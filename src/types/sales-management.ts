// ===== TIPOS E INTERFACES PARA MÓDULO DE GESTÃO DE VENDAS =====

// ===== ENUMS E CONSTANTES =====

// Status das comandas
export enum ComandaStatus {
  ABERTA = 'aberta',
  PENDENTE_PAGAMENTO = 'pendente_pagamento',
  FECHADA = 'fechada',
  CANCELADA = 'cancelada'
}

// Status dos itens da comanda
export enum ItemStatus {
  PENDENTE = 'pendente',
  PREPARANDO = 'preparando',
  PRONTO = 'pronto',
  ENTREGUE = 'entregue',
  CANCELADO = 'cancelado'
}

// Status das transações
export enum TransactionStatus {
  PENDENTE = 'pendente',
  PROCESSADA = 'processada',
  CANCELADA = 'cancelada',
  ESTORNADA = 'estornada'
}

// Status das pendências de pagamento
export enum PaymentPendingStatus {
  PENDENTE = 'pendente',
  PAGA = 'paga',
  CANCELADA = 'cancelada',
  VENCIDA = 'vencida'
}

// Status do sistema de caixa
export enum CashSystemStatus {
  FECHADO = 'fechado',
  ABERTO = 'aberto',
  FECHANDO = 'fechando'
}

// Status de pedidos
export enum OrderStatus {
  PENDENTE = 'pendente',
  PREPARANDO = 'preparando',
  PRONTO = 'pronto',
  ENTREGUE = 'entregue',
  CANCELADO = 'cancelado'
}

// Métodos de pagamento
export type PaymentMethod = 
  | 'dinheiro' 
  | 'cartao_debito' 
  | 'cartao_credito' 
  | 'pix' 
  | 'credito_membro'
  | 'transferencia';

// Tipos de transação
export type TransactionType = 
  | 'venda' 
  | 'estorno' 
  | 'cancelamento' 
  | 'ajuste' 
  | 'comissao';

// Estados do sistema
export type SystemState = 
  | 'idle' 
  | 'processing' 
  | 'loading' 
  | 'error' 
  | 'success';

// Tipos de desconto
export type DiscountType = 
  | 'percentual' 
  | 'valor_fixo' 
  | 'promocional' 
  | 'membro';

// Tipos de relatório
export type ReportType = 
  | 'vendas_diarias' 
  | 'vendas_periodo' 
  | 'produtos_vendidos' 
  | 'funcionarios' 
  | 'metodos_pagamento' 
  | 'comissoes';

// ===== INTERFACES PRINCIPAIS =====

// Interface para Comanda
export interface Command {
  id: string;
  mesa_id?: string;
  cliente_id?: string;
  nome_cliente?: string;
  funcionario_id: string;
  status: ComandaStatus;
  total: number;
  quantidade_pessoas: number;
  aberta_em: string;
  fechada_em?: string;
  metodo_pagamento?: PaymentMethod;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  
  // Campos adicionais para compatibilidade
  data_abertura: string; // Alias para aberta_em
  
  // Relações
  mesa?: {
    id?: string;
    numero: number; // Mudado para number para compatibilidade
    capacidade?: number;
  };
  cliente?: {
    id: string;
    nome: string;
    telefone?: string;
  };
  funcionario?: {
    id: string;
    nome: string;
  };
  itens?: CommandItem[];
}

// Interface para Item da Comanda
export interface CommandItem {
  id: string;
  comanda_id: string;
  produto_id: string;
  nome_produto: string;
  quantidade: number;
  preco_unitario: number;
  preco_total: number;
  status: ItemStatus;
  adicionado_em: string;
  preparado_em?: string;
  entregue_em?: string;
  observacoes?: string;
  created_at: string;
  
  // Relação com produto
  produto?: {
    id: string;
    nome: string;
    categoria: string;
    tempo_preparo?: number;
  };
}

// Interface para Pendência de Pagamento
export interface PaymentPending {
  id: string;
  command_id: string;
  amount: number;
  commission_percentage: number;
  commission_amount: number;
  payment_method: PaymentMethod;
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
  paid_at?: string;
  transaction_id?: string;
  observations?: string;
  cash_session_id: string;
  
  // Relação com comanda
  comanda?: Command;
}

// Interface para Transação
export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  payment_method: PaymentMethod;
  command_id?: string;
  pending_id?: string;
  cash_session_id: string;
  processed_at: string;
  processed_by: string;
  reference_number?: string;
  receipt_number?: string;
  fiscal_document_id?: string;
  observations?: string;
  
  // Relações
  comanda?: Command;
  pendencia?: PaymentPending;
  processada_por_funcionario?: {
    id: string;
    nome: string;
  };
}

