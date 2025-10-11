/**
 * Sistema de Cache Inteligente
 * 
 * Cache em memória e localStorage com TTL e invalidação automática
 */

// ============================================================================
// INTERFACES
// ============================================================================

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

interface CacheOptions {
  ttl?: number; // Time to live em ms
  persistent?: boolean; // Salvar no localStorage
  maxSize?: number; // Tamanho máximo do cache
}

// ============================================================================
// CLASSE DE CACHE
// ============================================================================

class CacheManager {
  private memoryCache = new Map<string, CacheItem<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutos
  private maxSize = 100;

  // ============================================================================
  // MÉTODOS PRINCIPAIS
  // ============================================================================

  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const {
      ttl = this.defaultTTL,
      persistent = false,
      maxSize = this.maxSize
    } = options;

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      key
    };

    // Adicionar ao cache em memória
    this.memoryCache.set(key, item);

    // Limpar cache se exceder tamanho máximo
    if (this.memoryCache.size > maxSize) {
      this.evictOldest();
    }

    // Salvar no localStorage se persistente
    if (persistent) {
      this.saveToLocalStorage(key, item);
    }
  }

  get<T>(key: string): T | null {
    // Tentar buscar no cache em memória primeiro
    let item = this.memoryCache.get(key);

    // Se não encontrou, tentar no localStorage
    if (!item) {
      item = this.loadFromLocalStorage(key);
      if (item) {
        // Recolocar no cache em memória
        this.memoryCache.set(key, item);
      }
    }

    if (!item) return null;

    // Verificar se expirou
    if (this.isExpired(item)) {
      this.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.memoryCache.delete(key);
    this.removeFromLocalStorage(key);
  }

  clear(): void {
    this.memoryCache.clear();
    this.clearLocalStorage();
  }

  // ============================================================================
  // MÉTODOS DE INVALIDAÇÃO
  // ============================================================================

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    
    // Invalidar cache em memória
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
      }
    }

    // Invalidar localStorage
    this.invalidateLocalStoragePattern(pattern);
  }

  invalidateByPrefix(prefix: string): void {
    this.invalidatePattern(`^${prefix}`);
  }

  // ============================================================================
  // MÉTODOS UTILITÁRIOS
  // ============================================================================

  private isExpired(item: CacheItem<any>): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }

  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, item] of this.memoryCache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
    }
  }

  private saveToLocalStorage(key: string, item: CacheItem<any>): void {
    try {
      const cacheKey = `cache_${key}`;
      localStorage.setItem(cacheKey, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  private loadFromLocalStorage(key: string): CacheItem<any> | null {
    try {
      const cacheKey = `cache_${key}`;
      const stored = localStorage.getItem(cacheKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
      return null;
    }
  }

  private removeFromLocalStorage(key: string): void {
    try {
      const cacheKey = `cache_${key}`;
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  }

  private clearLocalStorage(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear localStorage cache:', error);
    }
  }

  private invalidateLocalStoragePattern(pattern: string): void {
    try {
      const regex = new RegExp(pattern);
      const keys = Object.keys(localStorage);
      
      keys.forEach(storageKey => {
        if (storageKey.startsWith('cache_')) {
          const cacheKey = storageKey.replace('cache_', '');
          if (regex.test(cacheKey)) {
            localStorage.removeItem(storageKey);
          }
        }
      });
    } catch (error) {
      console.warn('Failed to invalidate localStorage pattern:', error);
    }
  }

  // ============================================================================
  // MÉTODOS DE ESTATÍSTICAS
  // ============================================================================

  getStats() {
    const memorySize = this.memoryCache.size;
    const localStorageSize = Object.keys(localStorage)
      .filter(key => key.startsWith('cache_')).length;

    return {
      memorySize,
      localStorageSize,
      totalSize: memorySize + localStorageSize
    };
  }

  // ============================================================================
  // LIMPEZA AUTOMÁTICA
  // ============================================================================

  startAutoCleanup(intervalMs: number = 60000): () => void {
    const cleanup = () => {
      const now = Date.now();
      
      // Limpar cache em memória
      for (const [key, item] of this.memoryCache.entries()) {
        if (this.isExpired(item)) {
          this.memoryCache.delete(key);
        }
      }

      // Limpar localStorage
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(storageKey => {
          if (storageKey.startsWith('cache_')) {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
              const item = JSON.parse(stored);
              if (this.isExpired(item)) {
                localStorage.removeItem(storageKey);
              }
            }
          }
        });
      } catch (error) {
        console.warn('Auto cleanup failed:', error);
      }
    };

    const interval = setInterval(cleanup, intervalMs);
    
    return () => clearInterval(interval);
  }
}

// ============================================================================
// INSTÂNCIA GLOBAL
// ============================================================================

export const cache = new CacheManager();

// ============================================================================
// HOOKS E UTILITÁRIOS ESPECÍFICOS
// ============================================================================

/**
 * Hook para cache com React
 */
export const useCache = <T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
) => {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Tentar buscar do cache primeiro
        const cached = cache.get<T>(key);
        if (cached) {
          setData(cached);
          setLoading(false);
          return;
        }

        // Se não tem cache, buscar dados
        const result = await fetcher();
        cache.set(key, result, options);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [key]);

  const invalidate = () => {
    cache.delete(key);
  };

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await fetcher();
      cache.set(key, result, options);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar dados');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, invalidate, refresh };
};

/**
 * Cache específico para funcionários
 */
export const employeeCache = {
  getList: () => cache.get<any[]>('employees_list'),
  setList: (employees: any[]) => cache.set('employees_list', employees, { 
    ttl: 2 * 60 * 1000, // 2 minutos
    persistent: true 
  }),
  
  getEmployee: (id: string) => cache.get<any>(`employee_${id}`),
  setEmployee: (id: string, employee: any) => cache.set(`employee_${id}`, employee, {
    ttl: 5 * 60 * 1000, // 5 minutos
    persistent: true
  }),
  
  getStats: () => cache.get<any>('employee_stats'),
  setStats: (stats: any) => cache.set('employee_stats', stats, {
    ttl: 1 * 60 * 1000 // 1 minuto
  }),
  
  invalidateAll: () => cache.invalidateByPrefix('employee'),
  invalidateList: () => cache.delete('employees_list'),
  invalidateEmployee: (id: string) => cache.delete(`employee_${id}`)
};

export default cache;