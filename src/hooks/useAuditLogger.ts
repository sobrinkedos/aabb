/**
 * Hook para Audit Logger
 */

import { useEffect } from 'react';
import { auditLogger } from '../utils/auditLogger';
import { useAuth } from '../contexts/AuthContextSimple';

export const useAuditLogger = () => {
  const { user, permissions } = useAuth();

  // Atualizar contexto do audit logger quando usuário muda
  useEffect(() => {
    if (user && permissions) {
      auditLogger.setContext(user.id, user.email);
    }
  }, [user, permissions]);

  // Sincronizar logs pendentes quando online
  useEffect(() => {
    const syncLogs = async () => {
      if (navigator.onLine) {
        await auditLogger.syncPendingLogs();
      }
    };

    syncLogs();
    
    const handleOnline = () => syncLogs();
    window.addEventListener('online', handleOnline);
    
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return {
    logEmployeeCreated: auditLogger.logEmployeeCreated.bind(auditLogger),
    logEmployeeUpdated: auditLogger.logEmployeeUpdated.bind(auditLogger),
    logEmployeeDeactivated: auditLogger.logEmployeeDeactivated.bind(auditLogger),
    logLoginAttempt: auditLogger.logLoginAttempt.bind(auditLogger),
    syncPendingLogs: auditLogger.syncPendingLogs.bind(auditLogger)
  };
};

export default useAuditLogger;