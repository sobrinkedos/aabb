import React, { useState, useCallback } from 'react';
import { z } from 'zod';
import { FormValidator, ValidationError, ValidationErrorClass } from '../../utils/formValidation';

interface ValidatedFormProps<T> {
  schema: z.ZodSchema<T>;
  initialData?: Partial<T>;
  onSubmit: (data: T) => Promise<void> | void;
  onCancel?: () => void;
  children: (props: FormRenderProps<T>) => React.ReactNode;
  className?: string;
}

interface FormRenderProps<T> {
  data: Partial<T>;
  errors: Record<string, string[]>;
  isSubmitting: boolean;
  hasErrors: boolean;
  updateField: (field: keyof T, value: any) => void;
  updateData: (updates: Partial<T>) => void;
  getFieldError: (field: keyof T) => string | undefined;
  hasFieldError: (field: keyof T) => boolean;
  clearFieldError: (field: keyof T) => void;
  clearAllErrors: () => void;
  validateField: (field: keyof T) => boolean;
  validateForm: () => boolean;
  handleSubmit: (e: React.FormEvent) => void;
}

export function ValidatedForm<T>({
  schema,
  initialData = {},
  onSubmit,
  onCancel,
  children,
  className = ''
}: ValidatedFormProps<T>) {
  const [data, setData] = useState<Partial<T>>(initialData);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = useCallback((field: keyof T, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  }, [errors]);

  const updateData = useCallback((updates: Partial<T>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const getFieldError = useCallback((field: keyof T): string | undefined => {
    const fieldErrors = errors[field as string];
    return fieldErrors && fieldErrors.length > 0 ? fieldErrors[0] : undefined;
  }, [errors]);

  const hasFieldError = useCallback((field: keyof T): boolean => {
    return !!(errors[field as string] && errors[field as string].length > 0);
  }, [errors]);

  const clearFieldError = useCallback((field: keyof T) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field as string];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const validateField = useCallback((field: keyof T): boolean => {
    try {
      // Criar um schema parcial apenas para este campo
      const fieldSchema = schema.pick({ [field]: true } as any);
      const fieldData = { [field]: data[field] };
      
      const result = FormValidator.validate(fieldSchema, fieldData);
      
      if (!result.success) {
        const fieldErrors = FormValidator.groupErrorsByField(result.errors);
        setErrors(prev => ({ ...prev, ...fieldErrors }));
        return false;
      }
      
      return true;
    } catch (error) {
      // Se não conseguir validar o campo individualmente, considera válido
      return true;
    }
  }, [schema, data]);

  const validateForm = useCallback(): boolean => {
    const result = FormValidator.validate(schema, data);
    
    if (!result.success) {
      const fieldErrors = FormValidator.groupErrorsByField(result.errors);
      setErrors(fieldErrors);
      return false;
    }
    
    setErrors({});
    return true;
  }, [schema, data]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      if (!validateForm()) {
        return;
      }
      
      const validatedData = FormValidator.validateOrThrow(schema, data);
      await onSubmit(validatedData);
      
    } catch (error) {
      if (error instanceof ValidationErrorClass) {
        const fieldErrors = FormValidator.groupErrorsByField(error.errors);
        setErrors(fieldErrors);
      } else {
        console.error('Erro ao submeter formulário:', error);
        // Aqui você pode adicionar uma notificação de erro global
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [data, schema, onSubmit, isSubmitting, validateForm]);

  const hasErrors = Object.keys(errors).length > 0;

  const formProps: FormRenderProps<T> = {
    data,
    errors,
    isSubmitting,
    hasErrors,
    updateField,
    updateData,
    getFieldError,
    hasFieldError,
    clearFieldError,
    clearAllErrors,
    validateField,
    validateForm,
    handleSubmit
  };

  return (
    <form onSubmit={handleSubmit} className={className} noValidate>
      {children(formProps)}
    </form>
  );
}

// Componente de campo de input com validação
interface ValidatedInputProps {
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
  value: any;
  onChange: (value: any) => void;
  onBlur?: () => void;
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  label,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  className = '',
  error,
  value,
  onChange,
  onBlur
}) => {
  const hasError = !!error;
  
  return (
    <div className={`mb-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1
          ${hasError 
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
        `}
      />
      
      {hasError && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

// Componente de select com validação
interface ValidatedSelectProps {
  label: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
  value: any;
  onChange: (value: any) => void;
  onBlur?: () => void;
}

export const ValidatedSelect: React.FC<ValidatedSelectProps> = ({
  label,
  options,
  placeholder = 'Selecione uma opção',
  required = false,
  disabled = false,
  className = '',
  error,
  value,
  onChange,
  onBlur
}) => {
  const hasError = !!error;
  
  return (
    <div className={`mb-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        className={`
          w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1
          ${hasError 
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
        `}
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {hasError && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

// Componente de textarea com validação
interface ValidatedTextareaProps {
  label: string;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
  value: any;
  onChange: (value: any) => void;
  onBlur?: () => void;
}

export const ValidatedTextarea: React.FC<ValidatedTextareaProps> = ({
  label,
  placeholder,
  rows = 3,
  required = false,
  disabled = false,
  className = '',
  error,
  value,
  onChange,
  onBlur
}) => {
  const hasError = !!error;
  
  return (
    <div className={`mb-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={`
          w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 resize-vertical
          ${hasError 
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
        `}
      />
      
      {hasError && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

// Componente de checkbox com validação
interface ValidatedCheckboxProps {
  label: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const ValidatedCheckbox: React.FC<ValidatedCheckboxProps> = ({
  label,
  description,
  required = false,
  disabled = false,
  className = '',
  error,
  checked,
  onChange
}) => {
  const hasError = !!error;
  
  return (
    <div className={`mb-4 ${className}`}>
      <div className="flex items-start">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className={`
            mt-1 h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-offset-2
            ${hasError 
              ? 'text-red-600 focus:ring-red-500' 
              : 'text-blue-600 focus:ring-blue-500'
            }
            ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
          `}
        />
        <div className="ml-3">
          <label className={`text-sm font-medium text-gray-700 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
      </div>
      
      {hasError && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};