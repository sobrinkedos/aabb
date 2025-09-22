/**
 * Componente de Validação em Tempo Real
 * 
 * Fornece feedback visual instantâneo sobre a validade dos campos
 * do formulário de funcionário, melhorando a experiência do usuário.
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, Loader } from 'lucide-react';
import { Employee } from '../../types/employee.types';

// ============================================================================
// INTERFACES
// ============================================================================

interface ValidationRule {
  field: keyof Employee;
  validator: (value: any, employee: Partial<Employee>) => Promise<ValidationResult> | ValidationResult;
  debounceMs?: number;
}

interface ValidationResult {
  isValid: boolean;
  message?: string;
  severity?: 'error' | 'warning' | 'info' | 'success';
}

interface FieldValidationState {
  isValidating: boolean;
  result: ValidationResult | null;
  lastValidated: number;
}

interface RealTimeValidationProps {
  employee: Partial<Employee>;
  rules: ValidationRule[];
  onValidationChange?: (field: keyof Employee, result: ValidationResult) => void;
  showSuccessMessages?: boolean;
}

// ============================================================================
// VALIDADORES ESPECÍFICOS
// ============================================================================

/**
 * Validador de email com verificação de formato e unicidade
 */
export const emailValidator = async (email: string): Promise<ValidationResult> => {
  if (!email) {
    return { isValid: false, message: 'Email é obrigatório', severity: 'error' };
  }

  // Validação de formato
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Formato de email inválido', severity: 'error' };
  }

  // Simulação de verificação de unicidade (substituir por chamada real à API)
  try {
    // TODO: Implementar verificação real no backend
    await new Promise(resolve => setTimeout(resolve, 500)); // Simular delay da API
    
    // Simulação: emails que terminam com 'test.com' são considerados já existentes
    if (email.endsWith('test.com')) {
      return { isValid: false, message: 'Este email já está em uso', severity: 'error' };
    }

    return { isValid: true, message: 'Email disponível', severity: 'success' };
  } catch (error) {
    return { isValid: false, message: 'Erro ao verificar email', severity: 'warning' };
  }
};

/**
 * Validador de CPF
 */
export const cpfValidator = (cpf: string): ValidationResult => {
  if (!cpf) {
    return { isValid: true }; // CPF é opcional
  }

  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '');

  if (cleanCPF.length !== 11) {
    return { isValid: false, message: 'CPF deve ter 11 dígitos', severity: 'error' };
  }

  // Verifica se não são todos iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return { isValid: false, message: 'CPF inválido', severity: 'error' };
  }

  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit === 10 || digit === 11) digit = 0;
  if (digit !== parseInt(cleanCPF.charAt(9))) {
    return { isValid: false, message: 'CPF inválido', severity: 'error' };
  }

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit === 10 || digit === 11) digit = 0;
  if (digit !== parseInt(cleanCPF.charAt(10))) {
    return { isValid: false, message: 'CPF inválido', severity: 'error' };
  }

  return { isValid: true, message: 'CPF válido', severity: 'success' };
};

/**
 * Validador de telefone
 */
export const phoneValidator = (phone: string): ValidationResult => {
  if (!phone) {
    return { isValid: true }; // Telefone é opcional
  }

  // Remove caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');

  if (cleanPhone.length < 10 || cleanPhone.length > 11) {
    return { isValid: false, message: 'Telefone deve ter 10 ou 11 dígitos', severity: 'error' };
  }

  // Verificar se é um número válido (não pode começar com 0 ou 1)
  if (cleanPhone.length === 11 && !['2', '3', '4', '5', '6', '7', '8', '9'].includes(cleanPhone[2])) {
    return { isValid: false, message: 'Número de celular inválido', severity: 'error' };
  }

  return { isValid: true, message: 'Telefone válido', severity: 'success' };
};

/**
 * Validador de nome
 */
