import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { ComandaStatus } from '../../../types/bar-attendance';

interface ComandaFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: ComandaStatus | 'all';
  onStatusFilterChange: (status: ComandaStatus | 'all') => void;
  employeeFilter: string;
  onEmployeeFilterChange: (employeeId: string) => void;
  tableFilter: string;
  onTableFilterChange: (tableId: string) => void;
  timeFilter: 'all' | 'recent' | 'overdue' | 'critical';
  onTimeFilterChange: (filter: 'all' | 'recent' | 'overdue' | 'critical') => void;
  employees: Array<{ id: string; name: string }>;
  tables: Array<{ id: string; number: string }>;
  onClearFilters: () => void;
}

const ComandaFilters: React.FC<ComandaFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  employeeFilter,
  onEmployeeFilterChange,
  tableFilter,
  onTableFilterChange,
  timeFilter,
  onTimeFilterChange,
  employees,
  tables,
  onClearFilters
}) => {
  const hasActiveFilters = 
    searchTerm || 
    statusFilter !== 'all' || 
    employeeFilter || 
    tableFilter || 
    timeFilter !== 'all';

  const getStatusLabel = (status: ComandaStatus | 'all') => {
    switch (status) {
      case 'all': return 'Todos os Status';
      case 'open': return 'Abertas';
      case 'pending_payment': return 'Aguardando Pagamento';
      case 'closed': return 'Fechadas';
      case 'cancelled': return 'Canceladas';
      default: return status;
    }
  };

  const getTimeFilterLabel = (filter: string) => {
    switch (filter) {
      case 'all': return 'Todos os Tempos';
      case 'recent': return 'Recentes (< 1h)';
      case 'overdue': return 'Atrasadas (> 2h)';
      case 'critical': return 'Críticas (> 4h)';
      default: return filter;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Limpar Filtros</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Busca por texto */}
        <div className="xl:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Buscar
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Mesa, cliente ou funcionário..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filtro por Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as ComandaStatus | 'all')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos os Status</option>
            <option value="open">Abertas</option>
            <option value="pending_payment">Aguardando Pagamento</option>
            <option value="closed">Fechadas</option>
            <option value="cancelled">Canceladas</option>
          </select>
        </div>

        {/* Filtro por Funcionário */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Funcionário
          </label>
          <select
            value={employeeFilter}
            onChange={(e) => onEmployeeFilterChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos os Funcionários</option>
            {employees.map(employee => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por Mesa */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mesa
          </label>
          <select
            value={tableFilter}
            onChange={(e) => onTableFilterChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas as Mesas</option>
            <option value="balcao">Balcão</option>
            {tables.map(table => (
              <option key={table.id} value={table.id}>
                Mesa {table.number}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por Tempo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tempo
          </label>
          <select
            value={timeFilter}
            onChange={(e) => onTimeFilterChange(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos os Tempos</option>
            <option value="recent">Recentes (&lt; 1h)</option>
            <option value="overdue">Atrasadas (&gt; 2h)</option>
            <option value="critical">Críticas (&gt; 4h)</option>
          </select>
        </div>
      </div>

      {/* Indicadores de filtros ativos */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {searchTerm && (
            <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              Busca: "{searchTerm}"
              <button
                onClick={() => onSearchChange('')}
                className="ml-1 p-0.5 hover:bg-blue-200 rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {statusFilter !== 'all' && (
            <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              Status: {getStatusLabel(statusFilter)}
              <button
                onClick={() => onStatusFilterChange('all')}
                className="ml-1 p-0.5 hover:bg-green-200 rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {employeeFilter && (
            <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
              Funcionário: {employees.find(e => e.id === employeeFilter)?.name}
              <button
                onClick={() => onEmployeeFilterChange('')}
                className="ml-1 p-0.5 hover:bg-purple-200 rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {tableFilter && (
            <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
              Mesa: {tableFilter === 'balcao' ? 'Balcão' : tables.find(t => t.id === tableFilter)?.number}
              <button
                onClick={() => onTableFilterChange('')}
                className="ml-1 p-0.5 hover:bg-orange-200 rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {timeFilter !== 'all' && (
            <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
              Tempo: {getTimeFilterLabel(timeFilter)}
              <button
                onClick={() => onTimeFilterChange('all')}
                className="ml-1 p-0.5 hover:bg-red-200 rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ComandaFilters;