// ===== INTERFACES PARA DADOS DE PAGAMENTO =====

// Dados para processamento de pagamento
export interface PaymentData {
  valor_total: number;
  percentual_comissao: number;
  valor_comissao: number;
  metodo_pagamento: PaymentMethod;
  command_id?: string;
  observacoes?: string;
  numero_referencia?: string;
  dados_pix?: {
    chave_pix: string;
    qr_code: string;
  };
  dados_cartao?: {
    bandeira: string;
    ultimos_digitos: string;
    numero_autorizacao: string;
  };
  dados_membro?: {
    membro_id: string;
    saldo_anterior: number;
    saldo_posterior: number;
  };
}

// Dados para fechamento de conta
export interface CloseAccountData {
  comanda_id: string;
  valor_base: number;
  percentual_comissao: number;
  valor_comissao: number;
  valor_total: number;
  metodo_pagamento: PaymentMethod;
  observacoes?: string;
}

// ===== INTERFACES PARA COMPONENTES =====

// Props do Modal de Fechamento de Conta
export interface CloseAccountModalProps {
  isOpen: boolean;
  comanda: Command;
  onClose: () => void;
  onConfirm: (dados: CloseAccountData) => Promise<void>;
  loading?: boolean;
}

// Estado do Modal de Fechamento
export interface CloseAccountModalState {
  percentual_comissao: number;
  valor_comissao: number;
  valor_total: number;
  metodo_pagamento: PaymentMethod;
  observacoes: string;
  processando: boolean;
  erro?: string;
}

// Interface para estado da interface de vendas
export interface SalesInterfaceState {
  itens_selecionados: CartItem[];
  mesa_atual?: {
    id: string;
    numero: string;
  };
  comanda_atual?: Command;
  valor_total: number;
  produtos_disponiveis: {
    id: string;
    nome: string;
    preco: number;
    categoria: string;
    disponivel: boolean;
  }[];
}

// Interface para props do gerenciador de pedidos
export interface OrderManagerProps {
  onItemAdded: (item: CartItem) => void;
  onItemRemoved: (itemId: string) => void;
  onOrderCreated: (order: Order) => void;
  onError: (error: string) => void;
}

// ===== INTERFACES PARA CÁLCULOS =====

// Resultado do cálculo de comissão
export interface CommissionCalculationResult {
  valor_base: number;
  percentual_comissao: number;
  valor_comissao: number;
  valor_total: number;
  percentual_valido: boolean;
  erro?: string;
}

// Dados para cálculo de preços
export interface PriceCalculationData {
  itens: {
    produto_id: string;
    quantidade: number;
    preco_unitario: number;
  }[];
  descontos?: {
    tipo: 'percentual' | 'valor';
    valor: number;
    motivo: string;
  }[];
  acrescimos?: {
    tipo: 'percentual' | 'valor';
    valor: number;
    motivo: string;
  }[];
}

// ===== INTERFACES PARA VALIDAÇÃO =====

// Resultado de validação de comissão
export interface CommissionValidationResult {
  valido: boolean;
  percentual: number;
  valor_calculado: number;
  mensagem_erro?: string;
  sugestoes?: string[];
}

// Resultado de validação de pagamento
export interface PaymentValidationResult {
  valido: boolean;
  metodo_disponivel: boolean;
  valor_suficiente: boolean;
  dados_completos: boolean;
  erros: string[];
  avisos: string[];
}

// ===== INTERFACES PARA RELATÓRIOS =====

// Resumo de vendas por período
export interface SalesReportSummary {
  periodo_inicio: string;
  periodo_fim: string;
  total_vendas: number;
  total_comandas: number;
  total_itens: number;
  ticket_medio: number;
  total_comissoes: number;
  por_metodo_pagamento: {
    metodo: PaymentMethod;
    valor: number;
    quantidade: number;
    percentual: number;
  }[];
  por_funcionario: {
    funcionario_id: string;
    nome_funcionario: string;
    total_vendas: number;
    total_comandas: number;
    total_comissoes: number;
  }[];
  produtos_mais_vendidos: {
    produto_id: string;
    nome_produto: string;
    quantidade_vendida: number;
    valor_total: number;
  }[];
}

// ===== CONSTANTES E UTILITÁRIOS =====

// Labels para métodos de pagamento
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  dinheiro: 'Dinheiro',
  cartao_debito: 'Cartão de Débito',
  cartao_credito: 'Cartão de Crédito',
  pix: 'PIX',
  credito_membro: 'Crédito de Membro',
  transferencia: 'Transferência'
};

