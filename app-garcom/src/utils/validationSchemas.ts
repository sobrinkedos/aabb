/**
 * Schemas de validação para formulários
 * 
 * NOTA: Este arquivo mantém schemas de formulários específicos.
 * Para validação de tipos de dados do banco, use src/types/validators.ts
 */
import { z } from 'zod';

// Re-exportar schemas comuns de validators.ts
export {
  loginFormSchema as loginSchema,
  abrirComandaFormSchema,
  adicionarItemFormSchema,
  fecharComandaFormSchema,
  type LoginFormData,
  type AbrirComandaFormData,
  type AdicionarItemFormData,
  type FecharComandaFormData,
} from '../types/validators';

// Schema para recuperação de senha
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
    .toLowerCase(),
});

// Schema para redefinição de senha
export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(50, 'Senha muito longa'),
  confirmPassword: z
    .string()
    .min(6, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

// Schema para atualização de perfil
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  email: z
    .string()
    .email('Email inválido')
    .toLowerCase(),
  avatar_url: z
    .string()
    .url('URL inválida')
    .optional(),
});

// Schema para atualizar status da mesa
export const updateMesaStatusSchema = z.object({
  status: z.enum(['available', 'occupied', 'reserved', 'cleaning', 'maintenance'], {
    errorMap: () => ({ message: 'Status inválido' }),
  }),
  notes: z.string().max(500, 'Observações muito longas').optional(),
});

// Schema para divisão de conta
export const dividirContaSchema = z.object({
  split_type: z.enum(['equal', 'by_item', 'by_person', 'custom'], {
    errorMap: () => ({ message: 'Tipo de divisão inválido' }),
  }),
  person_count: z.number().int().positive('Número de pessoas deve ser maior que zero'),
  service_charge_percentage: z.number().min(0).max(100).default(10),
  discount_amount: z.number().min(0).default(0),
});

// Tipos TypeScript derivados dos schemas
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
export type UpdateMesaStatusFormData = z.infer<typeof updateMesaStatusSchema>;
export type DividirContaFormData = z.infer<typeof dividirContaSchema>;