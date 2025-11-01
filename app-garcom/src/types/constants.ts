// Constantes relacionadas aos tipos de dados

import { Mesa } from './Mesa';
import { Comanda, ItemComanda, PaymentMethod } from './Comanda';
import { Profile } from './Usuario';

/**
 * Status possíveis para mesas
 */
export const MESA_STATUS = {
  AVAILABLE: 'available' as const,
  OCCUPIED: 'occupied' as const,
  RESERVED: 'reserved' as const,
  CLEANING: 'cleaning' as const,
  MAINTENANCE: 'maintenance' as const,
};

export const MESA_STATUS_LIST: Mesa['status'][] = [
  'available',
  'occupied',
  'reserved',
  'cleaning',
  'maintenance',
];

/**
 * Status possíveis para comandas
 */
export const COMANDA_STATUS = {
  OPEN: 'open' as const,
  PENDING_PAYMENT: 'pending_payment' as const,
  CLOSED: 'closed' as const,
  CANCELLED: 'cancelled' as const,
};

export const COMANDA_STATUS_LIST: Comanda['status'][] = [
  'open',
  'pending_payment',
  'closed',
  'cancelled',
];

/**
 * Status possíveis para itens de comanda
 */
export const ITEM_STATUS = {
  PENDING: 'pending' as const,
  PREPARING: 'preparing' as const,
  READY: 'ready' as const,
  DELIVERED: 'delivered' as const,
  CANCELLED: 'cancelled' as const,
};

export const ITEM_STATUS_LIST: ItemComanda['status'][] = [
  'pending',
  'preparing',
  'ready',
  'delivered',
  'cancelled',
];

/**
 * Métodos de pagamento
 */
export const PAYMENT_METHODS = {
  CASH: 'cash' as const,
  CREDIT_CARD: 'credit_card' as const,
  DEBIT_CARD: 'debit_card' as const,
  PIX: 'pix' as const,
  CLUB_ACCOUNT: 'club_account' as const,
};

export const PAYMENT_METHODS_LIST: PaymentMethod[] = [
  'cash',
  'credit_card',
  'debit_card',
  'pix',
  'club_account',
];

/**
 * Roles de usuários
 */
export const USER_ROLES = {
  ADMIN: 'admin' as const,
  EMPLOYEE: 'employee' as const,
  MANAGER: 'manager' as const,
  WAITER: 'waiter' as const,
};

export const USER_ROLES_LIST: Profile['role'][] = [
  'admin',
  'employee',
  'manager',
  'waiter',
];

/**
 * Tipos de operações offline
 */
export const OPERACAO_TIPO = {
  CRIAR_COMANDA: 'criar_comanda' as const,
  ADICIONAR_ITEM: 'adicionar_item' as const,
  ATUALIZAR_ITEM: 'atualizar_item' as const,
  FECHAR_COMANDA: 'fechar_comanda' as const,
  ATUALIZAR_MESA: 'atualizar_mesa' as const,
};

/**
 * Tipos de notificações
 */
export const NOTIFICACAO_TIPO = {
  PEDIDO_PRONTO: 'pedido_pronto' as const,
  CLIENTE_CHAMANDO: 'cliente_chamando' as const,
  PROBLEMA_COZINHA: 'problema_cozinha' as const,
  TURNO_TERMINANDO: 'turno_terminando' as const,
  EMERGENCIA: 'emergencia' as const,
};

/**
 * Tipos de divisão de conta
 */
export const SPLIT_TYPE = {
  EQUAL: 'equal' as const,
  BY_ITEM: 'by_item' as const,
  BY_PERSON: 'by_person' as const,
  CUSTOM: 'custom' as const,
};

/**
 * Configurações padrão
 */
export const DEFAULT_CONFIG = {
  // Taxa de serviço padrão (10%)
  SERVICE_CHARGE_PERCENTAGE: 10,
  
  // Número máximo de tentativas para sincronização offline
  MAX_SYNC_RETRIES: 3,
  
  // Tempo de cache em milissegundos (5 minutos)
  CACHE_TTL: 5 * 60 * 1000,
  
  // Intervalo de sincronização automática em milissegundos (30 segundos)
  SYNC_INTERVAL: 30 * 1000,
  
  // Tempo máximo para considerar uma mesa "ocupada há muito tempo" (2 horas)
  LONG_OCCUPATION_TIME: 2 * 60 * 60 * 1000,
  
  // Número de itens por página em listas
  PAGE_SIZE: 20,
};

/**
 * Categorias de cardápio padrão
 */
export const MENU_CATEGORIES = {
  DRINKS: 'drinks' as const,
  FOOD: 'food' as const,
  SNACKS: 'snacks' as const,
  DESSERTS: 'desserts' as const,
  SPECIALS: 'specials' as const,
};

/**
 * Prioridades de notificação
 */
export const NOTIFICATION_PRIORITY = {
  LOW: 'low' as const,
  NORMAL: 'normal' as const,
  HIGH: 'high' as const,
  URGENT: 'urgent' as const,
};

/**
 * Mapeamento de prioridade por tipo de notificação
 */
export const NOTIFICATION_PRIORITY_MAP = {
  [NOTIFICACAO_TIPO.PEDIDO_PRONTO]: NOTIFICATION_PRIORITY.HIGH,
  [NOTIFICACAO_TIPO.CLIENTE_CHAMANDO]: NOTIFICATION_PRIORITY.HIGH,
  [NOTIFICACAO_TIPO.PROBLEMA_COZINHA]: NOTIFICATION_PRIORITY.NORMAL,
  [NOTIFICACAO_TIPO.TURNO_TERMINANDO]: NOTIFICATION_PRIORITY.LOW,
  [NOTIFICACAO_TIPO.EMERGENCIA]: NOTIFICATION_PRIORITY.URGENT,
};
