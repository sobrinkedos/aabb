import { useState, useCallback } from 'react';
import { EmployeeCreationService, EmployeeCreationData, EmployeeCreationResult } from '../services/employee-creation-service';
import { ensureAuthenticated, getCurrentUserEmpresaId } from '../utils/auth-helper';

export const useEmployeeCreation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Cria um funcionário completo com credenciais e permissões
   */
  const createEmployee = useCallback(async (
    employeeData: EmployeeCreationData
  ): Promise<EmployeeCreationResult> => {
    try {
      setLoading(true);
      setError(null);

      // Verificar autenticação
      const authResult = await ensureAuthenticated();
      if (!authResult.success) {
        throw new Error(`Falha na autenticação: ${authResult.error}`);
      }

      // Obter empresa_id
      const userEmpresaId = await getCurrentUserEmpresaId();
      
      if (!userEmpresaId) {
        throw new Error('Não foi possível obter o ID da empresa do usuário atual. Verifique se você está logado corretamente.');
      }
      
      const empresaId = userEmpresaId;

      // Usar o serviço de criação
      const service = EmployeeCreationService.getInstance();
      const result = await service.createCompleteEmployee(employeeData, empresaId);

      if (!result.success) {
        setError(result.error || 'Erro ao criar funcionário');
      }

      return result;

    } catch (err) {
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
   * Cria funcionário com permissões padrão baseadas no cargo
   */
  const createEmployeeWithDefaultPermissions = useCallback(async (
    basicData: {
      nome_completo: string;
      email: string;
      telefone?: string;
      cpf?: string;
      bar_role: 'atendente' | 'garcom' | 'cozinheiro' | 'barman' | 'gerente';
      shift_preference?: 'manha' | 'tarde' | 'noite' | 'qualquer';
      specialties?: string[];
      commission_rate?: number;
      observacoes?: string;
      tem_acesso_sistema: boolean;
    }
  ): Promise<EmployeeCreationResult> => {
    // Mapear cargo do bar para cargo do sistema
    const cargoMap: Record<string, string> = {
      'gerente': 'Gerente de Bar',
      'atendente': 'Atendente de Caixa',
      'garcom': 'Garçom',
      'cozinheiro': 'Cozinheiro',
      'barman': 'Barman'
    };

    // Mapear tipo de usuário
    const tipoUsuarioMap: Record<string, 'funcionario' | 'administrador'> = {
      'gerente': 'administrador',
      'atendente': 'funcionario',
      'garcom': 'funcionario',
      'cozinheiro': 'funcionario',
      'barman': 'funcionario'
    };

    // Mapear papel
    const papelMap: Record<string, 'USER' | 'MANAGER' | 'ADMIN'> = {
      'gerente': 'MANAGER',
      'atendente': 'USER',
      'garcom': 'USER',
      'cozinheiro': 'USER',
      'barman': 'USER'
    };

    const employeeData: EmployeeCreationData = {
      ...basicData,
      cargo: cargoMap[basicData.bar_role] || 'Funcionário',
      tipo_usuario: tipoUsuarioMap[basicData.bar_role] || 'funcionario',
      papel: papelMap[basicData.bar_role] || 'USER',
      permissoes_modulos: await EmployeeCreationService.generateDefaultPermissions(basicData.bar_role)
    };

    return await createEmployee(employeeData);
  }, [createEmployee]);

  /**
   * Atualiza senha de um funcionário
   */
  const updatePassword = useCallback(async (
    userId: string,
    newPassword: string,
    isTemporary: boolean = false
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      const service = EmployeeCreationService.getInstance();
      const result = await service.updateEmployeePassword(userId, newPassword, isTemporary);

      if (!result.success) {
        setError(result.error || 'Erro ao atualizar senha');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar senha';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Desativa um funcionário
   */
  const deactivateEmployee = useCallback(async (
    employeeId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      const service = EmployeeCreationService.getInstance();
      const result = await service.deactivateEmployee(employeeId);

      if (!result.success) {
        setError(result.error || 'Erro ao desativar funcionário');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao desativar funcionário';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reativa um funcionário
   */
  const reactivateEmployee = useCallback(async (
    employeeId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      const service = EmployeeCreationService.getInstance();
      const result = await service.reactivateEmployee(employeeId);

      if (!result.success) {
        setError(result.error || 'Erro ao reativar funcionário');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao reativar funcionário';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Atualiza permissões de um funcionário
   */
  const updatePermissions = useCallback(async (
    usuarioEmpresaId: string,
    newPermissions: EmployeeCreationData['permissoes_modulos']
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      const service = EmployeeCreationService.getInstance();
      const result = await service.updateEmployeePermissions(usuarioEmpresaId, newPermissions);

      if (!result.success) {
        setError(result.error || 'Erro ao atualizar permissões');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar permissões';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Lista funcionários da empresa
   */
  const listEmployees = useCallback(async (
    includeInactive: boolean = false
  ): Promise<{ success: boolean; employees?: any[]; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      // Obter empresa_id
      let empresaId = '00000000-0000-0000-0000-000000000001'; // Default
      
      const authResult = await ensureAuthenticated();
      if (authResult.success && !authResult.useAdmin) {
        const userEmpresaId = await getCurrentUserEmpresaId();
        if (userEmpresaId) {
          empresaId = userEmpresaId;
        }
      }

      const service = EmployeeCreationService.getInstance();
      const result = await service.listEmployees(empresaId, includeInactive);

      if (!result.success) {
        setError(result.error || 'Erro ao listar funcionários');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao listar funcionários';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createEmployee,
    createEmployeeWithDefaultPermissions,
    updatePassword,
    deactivateEmployee,
    reactivateEmployee,
    updatePermissions,
    listEmployees,
    setError
  };
};