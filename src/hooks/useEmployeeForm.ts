import { useState, useCallback, useEffect } from 'react';
import { Employee, EmployeeRole, EmployeeModalState, MobilePermission } from '../types/employee.types';
import { ROLE_PRESETS, WAITER_MOBILE_PERMISSIONS } from '../utils/permissionPresets';
import { useEmployeeValidation } from './useEmployeeValidation';
import { useOfflineStorage } from './useOfflineStorage';
import { useNetworkStatus } from './useNetworkStatus';
import { useRetryOperation } from './useRetryOperation';
import { useEmployeePermissions } from './useEmployeePermissions';
import { EmployeeAuthService } from '../services/employee-auth-service';

interface UseEmployeeFormProps {
  initialEmployee?: Employee;
  onSave: (employee: Employee, credentials?: any) => Promise<void>;
  onClose: () => void;
}

export const useEmployeeForm = ({ initialEmployee, onSave, onClose }: UseEmployeeFormProps) => {
  const { validateForm, errors, clearErrors } = useEmployeeValidation();
  const { saveOffline } = useOfflineStorage();
  const { isOnline } = useNetworkStatus();
  const { executeWithRetry, retryCount, isRetrying } = useRetryOperation();
  const { saveCustomPermissions, getEmployeePermissions } = useEmployeePermissions();
  const [credentials, setCredentials] = useState<any>(null);
  
  const [state, setState] = useState<EmployeeModalState>({
    loading: false,
    saving: false,
    errors: { fields: [] },
    isDirty: false,
    isValid: false
  });

  const [employee, setEmployee] = useState<Partial<Employee>>(() => {
    const defaultEmployee = {
      name: '',
      email: '',
      cpf: '',
      phone: '',
      role: 'waiter' as EmployeeRole,
      permissions: [],
      status: 'active' as const,
      hire_date: new Date(),
      observations: ''
    };
    
    if (initialEmployee) {
      return { ...defaultEmployee, ...initialEmployee };
    }
    
    return defaultEmployee;
  });

  // Atualizar estado quando os erros de validação mudarem
  useEffect(() => {
    setState(prev => ({
      ...prev,
      errors,
      isValid: !errors.fields.length && !errors.general
    }));
  }, [errors]);

  // Atualizar employee quando initialEmployee mudar (para modo de edição)
  useEffect(() => {
    if (initialEmployee) {
      // Para edição, carregar permissões customizadas se existirem
      const defaultPermissions = initialEmployee.permissions || [];
      const customPermissions = initialEmployee.id 
        ? getEmployeePermissions(initialEmployee.id, defaultPermissions)
        : defaultPermissions;

      setEmployee({
        name: '',
        email: '',
        cpf: '',
        phone: '',
        role: 'waiter',
        status: 'active',
        hire_date: new Date(),
        observations: '',
        ...initialEmployee,
        permissions: customPermissions
      });
    }
  }, [initialEmployee, getEmployeePermissions]);

  // Aplicar preset de permissões quando a função mudar (apenas para novos funcionários)
  useEffect(() => {
    // Só aplica preset se:
    // 1. Tem uma função selecionada
    // 2. NÃO é edição (initialEmployee é undefined)
    // 3. As permissões estão vazias (novo funcionário)
    if (employee.role && !initialEmployee && (!employee.permissions || employee.permissions.length === 0)) {
      const preset = ROLE_PRESETS[employee.role];
      if (preset) {
        setEmployee(prev => ({
          ...prev,
          permissions: [...preset.permissions]
        }));
      }
    }
  }, [employee.role, initialEmployee]);

  const updateEmployee = useCallback((updates: Partial<Employee>) => {
    setEmployee(prev => ({ ...prev, ...updates }));
    setState(prev => ({ ...prev, isDirty: true }));
  }, []);

  const updateField = useCallback((field: keyof Employee, value: any) => {
    updateEmployee({ [field]: value });
  }, [updateEmployee]);

  const togglePermission = useCallback((permissionId: string) => {
    setEmployee(prev => {
      const currentPermissions = prev.permissions || [];
      const hasPermission = currentPermissions.some(p => p.id === permissionId);
      
      let newPermissions;
      if (hasPermission) {
        newPermissions = currentPermissions.filter(p => p.id !== permissionId);
      } else {
        // Encontrar a permissão no preset atual
        const preset = ROLE_PRESETS[prev.role!];
        const permission = preset?.permissions.find(p => p.id === permissionId);
        if (permission) {
          newPermissions = [...currentPermissions, permission];
        } else {
          newPermissions = currentPermissions;
        }
      }
      
      return { ...prev, permissions: newPermissions };
    });
    setState(prev => ({ ...prev, isDirty: true }));
  }, []);

  const configureMobileAccess = async (employeeId: string, appName: string, permissions: MobilePermission[]) => {
    console.log('Configurando acesso mobile:', { employeeId, appName, permissions });
    
    // TODO: Implementar integração real com Supabase quando as tabelas estiverem criadas
    // Por enquanto, apenas log para debug
  };

  const createEmployeeAuthUser = async (employee: Employee, credentials: any) => {
    if (!credentials || !credentials.system) {
      console.log('ℹ️ Nenhuma credencial fornecida, pulando criação de usuário Auth');
      return { success: true };
    }

    const authService = EmployeeAuthService.getInstance();
    
    console.log('🔐 Criando usuário de autenticação para funcionário:', employee.name);
    
    const result = await authService.createEmployeeUser(employee, {
      email: credentials.system.email,
      password: credentials.system.password,
      username: credentials.system.username,
      temporaryPassword: credentials.system.temporaryPassword
    });

    if (!result.success) {
      throw new Error(`Erro ao criar usuário de autenticação: ${result.error}`);
    }

    console.log('✅ Usuário de autenticação criado com sucesso');
    return result;
  };

  const handleSave = useCallback(async () => {
    if (!validateForm(employee)) {
      return;
    }

    setState(prev => ({ ...prev, saving: true }));

    try {
      const employeeToSave = employee as Employee;
      
      // Se não há conexão, salvar offline
      if (!isOnline) {
        const offlineEmployee = saveOffline(employeeToSave);
        setState(prev => ({ ...prev, isDirty: false }));
        clearErrors();
        
        // Mostrar mensagem de sucesso offline
        setState(prev => ({
          ...prev,
          errors: {
            general: `✅ Funcionário ${employeeToSave.name} salvo offline. Será sincronizado quando a conexão for restaurada.`,
            fields: []
          }
        }));
        
        // Fechar modal após 2 segundos
        setTimeout(() => {
          onClose();
        }, 2000);
        
        return;
      }
      
      // Usar sistema de retry otimizado para operações mais rápidas
      const timeoutDuration = initialEmployee ? 20000 : 15000; // 20s para edição, 15s para criação
      
      await executeWithRetry(
        () => onSave(employeeToSave, credentials),
        {
          maxRetries: initialEmployee ? 1 : 1, // Apenas 1 retry para evitar demora
          retryDelay: 2000, // Delay menor entre tentativas
          timeoutDuration
        }
      );

      // Criar usuário de autenticação se for novo funcionário com credenciais
      if (!initialEmployee && credentials) {
        try {
          await createEmployeeAuthUser(employeeToSave, credentials);
        } catch (authError) {
          console.error('Erro ao criar usuário de autenticação:', authError);
          // Não bloquear o salvamento, mas mostrar aviso
          setState(prev => ({
            ...prev,
            errors: {
              general: `Funcionário cadastrado, mas houve erro ao criar usuário de login: ${authError instanceof Error ? authError.message : 'Erro desconhecido'}`,
              fields: []
            }
          }));
        }
      }

      // Salvar permissões customizadas se for edição
      if (initialEmployee && employeeToSave.id && employeeToSave.permissions) {
        saveCustomPermissions(employeeToSave.id, employeeToSave.permissions);
      }

      // Se for garçom, configurar acesso ao app-garcom
      if (employee.role === 'waiter' && employeeToSave.id) {
        try {
          await configureMobileAccess(employeeToSave.id, 'app-garcom', WAITER_MOBILE_PERMISSIONS);
        } catch (mobileError) {
          console.warn('Erro ao configurar acesso mobile (não crítico):', mobileError);
          // Não bloquear o salvamento por erro no acesso mobile
        }
      }

      setState(prev => ({ ...prev, isDirty: false }));
      clearErrors();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar funcionário:', error);
      
      let errorMessage = 'Erro ao salvar funcionário. Tente novamente.';
      
      // Detectar problemas de conectividade
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Erro de conexão. Os dados foram salvos offline e serão sincronizados quando a conexão for restaurada.';
        
        // Salvar offline como fallback
        const employeeToSave = employee as Employee;
        saveOffline(employeeToSave);
        
        setTimeout(() => {
          onClose();
        }, 3000);
      } else if (error instanceof Error && error.message.includes('Timeout')) {
        const isEdit = !!initialEmployee;
        errorMessage = `Operação demorou mais que ${isEdit ? '20s' : '15s'}. ${isEdit ? 'A edição' : 'O cadastro'} pode ter sido processada mesmo assim. Verifique a lista de funcionários e tente novamente se necessário.`;
        
        // Para edição, salvar offline como backup
        if (isEdit) {
          const employeeToSave = employee as Employee;
          saveOffline(employeeToSave);
          errorMessage += ' Os dados foram salvos offline como backup.';
        }
      } else if (error instanceof Error && error.message.includes('NetworkError')) {
        errorMessage = 'Erro de rede. Os dados foram salvos offline.';
        
        // Salvar offline como fallback
        const employeeToSave = employee as Employee;
        saveOffline(employeeToSave);
        
        setTimeout(() => {
          onClose();
        }, 3000);
      }
      
      setState(prev => ({
        ...prev,
        errors: {
          general: errorMessage,
          fields: []
        }
      }));
    } finally {
      setState(prev => ({ ...prev, saving: false }));
    }
  }, [employee, validateForm, onSave, onClose, clearErrors, isOnline, saveOffline]);

  const handleCancel = useCallback(() => {
    if (state.isDirty) {
      const confirmed = window.confirm('Há alterações não salvas. Deseja realmente cancelar?');
      if (!confirmed) return;
    }
    
    clearErrors();
    onClose();
  }, [state.isDirty, clearErrors, onClose]);

  const resetForm = useCallback(() => {
    setEmployee({
      name: '',
      email: '',
      cpf: '',
      phone: '',
      role: 'waiter',
      permissions: [],
      status: 'active',
      hire_date: new Date(),
      observations: ''
    });
    setState({
      loading: false,
      saving: false,
      errors: { fields: [] },
      isDirty: false,
      isValid: false
    });
    clearErrors();
  }, [clearErrors]);

  const setEmployeeCredentials = useCallback((creds: any) => {
    setCredentials(creds);
  }, []);

  return {
    employee,
    state,
    updateEmployee,
    updateField,
    togglePermission,
    handleSave,
    handleCancel,
    resetForm,
    setEmployeeCredentials
  };
};