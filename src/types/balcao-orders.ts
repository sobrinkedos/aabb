// Types para o sistema de pedidos de balcão independente
import { PaymentMethod } from './cash-management';

// Enums para status
export type BalcaoOrderStatus = 'pending_payment' | 'paid' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type BalcaoOrderItemStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

// Interface principal do pedido de balcão
export interface BalcaoOrder {
  id: string;
  order_number: number;
  employee_id: string;
  customer_name?: string;
  customer_phone?: string;
  total_amount: number;
  discount_amount?: number;
  final_amount: number;
  status: BalcaoOrderStatus;
  payment_method?: PaymentMethod;
  paid_at?: string;
  cash_session_id?: string;
  preparation_started_at?: string;
  preparation_completed_at?: string;
  delivered_at?: string;
  delivered_by?: string;
  notes?: string;
  customer_notes?: string;
  created_at: string;
  updated_at: string;
}

// Interface para itens do pedido
export interface BalcaoOrderItem {
  id: string;
  balcao_order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: BalcaoOrderItemStatus;
  preparation_started_at?: string;
  preparation_completed_at?: string;
  preparation_time_minutes?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Interface estendida com detalhes
export interface BalcaoOrderWithDetails extends BalcaoOrder {
  employee_name?: string;
  cash_session_date?: string;
  items_count: number;
  items_preparing: number;
  items_ready: number;
  items_delivered: number;
  items?: BalcaoOrderItemWithMenu[];
}

// Interface para item com detalhes do menu
export interface BalcaoOrderItemWithMenu extends BalcaoOrderItem {
  menu_item?: {
    id: string;
    name: string;
    category: string;
    price: number;
    preparation_time?: number;
    item_type?: 'prepared' | 'direct';
  };
}

// Interface para criação de pedido
export interface CreateBalcaoOrderData {
  customer_name?: string;
  customer_phone?: string;
  customer_notes?: string;
  items: {
    menu_item_id: string;
    quantity: number;
    unit_price: number;
    notes?: string;
  }[];
  discount_amount?: number;
  notes?: string;
}

// Interface para atualização de status
export interface UpdateBalcaoOrderStatusData {
  status: BalcaoOrderStatus;
  payment_method?: PaymentMethod;
  cash_session_id?: string;
  delivered_by?: string;
  notes?: string;
}

// Interface para processamento de pagamento
export interface ProcessBalcaoPaymentData {
  order_id: string;
  payment_method: PaymentMethod;
  cash_session_id: string;
  amount_paid: number;
  notes?: string;
}

// Interface para filtros de busca
export interface BalcaoOrderFilters {
  status?: BalcaoOrderStatus[];
  employee_id?: string;
  start_date?: string;
  end_date?: string;
  customer_name?: string;
  order_number?: number;
  payment_method?: PaymentMethod;
}

// Interface para métricas do balcão
export interface BalcaoMetrics {
  today: {
    total_orders: number;
    total_revenue: number;
    avg_order_value: number;
    pending_payment: number;
    preparing: number;
    ready_for_delivery: number;
  };
  by_status: {
    status: BalcaoOrderStatus;
    count: number;
    total_amount: number;
  }[];
  by_payment_method: {
    payment_method: PaymentMethod;
    count: number;
    total_amount: number;
  }[];
  hourly_breakdown: {
    hour: number;
    orders: number;
    revenue: number;
  }[];
}

// Interface para dashboard do bar
export interface BarDashboardData {
  pending_orders: BalcaoOrderWithDetails[];
  preparing_orders: BalcaoOrderWithDetails[];
  ready_orders: BalcaoOrderWithDetails[];
  recent_delivered: BalcaoOrderWithDetails[];
  metrics: BalcaoMetrics;
}

// Interface para o hook de balcão
export interface UseBalcaoOrdersReturn {
  // Estado
  orders: BalcaoOrderWithDetails[];
  pendingOrders: BalcaoOrderWithDetails[];
  preparingOrders: BalcaoOrderWithDetails[];
  readyOrders: BalcaoOrderWithDetails[];
  metrics: BalcaoMetrics | null;
  loading: boolean;
  error: string | null;
  
