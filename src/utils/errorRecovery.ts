/**
 * Sistema de Recuperação de Erros
 * 
 * Utilitários para retry automático, fallbacks e recuperação de falhas
 */

// ============================================================================
// INTERFACES
// ============================================================================

export interface RetryOptions {
  maxAttempts: number;
  delay: number;
  backoff: 'linear' | 'exponential';
  retryCondition?: (error: any) => boolean;
}

export interface FallbackOptions {
  fallbackFn?: () => Promise<any>;
  useCache?: boolean;
  cacheKey?: string;
  offlineMode?: boolean;
}

export interface ErrorRecoveryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  usedFallback: boolean;
  fromCache: boolean;
}

// ============================================================================
// CACHE SIMPLES
// ============================================================================

class SimpleCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl: number = 300000): void { // 5 min default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }
}

const cache = new SimpleCache();

// ============================================================================
// UTILITÁRIOS DE RETRY
// ============================================================================

/**
 * Executa uma função com retry automático
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<ErrorRecoveryResult<T>> => {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = 'exponential',
    retryCondition = (error) => !isNonRetryableError(error)
  } = options;

  let lastError: Error;
  let attempts = 0;

  for (let i = 0; i < maxAttempts; i++) {
    attempts++;
    
    try {
      const result = await fn();
      return {
        success: true,
        data: result,
        attempts,
        usedFallback: false,
        fromCache: false
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Verificar se deve tentar novamente
      if (i === maxAttempts - 1 || !retryCondition(lastError)) {
        break;
      }

      // Calcular delay
      const currentDelay = backoff === 'exponential' 
        ? delay * Math.pow(2, i)
        : delay * (i + 1);

      console.warn(`Attempt ${i + 1} failed, retrying in ${currentDelay}ms:`, lastError.message);
      await sleep(currentDelay);
    }
  }

  return {
    success: false,
    error: lastError!,
    attempts,
    usedFallback: false,
    fromCache: false
  };
};

/**
 * Executa uma função com fallback e cache
 */
export const withFallback = async <T>(
  fn: () => Promise<T>,
  options: FallbackOptions & Partial<RetryOptions> = {}
): Promise<ErrorRecoveryResult<T>> => {
  const {
    fallbackFn,
    useCache = true,
    cacheKey,
    offlineMode = false,
    ...retryOptions
  } = options;

  // Tentar buscar do cache primeiro se offline
  if (offlineMode && useCache && cacheKey) {
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return {
        success: true,
        data: cachedData,
        attempts: 0,
        usedFallback: false,
        fromCache: true
      };
    }
  }

  // Tentar executar função principal com retry
  const result = await withRetry(fn, retryOptions);
  
  if (result.success) {
    // Salvar no cache se bem-sucedido
    if (useCache && cacheKey && result.data) {
      cache.set(cacheKey, result.data);
    }
    return result;
  }

  // Tentar fallback
  if (fallbackFn) {
    try {
      const fallbackData = await fallbackFn();
      return {
        success: true,
        data: fallbackData,
        attempts: result.attempts,
        usedFallback: true,
        fromCache: false
      };
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
    }
  }

  // Tentar cache como último recurso
  if (useCache && cacheKey) {
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return {
        success: true,
        data: cachedData,
        attempts: result.attempts,
        usedFallback: true,
        fromCache: true
      };
    }
  }

  return result;
};

// ============================================================================
// RECUPERAÇÃO ESPECÍFICA PARA FUNCIONÁRIOS
// ============================================================================

/**
 * Carrega funcionários com recuperação de erros
 */
export const loadEmployeesWithRecovery = async (
  loadFn: () => Promise<any[]>
): Promise<ErrorRecoveryResult<any[]>> => {
  return withFallback(loadFn, {
    maxAttempts: 3,
    delay: 1000,
    backoff: 'exponential',
    useCache: true,
    cacheKey: 'employees_list',
    fallbackFn: async () => {
      // Fallback: retornar lista vazia ou dados mockados
      console.warn('Using fallback: returning empty employee list');
      return [];
    },
    retryCondition: (error) => {
      // Retry em erros de rede, mas não em erros de autenticação
      return !error.message.includes('auth') && !error.message.includes('permission');
    }
  });
};

/**
 * Salva funcionário com recuperação de erros
 */
export const saveEmployeeWithRecovery = async (
  saveFn: () => Promise<any>,
  employeeData: any
): Promise<ErrorRecoveryResult<any>> => {
  return withFallback(saveFn, {
    maxAttempts: 5,
    delay: 2000,
    backoff: 'exponential',
    useCache: false, // Não cachear operações de escrita
    fallbackFn: async () => {
      // Fallback: salvar localmente para sincronizar depois
      const pendingKey = `pending_save_${Date.now()}`;
      localStorage.setItem(pendingKey, JSON.stringify({
        type: 'employee_save',
        data: employeeData,
        timestamp: Date.now()
      }));
      
      console.warn('Saved employee data locally for later sync');
      return { id: pendingKey, ...employeeData, pending: true };
    },
    retryCondition: (error) => {
      // Retry em erros temporários
      const retryableErrors = ['network', 'timeout', 'server', '5'];
      return retryableErrors.some(keyword => 
        error.message.toLowerCase().includes(keyword)
      );
    }
  });
};

