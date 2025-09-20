import { z } from 'zod';

/**
 * Utilitário para validação de formulários usando Zod
 */
export class FormValidator {
  /**
   * Valida dados usando um schema Zod e retorna resultado formatado
   */
  static validate<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
    const result = schema.safeParse(data);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
        errors: []
      };
    }

    return {
      success: false,
      data: null,
      errors: result.error.errors.map(error => ({
        field: error.path.join('.'),
        message: error.message,
        code: error.code
      }))
    };
  }

  /**
   * Valida dados e lança erro se inválido
   */
  static validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
    const result = this.validate(schema, data);
    
    if (!result.success) {
      const errorMessage = result.errors.map(e => `${e.field}: ${e.message}`).join(', ');
      throw new ValidationErrorClass(`Dados inválidos: ${errorMessage}`, result.errors);
    }

    return result.data!;
  }

  /**
   * Valida dados parciais (útil para atualizações)
   */
  static validatePartial<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<Partial<T>> {
    const partialSchema = schema.partial();
    return this.validate(partialSchema, data);
  }

  /**
   * Formata erros de validação para exibição
   */
  static formatErrors(errors: ValidationError[]): string {
    return errors.map(error => {
      const field = error.field ? `${error.field}: ` : '';
      return `${field}${error.message}`;
    }).join('\n');
  }

  /**
   * Agrupa erros por campo
   */
  static groupErrorsByField(errors: ValidationError[]): Record<string, string[]> {
    return errors.reduce((acc, error) => {
      const field = error.field || 'general';
      if (!acc[field]) {
        acc[field] = [];
      }
      acc[field].push(error.message);
      return acc;
    }, {} as Record<string, string[]>);
  }
}

/**
 * Resultado da validação
 */
export interface ValidationResult<T> {
  success: boolean;
  data: T | null;
  errors: ValidationError[];
}

/**
 * Erro de validação
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Classe de erro personalizada para validação
 */
export class ValidationErrorClass extends Error {
  public errors: ValidationError[];

  constructor(message: string, errors: ValidationError[]) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * Hook para validação de formulários em React
 */
export const useFormValidation = <T>(schema: z.ZodSchema<T>) => {
  const validate = (data: unknown) => FormValidator.validate(schema, data);
  const validateOrThrow = (data: unknown) => FormValidator.validateOrThrow(schema, data);
  const validatePartial = (data: unknown) => FormValidator.validatePartial(schema, data);

  return {
    validate,
    validateOrThrow,
    validatePartial,
    formatErrors: FormValidator.formatErrors,
    groupErrorsByField: FormValidator.groupErrorsByField
  };
};

/**
 * Schemas de validação comuns
 */
export const CommonSchemas = {
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
    .regex(/[^A-Za-z0-9]/, 'Senha deve conter pelo menos um caractere especial'),
  
  cpf: z.string()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, 'CPF inválido')
    .refine((cpf) => {
      // Validação de CPF
      const cleanCPF = cpf.replace(/\D/g, '');
      if (cleanCPF.length !== 11) return false;
      if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
      
      // Validação dos dígitos verificadores
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
      }
      let remainder = (sum * 10) % 11;
      if (remainder === 10 || remainder === 11) remainder = 0;
      if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
      
      sum = 0;
      for (let i = 0; i < 10; i++) {
        sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
      }
      remainder = (sum * 10) % 11;
      if (remainder === 10 || remainder === 11) remainder = 0;
      if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
      
      return true;
    }, 'CPF inválido'),

  cnpj: z.string()
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/, 'CNPJ inválido')
    .refine((cnpj) => {
      // Validação de CNPJ
      const cleanCNPJ = cnpj.replace(/\D/g, '');
      if (cleanCNPJ.length !== 14) return false;
      if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;
      
      // Validação dos dígitos verificadores
      const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      
      let sum = 0;
      for (let i = 0; i < 12; i++) {
        sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i];
      }
      let remainder = sum % 11;
      const digit1 = remainder < 2 ? 0 : 11 - remainder;
      
      if (digit1 !== parseInt(cleanCNPJ.charAt(12))) return false;
      
      sum = 0;
      for (let i = 0; i < 13; i++) {
        sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i];
      }
      remainder = sum % 11;
      const digit2 = remainder < 2 ? 0 : 11 - remainder;
      
      return digit2 === parseInt(cleanCNPJ.charAt(13));
    }, 'CNPJ inválido'),

  phone: z.string()
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$|^\d{10,11}$/, 'Telefone inválido'),

  cep: z.string()
    .regex(/^\d{5}-\d{3}$|^\d{8}$/, 'CEP inválido'),

  url: z.string().url('URL inválida'),

  positiveNumber: z.number().positive('Deve ser um número positivo'),

  nonNegativeNumber: z.number().nonnegative('Não pode ser negativo'),

  dateString: z.string().datetime('Data inválida'),

  futureDate: z.date().refine(
    (date) => date > new Date(),
    'Data deve ser futura'
  ),

  pastDate: z.date().refine(
    (date) => date < new Date(),
    'Data deve ser passada'
  )
};

/**
 * Utilitários para formatação de dados
 */
export const FormatUtils = {
  formatCPF: (cpf: string): string => {
    const clean = cpf.replace(/\D/g, '');
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  },

  formatCNPJ: (cnpj: string): string => {
    const clean = cnpj.replace(/\D/g, '');
    return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  },

  formatPhone: (phone: string): string => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 11) {
      return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (clean.length === 10) {
      return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  },

  formatCEP: (cep: string): string => {
    const clean = cep.replace(/\D/g, '');
    return clean.replace(/(\d{5})(\d{3})/, '$1-$2');
  },

  cleanNumericString: (value: string): string => {
    return value.replace(/\D/g, '');
  }
};