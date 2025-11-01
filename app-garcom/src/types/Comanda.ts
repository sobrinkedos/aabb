// Tipos alinhados com a tabela comandas do banco de dados
export interface Comanda {
  id: string;
  table_id?: string; // Opcional para pedidos no balcão
  customer_id?: string; // Cliente cadastrado (opcional)
  customer_name?: string; // Nome do cliente se não cadastrado
  employee_id: string; // Garçom responsável
  status: 'open' | 'pending_payment' | 'closed' | 'cancelled';
  total: number;
  people_count: number;
  opened_at: string;
  closed_at?: string;
  payment_method?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Tipo estendido com itens e informações adicionais (para UI)
export interface ComandaComDetalhes extends Comanda {
  table_number?: string;
  employee_name?: string;
  items?: ItemComanda[];
  items_count?: number;
  pending_items?: number;
}

// Tipos alinhados com a tabela comanda_items do banco de dados
export interface ItemComanda {
  id: string;
  comanda_id: string;
  menu_item_id: string;
  quantity: number;
  price: number; // Preço no momento do pedido
  status: 'draft' | 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  added_at: string;
  prepared_at?: string;
  delivered_at?: string;
  notes?: string;
  created_at: string;
}

// Tipo estendido com informações do produto (para UI)
export interface ItemComandaComDetalhes extends ItemComanda {
  menu_item_name?: string;
  menu_item_category?: string;
  subtotal?: number; // quantity * price
}

// Formas de pagamento
export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'club_account';

export interface PaymentDetails {
  method: PaymentMethod;
  amount: number;
  tip?: number;
  change?: number;
  transaction_id?: string;
  metadata?: Record<string, unknown>;
}

// Divisão de contas (alinhado com bill_splits)
export interface BillSplit {
  id: string;
  comanda_id: string;
  split_type: 'equal' | 'by_item' | 'by_person' | 'custom';
  person_count: number;
  splits: SplitDetail[];
  total_amount: number;
  service_charge_percentage: number;
  discount_amount: number;
  created_by: string;
  created_at: string;
}

export interface SplitDetail {
  person_id: string;
  person_name?: string;
  items: string[]; // IDs dos itens
  amount: number;
  paid: boolean;
  payment_method?: PaymentMethod;
}

// Status traduzidos para UI
export const ComandaStatusLabel: Record<Comanda['status'], string> = {
  open: 'Aberta',
  pending_payment: 'Aguardando Pagamento',
  closed: 'Fechada',
  cancelled: 'Cancelada',
};

export const ItemStatusLabel: Record<ItemComanda['status'], string> = {
  draft: 'Rascunho',
  pending: 'Pendente',
  preparing: 'Preparando',
  ready: 'Pronto',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

export const PaymentMethodLabel: Record<PaymentMethod, string> = {
  cash: 'Dinheiro',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  pix: 'PIX',
  club_account: 'Conta do Clube',
};