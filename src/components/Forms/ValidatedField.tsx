/**
 * Componente de Campo com Validação Integrada
 * 
 * Campo de formulário com feedback visual de validação em tempo real
 */

import React from 'react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

// ============================================================================
// INTERFACES
// ============================================================================

interface ValidatedFieldProps {
  label: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'select' | 'textarea';
  value: string | number;
  error?: string;
  warning?: string;
  isValidating?: boolean;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  rows?: number;
  onChange: (value: any) => void;
  onBlur?: () => void;
  onClearError?: () => void;
  className?: string;
  disabled?: boolean;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const ValidatedField: React.FC<ValidatedFieldProps> = ({
  label,
  type = 'text',
  value,
  error,
  warning,
  isValidating = false,
  required = false,
  placeholder,
  options = [],
  rows = 3,
  onChange,
  onBlur,
  onClearError,
  className = '',
  disabled = false
}) => {
  const hasError = !!error;
  const hasWarning = !!warning && !hasError;
  const isValid = !hasError && !hasWarning && !isValidating && value;

  const getInputClasses = () => {
    const baseClasses = 'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors';
    
    if (hasError) {
      return `${baseClasses} border-red-300 focus:ring-red-500 focus:border-red-500`;
    }
    
    if (hasWarning) {
      return `${baseClasses} border-yellow-300 focus:ring-yellow-500 focus:border-yellow-500`;
    }
    
    if (isValid) {
      return `${baseClasses} border-green-300 focus:ring-green-500 focus:border-green-500`;
    }
    
    return `${baseClasses} border-gray-300 focus:ring-blue-500 focus:border-blue-500`;
  };

  const renderInput = () => {
    const inputProps = {
      value: value || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const newValue = type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
        onChange(newValue);
      },
      onBlur,
      className: getInputClasses(),
      placeholder,
      disabled
    };

    switch (type) {
      case 'select':
        return (
          <select {...inputProps}>
            <option value="">Selecione uma opção</option>
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            {...inputProps}
            rows={rows}
          />
        );

      case 'number':
        return (
          <input
            {...inputProps}
            type="number"
            step="0.01"
            min="0"
          />
        );

      default:
        return (
          <input
            {...inputProps}
            type={type}
          />
        );
    }
  };

  const renderFeedbackIcon = () => {
    if (isValidating) {
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    }
    
    if (hasError) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    
    if (hasWarning) {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
    
    if (isValid) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    
    return null;
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Input Container */}
      <div className="relative">
        {renderInput()}
        
        {/* Feedback Icon */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {renderFeedbackIcon()}
        </div>
      </div>

      {/* Error/Warning Messages */}
      {hasError && (
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-600">{error}</p>
            {onClearError && (
              <button
                type="button"
                onClick={onClearError}
                className="text-xs text-red-500 hover:text-red-700 underline mt-1"
              >
                Limpar erro
              </button>
            )}
          </div>
        </div>
      )}

      {hasWarning && (
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-yellow-600">{warning}</p>
        </div>
      )}

      {/* Validation Status */}
      {isValidating && (
        <p className="text-xs text-blue-600">Validando...</p>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENTES ESPECIALIZADOS
// ============================================================================

interface CPFFieldProps extends Omit<ValidatedFieldProps, 'type' | 'onChange'> {
  onChange: (value: string) => void;
}

export const CPFField: React.FC<CPFFieldProps> = ({ onChange, value, ...props }) => {
  const formatCPF = (cpf: string) => {
    const clean = cpf.replace(/[^\d]/g, '');
    if (clean.length <= 11) {
      return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpf;
  };

  const handleChange = (newValue: string) => {
    const formatted = formatCPF(newValue);
    onChange(formatted);
  };

  return (
    <ValidatedField
      {...props}
      type="text"
      value={value}
      onChange={handleChange}
      placeholder="000.000.000-00"
    />
  );
};

interface PhoneFieldProps extends Omit<ValidatedFieldProps, 'type' | 'onChange'> {
  onChange: (value: string) => void;
}

export const PhoneField: React.FC<PhoneFieldProps> = ({ onChange, value, ...props }) => {
  const formatPhone = (phone: string) => {
    const clean = phone.replace(/[^\d]/g, '');
    if (clean.length <= 11) {
      if (clean.length === 11) {
        return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      } else if (clean.length === 10) {
        return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
      }
    }
    return phone;
  };

  const handleChange = (newValue: string) => {
    const formatted = formatPhone(newValue);
    onChange(formatted);
  };

  return (
    <ValidatedField
      {...props}
      type="tel"
      value={value}
      onChange={handleChange}
      placeholder="(11) 99999-9999"
    />
  );
};

interface CommissionFieldProps extends Omit<ValidatedFieldProps, 'type' | 'onChange'> {
  onChange: (value: number) => void;
}

export const CommissionField: React.FC<CommissionFieldProps> = ({ onChange, value, ...props }) => {
  return (
    <ValidatedField
      {...props}
      type="number"
      value={value}
      onChange={onChange}
      placeholder="0.00"
    />
  );
};

export default ValidatedField;