/**
 * Middleware de Performance para otimizar consultas e monitorar métricas
 */

import { supabase } from '../lib/supabase';

interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: number;
  cached: boolean;
  error?: string;
}

interface PerformanceStats {
  totalQueries: number;
  averageQueryTime: number;
  cacheHitRate: number;
  slowQueries: QueryMetrics[];
  errorRate: number;
}

class PerformanceMiddleware {
  private static instance: PerformanceMiddleware;
  private metrics: QueryMetrics[] = [];
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private readonly SLOW_QUERY_THRESHOLD = 1000; // 1 segundo
  private readonly MAX_METRICS = 1000; // Manter apenas as últimas 1000 métricas
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos

  private constructor() {}

  static getInstance(): PerformanceMiddleware {
    if (!PerformanceMiddleware.instance) {
      PerformanceMiddleware.instance = new PerformanceMiddleware();
    }
    return PerformanceMiddleware.instance;
  }

  /**
   * Gerar chave de cache para query
   */
  private generateCacheKey(table: string, query: any): string {
    return `${table}:${JSON.stringify(query)}`;
  }

  /**
   * Verificar se item do cache é válido
   */
  private isCacheValid(cacheItem: any): boolean {
    if (!cacheItem) return false;
    return (Date.now() - cacheItem.timestamp) < cacheItem.ttl;
  }

  /**
   * Executar query com cache e métricas
   */
  async executeQuery<T>(
    table: string,
    queryBuilder: any,
    options: {
      useCache?: boolean;
      ttl?: number;
      description?: string;
    } = {}
  ): Promise<{ data: T | null; error: any; fromCache: boolean }> {
    const startTime = performance.now();
    const { useCache = true, ttl = this.DEFAULT_TTL, description = '' } = options;
    
    // Gerar chave de cache
    const cacheKey = this.generateCacheKey(table, queryBuilder);
    
    // Verificar cache se habilitado
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (this.isCacheValid(cached)) {
        const duration = performance.now() - startTime;
        
        // Registrar métrica de cache hit
        this.recordMetric({
          query: `${table} (${description})`,
          duration,
          timestamp: Date.now(),
          cached: true
        });
        
        console.log(`🎯 Cache HIT: ${table} (${duration.toFixed(2)}ms)`);
        return { data: cached.data, error: null, fromCache: true };
      }
    }

