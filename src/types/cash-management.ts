import { Database } from './database';
import { ComandaWithItems } from './bar-attendance';

// ===== TIPOS BÁSICOS DO BANCO DE DADOS =====

// Tipos temporários até regenerar os tipos do Supabase
export interface CashSession {
  id: string;
  employee_id: string;
  session_date: string;
  opened_at: string;
  closed_at?: string;
  opening_amount: number;
  closing_amount?: number;
  expected_amount: number;
  cash_discrepancy?: number;
  status: 'open' | 'closed' | 'reconciled';
  supervisor_approval_id?: string;
  opening_notes?: string;
  closing_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CashTransaction {
  id: string;
  cash_session_id: string;
  comanda_id?: string;
  transaction_type: 'sale' | 'refund' | 'adjustment' | 'tip';
  payment_method: PaymentMethod;
  amount: number;
  processed_at: string;
  processed_by: string;
  reference_number?: string;
  receipt_number?: string;
  customer_name?: string;
  notes?: string;
  created_at: string;
}

export interface PaymentReconciliation {
  id: string;
  cash_session_id: string;
  payment_method: string;
  expected_amount: number;
  actual_amount: number;
  discrepancy: number;
  transaction_count: number;
  reconciled_at: string;
  reconciled_by: string;
  notes?: string;
  created_at: string;
}

export interface CashAuditLog {
  id: string;
  cash_session_id?: string;
  action_type: string;
  performed_by: string;
  old_values?: any;
  new_values?: any;
  reason?: string;
  ip_address?: string;
  user_agent?: string;
  performed_at: string;
}

// Tipos temporários para insert/update
export type CashSessionInsert = Omit<CashSession, 'id' | 'created_at' | 'updated_at'>;
export type CashSessionUpdate = Partial<CashSessionInsert>;
export type CashTransactionInsert = Omit<CashTransaction, 'id' | 'created_at'>;
export type CashTransactionUpdate = Partial<CashTransactionInsert>;
export type PaymentReconciliationInsert = Omit<PaymentReconciliation, 'id' | 'created_at' | 'discrepancy'>;
export type PaymentReconciliationUpdate = Partial<PaymentReconciliationInsert>;

// ===== ENUMS E CONSTANTES =====

export type CashSessionStatus = 'open' | 'closed' | 'reconciled';

export type TransactionType = 'sale' | 'refund' | 'adjustment' | 'tip' | 'cash_withdrawal' | 'treasury_transfer';

export type PaymentMethod = 'dinheiro' | 'cartao_debito' | 'cartao_credito' | 'pix' | 'transferencia';

export type AuditActionType = 'open_session' | 'close_session' | 'process_payment' | 'adjustment' | 'supervisor_override';

// ===== FUNÇÕES UTILITÁRIAS =====

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const calculateDiscrepancyPercentage = (discrepancy: number, expected: number): number => {
  if (expected === 0) return 0;
  return Math.abs((discrepancy / expected) * 100);
};

export const isDiscrepancyAcceptable = (discrepancy: number, threshold: number = 5.00): boolean => {
  return Math.abs(discrepancy) <= threshold;
};

// ===== CONSTANTES PARA O SISTEMA =====

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  dinheiro: 'Dinheiro',
  cartao_debito: 'Cartão de Débito',
  cartao_credito: 'Cartão de Crédito',
  pix: 'PIX',
  transferencia: 'Transferência'
};

export const PAYMENT_METHOD_ICONS: Record<PaymentMethod, string> = {
  dinheiro: '💵',
  cartao_debito: '💳',
  cartao_credito: '💳',
  pix: '📱',
  transferencia: '🏦'
};

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  sale: 'Venda',
  refund: 'Estorno',
  adjustment: 'Ajuste',
  tip: 'Gorjeta',
  cash_withdrawal: 'Saída de Dinheiro',
  treasury_transfer: 'Transferência para Tesouraria'
};

// ===== INTERFACES PARA DADOS COMPOSTOS =====

// Sessão de caixa com informações do funcionário
export interface CashSessionWithEmployee extends CashSession {
  employee?: {
    id: string;
    name: string;
    role: string;
  };
  supervisor?: {
    id: string;
    name: string;
  };
  transactions?: CashTransaction[];
  reconciliation?: PaymentReconciliation[];
}

// Transação com informações da comanda e funcionário
export interface CashTransactionWithDetails extends CashTransaction {
  comanda?: {
    id: string;
    customer_name?: string;
    table_number?: string;
    total: number;
  };
  processed_by_employee?: {
    id: string;
    name: string;
  };
  session?: {
    id: string;
    session_date: string;
    employee_name: string;
  };
}

