import { useState, useCallback } from 'react';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { EmployeeAuthService, EmployeeAuthCredentials } from '../services/employee-auth-service';
import { Employee, EmployeeRole, Permission } from '../types/employee.types';
import { ensureAuthenticated, getCurrentUserEmpresaId } from '../utils/auth-helper';

export interface NewEmployeeWithAuthData {
  // Dados básicos do funcionário
  name: string;
  email: string;
  cpf?: string;
  phone?: string;
  
  // Dados específicos do bar
  bar_role: 'atendente' | 'garcom' | 'cozinheiro' | 'barman' | 'gerente';
  shift_preference?: 'manha' | 'tarde' | 'noite' | 'qualquer';
  specialties?: string[];
  commission_rate?: number;
  notes?: string;
  
  // Configurações de acesso ao sistema
  should_create_user: boolean; // Se deve criar credenciais de acesso
  permissions?: Permission[]; // Permissões específicas
  role?: EmployeeRole; // Papel no sistema
  temporary_password?: boolean; // Se a senha é temporária
}

export interface EmployeeCreationResult {
  success: boolean;
  employeeId?: string;
  userId?: string;
  credentials?: {
    email: string;
    password: string;
    username: string;
    temporary: boolean;
  };
  error?: string;
}

export const useEmployeeWithAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Gera um username único baseado no nome
   */
  const generateUsername = (name: string): string => {
    const cleanName = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]/g, '') // Remove caracteres especiais
      .substring(0, 15); // Limita tamanho
    
    const timestamp = Date.now().toString().slice(-4);
    return `${cleanName}${timestamp}`;
  };

  /**
   * Gera uma senha temporária
   */
  const generateTemporaryPassword = (): string => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  /**
   * Mapeia papel do bar para papel do sistema
   */
  const mapBarRoleToSystemRole = (barRole: string): EmployeeRole => {
    const roleMap: Record<string, EmployeeRole> = {
      'gerente': 'manager',
      'barman': 'supervisor',
      'atendente': 'cashier',
      'garcom': 'waiter',
      'cozinheiro': 'cook'
    };
    
    return roleMap[barRole] || 'waiter';
  };

  /**
   * Gera permissões baseadas no papel do funcionário
   */
  const generatePermissionsForRole = (barRole: string): Permission[] => {
    const basePermissions: Permission[] = [
      { id: 'view_dashboard', module: 'bar', action: 'view' }
    ];

    switch (barRole) {
      case 'gerente':
        return [
          ...basePermissions,
          { id: 'manage_bar', module: 'bar', action: 'manage' },
          { id: 'manage_kitchen', module: 'kitchen', action: 'manage' },
          { id: 'manage_cashier', module: 'cashier', action: 'manage' },
          { id: 'view_reports', module: 'reports', action: 'view' },
          { id: 'manage_inventory', module: 'inventory', action: 'manage' },
          { id: 'manage_customers', module: 'customers', action: 'manage' }
        ];

      case 'atendente':
        return [
          ...basePermissions,
          { id: 'access_cashier', module: 'cashier', action: 'access' },
          { id: 'manage_cashier', module: 'cashier', action: 'manage' },
          { id: 'view_customers', module: 'customers', action: 'view' },
          { id: 'create_customers', module: 'customers', action: 'create' }
        ];

      case 'garcom':
        return [
          ...basePermissions,
          { id: 'access_bar', module: 'bar', action: 'access' },
          { id: 'create_orders', module: 'bar', action: 'create' },
          { id: 'view_customers', module: 'customers', action: 'view' },
          { id: 'access_app_garcom', module: 'app-garcom', action: 'access' }
        ];

      case 'cozinheiro':
        return [
          ...basePermissions,
          { id: 'access_kitchen', module: 'kitchen', action: 'access' },
          { id: 'manage_orders', module: 'kitchen', action: 'manage' },
          { id: 'view_inventory', module: 'inventory', action: 'view' }
        ];

      case 'barman':
        return [
          ...basePermissions,
          { id: 'access_bar', module: 'bar', action: 'access' },
          { id: 'manage_bar', module: 'bar', action: 'manage' },
          { id: 'view_inventory', module: 'inventory', action: 'view' }
        ];

      default:
        return basePermissions;
    }
  };

  /**
   * Cria um funcionário completo com credenciais de acesso
   */
  const createEmployeeWithAuth = useCallback(async (
    employeeData: NewEmployeeWithAuthData
  ): Promise<EmployeeCreationResult> => {
    try {
      setLoading(true);
      setError(null);

      console.log('🚀 Iniciando criação de funcionário com credenciais:', employeeData.name);

      // 1. Autenticação
      const authResult = await ensureAuthenticated();
      if (!authResult.success) {
        throw new Error(`Falha na autenticação: ${authResult.error}`);
      }

      // 2. Determinar cliente e empresa
      let client = supabase;
      let empresaId = '00000000-0000-0000-0000-000000000001';

      if (authResult.useAdmin) {
        console.log('🔧 Usando cliente admin para operações no banco');
        client = supabaseAdmin;
      } else {
        const userEmpresaId = await getCurrentUserEmpresaId();
        if (userEmpresaId) {
          empresaId = userEmpresaId;
        }
      }

      console.log('✅ Criando funcionário para empresa:', empresaId);

      // 3. Criar registro na tabela bar_employees
      const notesArray = [];
      if (employeeData.name) notesArray.push(`Nome: ${employeeData.name}`);
      if (employeeData.cpf) notesArray.push(`CPF: ${employeeData.cpf}`);
      if (employeeData.email) notesArray.push(`Email: ${employeeData.email}`);
      if (employeeData.phone) notesArray.push(`Telefone: ${employeeData.phone}`);
      if (employeeData.notes) notesArray.push(`Observações: ${employeeData.notes}`);
      
      const cleanNotes = notesArray.join(', ');

      const { data: newBarEmployee, error: barEmployeeError } = await client
        .from('bar_employees')
        .insert([{
          employee_id: null,
          bar_role: employeeData.bar_role,
          shift_preference: employeeData.shift_preference || 'qualquer',
          specialties: employeeData.specialties || [],
          commission_rate: employeeData.commission_rate || 0,
          is_active: true,
          start_date: new Date().toISOString().split('T')[0],
          notes: cleanNotes,
          empresa_id: empresaId
        }])
        .select()
        .single();

      if (barEmployeeError) {
        throw new Error(`Erro ao criar funcionário: ${barEmployeeError.message}`);
      }

      console.log('✅ Funcionário criado no bar_employees:', newBarEmployee.id);

      let credentials: EmployeeCreationResult['credentials'];
      let userId: string | undefined;

      // 4. Criar credenciais de acesso se solicitado
      if (employeeData.should_create_user && employeeData.email) {
        console.log('🔐 Criando credenciais de acesso para o funcionário...');

        const username = generateUsername(employeeData.name);
        const password = generateTemporaryPassword();
        const isTemporary = employeeData.temporary_password !== false; // Default true

        // Preparar dados do funcionário para o serviço de auth
        const employee: Employee = {
          id: newBarEmployee.id,
          name: employeeData.name,
          email: employeeData.email,
          cpf: employeeData.cpf || '',
          phone: employeeData.phone || '',
          role: employeeData.role || mapBarRoleToSystemRole(employeeData.bar_role),
          permissions: employeeData.permissions || generatePermissionsForRole(employeeData.bar_role),
          status: 'active',
          hire_date: new Date(),
          observations: employeeData.notes
        };

        const authCredentials: EmployeeAuthCredentials = {
          email: employeeData.email,
          password: password,
          username: username,
          temporaryPassword: isTemporary
        };

        // Usar o serviço de autenticação
        const authService = EmployeeAuthService.getInstance();
        const authResult = await authService.createEmployeeUser(employee, authCredentials);

        if (authResult.success) {
          console.log('✅ Credenciais criadas com sucesso');
          userId = authResult.userId;
          credentials = {
            email: employeeData.email,
            password: password,
            username: username,
            temporary: isTemporary
          };

          // 5. Atualizar o registro bar_employees com o user_id se disponível
          if (userId && authResult.userId) {
            await client
              .from('bar_employees')
              .update({ employee_id: authResult.userId })
              .eq('id', newBarEmployee.id);
            
            console.log('✅ Registro atualizado com user_id');
          }

          // 6. Criar permissões específicas no sistema multitenant
          await createMultitenantPermissions(userId || newBarEmployee.id, employee.permissions, empresaId);

        } else {
          console.warn('⚠️ Erro ao criar credenciais:', authResult.error);
          // Não falhar a criação do funcionário por causa das credenciais
        }
      }

      const result: EmployeeCreationResult = {
        success: true,
        employeeId: newBarEmployee.id,
        userId: userId,
        credentials: credentials
      };

      console.log('🎉 Funcionário criado com sucesso:', result);
      return result;

    } catch (err) {
      console.error('❌ Erro ao criar funcionário:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar funcionário';
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cria permissões no sistema multitenant
   */
  const createMultitenantPermissions = async (
    userId: string, 
    permissions: Permission[], 
    empresaId: string
  ): Promise<void> => {
    try {
      // Primeiro, criar/buscar o registro na tabela usuarios_empresa
      const { data: usuarioEmpresa, error: usuarioEmpresaError } = await supabase
        .from('usuarios_empresa')
        .select('id')
        .eq('user_id', userId)
        .eq('empresa_id', empresaId)
        .single();

      let usuarioEmpresaId: string;

      if (usuarioEmpresaError || !usuarioEmpresa) {
        // Criar registro na usuarios_empresa
        const { data: newUsuarioEmpresa, error: createError } = await supabase
          .from('usuarios_empresa')
          .insert([{
            user_id: userId,
            empresa_id: empresaId,
            nome_completo: 'Funcionário', // Será atualizado depois
            email: '', // Será atualizado depois
            cargo: 'Funcionário',
            tipo_usuario: 'funcionario',
            status: 'ativo',
            ativo: true,
            tem_acesso_sistema: true,
            papel: 'USER'
          }])
          .select('id')
          .single();

        if (createError) {
          throw createError;
        }

        usuarioEmpresaId = newUsuarioEmpresa.id;
      } else {
        usuarioEmpresaId = usuarioEmpresa.id;
      }

      // Mapear permissões para módulos do sistema
      const modulePermissions = mapPermissionsToModules(permissions);

      // Criar permissões para cada módulo
      for (const [modulo, permissoes] of Object.entries(modulePermissions)) {
        await supabase
          .from('permissoes_usuario')
          .insert([{
            usuario_empresa_id: usuarioEmpresaId,
            modulo: modulo as any,
            permissoes: permissoes
          }]);
      }

      console.log('✅ Permissões multitenant criadas');
    } catch (error) {
      console.error('⚠️ Erro ao criar permissões multitenant:', error);
      // Não falhar por causa das permissões
    }
  };

  /**
   * Mapeia permissões para módulos do sistema multitenant
   */
  const mapPermissionsToModules = (permissions: Permission[]): Record<string, any> => {
    const moduleMap: Record<string, string> = {
      'bar': 'atendimento_bar',
      'kitchen': 'monitor_cozinha',
      'cashier': 'gestao_caixa',
      'customers': 'clientes',
      'reports': 'relatorios',
      'inventory': 'funcionarios' // Temporário
    };

    const result: Record<string, any> = {};

    permissions.forEach(permission => {
      const moduleName = moduleMap[permission.module];
      if (moduleName) {
        if (!result[moduleName]) {
          result[moduleName] = {
            visualizar: false,
            criar: false,
            editar: false,
            excluir: false,
            administrar: false
          };
        }

        // Mapear ações
        switch (permission.action) {
          case 'view':
            result[moduleName].visualizar = true;
            break;
          case 'create':
            result[moduleName].criar = true;
            break;
          case 'edit':
            result[moduleName].editar = true;
            break;
          case 'delete':
            result[moduleName].excluir = true;
            break;
          case 'manage':
            result[moduleName].administrar = true;
            result[moduleName].visualizar = true;
            result[moduleName].criar = true;
            result[moduleName].editar = true;
            break;
          case 'access':
            result[moduleName].visualizar = true;
            break;
        }
      }
    });

    return result;
  };

  return {
    loading,
    error,
    createEmployeeWithAuth,
    setError
  };
};