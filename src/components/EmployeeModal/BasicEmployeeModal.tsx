import React, { useState } from 'react';
import { X, Save, User } from 'lucide-react';

interface BasicEmployeeData {
  nome_completo: string;
  email: string;
  telefone?: string;
  cpf?: string;
  bar_role: string;
  cargo: string;
  observacoes?: string;
}

interface BasicEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: BasicEmployeeData) => Promise<void>;
}

export const BasicEmployeeModal: React.FC<BasicEmployeeModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [employee, setEmployee] = useState<BasicEmployeeData>({
    nome_completo: '',
    email: '',
    telefone: '',
    cpf: '',
    bar_role: 'caixa',
    cargo: 'Atendente de Caixa',
    observacoes: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const roles = [
    { value: 'caixa', label: 'Atendente de Caixa', cargo: 'Atendente de Caixa' },
    { value: 'garcom', label: 'Garçom', cargo: 'Garçom' },
    { value: 'cozinheiro', label: 'Cozinheiro', cargo: 'Cozinheiro' },
    { value: 'barman', label: 'Barman', cargo: 'Barman' },
    { value: 'gerente', label: 'Gerente', cargo: 'Gerente' },
    { value: 'atendente', label: 'Atendente', cargo: 'Atendente' }
  ];

  const handleRoleChange = (roleValue: string) => {
    const selectedRole = roles.find(r => r.value === roleValue);
    if (selectedRole) {
      setEmployee(prev => ({
        ...prev,
        bar_role: roleValue,
        cargo: selectedRole.cargo
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!employee.nome_completo.trim()) {
      newErrors.nome_completo = 'Nome completo é obrigatório';
    }

    if (!employee.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!employee.bar_role) {
      newErrors.bar_role = 'Função é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSave(employee);
      handleClose();
    } catch (error) {
      console.error('Erro ao salvar funcionário:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmployee({
      nome_completo: '',
      email: '',
      telefone: '',
      cpf: '',
      bar_role: 'caixa',
      cargo: 'Atendente de Caixa',
      observacoes: ''
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <User className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-medium text-gray-900">
                  Novo Funcionário
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Etapa 1:</strong> Cadastro básico do funcionário. 
                As credenciais de acesso serão criadas posteriormente através da edição.
              </p>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Nome Completo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={employee.nome_completo}
                  onChange={(e) => setEmployee(prev => ({ ...prev, nome_completo: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.nome_completo ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Digite o nome completo"
                />
                {errors.nome_completo && (
                  <p className="mt-1 text-sm text-red-600">{errors.nome_completo}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={employee.email}
                  onChange={(e) => setEmployee(prev => ({ ...prev, email: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Digite o email"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={employee.telefone}
                  onChange={(e) => setEmployee(prev => ({ ...prev, telefone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(00) 00000-0000"
                />
              </div>

              {/* CPF */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CPF
                </label>
                <input
                  type="text"
                  value={employee.cpf}
                  onChange={(e) => setEmployee(prev => ({ ...prev, cpf: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="000.000.000-00"
                />
              </div>

              {/* Função */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Função *
                </label>
                <select
                  value={employee.bar_role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.bar_role ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                {errors.bar_role && (
                  <p className="mt-1 text-sm text-red-600">{errors.bar_role}</p>
                )}
              </div>

              {/* Cargo (readonly) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cargo
                </label>
                <input
                  type="text"
                  value={employee.cargo}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                />
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={employee.observacoes}
                  onChange={(e) => setEmployee(prev => ({ ...prev, observacoes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Observações adicionais..."
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full inline-flex justify-center items-center space-x-2 rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Salvando...' : 'Salvar Funcionário'}</span>
            </button>
            <button
              onClick={handleClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};