/**
 * Sistema de Validação de Formulários
 * 
 * Utilitários para validação em tempo real de dados de funcionários
 */

// ============================================================================
// INTERFACES
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FieldValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

export interface EmployeeFormData {
  nome_completo: string;
  email: string;
  telefone?: string;
  cpf?: string;
  bar_role: string;
  shift_preference?: string;
  specialties?: string[];
  commission_rate?: number;
  tem_acesso_sistema: boolean;
  observacoes?: string;
}

// ============================================================================
// VALIDADORES BÁSICOS
// ============================================================================

/**
 * Valida se um campo obrigatório está preenchido
 */
export const validateRequired = (value: any, fieldName: string): FieldValidationResult => {
  const isEmpty = value === null || value === undefined || 
    (typeof value === 'string' && value.trim() === '') ||
    (Array.isArray(value) && value.length === 0);

  return {
    isValid: !isEmpty,
    error: isEmpty ? `${fieldName} é obrigatório` : undefined
  };
};

/**
 * Valida formato de email
 */
export const validateEmail = (email: string): FieldValidationResult => {
  if (!email) {
    return { isValid: true }; // Email pode ser opcional em alguns casos
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);

  return {
    isValid,
    error: !isValid ? 'Email deve ter um formato válido' : undefined
  };
};

/**
 * Valida unicidade de email
 */
export const validateEmailUniqueness = async (
  email: string, 
  currentEmployeeId?: string
): Promise<FieldValidationResult> => {
  if (!email) {
    return { isValid: true };
  }

  try {
    // Em um sistema real, isso faria uma consulta ao banco
    // Por enquanto, simular verificação
    const existingEmails = ['admin@empresa.com', 'gerente@empresa.com'];
    const isDuplicate = existingEmails.includes(email.toLowerCase());

    return {
      isValid: !isDuplicate,
      error: isDuplicate ? 'Este email já está em uso' : undefined
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Erro ao verificar unicidade do email'
    };
  }
};

/**
 * Valida formato de CPF
 */
export const validateCPF = (cpf: string): FieldValidationResult => {
  if (!cpf) {
    return { isValid: true }; // CPF pode ser opcional
  }

  // Remove formatação
  const cleanCPF = cpf.replace(/[^\d]/g, '');

  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) {
    return {
      isValid: false,
      error: 'CPF deve ter 11 dígitos'
    };
  }

  // Verifica se não são todos os dígitos iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return {
      isValid: false,
      error: 'CPF inválido'
    };
  }

  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) {
    return {
      isValid: false,
      error: 'CPF inválido'
    };
  }

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) {
    return {
      isValid: false,
      error: 'CPF inválido'
    };
  }

  return { isValid: true };
};

/**
 * Valida formato de telefone brasileiro
 */
export const validatePhone = (phone: string): FieldValidationResult => {
  if (!phone) {
    return { isValid: true }; // Telefone pode ser opcional
  }

  // Remove formatação
  const cleanPhone = phone.replace(/[^\d]/g, '');

  // Verifica se tem 10 ou 11 dígitos (com DDD)
  if (cleanPhone.length < 10 || cleanPhone.length > 11) {
    return {
      isValid: false,
      error: 'Telefone deve ter 10 ou 11 dígitos (com DDD)'
    };
  }

  // Verifica se o DDD é válido (11-99)
  const ddd = parseInt(cleanPhone.substring(0, 2));
  if (ddd < 11 || ddd > 99) {
    return {
      isValid: false,
      error: 'DDD inválido'
    };
  }

  return { isValid: true };
};

/**
 * Valida taxa de comissão
 */
export const validateCommissionRate = (rate?: number): FieldValidationResult => {
  if (rate === undefined || rate === null) {
    return { isValid: true }; // Taxa pode ser opcional
  }

  if (rate < 0) {
    return {
      isValid: false,
      error: 'Taxa de comissão não pode ser negativa'
    };
  }

  if (rate > 100) {
    return {
      isValid: false,
      error: 'Taxa de comissão não pode ser maior que 100%'
    };
  }

  if (rate > 50) {
    return {
      isValid: true,
      warning: 'Taxa de comissão muito alta (acima de 50%)'
    };
  }

  return { isValid: true };
};

/**
 * Valida função do funcionário
 */
