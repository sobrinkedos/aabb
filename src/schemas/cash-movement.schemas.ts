import { z } from 'zod';
import { 
  CashMovementType, 
  CashMovementPurpose, 
  AuthorizationStatus,
  DEFAULT_CASH_LIMITS 
} from '../types/cash-management';

// ===== SCHEMAS DE VALIDAÇÃO PARA MOVIMENTAÇÃO DE CAIXA =====

// Schema para suprimento de caixa
export const cashSupplySchema = z.object({
  amount: z.number()
    .positive('O valor deve ser positivo')
    .max(DEFAULT_CASH_LIMITS.MAX_SUPPLY_WITHOUT_APPROVAL * 10, 'Valor muito alto para suprimento')
    .refine(
      (val) => Number.isFinite(val) && val > 0,
      'Valor inválido'
    ),
  reason: z.string()
    .min(5, 'A justificativa deve ter pelo menos 5 caracteres')
    .max(500, 'A justificativa não pode exceder 500 caracteres'),
  source: z.string()
    .min(3, 'A origem deve ter pelo menos 3 caracteres')
    .max(100, 'A origem não pode exceder 100 caracteres'),
  authorized_by: z.string().uuid('ID de autorização inválido').optional(),
  purpose: z.enum([
    'change_fund',
    'security',
    'expense',
    'transfer',
    'correction',
    'other'
  ] as const),
  reference_number: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
}).refine(
  (data) => {
    // Se o valor exceder o limite, deve ter autorização
    if (data.amount > DEFAULT_CASH_LIMITS.MAX_SUPPLY_WITHOUT_APPROVAL) {
      return !!data.authorized_by;
    }
    return true;
  },
  {
    message: `Suprimentos acima de R$ ${DEFAULT_CASH_LIMITS.MAX_SUPPLY_WITHOUT_APPROVAL} requerem autorização de supervisor`,
    path: ['authorized_by']
  }
);

// Schema para sangria de caixa
export const cashWithdrawalSchema = z.object({
  amount: z.number()
    .positive('O valor deve ser positivo')
    .max(DEFAULT_CASH_LIMITS.AUTO_SANGRIA_THRESHOLD * 2, 'Valor muito alto para sangria')
    .refine(
      (val) => Number.isFinite(val) && val > 0,
      'Valor inválido'
    ),
  reason: z.string()
    .min(5, 'A justificativa deve ter pelo menos 5 caracteres')
    .max(500, 'A justificativa não pode exceder 500 caracteres'),
  destination: z.string()
    .min(3, 'O destino deve ter pelo menos 3 caracteres')
    .max(100, 'O destino não pode exceder 100 caracteres'),
  authorized_by: z.string().uuid('ID de autorização inválido').optional(),
  purpose: z.enum([
    'change_fund',
    'security',
    'expense',
    'transfer',
    'correction',
    'other'
  ] as const),
  recipient: z.string().max(100).optional(),
  reference_number: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
}).refine(
  (data) => {
    // Se o valor exceder o limite, deve ter autorização
    if (data.amount > DEFAULT_CASH_LIMITS.SUPERVISOR_APPROVAL_THRESHOLD) {
      return !!data.authorized_by;
    }
    return true;
  },
  {
    message: `Sangrias acima de R$ ${DEFAULT_CASH_LIMITS.SUPERVISOR_APPROVAL_THRESHOLD} requerem autorização de supervisor`,
    path: ['authorized_by']
  }
);

// Schema para movimentação genérica
export const cashMovementSchema = z.object({
  cash_session_id: z.string().uuid('ID de sessão inválido'),
  movement_type: z.enum(['supply', 'withdrawal', 'transfer'] as const),
  amount: z.number().positive('O valor deve ser positivo'),
  reason: z.string().min(5).max(500),
  authorized_by: z.string().uuid().optional(),
  authorization_status: z.enum(['pending', 'approved', 'rejected', 'not_required'] as const),
  recipient: z.string().max(100).optional(),
  purpose: z.enum([
    'change_fund',
    'security',
    'expense',
    'transfer',
    'correction',
    'other'
  ] as const),
  reference_number: z.string().max(50).optional(),
});

// Schema para limites de movimentação
export const cashMovementLimitsSchema = z.object({
  user_id: z.string().uuid('ID de usuário inválido'),
  role: z.string().min(1, 'Função é obrigatória'),
  max_supply_amount: z.number()
    .nonnegative('O limite de suprimento não pode ser negativo')
    .max(100000, 'Limite muito alto'),
  max_withdrawal_amount: z.number()
    .nonnegative('O limite de sangria não pode ser negativo')
    .max(100000, 'Limite muito alto'),
  requires_supervisor_approval_above: z.number()
    .nonnegative('O limite de aprovação não pode ser negativo'),
  can_authorize_movements: z.boolean(),
});