export const nameValidator = (name: string): ValidationResult => {
  if (!name || !name.trim()) {
    return { isValid: false, message: 'Nome é obrigatório', severity: 'error' };
  }

  if (name.trim().length < 2) {
    return { isValid: false, message: 'Nome deve ter pelo menos 2 caracteres', severity: 'error' };
  }

  if (name.trim().length > 100) {
    return { isValid: false, message: 'Nome muito longo (máximo 100 caracteres)', severity: 'error' };
  }

  // Verificar se tem pelo menos nome e sobrenome
  const nameParts = name.trim().split(' ').filter(part => part.length > 0);
  if (nameParts.length < 2) {
    return { isValid: false, message: 'Informe nome e sobrenome', severity: 'warning' };
  }

  return { isValid: true, message: 'Nome válido', severity: 'success' };
};

/**
 * Validador de função
 */
export const roleValidator = (role: any, employee: Partial<Employee>): ValidationResult => {
  if (!role) {
    return { isValid: false, message: 'Selecione uma função', severity: 'error' };
  }

  // Verificar se a função é compatível com as permissões
  if (employee.permissions && employee.permissions.length > 0) {
    return { isValid: true, message: 'Função selecionada com permissões configuradas', severity: 'success' };
  }

  return { isValid: true, message: 'Função selecionada', severity: 'info' };
};

// ============================================================================
// REGRAS DE VALIDAÇÃO PADRÃO
// ============================================================================