  // Funções CRUD
  createOrder: (data: CreateBalcaoOrderData) => Promise<string>;
  updateOrderStatus: (orderId: string, data: UpdateBalcaoOrderStatusData) => Promise<void>;
  updateItemStatus: (itemId: string, status: BalcaoOrderItemStatus) => Promise<void>;
  cancelOrder: (orderId: string, reason?: string) => Promise<void>;
  
  // Funções de pagamento
  processPayment: (data: ProcessBalcaoPaymentData) => Promise<void>;
  
  // Funções de busca
  searchOrders: (filters: BalcaoOrderFilters) => Promise<BalcaoOrderWithDetails[]>;
  getOrdersByStatus: (status: BalcaoOrderStatus) => BalcaoOrderWithDetails[];
  
  // Funções utilitárias
  refreshData: () => Promise<void>;
  getOrderById: (orderId: string) => BalcaoOrderWithDetails | undefined;
  
  // Métricas
  loadMetrics: () => Promise<void>;
}

// Interface para configurações do sistema de balcão
export interface BalcaoSettings {
  auto_print_receipt: boolean;
  default_preparation_time: number; // minutos
  enable_customer_info: boolean;
  require_payment_before_preparation: boolean;
  max_order_items: number;
  discount_percentage_limit: number;
  order_timeout_minutes: number;
}

// Interface para notificações do balcão
export interface BalcaoNotification {
  id: string;
  type: 'order_ready' | 'payment_pending' | 'order_timeout' | 'inventory_low';
  order_id?: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: string;
  read: boolean;
  data?: any;
}

// Constantes para o sistema
export const BALCAO_ORDER_STATUS_LABELS: Record<BalcaoOrderStatus, string> = {
  pending_payment: 'Aguardando Pagamento',
  paid: 'Pago',
  preparing: 'Preparando',
  ready: 'Pronto',
  delivered: 'Entregue',
  cancelled: 'Cancelado'
};

export const BALCAO_ORDER_STATUS_COLORS: Record<BalcaoOrderStatus, string> = {
  pending_payment: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  preparing: 'bg-orange-100 text-orange-800',
  ready: 'bg-green-100 text-green-800',
  delivered: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800'
};

export const BALCAO_ITEM_STATUS_LABELS: Record<BalcaoOrderItemStatus, string> = {
  pending: 'Pendente',
  preparing: 'Preparando',
  ready: 'Pronto',
  delivered: 'Entregue',
  cancelled: 'Cancelado'
};

// Funções utilitárias
export const formatOrderNumber = (orderNumber: number): string => {
  return `#${orderNumber.toString().padStart(4, '0')}`;
};

export const getOrderStatusPriority = (status: BalcaoOrderStatus): number => {
  const priorities: Record<BalcaoOrderStatus, number> = {
    pending_payment: 1,
    paid: 2,
    preparing: 3,
    ready: 4,
    delivered: 5,
    cancelled: 6
  };
  return priorities[status] || 0;
};

export const calculateOrderPreparationTime = (items: BalcaoOrderItemWithMenu[]): number => {
  return items.reduce((maxTime, item) => {
    const itemTime = item.menu_item?.preparation_time || 5; // 5 minutos padrão
    return Math.max(maxTime, itemTime);
  }, 0);
};

export const isOrderOverdue = (order: BalcaoOrderWithDetails): boolean => {
  if (order.status !== 'preparing' || !order.preparation_started_at) return false;
  
  const startTime = new Date(order.preparation_started_at).getTime();
  const estimatedTime = calculateOrderPreparationTime(order.items || []);
  const currentTime = new Date().getTime();
  
  return (currentTime - startTime) > (estimatedTime * 60 * 1000); // converter para ms
};