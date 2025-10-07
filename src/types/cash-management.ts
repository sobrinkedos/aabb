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

// ===== NOVOS TIPOS PARA MOVIMENTAÇÃO DE CAIXA =====

// Tipos de movimentação de caixa
export type CashMovementType = 'supply' | 'withdrawal' | 'transfer';

// Propósitos de movimentação
export type CashMovementPurpose = 
  | 'change_fund'      // Fundo de troco
  | 'security'         // Segurança (sangria)
  | 'expense'          // Despesa
  | 'transfer'         // Transferência
  | 'correction'       // Correção
  | 'other';           // Outros

// Status de autorização
export type AuthorizationStatus = 'pending' | 'approved' | 'rejected' | 'not_required';

// Níveis de risco para auditoria
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

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

// ===== CONSTANTES PARA MOVIMENTAÇÃO DE CAIXA =====

export const CASH_MOVEMENT_TYPE_LABELS: Record<CashMovementType, string> = {
  supply: 'Suprimento',
  withdrawal: 'Sangria',
  transfer: 'Transferência'
};

export const CASH_MOVEMENT_TYPE_ICONS: Record<CashMovementType, string> = {
  supply: '➕',
  withdrawal: '➖',
  transfer: '🔄'
};

export const CASH_MOVEMENT_PURPOSE_LABELS: Record<CashMovementPurpose, string> = {
  change_fund: 'Fundo de Troco',
  security: 'Segurança',
  expense: 'Despesa',
  transfer: 'Transferência',
  correction: 'Correção',
  other: 'Outros'
};

export const AUTHORIZATION_STATUS_LABELS: Record<AuthorizationStatus, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  not_required: 'Não Requerido'
};

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  low: 'Baixo',
  medium: 'Médio',
  high: 'Alto',
  critical: 'Crítico'
};

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  low: 'green',
  medium: 'yellow',
  high: 'orange',
  critical: 'red'
};

// Limites padrão do sistema
export const DEFAULT_CASH_LIMITS = {
  MAX_CASH_IN_REGISTER: 1000, // R$ 1000 - limite para alertar sangria
  AUTO_SANGRIA_THRESHOLD: 1500, // R$ 1500 - alerta crítico
  SUPERVISOR_APPROVAL_THRESHOLD: 500, // R$ 500 - requer aprovação supervisor
  MAX_WITHDRAWAL_WITHOUT_APPROVAL: 300, // R$ 300 - máximo sem aprovação
  MAX_SUPPLY_WITHOUT_APPROVAL: 500, // R$ 500 - máximo sem aprovação
  MIN_CASH_BALANCE: 50, // R$ 50 - saldo mínimo recomendado
  MAX_DISCREPANCY_AUTO_ACCEPT: 5, // R$ 5 - aceitar automaticamente
  MAX_DISCREPANCY_WITHOUT_APPROVAL: 50, // R$ 50 - requer aprovação acima deste valor
  MAX_DISCREPANCY_PERCENTAGE: 2, // 2% - percentual máximo aceitável
} as const;

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

// Dados aprimorados para fechamento de caixa
export interface CashClosingData extends CloseCashSessionData {
  treasury_transfer?: TreasuryTransferData;
  discrepancy_handling?: DiscrepancyHandlingData;
}

// Dados de transferência para tesouraria
export interface TreasuryTransferData {
  amount: number;
  transferred_at?: string;
  authorized_by: string;
  recipient_name?: string;
  destination: string;
  receipt_number?: string;
  notes?: string;
}

// Dados de tratamento de discrepância
export interface DiscrepancyHandlingData {
  discrepancy_amount: number;
  reason: string;
  action_taken: 'accepted' | 'investigation' | 'adjustment' | 'pending';
  approved_by?: string;
  resolution_notes?: string;
}

// Breakdown detalhado por método de pagamento
export interface PaymentMethodBreakdown {
  payment_method: PaymentMethod;
  expected_amount: number;
  actual_amount: number;
  transaction_count: number;
  discrepancy: number;
  discrepancy_percentage: number;
  transactions: CashTransaction[];
}

