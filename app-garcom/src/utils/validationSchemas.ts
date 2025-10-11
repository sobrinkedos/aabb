import { z } from 'zod';

// Schema para login
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
    .toLowerCase(),
  password: z
    .string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(50, 'Senha muito longa'),
});

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
  nome: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  email: z
    .string()
    .email('Email inválido')
    .toLowerCase(),
});

// Tipos TypeScript derivados dos schemas
export type LoginFormData = z.infer<typeof loginSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;