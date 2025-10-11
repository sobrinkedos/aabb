/**
 * Configurações de Performance do Sistema
 * Controla quais otimizações estão ativas
 */

export const PERFORMANCE_CONFIG = {
  // ============================================================================
  // CACHE SETTINGS
  // ============================================================================
  CACHE: {
    // Habilitar cache de permissões
    ENABLE_PERMISSIONS_CACHE: true,
    
    // TTL padrão para cache de permissões (5 minutos)
    PERMISSIONS_CACHE_TTL: 5 * 60 * 1000,
    
    // TTL para cache de usuários (2 minutos)
    USERS_CACHE_TTL: 2 * 60 * 1000,
    
    // TTL para cache de menu items (10 minutos)
    MENU_CACHE_TTL: 10 * 60 * 1000,
    
    // Limpeza automática de cache expirado
    AUTO_CLEANUP_ENABLED: true,
    
    // Intervalo de limpeza automática (10 minutos)
    AUTO_CLEANUP_INTERVAL: 10 * 60 * 1000
  },

  // ============================================================================
  // DEBOUNCE SETTINGS
  // ============================================================================
  DEBOUNCE: {
    // Delay padrão para buscas (300ms)
    SEARCH_DELAY: 300,
    
    // Comprimento mínimo para busca
    MIN_SEARCH_LENGTH: 2,
    
    // Máximo de itens no histórico de busca
    MAX_SEARCH_HISTORY: 10
  },

  // ============================================================================
  // QUERY OPTIMIZATION
  // ============================================================================
  QUERIES: {
    // Limite padrão de resultados
    DEFAULT_LIMIT: 100,
    
    // Limite para usuários
    USERS_LIMIT: 50,
    
    // Limite para pedidos recentes
    RECENT_ORDERS_LIMIT: 20,
    
    // Limite para itens de estoque baixo
    LOW_STOCK_LIMIT: 10,
    
    // Threshold para queries lentas (1 segundo)
    SLOW_QUERY_THRESHOLD: 1000
  },

  // ============================================================================
  // MONITORING SETTINGS
  // ============================================================================
  MONITORING: {
    // Habilitar monitoramento de performance
    ENABLE_PERFORMANCE_MONITOR: true,
    
    // Auto-refresh do monitor (5 segundos)
    MONITOR_REFRESH_INTERVAL: 5000,
    
    // Máximo de métricas armazenadas
    MAX_METRICS: 1000,
    
    // Mostrar botão flutuante em desenvolvimento
    SHOW_FLOATING_BUTTON_DEV: true,
    
    // Mostrar botão flutuante em produção
    SHOW_FLOATING_BUTTON_PROD: false,
    
    // Posição do botão flutuante
    FLOATING_BUTTON_POSITION: 'bottom-left' as const
  },

  // ============================================================================
  // COMPONENT OPTIMIZATION
  // ============================================================================
  COMPONENTS: {
    // Usar componentes otimizados
    USE_OPTIMIZED_COMPONENTS: true,
    
    // Usar memoização agressiva
    USE_AGGRESSIVE_MEMOIZATION: true,
    
    // Usar virtual scrolling para listas grandes
    USE_VIRTUAL_SCROLLING: false, // Implementar futuramente
    
    // Threshold para virtual scrolling
    VIRTUAL_SCROLLING_THRESHOLD: 100
  },

  // ============================================================================
  // LAZY LOADING
  // ============================================================================
  LAZY_LOADING: {
    // Habilitar lazy loading
    ENABLED: true,
    
    // Carregar menu items sob demanda
    LAZY_LOAD_MENU_ITEMS: true,
    
    // Carregar inventory sob demanda
    LAZY_LOAD_INVENTORY: true,
    
    // Carregar members sob demanda
    LAZY_LOAD_MEMBERS: true
  },

  // ============================================================================
  // DEVELOPMENT SETTINGS
  // ============================================================================
  DEVELOPMENT: {
    // Logs detalhados de performance
    VERBOSE_LOGGING: process.env.NODE_ENV === 'development',
    
    // Mostrar estatísticas de performance nos componentes
    SHOW_PERFORMANCE_STATS: process.env.NODE_ENV === 'development',
    
    // Alertas para re-renders excessivos
    WARN_EXCESSIVE_RERENDERS: process.env.NODE_ENV === 'development',
    
    // Threshold para alerta de re-renders
    RERENDER_WARNING_THRESHOLD: 10
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Verificar se uma otimização está habilitada
 */
export const isOptimizationEnabled = (path: string): boolean => {
  const keys = path.split('.');
  let current: any = PERFORMANCE_CONFIG;
  
  for (const key of keys) {
    if (current[key] === undefined) return false;
    current = current[key];
  }
  
  return Boolean(current);
};

/**
 * Obter valor de configuração
 */
export const getConfigValue = <T>(path: string, defaultValue: T): T => {
  const keys = path.split('.');
  let current: any = PERFORMANCE_CONFIG;
  
  for (const key of keys) {
    if (current[key] === undefined) return defaultValue;
    current = current[key];
  }
  
  return current as T;
};

/**
 * Verificar se está em modo de desenvolvimento
 */
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

/**
 * Verificar se está em modo de produção
 */
export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

/**
 * Obter configurações de cache
 */
export const getCacheConfig = () => PERFORMANCE_CONFIG.CACHE;

/**
 * Obter configurações de debounce
 */
export const getDebounceConfig = () => PERFORMANCE_CONFIG.DEBOUNCE;

/**
 * Obter configurações de queries
 */
export const getQueryConfig = () => PERFORMANCE_CONFIG.QUERIES;

/**
 * Obter configurações de monitoramento
 */
export const getMonitoringConfig = () => PERFORMANCE_CONFIG.MONITORING;

export default PERFORMANCE_CONFIG;