// Ícones para métodos de pagamento
export const PAYMENT_METHOD_ICONS: Record<PaymentMethod, string> = {
  dinheiro: '💵',
  cartao_debito: '💳',
  cartao_credito: '💳',
  pix: '📱',
  credito_membro: '👤',
  transferencia: '🏦'
};

// Labels para status de comanda
export const COMANDA_STATUS_LABELS: Record<ComandaStatus, string> = {
  [ComandaStatus.ABERTA]: 'Aberta',
  [ComandaStatus.PENDENTE_PAGAMENTO]: 'Pendente Pagamento',
  [ComandaStatus.FECHADA]: 'Fechada',
  [ComandaStatus.CANCELADA]: 'Cancelada'
};

// Labels para status de item
export const ITEM_STATUS_LABELS: Record<ItemStatus, string> = {
  [ItemStatus.PENDENTE]: 'Pendente',
  [ItemStatus.PREPARANDO]: 'Preparando',
  [ItemStatus.PRONTO]: 'Pronto',
  [ItemStatus.ENTREGUE]: 'Entregue',
  [ItemStatus.CANCELADO]: 'Cancelado'
};

// Configurações padrão
export const DEFAULT_COMMISSION_PERCENTAGE = 10;
export const MIN_COMMISSION_PERCENTAGE = 0;
export const MAX_COMMISSION_PERCENTAGE = 30;

// ===== FUNÇÕES UTILITÁRIAS =====

// Formatar moeda brasileira
export const formatarMoeda = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
};

// Validar percentual de comissão
export const validarPercentualComissao = (percentual: number): boolean => {
  return percentual >= MIN_COMMISSION_PERCENTAGE && percentual <= MAX_COMMISSION_PERCENTAGE;
};

// Calcular comissão
export const calcularComissao = (valorBase: number, percentual: number): number => {
  if (!validarPercentualComissao(percentual)) {
    throw new Error(`Percentual de comissão deve estar entre ${MIN_COMMISSION_PERCENTAGE}% e ${MAX_COMMISSION_PERCENTAGE}%`);
  }
  return (valorBase * percentual) / 100;
};

// Calcular total com comissão
export const calcularTotalComComissao = (valorBase: number, percentual: number): number => {
  const valorComissao = calcularComissao(valorBase, percentual);
  return valorBase + valorComissao;
};

// ===== INTERFACES PARA PROCESSAMENTO =====

// Interface para resultado de pagamento
export interface PaymentResult {
  sucesso: boolean;
  transacao_id?: string;
  numero_referencia?: string;
  comprovante?: string;
  erro?: string;
  dados_adicionais?: {
    qr_code?: string;
    chave_pix?: string;
    numero_autorizacao?: string;
  };
}

// Interface para recibo/comprovante
export interface Receipt {
  id: string;
  transacao_id: string;
  numero_recibo: string;
  data_emissao: string;
  valor: number;
  metodo_pagamento: PaymentMethod;
  dados_cliente?: {
    nome: string;
    documento?: string;
  };
  itens: {
    descricao: string;
    quantidade: number;
    valor_unitario: number;
    valor_total: number;
  }[];
  observacoes?: string;
}

// Interface para sessão de caixa (removida - usando definição unificada abaixo)

// Interface para fechamento de caixa
export interface CashClosing {
  sessao_id: string;
  valor_esperado: number;
  valor_informado: number;
  divergencia: number;
  total_vendas: number;
  total_por_metodo: Record<PaymentMethod, number>;
  sangrias: number;
  suprimentos: number;
  observacoes?: string;
}

// Interface para item do carrinho
export interface CartItem {
  produto_id: string;
  nome_produto: string;
  quantidade: number;
  preco_unitario: number;
  preco_total: number;
  categoria: string;
  observacoes?: string;
}

// Interface para pedido
export interface Order {
  id: string;
  numero_pedido: string;
  mesa_id?: string;
  cliente_id?: string;
  itens: CartItem[];
  total: number;
  status: 'pendente' | 'preparando' | 'pronto' | 'entregue';
  criado_em: string;
  tempo_estimado?: number;
}

// ===== TIPOS PARA INSERÇÃO E ATUALIZAÇÃO =====

