// Validadores Zod para garantir type safety em runtime
import { z } from 'zod';

// Validador para Mesa
export const mesaSchema = z.object({
  id: z.string().uuid(),
  number: z.string().min(1).max(10),
  capacity: z.number().int().positive(),
  position_x: z.number().min(0).max(100),
  position_y: z.number().min(0).max(100),
  status: z.enum(['available', 'occupied', 'reserved', 'cleaning', 'maintenance']),
  notes: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const mesaComDetalhesSchema = mesaSchema.extend({
  current_comanda_id: z.string().uuid().optional(),
  occupied_since: z.string().optional(),
  current_total: z.number().optional(),
  people_count: z.number().int().positive().optional(),
});

// Validador para Comanda
export const comandaSchema = z.object({
  id: z.string().uuid(),
  table_id: z.string().uuid().optional(),
  customer_id: z.string().uuid().optional(),
  customer_name: z.string().optional(),
  employee_id: z.string().uuid(),
  status: z.enum(['open', 'pending_payment', 'closed', 'cancelled']),
  total: z.number().min(0),
  people_count: z.number().int().positive(),
  opened_at: z.string(),
  closed_at: z.string().optional(),
  payment_method: z.string().optional(),
  notes: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Validador para ItemComanda
export const itemComandaSchema = z.object({
  id: z.string().uuid(),
  comanda_id: z.string().uuid(),
  menu_item_id: z.string().uuid(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
  status: z.enum(['pending', 'preparing', 'ready', 'delivered', 'cancelled']),
  added_at: z.string(),
  prepared_at: z.string().optional(),
  delivered_at: z.string().optional(),
  notes: z.string().optional(),
  created_at: z.string(),
});

// Validador para MenuItem
export const menuItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  category: z.string().min(1),
  available: z.boolean(),
  preparation_time: z.number().int().positive().optional(),
  created_at: z.string(),
});

// Validador para Profile/User
export const profileSchema = z.object({
  id: z.string().uuid(),
  name: z.string().optional(),
  avatar_url: z.string().url().optional(),
  role: z.enum(['admin', 'employee', 'manager', 'waiter']),
  updated_at: z.string(),
});

export const userSchema = profileSchema.extend({
  email: z.string().email(),
  empresa_id: z.string().uuid().optional(),
});

// Validadores para formulários
export const loginFormSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export const abrirComandaFormSchema = z.object({
  table_id: z.string().uuid('Selecione uma mesa válida').optional(),
  customer_name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').optional(),
  people_count: z.number().int().positive('Número de pessoas deve ser maior que zero'),
  notes: z.string().optional(),
});

export const adicionarItemFormSchema = z.object({
  menu_item_id: z.string().uuid('Selecione um item válido'),
  quantity: z.number().int().positive('Quantidade deve ser maior que zero'),
  notes: z.string().max(500, 'Observações muito longas').optional(),
});

export const fecharComandaFormSchema = z.object({
  payment_method: z.enum(['cash', 'credit_card', 'debit_card', 'pix', 'club_account'], {
    errorMap: () => ({ message: 'Selecione uma forma de pagamento válida' }),
  }),
  tip: z.number().min(0, 'Gorjeta não pode ser negativa').optional(),
  discount: z.number().min(0, 'Desconto não pode ser negativo').optional(),
});

// Validador para operações offline
export const operacaoPendenteSchema = z.object({
  id: z.string().uuid(),
  tipo: z.enum(['criar_comanda', 'adicionar_item', 'atualizar_item', 'fechar_comanda', 'atualizar_mesa']),
  dados: z.any(),
  timestamp: z.string(),
  tentativas: z.number().int().min(0),
  maxTentativas: z.number().int().positive(),
  erro: z.string().optional(),
});

// Tipos inferidos dos schemas
export type MesaValidated = z.infer<typeof mesaSchema>;
export type ComandaValidated = z.infer<typeof comandaSchema>;
export type ItemComandaValidated = z.infer<typeof itemComandaSchema>;
export type MenuItemValidated = z.infer<typeof menuItemSchema>;
export type UserValidated = z.infer<typeof userSchema>;
export type LoginFormData = z.infer<typeof loginFormSchema>;
export type AbrirComandaFormData = z.infer<typeof abrirComandaFormSchema>;
export type AdicionarItemFormData = z.infer<typeof adicionarItemFormSchema>;
export type FecharComandaFormData = z.infer<typeof fecharComandaFormSchema>;
export type OperacaoPendenteValidated = z.infer<typeof operacaoPendenteSchema>;