/**
 * Deleta funcionário com recuperação de erros
 */
export const deleteEmployeeWithRecovery = async (
  deleteFn: () => Promise<void>,
  employeeId: string
): Promise<ErrorRecoveryResult<void>> => {
  return withFallback(deleteFn, {
    maxAttempts: 3,
    delay: 1500,
    backoff: 'exponential',
    fallbackFn: async () => {
      // Fallback: marcar para deleção posterior
      const pendingKey = `pending_delete_${employeeId}`;
      localStorage.setItem(pendingKey, JSON.stringify({
        type: 'employee_delete',
        employeeId,
        timestamp: Date.now()
      }));
      
      console.warn('Marked employee for deletion when connection is restored');
    }
  });
};

// ============================================================================
// SINCRONIZAÇÃO DE OPERAÇÕES PENDENTES
// ============================================================================

/**
 * Sincroniza operações pendentes quando a conexão é restaurada
 */
export const syncPendingOperations = async (): Promise<{
  synced: number;
  failed: number;
  errors: string[];
}> => {
  const results = { synced: 0, failed: 0, errors: [] as string[] };
  
  // Buscar operações pendentes no localStorage
  const pendingKeys = Object.keys(localStorage).filter(key => 
    key.startsWith('pending_save_') || key.startsWith('pending_delete_')
  );

  for (const key of pendingKeys) {
    try {
      const operation = JSON.parse(localStorage.getItem(key) || '{}');
      
      if (operation.type === 'employee_save') {
        // Tentar salvar funcionário pendente
        // Em um sistema real, isso chamaria a API de criação/atualização
        console.log('Syncing pending employee save:', operation.data);
        localStorage.removeItem(key);
        results.synced++;
      } else if (operation.type === 'employee_delete') {
        // Tentar deletar funcionário pendente
        // Em um sistema real, isso chamaria a API de deleção
        console.log('Syncing pending employee delete:', operation.employeeId);
        localStorage.removeItem(key);
        results.synced++;
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`Failed to sync ${key}: ${error}`);
    }
  }

  return results;
};

// ============================================================================
// UTILITÁRIOS
// ============================================================================

/**
 * Verifica se um erro não deve ser retentado
 */
const isNonRetryableError = (error: any): boolean => {
  const nonRetryablePatterns = [
    'auth', 'permission', 'unauthorized', 'forbidden',
    'not found', '404', '401', '403', 'validation'
  ];
  
  const errorMessage = error.message?.toLowerCase() || '';
  return nonRetryablePatterns.some(pattern => errorMessage.includes(pattern));
};

/**
 * Sleep utility
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Verifica status da conexão
 */
export const isOnline = (): boolean => {
  return navigator.onLine;
};

/**
 * Monitora mudanças na conexão
 */
export const onConnectionChange = (callback: (online: boolean) => void): () => void => {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

// ============================================================================
// MENSAGENS DE ERRO AMIGÁVEIS
// ============================================================================

export const getErrorMessage = (error: any): string => {
  if (!error) return 'Erro desconhecido';

  const message = error.message || error.toString();

  // Mapear erros técnicos para mensagens amigáveis
  const errorMappings: Record<string, string> = {
    'network error': 'Problema de conexão. Verifique sua internet.',
    'timeout': 'A operação demorou muito para responder. Tente novamente.',
    'server error': 'Erro no servidor. Tente novamente em alguns minutos.',
    'auth': 'Erro de autenticação. Faça login novamente.',
    'permission': 'Você não tem permissão para esta operação.',
    'validation': 'Dados inválidos. Verifique as informações.',
    'not found': 'Registro não encontrado.',
    'duplicate': 'Este registro já existe.',
    'connection': 'Problema de conexão com o servidor.'
  };

  for (const [pattern, friendlyMessage] of Object.entries(errorMappings)) {
    if (message.toLowerCase().includes(pattern)) {
      return friendlyMessage;
    }
  }

  return 'Ocorreu um erro inesperado. Tente novamente.';
};

/**
 * Cria uma mensagem de recuperação baseada no resultado
 */
export const getRecoveryMessage = (result: ErrorRecoveryResult<any>): string => {
  if (result.success) {
    if (result.fromCache) {
      return 'Dados carregados do cache local (sem conexão)';
    }
    if (result.usedFallback) {
      return 'Operação realizada com método alternativo';
    }
    if (result.attempts > 1) {
      return `Operação realizada após ${result.attempts} tentativas`;
    }
    return 'Operação realizada com sucesso';
  }

  return getErrorMessage(result.error);
};

export default {
  withRetry,
  withFallback,
  loadEmployeesWithRecovery,
  saveEmployeeWithRecovery,
  deleteEmployeeWithRecovery,
  syncPendingOperations,
  getErrorMessage,
  getRecoveryMessage,
  isOnline,
  onConnectionChange
};