// Tipos para inserção no banco
export type CommandInsert = Omit<Command, 'id' | 'created_at' | 'updated_at' | 'mesa' | 'cliente' | 'funcionario' | 'itens'>;
export type CommandItemInsert = Omit<CommandItem, 'id' | 'created_at' | 'produto'>;
export type PaymentPendingInsert = Omit<PaymentPending, 'id' | 'created_at' | 'updated_at' | 'comanda'>;
export type TransactionInsert = Omit<Transaction, 'id' | 'created_at' | 'comanda' | 'pendencia' | 'processada_por_funcionario'>;

// Tipos para atualização no banco
export type CommandUpdate = Partial<CommandInsert>;
export type CommandItemUpdate = Partial<CommandItemInsert>;
export type PaymentPendingUpdate = Partial<PaymentPendingInsert>;
export type TransactionUpdate = Partial<TransactionInsert>;

// ===== INTERFACES DE DESCONTO E PROMOÇÕES =====

export type DiscountType = 'percentage' | 'fixed' | 'promotion' | 'coupon' | 'membership';

export interface Discount {
  id: string;
  type: DiscountType;
  value: number;
  description: string;
  applied_by: string;
  applied_at: string;
  requires_authorization?: boolean;
  authorized_by?: string;
  coupon_code?: string;
  promotion_id?: string;
  member_id?: string;
  membership_type?: string;
  discount_percentage?: number;
  discount_amount?: number;
}

export interface Promotion {
  id: string;
  name: string;
  description: string;
  type: 'buy_x_get_y' | 'minimum_amount' | 'category_discount' | 'combo_discount';
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  start_date: string;
  end_date: string;
  active: boolean;
  conditions?: {
    buy_quantity?: number;
    get_quantity?: number;
    minimum_amount?: number;
    required_products?: string[];
  };
  applicable_products?: string[];
  applicable_categories?: string[];
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  minimum_order_value: number;
  max_discount_amount?: number;
  valid_from: string;
  valid_until: string;
  usage_limit?: number;
  usage_count: number;
  active: boolean;
  applicable_products?: string[];
  applicable_categories?: string[];
}

export interface MembershipDiscount {
  id: string;
  membership_type: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  minimum_order_value: number;
  max_discount_amount?: number;
  active: boolean;
  description: string;
}

export interface DiscountValidationResult {
  valid: boolean;
  message?: string;
  discount?: Discount;
  requires_authorization?: boolean;
  required_profile?: string;
}

export interface DiscountApplication {
  success: boolean;
  message: string;
  original_total: number;
  discount_amount: number;
  final_total: number;
  applied_discounts?: Discount[];
}

export interface UserProfile {
  id: string;
  name: string;
  role: string;
  permissions: string[];
}

// ===== INTERFACES DE FECHAMENTO DE CONTA =====

export interface CloseAccountData {
  comanda_id: string;
  valor_base: number;
  percentual_comissao: number;
  valor_comissao: number;
  valor_total: number;
  metodo_pagamento: PaymentMethod;
  observacoes?: string;
}

export interface AccountClosingResult {
  success: boolean;
  data?: {
    transaction_id: string;
    reference_number: string;
    pending_id: string;
    total_amount: number;
    commission_amount: number;
    payment_method: PaymentMethod;
    receipt: string;
    processed_at: string;
    additional_data?: any;
  };
  error?: {
    type: string;
    message: string;
    details?: any;
  };
}

// ===== INTERFACES DE CARRINHO E PEDIDOS =====

export interface CartSummary {
  total_items: number;
  subtotal: number;
  taxes: number;
  total: number;
  items_by_category: Record<string, CartItem[]>;
  has_kitchen_items: boolean;
}

export interface StockValidationResult {
  available: boolean;
  message?: string;
  available_quantity: number;
}

// ===== INTERFACES DE CAIXA =====

export interface CashSession {
  id: string;
  operator_id: string;
  opened_at: string;
  closed_at?: string;
  initial_amount: number;
  status: 'open' | 'closed';
  transactions: Transaction[];
  cash_movements: CashMovement[];
  expected_amount: number;
  actual_amount: number;
  discrepancy: number;
}

export interface CashClosing {
  id: string;
  session_id: string;
  operator_id: string;
  closed_at: string;
  initial_amount: number;
  expected_amount: number;
  actual_amount: number;
  discrepancy: number;
  total_sales: number;
  total_withdrawals: number;
  total_deposits: number;
  payment_summary: Record<PaymentMethod, number>;
  requires_justification: boolean;
  justification?: string;
}

export interface CashMovement {
  id: string;
  type: 'opening' | 'closing' | 'withdrawal' | 'deposit';
  amount: number;
  description: string;
  operator_id: string;
  timestamp: string;
  justification?: string;
  authorized_by?: string;
}

export type CashSessionStatus = 'open' | 'closed';