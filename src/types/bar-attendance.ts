import { Database } from './database';

// Tipos específicos para o sistema de atendimento do bar
export type BarTable = Database['public']['Tables']['bar_tables']['Row'];
export type BarTableInsert = Database['public']['Tables']['bar_tables']['Insert'];
export type BarTableUpdate = Database['public']['Tables']['bar_tables']['Update'];

export type Comanda = Database['public']['Tables']['comandas']['Row'];
export type ComandaInsert = Database['public']['Tables']['comandas']['Insert'];
export type ComandaUpdate = Database['public']['Tables']['comandas']['Update'];

export type ComandaItem = Database['public']['Tables']['comanda_items']['Row'];
export type ComandaItemInsert = Database['public']['Tables']['comanda_items']['Insert'];
export type ComandaItemUpdate = Database['public']['Tables']['comanda_items']['Update'];

export type AttendanceMetrics = Database['public']['Tables']['attendance_metrics']['Row'];
export type AttendanceMetricsInsert = Database['public']['Tables']['attendance_metrics']['Insert'];
export type AttendanceMetricsUpdate = Database['public']['Tables']['attendance_metrics']['Update'];

export type BillSplit = Database['public']['Tables']['bill_splits']['Row'];
export type BillSplitInsert = Database['public']['Tables']['bill_splits']['Insert'];
export type BillSplitUpdate = Database['public']['Tables']['bill_splits']['Update'];

export type BarCustomer = Database['public']['Tables']['bar_customers']['Row'];
export type BarCustomerInsert = Database['public']['Tables']['bar_customers']['Insert'];
export type BarCustomerUpdate = Database['public']['Tables']['bar_customers']['Update'];

// Enums para status
export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning' | 'maintenance';
export type ComandaStatus = 'open' | 'pending_payment' | 'closed' | 'cancelled';
export type ComandaItemStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type BillSplitType = 'equal' | 'by_item' | 'by_person' | 'custom';

// Interfaces para dados compostos
export interface ComandaWithItems extends Comanda {
  items: ComandaItem[];
  table?: BarTable;
  customer?: BarCustomer;
}

export interface TableWithComanda extends BarTable {
  currentComanda?: Comanda;
  occupiedSince?: string;
  currentTotal?: number;
  peopleCount?: number;
}

export interface OpenComandaDetails {
  id: string;
  table_number?: string;
  customer_name?: string;
  employee_name: string;
  total: number;
  people_count: number;
  opened_at: string;
  items_count: number;
  pending_items: number;
}

export interface TableStatusDetails {
  id: string;
  number: string;
  capacity: number;
  status: TableStatus;
  position_x: number;
  position_y: number;
  current_comanda_id?: string;
  occupied_since?: string;
  current_total?: number;
  people_count?: number;
}

// Interface para divisão de conta
export interface BillSplitDetails {
  person_name: string;
  items: {
    menu_item_id: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  subtotal: number;
  service_charge: number;
  discount: number;
  total: number;
}

export interface BillSplitConfig {
  type: BillSplitType;
  person_count: number;
  splits: BillSplitDetails[];
  service_charge_percentage?: number;
  discount_amount?: number;
}

// Interface para métricas de atendimento
export interface DailyMetrics {
  employee_id: string;
  employee_name: string;
  date: string;
  orders_count: number;
  comandas_count: number;
  total_sales: number;
  avg_service_time?: string;
  tables_served: number;
  customer_satisfaction?: number;
  tips_received?: number;
}

// Interface para pedido rápido no balcão
export interface BalcaoOrder {
  items: {
    menu_item_id: string;
    name: string;
    price: number;
    quantity: number;
    notes?: string;
  }[];
  customer?: BarCustomer;
  total: number;
  discount_amount?: number;
  payment_method?: string;
  notes?: string;
}

// Interface para notificações do sistema
export interface BarNotification {
  id: string;
  type: 'comanda_timeout' | 'item_ready' | 'table_available' | 'payment_pending' | 'stock_low';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: string;
  data?: any;
  read: boolean;
}

// Interface para configurações do bar
export interface BarSettings {
  comanda_timeout_minutes: number;
  service_charge_percentage: number;
  auto_close_tables: boolean;
  enable_notifications: boolean;
  default_payment_method: string;
  printer_settings: {
    receipt_printer: string;
    kitchen_printer: string;
  };
}