export const validateRole = (role: string): FieldValidationResult => {
  const validRoles = ['atendente', 'garcom', 'cozinheiro', 'barman', 'gerente'];
  
  if (!role) {
    return {
      isValid: false,
      error: 'Função é obrigatória'
    };
  }

  if (!validRoles.includes(role)) {
    return {
      isValid: false,
      error: 'Função inválida'
    };
  }

  return { isValid: true };
};

// ============================================================================
// VALIDAÇÃO COMPLETA DE FUNCIONÁRIO
// ============================================================================

/**
 * Valida todos os campos de um funcionário
 */
export const validateEmployeeForm = async (
  data: EmployeeFormData,
  currentEmployeeId?: string
): Promise<ValidationResult> => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validações obrigatórias
  const nameValidation = validateRequired(data.nome_completo, 'Nome completo');
  if (!nameValidation.isValid) {
    errors.push(nameValidation.error!);
  }

  const roleValidation = validateRole(data.bar_role);
  if (!roleValidation.isValid) {
    errors.push(roleValidation.error!);
  }

  // Validações de formato
  if (data.email) {
    const emailValidation = validateEmail(data.email);
    if (!emailValidation.isValid) {
      errors.push(emailValidation.error!);
    } else {
      // Verificar unicidade apenas se o formato estiver correto
      const uniquenessValidation = await validateEmailUniqueness(data.email, currentEmployeeId);
      if (!uniquenessValidation.isValid) {
        errors.push(uniquenessValidation.error!);
      }
    }
  }

  if (data.cpf) {
    const cpfValidation = validateCPF(data.cpf);
    if (!cpfValidation.isValid) {
      errors.push(cpfValidation.error!);
    }
  }

  if (data.telefone) {
    const phoneValidation = validatePhone(data.telefone);
    if (!phoneValidation.isValid) {
      errors.push(phoneValidation.error!);
    }
  }

  if (data.commission_rate !== undefined) {
    const commissionValidation = validateCommissionRate(data.commission_rate);
    if (!commissionValidation.isValid) {
      errors.push(commissionValidation.error!);
    } else if (commissionValidation.warning) {
      warnings.push(commissionValidation.warning);
    }
  }

  // Validações de negócio
  if (data.tem_acesso_sistema && !data.email) {
    errors.push('Email é obrigatório para funcionários com acesso ao sistema');
  }

  if (data.bar_role === 'gerente' && data.commission_rate && data.commission_rate > 0) {
    warnings.push('Gerentes normalmente não recebem comissão');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// ============================================================================
// UTILITÁRIOS DE FORMATAÇÃO
// ============================================================================

/**
 * Formata CPF para exibição
 */
export const formatCPF = (cpf: string): string => {
  const clean = cpf.replace(/[^\d]/g, '');
  if (clean.length === 11) {
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return cpf;
};

/**
 * Formata telefone para exibição
 */
export const formatPhone = (phone: string): string => {
  const clean = phone.replace(/[^\d]/g, '');
  if (clean.length === 11) {
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (clean.length === 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
};

/**
 * Remove formatação de string
 */
export const removeFormatting = (value: string): string => {
  return value.replace(/[^\d]/g, '');
};

// ============================================================================
// VALIDAÇÃO EM TEMPO REAL
// ============================================================================

/**
 * Debounce para validação em tempo real
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Hook para validação em tempo real (para uso em componentes React)
 */
export const createRealTimeValidator = (
  validationFn: (value: any) => Promise<FieldValidationResult> | FieldValidationResult,
  delay: number = 500
) => {
  return debounce(async (value: any, callback: (result: FieldValidationResult) => void) => {
    try {
      const result = await validationFn(value);
      callback(result);
    } catch (error) {
      callback({
        isValid: false,
        error: 'Erro na validação'
      });
    }
  }, delay);
};

// ============================================================================
// MENSAGENS DE VALIDAÇÃO
// ============================================================================

export const ValidationMessages = {
  REQUIRED: (field: string) => `${field} é obrigatório`,
  INVALID_EMAIL: 'Email deve ter um formato válido',
  EMAIL_IN_USE: 'Este email já está em uso',
  INVALID_CPF: 'CPF inválido',
  INVALID_PHONE: 'Telefone deve ter formato válido',
  INVALID_COMMISSION: 'Taxa de comissão deve estar entre 0% e 100%',
  HIGH_COMMISSION: 'Taxa de comissão muito alta',
  EMAIL_REQUIRED_FOR_SYSTEM_ACCESS: 'Email é obrigatório para acesso ao sistema',
  MANAGER_WITH_COMMISSION: 'Gerentes normalmente não recebem comissão'
} as const;