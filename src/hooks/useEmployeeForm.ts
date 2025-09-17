import { useState, useCallback, useEffect } from 'react';
import { Employee, EmployeeRole, EmployeeModalState, MobilePermission } from '../types/employee.types';
import { ROLE_PRESETS, WAITER_MOBILE_PERMISSIONS } from '../utils/permissionPresets';
import { useEmployeeValidation } from './useEmployeeValidation';
import { useOfflineStorage } from './useOfflineStorage';
import { useNetworkStatus } from './useNetworkStatus';
import { useRetryOperation } from './useRetryOperation';

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
      setEmployee({
        name: '',
        email: '',
        cpf: '',
        phone: '',
        role: 'waiter',
        permissions: [],
        status: 'active',
        hire_date: new Date(),
        observations: '',
        ...initialEmployee
      });
    }
  }, [initialEmployee]);

  // Aplicar preset de permissões quando a função mudar
  useEffect(() => {
    if (employee.role && !initialEmployee) {
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
    // Esta função seria implementada para integrar com o Supabase
    // Por enquanto, apenas um placeholder
    console.log('Configurando acesso mobile:', { employeeId, appName, permissions });
    
    // TODO: Implementar integração real com Supabase
    // const { data: mobileAccess } = await supabase
    //   .from('mobile_app_access')
    //   .insert({
    //     employee_id: employeeId,
    //     app_name: appName,
    //     has_access: true,
    //     device_limit: 2
    //   })
    //   .select()
    //   .single();
    
    // const permissionInserts = permissions.map(perm => ({
    //   mobile_access_id: mobileAccess.id,
    //   feature: perm.feature,
    //   permission_level: perm.level
    // }));
    
    // await supabase
    //   .from('mobile_permissions')
    //   .insert(permissionInserts);
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
      
      // Usar sistema de retry para operações que podem falhar por timeout
      const timeoutDuration = initialEmployee ? 60000 : 45000; // 60s para edição, 45s para criação
      
      await executeWithRetry(
        () => onSave(employeeToSave, credentials),
        {
          maxRetries: initialEmployee ? 1 : 2, // Menos retries para edição
          retryDelay: 3000,
          timeoutDuration
        }
      );

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
        errorMessage = `Operação demorou muito (${isEdit ? '60s' : '45s'}). ${isEdit ? 'A edição' : 'O cadastro'} pode ter sido processada mesmo assim. Verifique a lista de funcionários e tente novamente se necessário.`;
        
        // Para edição, salvar offline como backup
        if (isEdit) {
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