// Schema para filtros de movimentação
export const cashMovementFiltersSchema = z.object({
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  movement_type: z.enum(['supply', 'withdrawal', 'transfer'] as const).optional(),
  purpose: z.enum([
    'change_fund',
    'security',
    'expense',
    'transfer',
    'correction',
    'other'
  ] as const).optional(),
  min_amount: z.number().nonnegative().optional(),
  max_amount: z.number().positive().optional(),
  authorized_by: z.string().uuid().optional(),
  authorization_status: z.enum(['pending', 'approved', 'rejected', 'not_required'] as const).optional(),
}).refine(
  (data) => {
    if (data.start_date && data.end_date) {
      return new Date(data.start_date) <= new Date(data.end_date);
    }
    return true;
  },
  {
    message: 'A data inicial deve ser anterior à data final',
    path: ['end_date']
  }
).refine(
  (data) => {
    if (data.min_amount !== undefined && data.max_amount !== undefined) {
      return data.min_amount <= data.max_amount;
    }
    return true;
  },
  {
    message: 'O valor mínimo deve ser menor ou igual ao valor máximo',
    path: ['max_amount']
  }
);

// ===== FUNÇÕES DE VALIDAÇÃO =====

/**
 * Valida se um usuário pode realizar uma movimentação sem aprovação
 */
export const validateMovementAuthorization = (
  amount: number,
  movementType: CashMovementType,
  userLimits: { max_supply_amount: number; max_withdrawal_amount: number }
): { requiresApproval: boolean; reason?: string } => {
  if (movementType === 'supply') {
    if (amount > userLimits.max_supply_amount) {
      return {
        requiresApproval: true,
        reason: `Valor excede o limite de suprimento (R$ ${userLimits.max_supply_amount})`
      };
    }
  } else if (movementType === 'withdrawal') {
    if (amount > userLimits.max_withdrawal_amount) {
      return {
        requiresApproval: true,
        reason: `Valor excede o limite de sangria (R$ ${userLimits.max_withdrawal_amount})`
      };
    }
  }
  
  return { requiresApproval: false };
};

/**
 * Valida se o saldo do caixa permite uma sangria
 */
export const validateWithdrawalBalance = (
  currentBalance: number,
  withdrawalAmount: number
): { isValid: boolean; reason?: string } => {
  const remainingBalance = currentBalance - withdrawalAmount;
  
  if (remainingBalance < 0) {
    return {
      isValid: false,
      reason: 'Saldo insuficiente para realizar a sangria'
    };
  }
  
  if (remainingBalance < DEFAULT_CASH_LIMITS.MIN_CASH_BALANCE) {
    return {
      isValid: false,
      reason: `A sangria deixaria o caixa abaixo do saldo mínimo recomendado (R$ ${DEFAULT_CASH_LIMITS.MIN_CASH_BALANCE})`
    };
  }
  
  return { isValid: true };
};

/**
 * Verifica se o caixa precisa de sangria
 */
export const checkSangriaRequired = (
  currentBalance: number
): { required: boolean; severity: 'warning' | 'critical' | null; message?: string } => {
  if (currentBalance >= DEFAULT_CASH_LIMITS.AUTO_SANGRIA_THRESHOLD) {
    return {
      required: true,
      severity: 'critical',
      message: `Caixa com valor muito alto (R$ ${currentBalance.toFixed(2)}). Sangria urgente recomendada!`
    };
  }
  
  if (currentBalance >= DEFAULT_CASH_LIMITS.MAX_CASH_IN_REGISTER) {
    return {
      required: true,
      severity: 'warning',
      message: `Caixa com valor elevado (R$ ${currentBalance.toFixed(2)}). Considere realizar uma sangria.`
    };
  }
  
  return { required: false, severity: null };
};

/**
 * Valida dados de suprimento
 */
export const validateCashSupply = (data: unknown) => {
  return cashSupplySchema.safeParse(data);
};

/**
 * Valida dados de sangria
 */
export const validateCashWithdrawal = (data: unknown) => {
  return cashWithdrawalSchema.safeParse(data);
};

/**
 * Valida limites de movimentação
 */
export const validateCashMovementLimits = (data: unknown) => {
  return cashMovementLimitsSchema.safeParse(data);
};

// ===== TIPOS INFERIDOS DOS SCHEMAS =====

export type CashSupplyInput = z.infer<typeof cashSupplySchema>;
export type CashWithdrawalInput = z.infer<typeof cashWithdrawalSchema>;
export type CashMovementInput = z.infer<typeof cashMovementSchema>;
export type CashMovementLimitsInput = z.infer<typeof cashMovementLimitsSchema>;
export type CashMovementFiltersInput = z.infer<typeof cashMovementFiltersSchema>;
