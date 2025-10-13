import { useState, useCallback } from 'react';
import { EmployeeBasicService, BasicEmployeeData, BasicEmployeeResult } from '../services/employee-basic-service';
import { EmployeeCredentialsService, CredentialsResult } from '../services/employee-credentials-service';

export interface EmployeeTwoStepState {
  isLoading: boolean;
  error: string | null;
  basicEmployees: any[];
  employeesWithCredentials: any[];
}

export const useEmployeeTwoStep = (empresaId: string) => {
  const [state, setState] = useState<EmployeeTwoStepState>({
    isLoading: false,
    error: null,
    basicEmployees: [],
    employeesWithCredentials: []
  });

  const basicService = new EmployeeBasicService();
  const credentialsService = new EmployeeCredentialsService();

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  /**
   * ETAPA 1: Criar funcionário básico (sem credenciais)
   */
  const createBasicEmployee = useCallback(async (employeeData: BasicEmployeeData): Promise<BasicEmployeeResult> => {
    setLoading(true);
    setError(null);

    try {
      const result = await basicService.createBasicEmployee(employeeData, empresaId);
      
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
  }, [empresaId]);

  /**
   * ETAPA 2: Atribuir credenciais a um funcionário existente
   */
  const assignCredentials = useCallback(async (employeeId: string): Promise<CredentialsResult> => {
    setLoading(true);
    setError(null);

    try {
      const result = await credentialsService.assignCredentials(employeeId, empresaId);
      
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
  }, [empresaId]);

  /**
   * Remover credenciais de um funcionário
   */
  const removeCredentials = useCallback(async (employeeId: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const result = await credentialsService.removeCredentials(employeeId, empresaId);
      
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
  }, [empresaId]);

  /**
   * Atualizar dados básicos de um funcionário
   */
  const updateBasicEmployee = useCallback(async (
    employeeId: string, 
    employeeData: Partial<BasicEmployeeData>
  ): Promise<BasicEmployeeResult> => {
    setLoading(true);
    setError(null);

    try {
      const result = await basicService.updateBasicEmployee(employeeId, employeeData, empresaId);
      
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
  }, [empresaId]);

  /**
   * Carregar funcionários básicos (sem credenciais)
   */
  const loadBasicEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await basicService.getBasicEmployees(empresaId);
      
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
  }, [empresaId]);

  /**
   * Carregar funcionários com credenciais
   */
  const loadEmployeesWithCredentials = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await credentialsService.getEmployeesWithCredentials(empresaId);
      
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
  }, [empresaId]);

  /**
   * Carregar todas as listas
   */
  const loadAllEmployees = useCallback(async () => {
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