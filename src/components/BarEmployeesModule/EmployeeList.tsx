/**
 * Lista de Funcionários com Visualizações Grid e List
 * 
 * Componente para exibir funcionários em diferentes formatos
 * com ações de gerenciamento
 */

import React, { useState } from 'react';
import { 
  Edit, Trash2, UserCheck, UserX, Phone, Mail, 
  Calendar, Clock, Shield, MoreVertical, Eye 
} from 'lucide-react';
import { DeactivationModal } from '../EmployeeLifecycle/DeactivationModal';
import { ReactivationModal } from '../EmployeeLifecycle/ReactivationModal';

// ============================================================================
// INTERFACES
// ============================================================================

interface Employee {
  id: string;
  employee_id?: string;
  bar_role: string;
  shift_preference?: string;
  specialties?: string[];
  commission_rate?: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  notes?: string;
  status: string;
  employee?: {
    name: string;
    email?: string;
    phone?: string;
    avatar?: string;
  };
  usuario_empresa?: {
    nome_completo: string;
    email: string;
    telefone?: string;
    cargo: string;
    tem_acesso_sistema: boolean;
  };
}

interface EmployeeListProps {
  employees: Employee[];
  loading: boolean;
  error: string | null;
  viewMode: 'grid' | 'list';
  onEdit: (employee: Employee) => void;
  onDeactivate: (employeeId: string) => void;
  onReactivate: (employeeId: string) => void;
  onResetPassword?: (employeeId: string) => void;
  onViewDetails?: (employee: Employee) => void;
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

const LoadingState: React.FC = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-gray-600">Carregando funcionários...</span>
  </div>
);

const ErrorState: React.FC<{ error: string }> = ({ error }) => (
  <div className="text-center py-12">
    <div className="text-red-600 mb-2">Erro ao carregar funcionários</div>
    <div className="text-sm text-gray-500">{error}</div>
  </div>
);

const EmptyState: React.FC = () => (
  <div className="text-center py-12">
    <div className="text-gray-500 mb-2">Nenhum funcionário encontrado</div>
    <div className="text-sm text-gray-400">
      Tente ajustar os filtros ou adicione um novo funcionário
    </div>
  </div>
);

// ============================================================================
// COMPONENTE DE CARD (GRID VIEW)
// ============================================================================

