/**
 * Hook para Recuperação de Erros
 * 
 * Gerencia retry automático, fallbacks e sincronização offline
 */

import { useState, useEffect, useCallback } from 'react';
import {
  withRetry,
  withFallback,
  syncPendingOperations,
  getErrorMessage,
  getRecoveryMessage,
  isOnline,
  onConnectionChange,
  ErrorRecoveryResult
} from '../utils/errorRecovery';

// ============================================================================
// INTERFACES
// ============================================================================

interface ErrorRecoveryState {
  isOnline: boolean;
  isRetrying: boolean;
  pendingOperations: number;
  lastError: string | null;
  lastRecovery: string | null;
}

interface UseErrorRecoveryOptions {
  autoSync?: boolean;
  showNotifications?: boolean;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export const useErrorRecovery = (options: UseErrorRecoveryOptions = {}) => {
  const { autoSync = true, showNotifications = true } = options;

  const [state, setState] = useState<ErrorRecoveryState>({
    isOnline: isOnline(),
    isRetrying: false,
    pendingOperations: 0,
    lastError: null,
    lastRecovery: null
  });

  // Monitorar mudanças de conexão
  useEffect(() => {
    const cleanup = onConnectionChange((online) => {
      setState(prev => ({ ...prev, isOnline: online }));
      
      if (online && autoSync) {
        handleAutoSync();
      }
    });

    return cleanup;
  }, [autoSync]);

  // Contar operações pendentes
  useEffect(() => {
    const updatePendingCount = () => {
      const pendingKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('pending_save_') || key.startsWith('pending_delete_')
      );
      setState(prev => ({ ...prev, pendingOperations: pendingKeys.length }));
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000); // Check every 5s

    return () => clearInterval(interval);
  }, []);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleAutoSync = useCallback(async () => {
    if (state.pendingOperations === 0) return;

    try {
      setState(prev => ({ ...prev, isRetrying: true }));
      const result = await syncPendingOperations();
      
      if (result.synced > 0) {
        setState(prev => ({
          ...prev,
          lastRecovery: `${result.synced} operações sincronizadas`,
          pendingOperations: prev.pendingOperations - result.synced
        }));
      }

      if (result.failed > 0) {
        setState(prev => ({
          ...prev,
          lastError: `${result.failed} operações falharam na sincronização`
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        lastError: getErrorMessage(error)
      }));
    } finally {
      setState(prev => ({ ...prev, isRetrying: false }));
    }
  }, [state.pendingOperations]);

  const executeWithRecovery = useCallback(async <T>(
    operation: () => Promise<T>,
    options: {
      maxAttempts?: number;
      fallback?: () => Promise<T>;
      cacheKey?: string;
      operationType?: string;
    } = {}
  ): Promise<ErrorRecoveryResult<T>> => {
    const {
      maxAttempts = 3,
      fallback,
      cacheKey,
      operationType = 'operation'
    } = options;

    setState(prev => ({ ...prev, isRetrying: true, lastError: null }));

    try {
      const result = await withFallback(operation, {
        maxAttempts,
        delay: 1000,
        backoff: 'exponential',
        fallbackFn: fallback,
        useCache: !!cacheKey,
        cacheKey,
        offlineMode: !state.isOnline
      });

      const message = getRecoveryMessage(result);
      setState(prev => ({
        ...prev,
        isRetrying: false,
        lastRecovery: result.success ? message : null,
        lastError: result.success ? null : message
      }));

      return result;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setState(prev => ({
        ...prev,
        isRetrying: false,
        lastError: errorMessage
      }));

      return {
        success: false,
        error: error instanceof Error ? error : new Error(errorMessage),
        attempts: maxAttempts,
        usedFallback: false,
        fromCache: false
      };
    }
  }, [state.isOnline]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, lastError: null }));
  }, []);

  const clearRecovery = useCallback(() => {
    setState(prev => ({ ...prev, lastRecovery: null }));
  }, []);

  const manualSync = useCallback(async () => {
    await handleAutoSync();
  }, [handleAutoSync]);

  // ============================================================================
  // OPERAÇÕES ESPECÍFICAS
  // ============================================================================

  const loadWithRecovery = useCallback(async <T>(
    loadFn: () => Promise<T>,
    cacheKey?: string
  ): Promise<ErrorRecoveryResult<T>> => {
    return executeWithRecovery(loadFn, {
      maxAttempts: 3,
      cacheKey,
      operationType: 'load'
    });
  }, [executeWithRecovery]);

  const saveWithRecovery = useCallback(async <T>(
    saveFn: () => Promise<T>,
    data: any,
    fallbackKey?: string
  ): Promise<ErrorRecoveryResult<T>> => {
    return executeWithRecovery(saveFn, {
      maxAttempts: 5,
      fallback: fallbackKey ? async () => {
        // Salvar localmente para sincronizar depois
        localStorage.setItem(fallbackKey, JSON.stringify({
          type: 'pending_save',
          data,
          timestamp: Date.now()
        }));
        return { ...data, pending: true } as T;
      } : undefined,
      operationType: 'save'
    });
  }, [executeWithRecovery]);

  const deleteWithRecovery = useCallback(async (
    deleteFn: () => Promise<void>,
    itemId: string
  ): Promise<ErrorRecoveryResult<void>> => {
    return executeWithRecovery(deleteFn, {
      maxAttempts: 3,
      fallback: async () => {
        // Marcar para deleção posterior
        localStorage.setItem(`pending_delete_${itemId}`, JSON.stringify({
          type: 'pending_delete',
          itemId,
          timestamp: Date.now()
        }));
      },
      operationType: 'delete'
    });
  }, [executeWithRecovery]);

  return {
    // Estado
    ...state,
    
    // Métodos gerais
    executeWithRecovery,
    clearError,
    clearRecovery,
    manualSync,
    
    // Operações específicas
    loadWithRecovery,
    saveWithRecovery,
    deleteWithRecovery
  };
};

// ============================================================================
// HOOK PARA NOTIFICAÇÕES DE ERRO
// ============================================================================

export const useErrorNotifications = () => {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'error' | 'warning' | 'success';
    message: string;
    timestamp: number;
  }>>([]);

  const addNotification = useCallback((
    type: 'error' | 'warning' | 'success',
    message: string
  ) => {
    const notification = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: Date.now()
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-remove após 5 segundos
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll
  };
};

export default useErrorRecovery;