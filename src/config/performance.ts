// Configurações de performance para o sistema
export const PERFORMANCE_CONFIG = {
  // Ativar versão otimizada do AppContext
  USE_OPTIMIZED_CONTEXT: true,
  
  // Ativar versão otimizada do Dashboard
  USE_OPTIMIZED_DASHBOARD: true,
  
  // Configurações de carregamento lazy
  LAZY_LOADING: {
    // Carregar menu items apenas quando necessário
    MENU_ITEMS: true,
    
    // Carregar inventory apenas quando necessário
    INVENTORY: true,
    
    // Carregar members apenas quando necessário
    MEMBERS: true,
    
    // Carregar kitchen/bar orders apenas quando necessário
    KITCHEN_BAR_ORDERS: true
  },
  
  // Configurações de cache
  CACHE: {
    // Tempo de cache para dados do dashboard (em ms)
    DASHBOARD_CACHE_TIME: 30000, // 30 segundos
    
    // Tempo de cache para estatísticas (em ms)
    STATS_CACHE_TIME: 60000, // 1 minuto
    
    // Limite de itens em cache
    MAX_CACHED_ITEMS: 100
  },
  
  // Configurações de paginação
  PAGINATION: {
    // Número de pedidos carregados inicialmente
    INITIAL_ORDERS_LIMIT: 20,
    
    // Número de itens de estoque baixo mostrados
    LOW_STOCK_LIMIT: 10,
    
    // Número de notificações mantidas
    NOTIFICATIONS_LIMIT: 5
  },
  
  // Configurações de real-time
  REALTIME: {
    // Debounce para atualizações em tempo real (em ms)
    UPDATE_DEBOUNCE: 500,
    
    // Intervalo mínimo entre atualizações (em ms)
    MIN_UPDATE_INTERVAL: 1000,
    
    // Desabilitar subscriptions desnecessárias
    DISABLE_UNUSED_SUBSCRIPTIONS: true
  },
  
  // Configurações de animações
  ANIMATIONS: {
    // Reduzir animações para melhor performance
    REDUCE_MOTION: false,
    
    // Duração padrão das animações (em segundos)
    DEFAULT_DURATION: 0.3,
    
    // Delay entre animações em sequência (em segundos)
    STAGGER_DELAY: 0.05
  }
};

// Função para verificar se deve usar versão otimizada
export const shouldUseOptimized = (feature: keyof typeof PERFORMANCE_CONFIG) => {
  return PERFORMANCE_CONFIG[feature] === true;
};

// Função para obter configuração específica
export const getPerformanceConfig = <T extends keyof typeof PERFORMANCE_CONFIG>(
  key: T
): typeof PERFORMANCE_CONFIG[T] => {
  return PERFORMANCE_CONFIG[key];
};