// ===== INTERFACES PARA O HOOK useCashManagement =====

export interface CashManagementState {
  currentSession: CashSessionWithEmployee | null;
  pendingComandas: ComandaWithItems[];
  todaysTransactions: CashTransactionWithDetails[];
  todaysSessions: CashSessionWithEmployee[];
  todaysSummary: DailySummary;
  loading: boolean;
  error: string | null;
}

// ===== INTERFACES PARA OPERAÇÕES =====

// Dados para abertura de caixa
export interface OpenCashSessionData {
  opening_amount: number;
  opening_notes?: string;
  supervisor_approval_id?: string;
}

// Dados para fechamento de caixa
export interface CloseCashSessionData {
  closing_amount: number;
  closing_notes?: string;
  reconciliation: PaymentReconciliationData[];
}

// Dados para reconciliação de pagamentos
export interface PaymentReconciliationData {
  payment_method: PaymentMethod;
  expected_amount: number;
  actual_amount: number;
  transaction_count: number;
  notes?: string;
}

// Dados para processamento de pagamento de comanda
export interface ProcessComandaPaymentData {
  comanda_id: string;
  payment_method: PaymentMethod;
  amount: number;
  reference_number?: string;
  customer_name?: string;
  notes?: string;
}

// Dados para estorno
export interface ProcessRefundData {
  original_transaction_id: string;
  amount: number;
  reason: string;
  refund_method: PaymentMethod;
}

// Dados para ajuste manual
export interface ProcessAdjustmentData {
  amount: number;
  reason: string;
  adjustment_type: 'add' | 'subtract';
  payment_method?: PaymentMethod;
}

// Dados para saída de dinheiro
export interface ProcessCashWithdrawalData {
  amount: number;
  reason: string;
  authorized_by: string;
  recipient?: string;
  purpose: 'change' | 'expense' | 'transfer' | 'other';
}

// Dados para transferência para tesouraria
export interface ProcessTreasuryTransferData {
  amount: number;
  transfer_date: string;
  authorized_by: string;
  treasury_receipt_number?: string;
  notes?: string;
}

// ===== INTERFACES PARA RELATÓRIOS =====

// Resumo diário das operações de caixa
export interface DailySummary {
  session_date: string;
  total_sessions: number;
  total_sales: number;
  total_transactions: number;
  total_cash_withdrawals: number;
  total_treasury_transfers: number;
  cash_balance: number;
  by_payment_method: PaymentMethodSummary[];
  by_employee: EmployeeSummary[];
  discrepancies: DiscrepancySummary[];
  avg_ticket: number;
  peak_hours: PeakHourData[];
}

// Resumo por método de pagamento
export interface PaymentMethodSummary {
  payment_method: PaymentMethod;
  amount: number;
  transaction_count: number;
  percentage: number;
  expected_amount: number;
  actual_amount: number;
  discrepancy: number;
}

// Resumo por funcionário
export interface EmployeeSummary {
  employee_id: string;
  employee_name: string;
  session_count: number;
  total_sales: number;
  transaction_count: number;
  avg_ticket: number;
  cash_discrepancy: number;
  session_duration: string; // tempo total trabalhado
}

// Resumo de discrepâncias
export interface DiscrepancySummary {
  employee_id: string;
  employee_name: string;
  session_id: string;
  cash_discrepancy: number;
  payment_discrepancies: PaymentMethodSummary[];
  total_discrepancy: number;
}

// Dados de horário de pico
export interface PeakHourData {
  hour: number;
  transaction_count: number;
  total_amount: number;
}

// ===== INTERFACES PARA RELATÓRIOS AVANÇADOS =====

// Relatório mensal consolidado
export interface MonthlyCashReport {
  month: string;
  total_sales: number;
  total_sessions: number;
  total_transactions: number;
  unique_employees: number;
  avg_daily_sales: number;
  avg_ticket: number;
  total_discrepancies: number;
  discrepancy_percentage: number;
  by_payment_method: PaymentMethodSummary[];
  daily_breakdown: DailySummary[];
  top_employees: EmployeeSummary[];
}

// Relatório de performance por funcionário
export interface EmployeePerformanceReport {
  employee_id: string;
  employee_name: string;
  period_start: string;
  period_end: string;
  total_sessions: number;
  total_sales: number;
  avg_session_sales: number;
  total_discrepancies: number;
  discrepancy_rate: number;
  avg_session_duration: string;
  best_day: {
    date: string;
    sales: number;
    transactions: number;
  };
  improvement_areas: string[];
  strengths: string[];
}

