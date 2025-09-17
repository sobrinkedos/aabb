import { useState, useEffect, useCallback } from 'react';
import { Permission } from '../types/employee.types';

interface EmployeePermissionsStorage {
  [employeeId: string]: Permission[];
}

export const useEmployeePermissions = () => {
  const [customPermissions, setCustomPermissions] = useState<EmployeePermissionsStorage>({});

  // Carregar permissões customizadas do localStorage
  useEffect(() => {
    const stored = localStorage.getItem('employee_custom_permissions');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCustomPermissions(parsed);
      } catch (error) {
        console.error('Erro ao carregar permissões customizadas:', error);
      }
    }
  }, []);

  // Salvar permissões customizadas
  const saveCustomPermissions = useCallback((employeeId: string, permissions: Permission[]) => {
    const updated = {
      ...customPermissions,
      [employeeId]: permissions
    };
    
    setCustomPermissions(updated);
    localStorage.setItem('employee_custom_permissions', JSON.stringify(updated));
  }, [customPermissions]);

  // Obter permissões de um funcionário (customizadas ou padrão)
  const getEmployeePermissions = useCallback((employeeId: string, defaultPermissions: Permission[]): Permission[] => {
    return customPermissions[employeeId] || defaultPermissions;
  }, [customPermissions]);

  // Verificar se funcionário tem permissões customizadas
  const hasCustomPermissions = useCallback((employeeId: string): boolean => {
    return !!customPermissions[employeeId];
  }, [customPermissions]);

  // Remover permissões customizadas (volta ao padrão)
  const resetToDefaultPermissions = useCallback((employeeId: string) => {
    const updated = { ...customPermissions };
    delete updated[employeeId];
    
    setCustomPermissions(updated);
    localStorage.setItem('employee_custom_permissions', JSON.stringify(updated));
  }, [customPermissions]);

  return {
    saveCustomPermissions,
    getEmployeePermissions,
    hasCustomPermissions,
    resetToDefaultPermissions
  };
};