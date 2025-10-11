import { useState, useEffect } from 'react';
import { Employee } from '../types/employee.types';

interface OfflineEmployee extends Employee {
  _offline: true;
  _timestamp: number;
}

export const useOfflineStorage = () => {
  const [offlineEmployees, setOfflineEmployees] = useState<OfflineEmployee[]>([]);

  // Carregar dados offline do localStorage
  useEffect(() => {
    const stored = localStorage.getItem('offline_employees');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setOfflineEmployees(parsed);
      } catch (error) {
        console.error('Erro ao carregar dados offline:', error);
      }
    }
  }, []);

  // Salvar funcionário offline
  const saveOffline = (employee: Employee) => {
    const offlineEmployee: OfflineEmployee = {
      ...employee,
      id: `offline_${Date.now()}`,
      _offline: true,
      _timestamp: Date.now()
    };

    const updated = [...offlineEmployees, offlineEmployee];
    setOfflineEmployees(updated);
    localStorage.setItem('offline_employees', JSON.stringify(updated));
    
    return offlineEmployee;
  };

  // Sincronizar dados offline quando voltar online
  const syncOfflineData = async (syncFunction: (employee: Employee) => Promise<void>) => {
    const toSync = [...offlineEmployees];
    
    for (const employee of toSync) {
      try {
        // Remove propriedades offline antes de sincronizar
        const { _offline, _timestamp, ...cleanEmployee } = employee;
        await syncFunction(cleanEmployee);
        
        // Remove da lista offline após sincronizar
        const updated = offlineEmployees.filter(e => e.id !== employee.id);
        setOfflineEmployees(updated);
        localStorage.setItem('offline_employees', JSON.stringify(updated));
        
        console.log(`✅ Funcionário ${employee.name} sincronizado`);
      } catch (error) {
        console.error(`❌ Erro ao sincronizar ${employee.name}:`, error);
      }
    }
  };

  // Limpar dados offline
  const clearOfflineData = () => {
    setOfflineEmployees([]);
    localStorage.removeItem('offline_employees');
  };

  return {
    offlineEmployees,
    saveOffline,
    syncOfflineData,
    clearOfflineData,
    hasOfflineData: offlineEmployees.length > 0
  };
};