interface EmployeeCardProps {
  employee: Employee;
  onEdit: (employee: Employee) => void;
  onDeactivate: () => void;
  onReactivate: () => void;
  onResetPassword?: () => void;
  onViewDetails?: (employee: Employee) => void;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee,
  onEdit,
  onDeactivate,
  onReactivate,
  onResetPassword,
  onViewDetails
}) => {
  const employeeData = employee.employee || employee.usuario_empresa;
  const name = employeeData?.name || employeeData?.nome_completo || 'Nome não informado';
  const email = employeeData?.email || 'Email não informado';
  const phone = employeeData?.phone || employeeData?.telefone;
  
  const roleLabels: Record<string, string> = {
    'atendente': 'Atendente',
    'garcom': 'Garçom',
    'cozinheiro': 'Cozinheiro',
    'barman': 'Barman',
    'gerente': 'Gerente'
  };

  const shiftLabels: Record<string, string> = {
    'manha': 'Manhã',
    'tarde': 'Tarde',
    'noite': 'Noite',
    'qualquer': 'Qualquer'
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-medium text-sm">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{name}</h3>
            <p className="text-sm text-gray-500">
              {roleLabels[employee.bar_role] || employee.bar_role}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          {employee.is_active || employee.status === 'active' ? (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              Ativo
            </span>
          ) : (
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
              Inativo
            </span>
          )}
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Mail className="h-4 w-4" />
          <span className="truncate">{email}</span>
        </div>
        {phone && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Phone className="h-4 w-4" />
            <span>{phone}</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        {employee.shift_preference && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>Turno: {shiftLabels[employee.shift_preference] || employee.shift_preference}</span>
          </div>
        )}
        {employee.start_date && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Desde: {new Date(employee.start_date).toLocaleDateString('pt-BR')}</span>
          </div>
        )}
        {employee.usuario_empresa?.tem_acesso_sistema && (
          <div className="flex items-center space-x-2 text-sm text-green-600">
            <Shield className="h-4 w-4" />
            <span>Acesso ao sistema</span>
          </div>
        )}
      </div>

      {/* Specialties */}
      {employee.specialties && employee.specialties.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {employee.specialties.slice(0, 3).map((specialty, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
              >
                {specialty}
              </span>
            ))}
            {employee.specialties.length > 3 && (
              <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded">
                +{employee.specialties.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(employee)}
              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-700"
            >
              <Eye className="h-4 w-4" />
              <span>Ver</span>
            </button>
          )}
          <button
            onClick={() => onEdit(employee)}
            className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <Edit className="h-4 w-4" />
            <span>Editar</span>
          </button>
          {onResetPassword && (
            <button
              onClick={onResetPassword}
              className="flex items-center space-x-1 text-sm text-orange-600 hover:text-orange-700"
              title="Gerar nova senha"
            >
              <Shield className="h-4 w-4" />
              <span>Nova Senha</span>
            </button>
          )}
        </div>
        
        {employee.is_active || employee.status === 'active' ? (
          <button
            onClick={onDeactivate}
            className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700"
          >
            <UserX className="h-4 w-4" />
            <span>Desativar</span>
          </button>
        ) : (
          <button
            onClick={onReactivate}
            className="flex items-center space-x-1 text-sm text-green-600 hover:text-green-700"
          >
            <UserCheck className="h-4 w-4" />
            <span>Reativar</span>
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE DE LINHA (LIST VIEW)
// ============================================================================

interface EmployeeRowProps {
  employee: Employee;
  onEdit: (employee: Employee) => void;
  onDeactivate: () => void;
  onReactivate: () => void;
  onViewDetails?: (employee: Employee) => void;
}

const EmployeeRow: React.FC<EmployeeRowProps> = ({
  employee,
  onEdit,
  onDeactivate,
  onReactivate,
  onViewDetails
}) => {
  const employeeData = employee.employee || employee.usuario_empresa;
  const name = employeeData?.name || employeeData?.nome_completo || 'Nome não informado';
  const email = employeeData?.email || 'Email não informado';
  const phone = employeeData?.phone || employeeData?.telefone;
  
  const roleLabels: Record<string, string> = {
    'atendente': 'Atendente',
    'garcom': 'Garçom',
    'cozinheiro': 'Cozinheiro',
    'barman': 'Barman',
    'gerente': 'Gerente'
  };

  const shiftLabels: Record<string, string> = {
    'manha': 'Manhã',
    'tarde': 'Tarde',
    'noite': 'Noite',
    'qualquer': 'Qualquer'
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <span className="text-blue-600 font-medium text-sm">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{name}</div>
            <div className="text-sm text-gray-500">{email}</div>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-900">
          {roleLabels[employee.bar_role] || employee.bar_role}
        </span>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-900">
          {employee.shift_preference ? 
            (shiftLabels[employee.shift_preference] || employee.shift_preference) : 
            'N/A'
          }
        </span>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-900">
          {phone || 'N/A'}
        </span>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        {employee.is_active || employee.status === 'active' ? (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
            Ativo
          </span>
        ) : (
          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
            Inativo
          </span>
        )}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        {employee.usuario_empresa?.tem_acesso_sistema ? (
          <Shield className="h-4 w-4 text-green-500" />
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center space-x-2">
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(employee)}
              className="text-gray-600 hover:text-gray-700"
              title="Ver detalhes"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => onEdit(employee)}
            className="text-blue-600 hover:text-blue-700"
            title="Editar"
          >
            <Edit className="h-4 w-4" />
          </button>
          
          {employee.is_active || employee.status === 'active' ? (
            <button
              onClick={onDeactivate}
              className="text-red-600 hover:text-red-700"
              title="Desativar"
            >
              <UserX className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={onReactivate}
              className="text-green-600 hover:text-green-700"
              title="Reativar"
            >
              <UserCheck className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const EmployeeList: React.FC<EmployeeListProps> = ({
  employees,
  loading,
  error,
  viewMode,
  onEdit,
  onDeactivate,
  onReactivate,
  onResetPassword,
  onViewDetails
}) => {
  const [showDeactivationModal, setShowDeactivationModal] = useState(false);
  const [showReactivationModal, setShowReactivationModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const handleDeactivate = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowDeactivationModal(true);
  };

  const handleReactivate = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowReactivationModal(true);
  };

  const handleModalComplete = () => {
    // Refresh the list by calling the parent's refresh function
    window.location.reload(); // Simple refresh for now
  };
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (employees.length === 0) return <EmptyState />;

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map(employee => (
          <EmployeeCard
            key={employee.id}
            employee={employee}
            onEdit={onEdit}
            onDeactivate={() => handleDeactivate(employee)}
            onReactivate={() => handleReactivate(employee)}
            onResetPassword={onResetPassword ? () => onResetPassword(employee.id) : undefined}
            onViewDetails={onViewDetails}
          />
        ))}

        {/* Modals */}
        {showDeactivationModal && selectedEmployee && (
          <DeactivationModal
            employee={selectedEmployee}
            isOpen={showDeactivationModal}
            onClose={() => {
              setShowDeactivationModal(false);
              setSelectedEmployee(null);
            }}
            onComplete={handleModalComplete}
          />
        )}

        {showReactivationModal && selectedEmployee && (
          <ReactivationModal
            employee={selectedEmployee}
            isOpen={showReactivationModal}
            onClose={() => {
              setShowReactivationModal(false);
              setSelectedEmployee(null);
            }}
            onComplete={handleModalComplete}
          />
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Funcionário
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Função
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Turno
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Telefone
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Sistema
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {employees.map(employee => (
            <EmployeeRow
              key={employee.id}
              employee={employee}
              onEdit={onEdit}
              onDeactivate={onDeactivate}
              onReactivate={onReactivate}
              onViewDetails={onViewDetails}
            />
          ))}
        </tbody>
      </table>

      {/* Modals */}
      {showDeactivationModal && selectedEmployee && (
        <DeactivationModal
          employee={selectedEmployee}
          isOpen={showDeactivationModal}
          onClose={() => {
            setShowDeactivationModal(false);
            setSelectedEmployee(null);
          }}
          onComplete={handleModalComplete}
        />
      )}

      {showReactivationModal && selectedEmployee && (
        <ReactivationModal
          employee={selectedEmployee}
          isOpen={showReactivationModal}
          onClose={() => {
            setShowReactivationModal(false);
            setSelectedEmployee(null);
          }}
          onComplete={handleModalComplete}
        />
      )}
    </div>
  );
};

export default EmployeeList;