// Comprovante de fechamento de caixa
export interface CashClosingReceipt {
  id: string;
  session_id: string;
  receipt_number: string;
  closing_date: string;
  closing_time: string;
  employee_name: string;
  employee_id: string;
  opening_amount: number;
  closing_amount: number;
  expected_amount: number;
  total_sales: number;
  cash_discrepancy: number;
  payment_breakdown: PaymentMethodBreakdown[];
  treasury_transfer?: {
    amount: number;
    destination: string;
    receipt_number?: string;
    recipient_name?: string;
  };
  discrepancy_handling?: {
    reason: string;
    action_taken: string;
    approved_by_name?: string;
  };
  supervisor_approval?: {
    name: string;
    approved_at: string;
  };
  generated_at: string;
}

// Validação de fechamento
export interface CashClosingValidation {
  valid: boolean;
  discrepancy: number;
  requires_approval: boolean;
  expected_amount: number;
  closing_amount: number;
  warnings: string[];
  errors: string[];
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

// ===== INTERFACES PARA MOVIMENTAÇÃO AVANÇADA DE CAIXA =====

// Interface principal de movimentação de caixa
export interface CashMovement {
  id: string;
  cash_session_id: string;
  movement_type: CashMovementType;
  amount: number;
  reason: string;
  authorized_by: string;
  authorization_status: AuthorizationStatus;
  recipient?: string;
  purpose: CashMovementPurpose;
  reference_number?: string;
  created_at: string;
  updated_at?: string;
}

// Dados para suprimento de caixa
export interface CashSupplyData {
  amount: number;
  reason: string;
  source: string; // De onde vem o dinheiro (tesouraria, banco, etc)
  authorized_by?: string;
  purpose: CashMovementPurpose;
  reference_number?: string;
  notes?: string;
}

// Dados para sangria de caixa
export interface CashWithdrawalData {
  amount: number;
  reason: string;
  destination: string; // Para onde vai o dinheiro (tesouraria, banco, etc)
  authorized_by?: string;
  purpose: CashMovementPurpose;
  recipient?: string;
  reference_number?: string;
  notes?: string;
}

// Movimentação com detalhes completos
export interface CashMovementWithDetails extends CashMovement {
  session?: {
    id: string;
    session_date: string;
    employee_name: string;
  };
  authorized_by_employee?: {
    id: string;
    name: string;
    role: string;
  };
  created_by_employee?: {
    id: string;
    name: string;
  };
}

// Limites de movimentação por usuário
export interface CashMovementLimits {
  user_id: string;
  role: string;
  max_supply_amount: number;
  max_withdrawal_amount: number;
  requires_supervisor_approval_above: number;
  can_authorize_movements: boolean;
}

// Alerta de movimentação
export interface CashMovementAlert {
  id: string;
  alert_type: 'high_cash_amount' | 'frequent_withdrawals' | 'unusual_pattern' | 'limit_exceeded';
  severity: RiskLevel;
  message: string;
  cash_session_id?: string;
  movement_id?: string;
  threshold_value?: number;
  current_value?: number;
  created_at: string;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
}

// Comprovante de movimentação
export interface CashMovementReceipt {
  movement_id: string;
  receipt_number: string;
  movement_type: CashMovementType;
  amount: number;
  date: string;
  time: string;
  employee_name: string;
  authorized_by_name?: string;
  reason: string;
  purpose: CashMovementPurpose;
  session_info: {
    session_date: string;
    opening_amount: number;
    current_balance: number;
  };
  signature_required: boolean;
}

// Resumo de movimentações
export interface CashMovementSummary {
  period: {
    start: string;
    end: string;
  };
  total_supplies: number;
  total_withdrawals: number;
  net_movement: number;
  movement_count: number;
  by_purpose: {
    purpose: CashMovementPurpose;
    total_amount: number;
    count: number;
  }[];
  by_employee: {
    employee_id: string;
    employee_name: string;
    total_movements: number;
    total_amount: number;
  }[];
  alerts_generated: number;
  pending_authorizations: number;
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
  
  // Funções de histórico e movimento
  getLastClosedSessionBalance: (employeeId?: string) => Promise<number>;
  getDailyCashMovement: (date: string) => Promise<{
    sessions: CashSessionWithEmployee[];
    transactions: CashTransactionWithDetails[];
    summary: {
      opening_total: number;
      closing_total: number;
      sales_total: number;
      cash_sales: number;
      card_sales: number;
      pix_sales: number;
      adjustments: number;
      discrepancy_total: number;
      transaction_count: number;
    };
  }>;
}