    try {
      // Executar query
      const { data, error } = await queryBuilder;
      const duration = performance.now() - startTime;

      // Armazenar no cache se bem-sucedida
      if (!error && useCache) {
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          ttl
        });
      }

      // Registrar métrica
      this.recordMetric({
        query: `${table} (${description})`,
        duration,
        timestamp: Date.now(),
        cached: false,
        error: error?.message
      });

      // Log de performance
      const logLevel = duration > this.SLOW_QUERY_THRESHOLD ? '🐌' : '⚡';
      console.log(`${logLevel} Query: ${table} (${duration.toFixed(2)}ms)${error ? ' - ERROR' : ''}`);

      return { data, error, fromCache: false };
    } catch (error) {
      const duration = performance.now() - startTime;
      
      // Registrar métrica de erro
      this.recordMetric({
        query: `${table} (${description})`,
        duration,
        timestamp: Date.now(),
        cached: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      console.error(`❌ Query Error: ${table} (${duration.toFixed(2)}ms)`, error);
      return { data: null, error, fromCache: false };
    }
  }

  /**
   * Registrar métrica de performance
   */
  private recordMetric(metric: QueryMetrics): void {
    this.metrics.push(metric);
    
    // Manter apenas as últimas métricas
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  /**
   * Obter estatísticas de performance
   */
  getPerformanceStats(): PerformanceStats {
    if (this.metrics.length === 0) {
      return {
        totalQueries: 0,
        averageQueryTime: 0,
        cacheHitRate: 0,
        slowQueries: [],
        errorRate: 0
      };
    }

    const totalQueries = this.metrics.length;
    const cachedQueries = this.metrics.filter(m => m.cached).length;
    const errorQueries = this.metrics.filter(m => m.error).length;
    const slowQueries = this.metrics.filter(m => m.duration > this.SLOW_QUERY_THRESHOLD);
    
    const totalTime = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const averageQueryTime = totalTime / totalQueries;
    
    const cacheHitRate = totalQueries > 0 ? (cachedQueries / totalQueries) * 100 : 0;
    const errorRate = totalQueries > 0 ? (errorQueries / totalQueries) * 100 : 0;

    return {
      totalQueries,
      averageQueryTime: Math.round(averageQueryTime * 100) / 100,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      slowQueries: slowQueries.slice(-10), // Últimas 10 queries lentas
      errorRate: Math.round(errorRate * 100) / 100
    };
  }

  /**
   * Limpar cache expirado
   */
  cleanExpiredCache(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, value] of this.cache.entries()) {
      if ((now - value.timestamp) >= value.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 ${cleanedCount} itens expirados removidos do cache`);
    }

    return cleanedCount;
  }

  /**
   * Invalidar cache por padrão
   */
  invalidateCache(pattern?: string): number {
    if (!pattern) {
      const size = this.cache.size;
      this.cache.clear();
      console.log(`🗑️ Cache completamente limpo (${size} itens)`);
      return size;
    }

    let deletedCount = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      console.log(`🗑️ ${deletedCount} itens removidos do cache (padrão: ${pattern})`);
    }

    return deletedCount;
  }

  /**
   * Obter tamanho do cache
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Resetar métricas
   */
  resetMetrics(): void {
    this.metrics = [];
    console.log('📊 Métricas de performance resetadas');
  }

  /**
   * Exportar métricas para análise
   */
  exportMetrics(): {
    stats: PerformanceStats;
    rawMetrics: QueryMetrics[];
    cacheInfo: {
      size: number;
      keys: string[];
    };
  } {
    return {
      stats: this.getPerformanceStats(),
      rawMetrics: [...this.metrics],
      cacheInfo: {
        size: this.cache.size,
        keys: Array.from(this.cache.keys())
      }
    };
  }
}

// ============================================================================
// FUNÇÕES HELPER PARA USO FÁCIL
// ============================================================================

const performanceMiddleware = PerformanceMiddleware.getInstance();

/**
 * Executar query otimizada com cache
 */
export const executeOptimizedQuery = async <T>(
  table: string,
  queryBuilder: any,
  options?: {
    useCache?: boolean;
    ttl?: number;
    description?: string;
  }
) => {
  return performanceMiddleware.executeQuery<T>(table, queryBuilder, options);
};

/**
 * Obter estatísticas de performance
 */
export const getPerformanceStats = () => {
  return performanceMiddleware.getPerformanceStats();
};

/**
 * Limpar cache
 */
export const cleanCache = (pattern?: string) => {
  return performanceMiddleware.invalidateCache(pattern);
};

/**
 * Limpar cache expirado
 */
export const cleanExpiredCache = () => {
  return performanceMiddleware.cleanExpiredCache();
};

/**
 * Exportar métricas
 */
export const exportPerformanceMetrics = () => {
  return performanceMiddleware.exportMetrics();
};

// ============================================================================
// QUERIES OTIMIZADAS ESPECÍFICAS
// ============================================================================

/**
 * Buscar usuários com cache otimizado
 */
export const getOptimizedUsers = async (empresaId: string, filters: any = {}) => {
  let query = supabase
    .from('usuarios_empresa')
    .select('id, user_id, nome_completo, email, cargo, status, tem_acesso_sistema')
    .eq('empresa_id', empresaId)
    .order('nome_completo');

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  return executeOptimizedQuery(
    'usuarios_empresa',
    query,
    {
      useCache: true,
      ttl: 2 * 60 * 1000, // 2 minutos
      description: `users_${empresaId}_${JSON.stringify(filters)}`
    }
  );
};

/**
 * Buscar permissões de usuário com cache
 */
export const getOptimizedUserPermissions = async (userId: string, empresaId: string) => {
  // Buscar usuário empresa
  const userQuery = supabase
    .from('usuarios_empresa')
    .select('id, user_id, nome_completo, email, papel, tem_acesso_sistema')
    .eq('user_id', userId)
    .eq('empresa_id', empresaId)
    .eq('status', 'ativo')
    .maybeSingle();

  const userResult = await executeOptimizedQuery(
    'usuarios_empresa',
    userQuery,
    {
      useCache: true,
      ttl: 5 * 60 * 1000, // 5 minutos
      description: `user_${userId}_${empresaId}`
    }
  );

  if (userResult.error || !userResult.data) {
    return { data: null, error: userResult.error, fromCache: userResult.fromCache };
  }

  // Buscar permissões específicas
  const permissionsQuery = supabase
    .from('permissoes_usuario')
    .select('modulo, permissoes')
    .eq('usuario_empresa_id', userResult.data.id);

  const permissionsResult = await executeOptimizedQuery(
    'permissoes_usuario',
    permissionsQuery,
    {
      useCache: true,
      ttl: 5 * 60 * 1000, // 5 minutos
      description: `permissions_${userResult.data.id}`
    }
  );

  return {
    data: {
      usuario: userResult.data,
      permissions: permissionsResult.data || []
    },
    error: permissionsResult.error,
    fromCache: userResult.fromCache && permissionsResult.fromCache
  };
};

/**
 * Buscar menu items com cache
 */
export const getOptimizedMenuItems = async (empresaId?: string) => {
  let query = supabase
    .from('menu_items')
    .select('*, inventory_items!left(name, image_url, current_stock, available_for_sale)')
    .eq('available', true)
    .order('name');

  if (empresaId) {
    query = query.eq('empresa_id', empresaId);
  }

  return executeOptimizedQuery(
    'menu_items',
    query,
    {
      useCache: true,
      ttl: 10 * 60 * 1000, // 10 minutos (menu muda pouco)
      description: `menu_${empresaId || 'all'}`
    }
  );
};

// Limpar cache automaticamente a cada 10 minutos
setInterval(() => {
  cleanExpiredCache();
}, 10 * 60 * 1000);

export default performanceMiddleware;