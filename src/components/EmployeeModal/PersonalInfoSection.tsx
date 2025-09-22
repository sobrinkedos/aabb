import React, { useState, useEffect } from 'react';
import { User, Calendar, CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react';
import { Employee } from '../../types/employee.types';
import { formatCPF, formatPhone } from '../../utils/validationRules';
import { useEmployeeValidation } from '../../hooks/useEmployeeValidation';
import { 
  useRealTimeValidation, 
  defaultValidationRules,
  nameValidator,
  emailValidator,
  cpfValidator,
  phoneValidator
} from './RealTimeValidation';

interface PersonalInfoSectionProps {
  employee: Partial<Employee>;
  onUpdate: (field: keyof Employee, value: any) => void;
  errors: ReturnType<typeof useEmployeeValidation>['errors'];
}

export const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = ({
  employee,
  onUpdate,
  errors
}) => {
  // Estado para validação em tempo real
  const [fieldStates, setFieldStates] = useState<Record<string, {
    isValidating: boolean;
    isValid: boolean | null;
    message: string | null;
    severity: 'error' | 'warning' | 'success' | 'info' | null;
  }>>({});

  // Hook de validação em tempo real
  const {
    validationResults,
    handleValidationChange,
    isFieldValid,
    getFieldError: getRealTimeError
  } = useRealTimeValidation(employee);

  const getFieldError = (field: string) => {
    // Priorizar erros de validação em tempo real
    const realTimeError = getRealTimeError(field as keyof Employee);
    if (realTimeError) {
      return { message: realTimeError };
    }
    
    // Fallback para erros do sistema antigo
    return errors.fields.find(error => error.field === field);
  };

  // Função para validar campo com debounce
  const validateFieldWithDebounce = (field: keyof Employee, value: any, validator: Function, delay: number = 500) => {
    const fieldKey = field as string;
    
    // Marcar como validando
    setFieldStates(prev => ({
      ...prev,
      [fieldKey]: { ...prev[fieldKey], isValidating: true }
    }));

    // Limpar timeout anterior
    const timeoutId = setTimeout(async () => {
      try {
        const result = await Promise.resolve(validator(value, employee));
        
        setFieldStates(prev => ({
          ...prev,
          [fieldKey]: {
            isValidating: false,
            isValid: result.isValid,
            message: result.message || null,
            severity: result.severity || null
          }
        }));
      } catch (error) {
        setFieldStates(prev => ({
          ...prev,
          [fieldKey]: {
            isValidating: false,
            isValid: false,
            message: 'Erro na validação',
            severity: 'error'
          }
        }));
      }
    }, delay);

    return () => clearTimeout(timeoutId);
  };

  const handleCPFChange = (value: string) => {
    // Remove caracteres não numéricos e limita a 11 dígitos
    const cleanValue = value.replace(/\D/g, '').slice(0, 11);
    onUpdate('cpf', cleanValue);
    
    // Validar em tempo real
    validateFieldWithDebounce('cpf', cleanValue, cpfValidator, 300);
  };

  const handlePhoneChange = (value: string) => {
    // Remove caracteres não numéricos e limita a 11 dígitos
    const cleanValue = value.replace(/\D/g, '').slice(0, 11);
    onUpdate('phone', cleanValue);
    
    // Validar em tempo real
    validateFieldWithDebounce('phone', cleanValue, phoneValidator, 300);
  };

  const handleNameChange = (value: string) => {
    onUpdate('name', value);
    validateFieldWithDebounce('name', value, nameValidator, 400);
  };

  const handleEmailChange = (value: string) => {
    onUpdate('email', value);
    validateFieldWithDebounce('email', value, emailValidator, 800);
  };

  // Componente para renderizar indicador de validação
  const ValidationIndicator: React.FC<{ field: string }> = ({ field }) => {
    const state = fieldStates[field];
    
    if (!state) return null;

    if (state.isValidating) {
      return (
        <div className="flex items-center space-x-1 text-blue-600 mt-1">
          <Loader className="h-3 w-3 animate-spin" />
          <span className="text-xs">Validando...</span>
        </div>
      );
    }

    if (state.isValid === null) return null;

    const getIcon = () => {
      switch (state.severity) {
        case 'success':
          return <CheckCircle className="h-3 w-3 text-green-600" />;
        case 'error':
          return <XCircle className="h-3 w-3 text-red-600" />;
        case 'warning':
          return <AlertCircle className="h-3 w-3 text-yellow-600" />;
        default:
          return null;
      }
    };

    const getTextColor = () => {
      switch (state.severity) {
        case 'success':
          return 'text-green-600';
        case 'error':
          return 'text-red-600';
        case 'warning':
          return 'text-yellow-600';
        default:
          return 'text-gray-600';
      }
    };

    return (
      <div className={`flex items-center space-x-1 mt-1 ${getTextColor()}`}>
        {getIcon()}
        {state.message && <span className="text-xs">{state.message}</span>}
      </div>
    );
  };

  // Função para obter classe CSS do campo baseada na validação
  const getFieldClassName = (field: string, baseClass: string) => {
    const state = fieldStates[field];
    const hasError = getFieldError(field);
    
    if (hasError || (state && state.isValid === false)) {
      return `${baseClass} border-red-500 focus:ring-red-500`;
    }
    
    if (state && state.isValid === true) {
      return `${baseClass} border-green-500 focus:ring-green-500`;
    }
    
    return `${baseClass} border-gray-300 focus:ring-blue-500`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <User className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Dados Pessoais</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nome Completo *
          </label>
          <input
            id="name"
            type="text"
            value={employee.name || ''}
            onChange={(e) => handleNameChange(e.target.value)}
            className={getFieldClassName('name', 'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2')}
            placeholder="Digite o nome completo"
          />
          <ValidationIndicator field="name" />
          {getFieldError('name') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('name')?.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-1">
            CPF *
          </label>
          <input
            id="cpf"
            type="text"
            value={employee.cpf ? formatCPF(employee.cpf) : ''}
            onChange={(e) => handleCPFChange(e.target.value)}
            className={getFieldClassName('cpf', 'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2')}
            placeholder="000.000.000-00"
            maxLength={14}
          />
          <ValidationIndicator field="cpf" />
          {getFieldError('cpf') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('cpf')?.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Telefone
          </label>
          <input
            id="phone"
            type="text"
            value={employee.phone ? formatPhone(employee.phone) : ''}
            onChange={(e) => handlePhoneChange(e.target.value)}
            className={getFieldClassName('phone', 'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2')}
            placeholder="(11) 99999-9999"
            maxLength={15}
          />
          <ValidationIndicator field="phone" />
          {getFieldError('phone') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('phone')?.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            id="email"
            type="email"
            value={employee.email || ''}
            onChange={(e) => handleEmailChange(e.target.value)}
            className={getFieldClassName('email', 'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2')}
            placeholder="email@exemplo.com"
          />
          <ValidationIndicator field="email" />
          {getFieldError('email') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('email')?.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="hire_date" className="block text-sm font-medium text-gray-700 mb-1">
            <Calendar className="inline h-4 w-4 mr-1" />
            Data de Contratação *
          </label>
          <input
            id="hire_date"
            type="date"
            value={employee.hire_date ? employee.hire_date.toISOString().split('T')[0] : ''}
            onChange={(e) => onUpdate('hire_date', new Date(e.target.value))}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              getFieldError('hire_date') ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {getFieldError('hire_date') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('hire_date')?.message}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label htmlFor="observations" className="block text-sm font-medium text-gray-700 mb-1">
            Observações
          </label>
          <textarea
            id="observations"
            value={employee.observations || ''}
            onChange={(e) => onUpdate('observations', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Observações adicionais sobre o funcionário (opcional)"
          />
        </div>
      </div>
    </div>
  );
};