/**
 * Hook para Validação de Formulários em Tempo Real
 * 
 * Gerencia estado de validação e feedback visual
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  validateEmployeeForm, 
  validateEmail, 
  validateCPF, 
  validatePhone,
  validateCommissionRate,
  validateRequired,
  debounce,
  FieldValidationResult,
  ValidationResult,
  EmployeeFormData
} from '../utils/validation';

// ============================================================================
// INTERFACES
// ============================================================================

interface FieldState {
  value: any;
  error?: string;
  warning?: string;
  isValidating?: boolean;
  touched: boolean;
}

interface FormValidationState {
  fields: Record<string, FieldState>;
  isValid: boolean;
  isValidating: boolean;
  errors: string[];
  warnings: string[];
}

interface UseFormValidationOptions {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export const useFormValidation = (
  initialData: Partial<EmployeeFormData> = {},
  options: UseFormValidationOptions = {}
) => {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    debounceMs = 500
  } = options;

  const [formState, setFormState] = useState<FormValidationState>({
    fields: {},
    isValid: false,
    isValidating: false,
    errors: [],
    warnings: []
  });

  // Inicializar campos com dados iniciais
  useEffect(() => {
    const initialFields: Record<string, FieldState> = {};
    
    Object.entries(initialData).forEach(([key, value]) => {
      initialFields[key] = {
        value,
        touched: false
      };
    });

    setFormState(prev => ({
      ...prev,
      fields: initialFields
    }));
  }, []);

  // ============================================================================
  // VALIDAÇÃO DE CAMPO INDIVIDUAL
  // ============================================================================

  const validateField = useCallback(async (
    fieldName: string, 
    value: any
  ): Promise<FieldValidationResult> => {
    switch (fieldName) {
      case 'nome_completo':
        return validateRequired(value, 'Nome completo');
      
      case 'email':
        if (!value) return { isValid: true };
        const emailResult = validateEmail(value);
        if (!emailResult.isValid) return emailResult;
        
        // Verificar unicidade (simulado)
        return new Promise(resolve => {
          setTimeout(() => {
            const existingEmails = ['admin@empresa.com', 'gerente@empresa.com'];
            const isDuplicate = existingEmails.includes(value.toLowerCase());
            resolve({
              isValid: !isDuplicate,
              error: isDuplicate ? 'Este email já está em uso' : undefined
            });
          }, 300);
        });
      
      case 'cpf':
        return validateCPF(value);
      
      case 'telefone':
        return validatePhone(value);
      
      case 'commission_rate':
        return validateCommissionRate(value);
      
      case 'bar_role':
        return validateRequired(value, 'Função');
      
      default:
        return { isValid: true };
    }
  }, []);

  // Debounced validation
  const debouncedValidateField = useCallback(
    debounce(async (fieldName: string, value: any) => {
      setFormState(prev => ({
        ...prev,
        fields: {
          ...prev.fields,
          [fieldName]: {
            ...prev.fields[fieldName],
            isValidating: true
          }
        }
      }));

      const result = await validateField(fieldName, value);

      setFormState(prev => ({
        ...prev,
        fields: {
          ...prev.fields,
          [fieldName]: {
            ...prev.fields[fieldName],
            error: result.error,
            warning: result.warning,
            isValidating: false
          }
        }
      }));
    }, debounceMs),
    [validateField, debounceMs]
  );

  // ============================================================================
  // HANDLERS DE CAMPO
  // ============================================================================

  const setFieldValue = useCallback((fieldName: string, value: any) => {
    setFormState(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [fieldName]: {
          ...prev.fields[fieldName],
          value,
          touched: true
        }
      }
    }));

    if (validateOnChange) {
      debouncedValidateField(fieldName, value);
    }
  }, [validateOnChange, debouncedValidateField]);

  const setFieldTouched = useCallback((fieldName: string) => {
    setFormState(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [fieldName]: {
          ...prev.fields[fieldName],
          touched: true
        }
      }
    }));

    if (validateOnBlur) {
      const value = formState.fields[fieldName]?.value;
      debouncedValidateField(fieldName, value);
    }
  }, [validateOnBlur, debouncedValidateField, formState.fields]);

  const clearFieldError = useCallback((fieldName: string) => {
    setFormState(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [fieldName]: {
          ...prev.fields[fieldName],
          error: undefined,
          warning: undefined
        }
      }
    }));
  }, []);

  // ============================================================================
  // VALIDAÇÃO COMPLETA DO FORMULÁRIO
  // ============================================================================

  const validateForm = useCallback(async (): Promise<ValidationResult> => {
    setFormState(prev => ({ ...prev, isValidating: true }));

    // Marcar todos os campos como touched
    const touchedFields = { ...formState.fields };
    Object.keys(touchedFields).forEach(key => {
      touchedFields[key] = { ...touchedFields[key], touched: true };
    });

    // Construir dados do formulário
    const formData: EmployeeFormData = {
      nome_completo: touchedFields.nome_completo?.value || '',
      email: touchedFields.email?.value || '',
      telefone: touchedFields.telefone?.value,
      cpf: touchedFields.cpf?.value,
      bar_role: touchedFields.bar_role?.value || '',
      shift_preference: touchedFields.shift_preference?.value,
      specialties: touchedFields.specialties?.value || [],
      commission_rate: touchedFields.commission_rate?.value,
      tem_acesso_sistema: touchedFields.tem_acesso_sistema?.value || false,
      observacoes: touchedFields.observacoes?.value
    };

    const result = await validateEmployeeForm(formData);

    // Atualizar estado com erros de campo individual
    const updatedFields = { ...touchedFields };
    
    // Limpar erros anteriores
    Object.keys(updatedFields).forEach(key => {
      updatedFields[key] = {
        ...updatedFields[key],
        error: undefined,
        warning: undefined
      };
    });

    // Aplicar novos erros (isso seria mais sofisticado em um sistema real)
    if (result.errors.length > 0) {
      result.errors.forEach(error => {
        if (error.includes('Nome')) {
          updatedFields.nome_completo = {
            ...updatedFields.nome_completo,
            error
          };
        } else if (error.includes('Email')) {
          updatedFields.email = {
            ...updatedFields.email,
            error
          };
        } else if (error.includes('CPF')) {
          updatedFields.cpf = {
            ...updatedFields.cpf,
            error
          };
        } else if (error.includes('Telefone')) {
          updatedFields.telefone = {
            ...updatedFields.telefone,
            error
          };
        } else if (error.includes('Função')) {
          updatedFields.bar_role = {
            ...updatedFields.bar_role,
            error
          };
        }
      });
    }

    setFormState(prev => ({
      ...prev,
      fields: updatedFields,
      isValid: result.isValid,
      isValidating: false,
      errors: result.errors,
      warnings: result.warnings
    }));

    return result;
  }, [formState.fields]);

  // ============================================================================
  // UTILITÁRIOS
  // ============================================================================

  const getFieldProps = useCallback((fieldName: string) => {
    const field = formState.fields[fieldName] || { value: '', touched: false };
    
    return {
      value: field.value || '',
      error: field.touched ? field.error : undefined,
      warning: field.touched ? field.warning : undefined,
      isValidating: field.isValidating || false,
      onChange: (value: any) => setFieldValue(fieldName, value),
      onBlur: () => setFieldTouched(fieldName),
      onClearError: () => clearFieldError(fieldName)
    };
  }, [formState.fields, setFieldValue, setFieldTouched, clearFieldError]);

  const getFormData = useCallback((): Partial<EmployeeFormData> => {
    const data: any = {};
    Object.entries(formState.fields).forEach(([key, field]) => {
      data[key] = field.value;
    });
    return data;
  }, [formState.fields]);

  const resetForm = useCallback((newData: Partial<EmployeeFormData> = {}) => {
    const resetFields: Record<string, FieldState> = {};
    
    Object.entries(newData).forEach(([key, value]) => {
      resetFields[key] = {
        value,
        touched: false
      };
    });

    setFormState({
      fields: resetFields,
      isValid: false,
      isValidating: false,
      errors: [],
      warnings: []
    });
  }, []);

  const hasErrors = Object.values(formState.fields).some(field => field.error);
  const hasWarnings = Object.values(formState.fields).some(field => field.warning);

  return {
    // Estado
    formState,
    isValid: formState.isValid && !hasErrors,
    isValidating: formState.isValidating,
    hasErrors,
    hasWarnings,
    errors: formState.errors,
    warnings: formState.warnings,

    // Métodos
    validateForm,
    validateField,
    setFieldValue,
    setFieldTouched,
    clearFieldError,
    getFieldProps,
    getFormData,
    resetForm
  };
};

export default useFormValidation;