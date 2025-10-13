import { useState, useCallback } from 'react';
import { Employee, EmployeeFormErrors, ValidationError } from '../types/employee.types';
import { validateEmployee } from '../utils/validationRules';

export const useEmployeeValidation = () => {
  const [errors, setErrors] = useState<EmployeeFormErrors>({ fields: [] });

  const validateForm = useCallback((employee: Partial<Employee>): boolean => {
    const validationErrors = validateEmployee(employee);
    
    setErrors({
      fields: validationErrors,
      general: validationErrors.length > 0 ? 'Por favor, corrija os erros antes de continuar' : undefined
    });
    
    return validationErrors.length === 0;
  }, []);

  const validateField = useCallback((field: keyof Employee, value: any, employee: Partial<Employee>): ValidationError | null => {
    const tempEmployee = { ...employee, [field]: value };
    const validationErrors = validateEmployee(tempEmployee);
    
    const fieldError = validationErrors.find(error => error.field === field);
    
    // Atualizar erros removendo o erro do campo atual e adicionando o novo se existir
    setErrors(prev => ({
      ...prev,
      fields: [
        ...prev.fields.filter(error => error.field !== field),
        ...(fieldError ? [fieldError] : [])
      ]
    }));
    
    return fieldError || null;
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({ fields: [] });
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => ({
      ...prev,
      fields: prev.fields.filter(error => error.field !== field)
    }));
  }, []);

  const getFieldError = useCallback((field: string): ValidationError | undefined => {
    return errors.fields.find(error => error.field === field);
  }, [errors.fields]);

  const hasErrors = errors.fields.length > 0 || !!errors.general;

  return {
    errors,
    validateForm,
    validateField,
    clearErrors,
    clearFieldError,
    getFieldError,
    hasErrors
  };
};