// Configurações da aplicação
export const APP_CONFIG = {
  NAME: 'App Garçom',
  VERSION: '1.0.0',
  ENVIRONMENT: process.env.EXPO_PUBLIC_ENVIRONMENT || 'development',
  DEBUG_MODE: process.env.EXPO_PUBLIC_DEBUG_MODE === 'true',
};

// Configurações do Supabase
export const SUPABASE_CONFIG = {
  URL: process.env.EXPO_PUBLIC_SUPABASE_URL!,
  ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
};

// Configurações de sincronização
export const SYNC_CONFIG = {
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // ms
  OFFLINE_QUEUE_LIMIT: 100,
  SYNC_INTERVAL: 30000, // 30 segundos
};

// Configurações de UI
export const UI_CONFIG = {
  COLORS: {
    PRIMARY: '#007AFF',
    SECONDARY: '#5856D6',
    SUCCESS: '#34C759',
    WARNING: '#FF9500',
    ERROR: '#FF3B30',
    BACKGROUND: '#F2F2F7',
    SURFACE: '#FFFFFF',
    TEXT_PRIMARY: '#000000',
    TEXT_SECONDARY: '#8E8E93',
  },
  SPACING: {
    XS: 4,
    SM: 8,
    MD: 16,
    LG: 24,
    XL: 32,
  },
  BORDER_RADIUS: {
    SM: 4,
    MD: 8,
    LG: 12,
    XL: 16,
  },
};

// Status das mesas
export const MESA_STATUS = {
  LIVRE: 'livre',
  OCUPADA: 'ocupada',
  AGUARDANDO: 'aguardando',
  LIMPEZA: 'limpeza',
} as const;

// Status das comandas
export const COMANDA_STATUS = {
  ABERTA: 'aberta',
  FECHADA: 'fechada',
  CANCELADA: 'cancelada',
} as const;

// Status dos itens
export const ITEM_STATUS = {
  PENDENTE: 'pendente',
  PREPARANDO: 'preparando',
  PRONTO: 'pronto',
  SERVIDO: 'servido',
  CANCELADO: 'cancelado',
} as const;