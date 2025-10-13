import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface PermissaoUsuario {
  id?: string;
  usuario_empresa_id: string;
  modulo: string;
  permissoes: {
    visualizar: boolean;
    criar: boolean;
    editar: boolean;
    excluir: boolean;
    administrar: boolean;
  };
}

export const useEmployeePermissions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Busca permissões específicas de um funcionário
   */
  const getEmployeePermissions = useCallback(async (employeeId: string): Promise<PermissaoUsuario[]> => {
    try {
      setError(null);

      console.log('🔍 Buscando permissões para employeeId:', employeeId);

      // 1. Buscar employee para obter profile_id
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('id, name, profile_id, tem_acesso_sistema')
        .eq('id', employeeId)
        .single();

      if (employeeError || !employee) {
        console.error('❌ Erro ao buscar employee:', employeeError);
        return [];
      }

      // 2. Verificar se tem credenciais
      if (!employee.profile_id || !employee.tem_acesso_sistema) {
        console.log('⚠️ Employee sem credenciais, sem permissões específicas');
        return [];
      }

      // 3. Buscar usuarios_empresa pelo profile_id
      const { data: usuarioEmpresa, error: usuarioError } = await supabase
        .from('usuarios_empresa')
        .select('id, user_id, nome_completo, tem_acesso_sistema, status')
        .eq('user_id', employee.profile_id)
        .single();

      if (usuarioError || !usuarioEmpresa) {
        console.error('❌ Erro ao buscar usuario_empresa:', usuarioError);
        return [];
      }

      console.log('👤 Usuário encontrado:', usuarioEmpresa.nome_completo);

      // Buscar permissões específicas
      const { data: permissoes, error: permissoesError } = await supabase
        .from('permissoes_usuario')
        .select('id, modulo, permissoes')
        .eq('usuario_empresa_id', usuarioEmpresa.id);

      if (permissoesError) {
        console.error('❌ Erro ao buscar permissões:', permissoesError);
        throw new Error(`Erro ao buscar permissões: ${permissoesError.message}`);
      }

      console.log(`✅ ${permissoes?.length || 0} permissões específicas encontradas`);

      return (permissoes || []).map(perm => ({
        ...perm,
        usuario_empresa_id: usuarioEmpresa.id
      }));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar permissões';
      setError(errorMessage);
      console.error('Erro ao buscar permissões:', err);
      return [];
    }
  }, []);

  /**
   * Salva permissões específicas de um funcionário
   */
  const saveEmployeePermissions = useCallback(async (
    employeeId: string, 
    permissoes: PermissaoUsuario[]
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      console.log('💾 Salvando permissões para funcionário:', employeeId);
      console.log('📋 Permissões:', permissoes);

      // CORREÇÃO: Buscar employee e depois usuarios_empresa
      console.log('🔍 Buscando employee e suas credenciais...');
      
      // 1. Buscar employee para obter profile_id
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('id, name, email, profile_id, tem_acesso_sistema')
        .eq('id', employeeId)
        .single();

      if (employeeError || !employee) {
        console.error('❌ Erro ao buscar employee:', employeeError);
        throw new Error('Funcionário não encontrado.');
      }

      console.log('👤 Employee encontrado:', employee);

      // 2. Verificar se tem profile_id (credenciais)
      if (!employee.profile_id || !employee.tem_acesso_sistema) {
        console.error('❌ Employee sem credenciais:', {
          profile_id: employee.profile_id,
          tem_acesso_sistema: employee.tem_acesso_sistema
        });
        throw new Error('Funcionário não tem credenciais de sistema. Crie credenciais primeiro.');
      }

      // 3. Buscar usuarios_empresa pelo profile_id
      const { data: usuarioEmpresa, error: usuarioError } = await supabase
        .from('usuarios_empresa')
        .select('id, user_id, nome_completo, tem_acesso_sistema, status')
        .eq('user_id', employee.profile_id)
        .single();

      if (usuarioError || !usuarioEmpresa) {
        console.error('❌ Erro ao buscar usuario_empresa:', usuarioError);
        throw new Error('Vínculo do usuário não encontrado.');
      }

      console.log('👤 Usuário encontrado:', usuarioEmpresa);

      // Verificar se tem credenciais válidas
      if (!usuarioEmpresa.user_id || !usuarioEmpresa.tem_acesso_sistema) {
        console.error('❌ Usuário sem credenciais válidas:', {
          user_id: usuarioEmpresa.user_id,
          tem_acesso_sistema: usuarioEmpresa.tem_acesso_sistema
        });
        throw new Error('Usuário não tem credenciais de sistema. Crie credenciais primeiro.');
      }

      // Verificar se está ativo
      if (usuarioEmpresa.status !== 'ativo') {
        console.error('❌ Usuário não está ativo:', usuarioEmpresa.status);
        throw new Error('Usuário não está ativo no sistema.');
      }

      console.log('✅ Usuário válido para salvar permissões');

      // Remover permissões existentes
      console.log('🗑️ Removendo permissões existentes...');
      const { error: deleteError } = await supabase
        .from('permissoes_usuario')
        .delete()
        .eq('usuario_empresa_id', usuarioEmpresa.id);

      if (deleteError) {
        console.error('❌ Erro ao deletar permissões existentes:', deleteError);
        throw new Error(`Erro ao limpar permissões existentes: ${deleteError.message}`);
      }

      console.log('✅ Permissões existentes removidas');

      // Inserir novas permissões (se houver)
      if (permissoes.length > 0) {
        console.log(`💾 Inserindo ${permissoes.length} novas permissões...`);
        
        const permissoesParaInserir = permissoes.map(perm => ({
          usuario_empresa_id: usuarioEmpresa.id,
          modulo: perm.modulo,
          permissoes: perm.permissoes
        }));

        console.log('📋 Dados para inserir:', permissoesParaInserir);

        const { error: insertError } = await supabase
          .from('permissoes_usuario')
          .insert(permissoesParaInserir);

        if (insertError) {
          console.error('❌ Erro ao inserir permissões:', insertError);
          throw new Error(`Erro ao salvar permissões: ${insertError.message}`);
        }

        console.log(`✅ ${permissoes.length} permissões salvas com sucesso`);
      } else {
        console.log('✅ Permissões removidas (usuário usará padrões do role)');
      }

      return { success: true };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar permissões';
      setError(errorMessage);
      console.error('Erro ao salvar permissões:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Remove todas as permissões específicas de um funcionário
   */
  const clearEmployeePermissions = useCallback(async (employeeId: string): Promise<{ success: boolean; error?: string }> => {
    return await saveEmployeePermissions(employeeId, []);
  }, [saveEmployeePermissions]);

  /**
   * Verifica se um funcionário tem permissões específicas configuradas
   */
  const hasCustomPermissions = useCallback(async (employeeId: string): Promise<boolean> => {
    const permissions = await getEmployeePermissions(employeeId);
    return permissions.length > 0;
  }, [getEmployeePermissions]);

  /**
   * Aplica um preset de permissões
   */
  const applyPermissionPreset = useCallback(async (
    employeeId: string, 
    preset: 'operador_caixa' | 'atendente_bar' | 'cozinheiro' | 'gerente'
  ): Promise<{ success: boolean; error?: string }> => {
    const presets = {
      operador_caixa: [
        {
          usuario_empresa_id: '', // Será preenchido na função
          modulo: 'gestao_caixa',
          permissoes: { visualizar: true, criar: true, editar: true, excluir: false, administrar: false }
        }
      ],
      atendente_bar: [
        {
          usuario_empresa_id: '',
          modulo: 'atendimento_bar',
          permissoes: { visualizar: true, criar: true, editar: true, excluir: false, administrar: false }
        },
        {
          usuario_empresa_id: '',
          modulo: 'monitor_bar',
          permissoes: { visualizar: true, criar: false, editar: false, excluir: false, administrar: false }
        }
      ],
      cozinheiro: [
        {
          usuario_empresa_id: '',
          modulo: 'monitor_cozinha',
          permissoes: { visualizar: true, criar: true, editar: true, excluir: false, administrar: false }
        }
      ],
      gerente: [
        {
          usuario_empresa_id: '',
          modulo: 'dashboard',
          permissoes: { visualizar: true, criar: false, editar: false, excluir: false, administrar: false }
        },
        {
          usuario_empresa_id: '',
          modulo: 'gestao_caixa',
          permissoes: { visualizar: true, criar: true, editar: true, excluir: true, administrar: false }
        },
        {
          usuario_empresa_id: '',
          modulo: 'atendimento_bar',
          permissoes: { visualizar: true, criar: true, editar: true, excluir: true, administrar: false }
        },
        {
          usuario_empresa_id: '',
          modulo: 'monitor_bar',
          permissoes: { visualizar: true, criar: true, editar: true, excluir: false, administrar: false }
        },
        {
          usuario_empresa_id: '',
          modulo: 'monitor_cozinha',
          permissoes: { visualizar: true, criar: true, editar: true, excluir: false, administrar: false }
        },
        {
          usuario_empresa_id: '',
          modulo: 'clientes',
          permissoes: { visualizar: true, criar: true, editar: true, excluir: true, administrar: false }
        },
        {
          usuario_empresa_id: '',
          modulo: 'funcionarios',
          permissoes: { visualizar: true, criar: true, editar: true, excluir: false, administrar: false }
        },
        {
          usuario_empresa_id: '',
          modulo: 'relatorios',
          permissoes: { visualizar: true, criar: false, editar: false, excluir: false, administrar: false }
        }
      ]
    };

    const permissoesPreset = presets[preset];
    return await saveEmployeePermissions(employeeId, permissoesPreset);
  }, [saveEmployeePermissions]);

  return {
    loading,
    error,
    getEmployeePermissions,
    saveEmployeePermissions,
    clearEmployeePermissions,
    hasCustomPermissions,
    applyPermissionPreset,
    clearError: () => setError(null)
  };
};