// ===== INTERFACES PARA COMPONENTES UI =====

// Props do modal de abertura de caixa
export interface OpenCashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCash: (data: OpenCashSessionData) => Promise<void>;
  loading?: boolean;
}

// Props do modal de fechamento de caixa
export interface CloseCashModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: CashSessionWithEmployee;
  onCloseCash: (data: CloseCashSessionData) => Promise<void>;
  loading?: boolean;
}

// Props do componente de pagamento de comanda
export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  comanda: ComandaWithItems;
  onProcessPayment: (data: ProcessComandaPaymentData) => Promise<void>;
  loading?: boolean;
}

// Props do componente de relatórios
export interface CashReportProps {
  period: 'day' | 'week' | 'month';
  startDate?: Date;
  endDate?: Date;
  employeeId?: string;
}

// ===== INTERFACES PARA FILTROS E BUSCA =====

// Filtros para transações
export interface TransactionFilters {
  start_date?: string;
  end_date?: string;
  payment_method?: PaymentMethod;
  transaction_type?: TransactionType;
  employee_id?: string;
  session_id?: string;
  min_amount?: number;
  max_amount?: number;
}

// Filtros para sessões
export interface SessionFilters {
  start_date?: string;
  end_date?: string;
  employee_id?: string;
  status?: CashSessionStatus;
  has_discrepancy?: boolean;
}

// ===== INTERFACES PARA VALIDAÇÃO =====

// Resultado de validação de caixa
export interface CashValidationResult {
  isValid: boolean;
  warnings: ValidationWarning[];
  errors: ValidationError[];
  suggestions: string[];
}

export interface ValidationWarning {
  type: 'discrepancy' | 'unusual_amount' | 'time_gap';
  message: string;
  severity: 'low' | 'medium' | 'high';
  data?: any;
}

export interface ValidationError {
  type: 'calculation_error' | 'missing_data' | 'invalid_state';
  message: string;
  field?: string;
  data?: any;
}

// ===== INTERFACES PARA CONFIGURAÇÕES =====

// Configurações do sistema de caixa
export interface CashSystemSettings {
  require_supervisor_approval: boolean;
  max_cash_discrepancy: number;
  auto_reconcile_threshold: number;
  enable_audit_logging: boolean;
  require_receipt_numbers: boolean;
  cash_count_precision: number; // número de casas decimais
  session_timeout_minutes: number;
  notification_settings: {
    large_discrepancy: boolean;
    session_timeout: boolean;
    daily_summary: boolean;
  };
}

// ===== TIPOS PARA HOOKS =====

// Tipo de retorno do hook useCashManagement
export interface UseCashManagementReturn extends CashManagementState {
  // Funções de sessão
  openCashSession: (data: OpenCashSessionData) => Promise<void>;
  closeCashSession: (data: CloseCashSessionData) => Promise<void>;
  getCurrentSession: () => CashSessionWithEmployee | null;
  
  // Funções de transação
  processComandaPayment: (data: ProcessComandaPaymentData) => Promise<void>;
  processRefund: (data: ProcessRefundData) => Promise<void>;
  processAdjustment: (data: ProcessAdjustmentData) => Promise<void>;
  processCashWithdrawal: (data: ProcessCashWithdrawalData) => Promise<string>;
  processTreasuryTransfer: (data: ProcessTreasuryTransferData) => Promise<string>;
  
  // Funções de relatório
  getDailySummary: (date?: Date) => Promise<DailySummary>;
  getMonthlyCashReport: (month: string) => Promise<MonthlyCashReport>;
  getEmployeePerformance: (employeeId: string, period: { start: Date; end: Date }) => Promise<EmployeePerformanceReport>;
  
  // Funções de validação
  validateCashCount: (amount: number) => Promise<CashValidationResult>;
  validateSession: (sessionId: string) => Promise<CashValidationResult>;
  
  // Funções utilitárias
  refreshData: () => Promise<void>;
  exportReport: (type: 'daily' | 'monthly', format: 'pdf' | 'excel') => Promise<void>;
  
  // Funções de busca e filtro
  searchTransactions: (filters: TransactionFilters) => Promise<CashTransactionWithDetails[]>;
  searchSessions: (filters: SessionFilters) => Promise<CashSessionWithEmployee[]>;
}
