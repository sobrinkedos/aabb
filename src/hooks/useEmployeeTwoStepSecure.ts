import { useState, useCallback, useEffect } from 'react';
import { EmployeeBasicService, BasicEmployeeData, BasicEmployeeResult } from '../services/employee-basic-service';
import { EmployeeCredentialsService, CredentialsResult } from '../services/employee-credentials-service';
import { getCurrentUserEmpresaId } from '../utils/auth-helper';

export interface EmployeeTwoStepState {
  isLoading: boolean;
  error: string | null;
  basicEmployees: any[];
  employeesWithCredentials: any[];
  userEmpresaId: string | null;
  isReady: boolean; // Indica se o empresaId foi carregado
}

/**
 * Hook seguro para gerenciar funcionários em duas etapas
 * Automaticamente obtém o empresaId do usuário logado
 * Impede vazamento de dados entre empresas diferentes
 */
export const useEmployeeTwoStepSecure = () => {
  const [state, setState] = useState<EmployeeTwoStepState>({
    isLoading: false,
    error: null,
    basicEmployees: [],
    employeesWithCredentials: [],
    userEmpresaId: null,
    isReady: false
  });

  const basicService = new EmployeeBasicService();
  const credentialsService = new EmployeeCredentialsService();

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  // Carregar empresaId do usuário logado
  useEffect(() => {
    const loadUserEmpresaId = async () => {
      try {
        setLoading(true);
        const empresaId = await getCurrentUserEmpresaId();
        
        if (!empresaId) {
          setError('Usuário não está associado a nenhuma empresa. Faça login novamente.');
          setState(prev => ({ ...prev, isReady: false }));
          return;
        }

        setState(prev => ({ 
          ...prev, 
          userEmpresaId: empresaId,
          isReady: true,
          error: null
        }));
      } catch (error) {
        console.error('Erro ao carregar empresaId do usuário:', error);
        setError('Erro ao identificar empresa do usuário');
        setState(prev => ({ ...prev, isReady: false }));
      } finally {
        setLoading(false);
      }
    };

    loadUserEmpresaId();
  }, []);

  /**
   * ETAPA 1: Criar funcionário básico (sem credenciais)
   */
  const createBasicEmployee = useCallback(async (employeeData: BasicEmployeeData): Promise<BasicEmployeeResult> => {
    if (!state.userEmpresaId || !state.isReady) {
      return {
        success: false,
        error: 'Sistema não está pronto. Aguarde ou faça login novamente.'
      };
    }

    setLoading(true);
    setError(null);

    try {
      const result = await basicService.createBasicEmployee(employeeData, state.userEmpresaId);
      
      if (result.success) {
        // Atualizar lista de funcionários básicos
        await loadBasicEmployees();
      } else {
        setError(result.error || 'Erro ao criar funcionário');
      }

      return result;
    } catch (error) {
      const errorMessage = 'Erro inesperado ao criar funcionário';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [state.userEmpresaId, state.isReady]);

  /**
   * ETAPA 2: Atribuir credenciais a um funcionário existente
   */
  const assignCredentials = useCallback(async (employeeId: string): Promise<CredentialsResult> => {
    if (!state.userEmpresaId || !state.isReady) {
      return {
        success: false,
        error: 'Sistema não está pronto. Aguarde ou faça login novamente.'
      };
    }

    setLoading(true);
    setError(null);

    try {
      const result = await credentialsService.assignCredentials(employeeId, state.userEmpresaId);
      
      if (result.success) {
        // Atualizar ambas as listas
        await Promise.all([
          loadBasicEmployees(),
          loadEmployeesWithCredentials()
        ]);
      } else {
        setError(result.error || 'Erro ao atribuir credenciais');
      }

      return result;
    } catch (error) {
      const errorMessage = 'Erro inesperado ao atribuir credenciais';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [state.userEmpresaId, state.isReady]);

  /**
   * Remover credenciais de um funcionário
   */
  const removeCredentials = useCallback(async (employeeId: string): Promise<{ success: boolean; error?: string }> => {
    if (!state.userEmpresaId || !state.isReady) {
      return {
        success: false,
        error: 'Sistema não está pronto. Aguarde ou faça login novamente.'
      };
    }

    setLoading(true);
    setError(null);

    try {
      const result = await credentialsService.removeCredentials(employeeId, state.userEmpresaId);
      
      if (result.success) {
        // Atualizar ambas as listas
        await Promise.all([
          loadBasicEmployees(),
          loadEmployeesWithCredentials()
        ]);
      } else {
        setError(result.error || 'Erro ao remover credenciais');
      }

      return result;
    } catch (error) {
      const errorMessage = 'Erro inesperado ao remover credenciais';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [state.userEmpresaId, state.isReady]);

  /**
   * Atualizar dados básicos de um funcionário
   */
  const updateBasicEmployee = useCallback(async (
    employeeId: string, 
    employeeData: Partial<BasicEmployeeData>
  ): Promise<BasicEmployeeResult> => {
    if (!state.userEmpresaId || !state.isReady) {
      return {
        success: false,
        error: 'Sistema não está pronto. Aguarde ou faça login novamente.'
      };
    }

    setLoading(true);
    setError(null);

    try {
      const result = await basicService.updateBasicEmployee(employeeId, employeeData, state.userEmpresaId);
      
      if (result.success) {
        // Atualizar lista apropriada
        await loadBasicEmployees();
        await loadEmployeesWithCredentials();
      } else {
        setError(result.error || 'Erro ao atualizar funcionário');
      }

      return result;
    } catch (error) {
      const errorMessage = 'Erro inesperado ao atualizar funcionário';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [state.userEmpresaId, state.isReady]);

  /**
   * Carregar funcionários básicos (sem credenciais)
   */
  const loadBasicEmployees = useCallback(async () => {
    if (!state.userEmpresaId || !state.isReady) {
      setError('Sistema não está pronto. Aguarde ou faça login novamente.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await basicService.getBasicEmployees(state.userEmpresaId);
      
      if (result.success) {
        setState(prev => ({ ...prev, basicEmployees: result.employees || [] }));
      } else {
        setError(result.error || 'Erro ao carregar funcionários básicos');
      }
    } catch (error) {
      setError('Erro inesperado ao carregar funcionários básicos');
    } finally {
      setLoading(false);
    }
  }, [state.userEmpresaId, state.isReady]);

  /**
   * Carregar funcionários com credenciais
   */
  const loadEmployeesWithCredentials = useCallback(async () => {
    if (!state.userEmpresaId || !state.isReady) {
      setError('Sistema não está pronto. Aguarde ou faça login novamente.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await credentialsService.getEmployeesWithCredentials(state.userEmpresaId);
      
      if (result.success) {
        setState(prev => ({ ...prev, employeesWithCredentials: result.employees || [] }));
      } else {
        setError(result.error || 'Erro ao carregar funcionários com credenciais');
      }
    } catch (error) {
      setError('Erro inesperado ao carregar funcionários com credenciais');
    } finally {
      setLoading(false);
    }
  }, [state.userEmpresaId, state.isReady]);

  /**
   * Carregar todas as listas
   */
  const loadAllEmployees = useCallback(async () => {
    if (!state.userEmpresaId || !state.isReady) {
      setError('Sistema não está pronto. Aguarde ou faça login novamente.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        loadBasicEmployees(),
        loadEmployeesWithCredentials()
      ]);
    } catch (error) {
      setError('Erro ao carregar funcionários');
    } finally {
      setLoading(false);
    }
  }, [loadBasicEmployees, loadEmployeesWithCredentials]);

  /**
   * Limpar erro
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Estado
    isLoading: state.isLoading,
    error: state.error,
    basicEmployees: state.basicEmployees,
    employeesWithCredentials: state.employeesWithCredentials,
    userEmpresaId: state.userEmpresaId,
    isReady: state.isReady,
    
    // Etapa 1: Funcionários básicos
    createBasicEmployee,
    updateBasicEmployee,
    loadBasicEmployees,
    
    // Etapa 2: Credenciais
    assignCredentials,
    removeCredentials,
    loadEmployeesWithCredentials,
    
    // Utilitários
    loadAllEmployees,
    clearError
  };
};