export const defaultValidationRules: ValidationRule[] = [
  {
    field: 'name',
    validator: nameValidator,
    debounceMs: 300
  },
  {
    field: 'email',
    validator: emailValidator,
    debounceMs: 800
  },
  {
    field: 'cpf',
    validator: cpfValidator,
    debounceMs: 500
  },
  {
    field: 'phone',
    validator: phoneValidator,
    debounceMs: 500
  },
  {
    field: 'role',
    validator: roleValidator,
    debounceMs: 100
  }
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const RealTimeValidation: React.FC<RealTimeValidationProps> = ({
  employee,
  rules,
  onValidationChange,
  showSuccessMessages = false
}) => {
  const [validationStates, setValidationStates] = useState<Record<string, FieldValidationState>>({});

  // Função para executar validação com debounce
  const validateField = async (rule: ValidationRule, value: any) => {
    const fieldKey = rule.field as string;
    
    // Marcar como validando
    setValidationStates(prev => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        isValidating: true
      }
    }));

    try {
      const result = await Promise.resolve(rule.validator(value, employee));
      
      setValidationStates(prev => ({
        ...prev,
        [fieldKey]: {
          isValidating: false,
          result,
          lastValidated: Date.now()
        }
      }));

      // Notificar mudança
      if (onValidationChange) {
        onValidationChange(rule.field, result);
      }
    } catch (error) {
      const errorResult: ValidationResult = {
        isValid: false,
        message: 'Erro na validação',
        severity: 'error'
      };

      setValidationStates(prev => ({
        ...prev,
        [fieldKey]: {
          isValidating: false,
          result: errorResult,
          lastValidated: Date.now()
        }
      }));

      if (onValidationChange) {
        onValidationChange(rule.field, errorResult);
      }
    }
  };

  // Effect para validar campos quando mudarem
  useEffect(() => {
    const timeouts: Record<string, NodeJS.Timeout> = {};

    rules.forEach(rule => {
      const fieldKey = rule.field as string;
      const value = employee[rule.field];
      const debounceMs = rule.debounceMs || 300;

      // Limpar timeout anterior
      if (timeouts[fieldKey]) {
        clearTimeout(timeouts[fieldKey]);
      }

      // Configurar novo timeout
      timeouts[fieldKey] = setTimeout(() => {
        validateField(rule, value);
      }, debounceMs);
    });

    // Cleanup
    return () => {
      Object.values(timeouts).forEach(timeout => clearTimeout(timeout));
    };
  }, [employee, rules]);

  // Renderizar indicadores de validação
  const renderValidationIndicator = (field: keyof Employee) => {
    const fieldKey = field as string;
    const state = validationStates[fieldKey];

    if (!state) return null;

    if (state.isValidating) {
      return (
        <div className="flex items-center space-x-1 text-blue-600">
          <Loader className="h-4 w-4 animate-spin" />
          <span className="text-xs">Validando...</span>
        </div>
      );
    }

    if (!state.result) return null;

    const { isValid, message, severity } = state.result;

    // Não mostrar mensagens de sucesso se desabilitado
    if (severity === 'success' && !showSuccessMessages) return null;

    const getIcon = () => {
      switch (severity) {
        case 'success':
          return <CheckCircle className="h-4 w-4 text-green-600" />;
        case 'error':
          return <XCircle className="h-4 w-4 text-red-600" />;
        case 'warning':
          return <AlertCircle className="h-4 w-4 text-yellow-600" />;
        case 'info':
          return <Info className="h-4 w-4 text-blue-600" />;
        default:
          return null;
      }
    };

    const getTextColor = () => {
      switch (severity) {
        case 'success':
          return 'text-green-600';
        case 'error':
          return 'text-red-600';
        case 'warning':
          return 'text-yellow-600';
        case 'info':
          return 'text-blue-600';
        default:
          return 'text-gray-600';
      }
    };

    return (
      <div className={`flex items-center space-x-1 ${getTextColor()}`}>
        {getIcon()}
        {message && <span className="text-xs">{message}</span>}
      </div>
    );
  };

  // Função para obter estado de validação de um campo
  const getFieldValidation = (field: keyof Employee) => {
    const fieldKey = field as string;
    const state = validationStates[fieldKey];
    return {
      isValidating: state?.isValidating || false,
      isValid: state?.result?.isValid || false,
      message: state?.result?.message,
      severity: state?.result?.severity,
      indicator: renderValidationIndicator(field)
    };
  };

  // Função para verificar se todos os campos são válidos
  const isFormValid = () => {
    return rules.every(rule => {
      const fieldKey = rule.field as string;
      const state = validationStates[fieldKey];
      return state?.result?.isValid !== false; // Considera válido se não foi validado ainda
    });
  };

  // Função para obter resumo de validação
  const getValidationSummary = () => {
    const total = rules.length;
    const validated = Object.keys(validationStates).length;
    const valid = Object.values(validationStates).filter(state => state.result?.isValid).length;
    const invalid = Object.values(validationStates).filter(state => state.result?.isValid === false).length;
    const validating = Object.values(validationStates).filter(state => state.isValidating).length;

    return {
      total,
      validated,
      valid,
      invalid,
      validating,
      isComplete: validated === total,
      isAllValid: valid === total && invalid === 0
    };
  };

  // Expor funções através de ref ou context se necessário
  return {
    getFieldValidation,
    isFormValid,
    getValidationSummary,
    renderValidationIndicator
  } as any;
};

// ============================================================================
// HOOK PARA USAR VALIDAÇÃO EM TEMPO REAL
// ============================================================================

export const useRealTimeValidation = (
  employee: Partial<Employee>,
  rules: ValidationRule[] = defaultValidationRules
) => {
  const [validationResults, setValidationResults] = useState<Record<string, ValidationResult>>({});

  const handleValidationChange = (field: keyof Employee, result: ValidationResult) => {
    setValidationResults(prev => ({
      ...prev,
      [field as string]: result
    }));
  };

  const isFieldValid = (field: keyof Employee) => {
    const result = validationResults[field as string];
    return result?.isValid !== false; // Considera válido se não foi validado ainda
  };

  const getFieldError = (field: keyof Employee) => {
    const result = validationResults[field as string];
    return result?.isValid === false ? result.message : null;
  };

  const isFormValid = () => {
    return Object.values(validationResults).every(result => result.isValid !== false);
  };

  return {
    validationResults,
    handleValidationChange,
    isFieldValid,
    getFieldError,
    isFormValid,
    rules
  };
};