import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useMultitenantAuth } from '../contexts/MultitenantAuthContextSimple';
import { User, Role, Permission, UserFormData, UserManagementHook } from '../types/admin';
import { AuthorizationMiddleware } from '../services/authorization-middleware';

export const useUserManagement = (): UserManagementHook => {
  const { empresa, user } = useMultitenantAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar usuários
  const loadUsers = useCallback(async () => {
    if (!empresa?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data: usersData, error: usersError } = await supabase
        .from('usuarios_empresa')
        .select(`
          *,
          roles:role_id (
            id,
            name,
            description
          )
        `)
        .eq('empresa_id', empresa.id)
        .order('nome_completo');

      if (usersError) throw usersError;

      // Carregar permissões para cada usuário
      const usersWithPermissions = await Promise.all(
        (usersData || []).map(async (userData) => {
          const { data: permissionsData } = await supabase
            .from('permissoes_usuario')
            .select('*')
            .eq('usuario_empresa_id', userData.id);

          const permissions: Permission[] = (permissionsData || []).map(p => ({
            module: p.modulo,
            actions: Object.keys(p.permissoes).filter(key => p.permissoes[key]),
            restrictions: p.restricoes || {}
          }));

          return {
            id: userData.id,
            name: userData.nome_completo,
            email: userData.email,
            role: {
              id: userData.roles?.id || '',
              name: userData.roles?.name || userData.tipo_usuario,
              description: userData.roles?.description || '',
              defaultPermissions: []
            },
            department: userData.departamento || '',
            permissions,
            lastLogin: userData.ultimo_login ? new Date(userData.ultimo_login) : null,
            isActive: userData.status === 'ativo',
            createdAt: new Date(userData.created_at),
            updatedAt: new Date(userData.updated_at)
          } as User;
        })
      );

      setUsers(usersWithPermissions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar usuários';
      setError(errorMessage);
      console.error('Erro ao carregar usuários:', err);
    } finally {
      setIsLoading(false);
    }
  }, [empresa?.id]);

  // Carregar funções
  const loadRoles = useCallback(async () => {
    if (!empresa?.id) return;

    try {
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('*')
        .eq('empresa_id', empresa.id)
        .order('name');

      if (rolesError) throw rolesError;

      const rolesWithPermissions = (rolesData || []).map(roleData => ({
        id: roleData.id,
        name: roleData.name,
        description: roleData.description,
        defaultPermissions: roleData.default_permissions || []
      }));

      setRoles(rolesWithPermissions);
    } catch (err) {
      console.error('Erro ao carregar funções:', err);
    }
  }, [empresa?.id]);

  // Criar usuário
  const createUser = async (userData: UserFormData): Promise<User> => {
    if (!empresa?.id) throw new Error('Empresa não identificada');

    try {
      setError(null);

      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: 'temp123456', // Senha temporária
        email_confirm: true,
        user_metadata: {
          nome_completo: userData.name
        }
      });

      if (authError) throw authError;

      // Criar registro na tabela usuarios_empresa
      const { data: userRecord, error: userError } = await supabase
        .from('usuarios_empresa')
        .insert({
          user_id: authData.user.id,
          empresa_id: empresa.id,
          nome_completo: userData.name,
          email: userData.email,
          role_id: userData.roleId,
          departamento: userData.department,
          tipo_usuario: 'funcionario',
          status: userData.isActive ? 'ativo' : 'inativo'
        })
        .select()
        .single();

      if (userError) throw userError;

      // Aplicar permissões padrão da função
      const role = roles.find(r => r.id === userData.roleId);
      if (role && role.defaultPermissions.length > 0) {
        await updatePermissions(userRecord.id, role.defaultPermissions);
      }

      // Registrar log de auditoria
      await AuthorizationMiddleware.logAccessAttempt(
        user?.user_id || '',
        empresa.id,
        'CREATE_USER',
        `user:${userRecord.id}`,
        true
      );

      await refreshData();

      const newUser = users.find(u => u.id === userRecord.id);
      if (!newUser) throw new Error('Usuário criado mas não encontrado');

      return newUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar usuário';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Atualizar usuário
  const updateUser = async (userId: string, updates: Partial<User>): Promise<User> => {
    try {
      setError(null);

      const updateData: any = {};
      if (updates.name) updateData.nome_completo = updates.name;
      if (updates.email) updateData.email = updates.email;
      if (updates.department) updateData.departamento = updates.department;
      if (updates.isActive !== undefined) updateData.status = updates.isActive ? 'ativo' : 'inativo';

      const { error: updateError } = await supabase
        .from('usuarios_empresa')
        .update(updateData)
        .eq('id', userId);

      if (updateError) throw updateError;

      // Registrar log de auditoria
      await AuthorizationMiddleware.logAccessAttempt(
        user?.user_id || '',
        empresa?.id || '',
        'UPDATE_USER',
        `user:${userId}`,
        true
      );

      await refreshData();

      const updatedUser = users.find(u => u.id === userId);
      if (!updatedUser) throw new Error('Usuário não encontrado após atualização');

      return updatedUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar usuário';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Excluir usuário
  const deleteUser = async (userId: string): Promise<void> => {
    try {
      setError(null);

      // Desativar ao invés de excluir para manter histórico
      const { error: updateError } = await supabase
        .from('usuarios_empresa')
        .update({ status: 'excluido' })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Registrar log de auditoria
      await AuthorizationMiddleware.logAccessAttempt(
        user?.user_id || '',
        empresa?.id || '',
        'DELETE_USER',
        `user:${userId}`,
        true
      );

      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir usuário';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Criar função
  const createRole = async (roleData: Omit<Role, 'id'>): Promise<Role> => {
    if (!empresa?.id) throw new Error('Empresa não identificada');

    try {
      setError(null);

      const { data: roleRecord, error: roleError } = await supabase
        .from('roles')
        .insert({
          empresa_id: empresa.id,
          name: roleData.name,
          description: roleData.description,
          default_permissions: roleData.defaultPermissions
        })
        .select()
        .single();

      if (roleError) throw roleError;

      await refreshData();

      const newRole = roles.find(r => r.id === roleRecord.id);
      if (!newRole) throw new Error('Função criada mas não encontrada');

      return newRole;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar função';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Atualizar função
  const updateRole = async (roleId: string, updates: Partial<Role>): Promise<Role> => {
    try {
      setError(null);

      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.description) updateData.description = updates.description;
      if (updates.defaultPermissions) updateData.default_permissions = updates.defaultPermissions;

      const { error: updateError } = await supabase
        .from('roles')
        .update(updateData)
        .eq('id', roleId);

      if (updateError) throw updateError;

      await refreshData();

      const updatedRole = roles.find(r => r.id === roleId);
      if (!updatedRole) throw new Error('Função não encontrada após atualização');

      return updatedRole;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar função';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Excluir função
  const deleteRole = async (roleId: string): Promise<void> => {
    try {
      setError(null);

      // Verificar se há usuários usando esta função
      const { data: usersWithRole } = await supabase
        .from('usuarios_empresa')
        .select('id')
        .eq('role_id', roleId)
        .eq('status', 'ativo');

      if (usersWithRole && usersWithRole.length > 0) {
        throw new Error('Não é possível excluir uma função que está sendo usada por usuários ativos');
      }

      const { error: deleteError } = await supabase
        .from('roles')
        .delete()
        .eq('id', roleId);

      if (deleteError) throw deleteError;

      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir função';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Atribuir função
  const assignRole = async (userId: string, roleId: string): Promise<void> => {
    try {
      setError(null);

      const { error: updateError } = await supabase
        .from('usuarios_empresa')
        .update({ role_id: roleId })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Aplicar permissões padrão da nova função
      const role = roles.find(r => r.id === roleId);
      if (role && role.defaultPermissions.length > 0) {
        await updatePermissions(userId, role.defaultPermissions);
      }

      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atribuir função';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Atualizar permissões
  const updatePermissions = async (userId: string, permissions: Permission[]): Promise<void> => {
    try {
      setError(null);

      // Remover permissões existentes
      await supabase
        .from('permissoes_usuario')
        .delete()
        .eq('usuario_empresa_id', userId);

      // Inserir novas permissões
      if (permissions.length > 0) {
        const permissionsData = permissions.map(permission => ({
          usuario_empresa_id: userId,
          modulo: permission.module,
          permissoes: permission.actions.reduce((acc, action) => {
            acc[action] = true;
            return acc;
          }, {} as Record<string, boolean>),
          restricoes: permission.restrictions || {}
        }));

        const { error: insertError } = await supabase
          .from('permissoes_usuario')
          .insert(permissionsData);

        if (insertError) throw insertError;
      }

      // Registrar log de auditoria
      await AuthorizationMiddleware.logAccessAttempt(
        user?.user_id || '',
        empresa?.id || '',
        'UPDATE_PERMISSIONS',
        `user:${userId}`,
        true
      );

      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar permissões';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Atualizar dados
  const refreshData = async (): Promise<void> => {
    await Promise.all([loadUsers(), loadRoles()]);
  };

  // Carregar dados iniciais
  useEffect(() => {
    if (empresa?.id) {
      refreshData();
    }
  }, [empresa?.id, loadUsers, loadRoles]);

  return {
    users,
    roles,
    isLoading,
    error,
    createUser,
    updateUser,
    deleteUser,
    createRole,
    updateRole,
    deleteRole,
    assignRole,
    updatePermissions,
    refreshData
  };
};