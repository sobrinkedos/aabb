import React from 'react';
import { User, Calendar } from 'lucide-react';
import { Employee } from '../../types/employee.types';
import { formatCPF, formatPhone } from '../../utils/validationRules';
import { useEmployeeValidation } from '../../hooks/useEmployeeValidation';

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
  const getFieldError = (field: string) => {
    return errors.fields.find(error => error.field === field);
  };

  const handleCPFChange = (value: string) => {
    // Remove caracteres não numéricos e limita a 11 dígitos
    const cleanValue = value.replace(/\D/g, '').slice(0, 11);
    onUpdate('cpf', cleanValue);
  };

  const handlePhoneChange = (value: string) => {
    // Remove caracteres não numéricos e limita a 11 dígitos
    const cleanValue = value.replace(/\D/g, '').slice(0, 11);
    onUpdate('phone', cleanValue);
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
            onChange={(e) => onUpdate('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              getFieldError('name') ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Digite o nome completo"
          />
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
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              getFieldError('cpf') ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="000.000.000-00"
            maxLength={14}
          />
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
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              getFieldError('phone') ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="(11) 99999-9999"
            maxLength={15}
          />
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
            onChange={(e) => onUpdate('email', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              getFieldError('email') ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="email@exemplo.com"
          />
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