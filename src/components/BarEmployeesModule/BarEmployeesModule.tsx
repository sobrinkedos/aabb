/**
 * Módulo de Gerenciamento de Funcionários do Bar
 * 
 * Interface completa para visualizar, filtrar e gerenciar funcionários
 * com dashboard de estatísticas e filtros avançados.
 */

import React, { useState, useMemo } from 'react';
import { 
  Users, Search, Filter, Plus, BarChart3, 
  UserCheck, UserX, Clock, TrendingUp 
} from 'lucide-react';
import { useBarEmployees } from '../../hooks/useBarEmployees';
import { EmployeeFilters } from './EmployeeFilters';
import { EmployeeStats } from './EmployeeStats';
import { EmployeeList } from './EmployeeList';
import { EmployeeModal } from '../EmployeeModal/EmployeeModal';
import { EmployeeDetails } from '../EmployeeDetails/EmployeeDetails';

// ============================================================================
// INTERFACES
// ============================================================================

interface FilterState {
  search: string;
  role: string;
  status: string;
  shift: string;
  dateRange: {
    start: string;
    end: string;
  };
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const BarEmployeesModule: React.FC = () => {
  const {
    employees,
    loading,
    error,
    createEmployee,
    updateEmployee,
    deactivateEmployee,
    reactivateEmployee,
    getStats,
    refetch
  } = useBarEmployees();

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    role: 'all',
    status: 'all',
    shift: 'all',
    dateRange: {
      start: '',
      end: ''
    }
  });

  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showEmployeeDetails, setShowEmployeeDetails] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  // Filtrar funcionários baseado nos filtros ativos
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      const employeeData = employee.employee || employee.usuario_empresa;
      const name = employeeData?.name || employeeData?.nome_completo || '';
      const email = employeeData?.email || '';
      const phone = employeeData?.phone || employeeData?.telefone || '';

      const matchesSearch = !filters.search || 
        name.toLowerCase().includes(filters.search.toLowerCase()) ||
        email.toLowerCase().includes(filters.search.toLowerCase()) ||
        phone.includes(filters.search);

      const matchesRole = filters.role === 'all' || employee.bar_role === filters.role;
      const matchesStatus = filters.status === 'all' || 
        (filters.status === 'ativo' && employee.status === 'active') ||
        (filters.status === 'inativo' && employee.status === 'inactive');
      const matchesShift = filters.shift === 'all' || employee.shift_preference === filters.shift;

      // Filtro por data de contratação
      let matchesDateRange = true;
      if (filters.dateRange.start || filters.dateRange.end) {
        const startDate = employee.start_date ? new Date(employee.start_date) : null;
        if (startDate) {
          if (filters.dateRange.start) {
            const filterStart = new Date(filters.dateRange.start);
            matchesDateRange = matchesDateRange && startDate >= filterStart;
          }
          if (filters.dateRange.end) {
            const filterEnd = new Date(filters.dateRange.end);
            matchesDateRange = matchesDateRange && startDate <= filterEnd;
          }
        } else {
          matchesDateRange = false;
        }
      }

      return matchesSearch && matchesRole && matchesStatus && matchesShift && matchesDateRange;
    });
  }, [employees, filters]);

  const stats = useMemo(() => getStats(), [getStats]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Users className="h-8 w-8 text-blue-600" />
            <span>Funcionários</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie sua equipe e acompanhe estatísticas
          </p>
        </div>
        
        <button
          onClick={() => setShowEmployeeModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Novo Funcionário</span>
        </button>
      </div>

      {/* Stats Dashboard */}
      <EmployeeStats stats={stats} />

      {/* Filters */}
      <EmployeeFilters 
        filters={filters}
        onFiltersChange={setFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Employee List */}
      <EmployeeList
        employees={filteredEmployees}
        loading={loading}
        error={error}
        viewMode={viewMode}
        onEdit={(employee) => {
          setSelectedEmployee(employee);
          setShowEmployeeModal(true);
        }}
        onDeactivate={deactivateEmployee}
        onReactivate={reactivateEmployee}
        onViewDetails={(employee) => {
          setSelectedEmployeeId(employee.id);
          setShowEmployeeDetails(true);
        }}
      />

      {/* Employee Modal */}
      {showEmployeeModal && (
        <EmployeeModal
          isOpen={showEmployeeModal}
          onClose={() => {
            setShowEmployeeModal(false);
            setSelectedEmployee(null);
          }}
          employee={selectedEmployee}
          mode={selectedEmployee ? 'edit' : 'create'}
          onSave={async (employeeData) => {
            if (selectedEmployee) {
              await updateEmployee(selectedEmployee.id, employeeData);
            } else {
              await createEmployee(employeeData);
            }
            refetch();
          }}
        />
      )}

      {/* Employee Details Modal */}
      {showEmployeeDetails && selectedEmployeeId && (
        <EmployeeDetails
          employeeId={selectedEmployeeId}
          isOpen={showEmployeeDetails}
          onClose={() => {
            setShowEmployeeDetails(false);
            setSelectedEmployeeId(null);
          }}
          onEdit={(employee) => {
            setShowEmployeeDetails(false);
            setSelectedEmployeeId(null);
            setSelectedEmployee(employee);
            setShowEmployeeModal(true);
          }}
        />
      )}
      
    </div>
  );
};

export default BarEmployeesModule;