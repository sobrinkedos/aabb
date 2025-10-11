/**
 * Componente de Filtros Avançados para Funcionários
 * 
 * Permite filtrar funcionários por função, status, turno e busca textual
 */

import React from 'react';
import { Search, Filter, Grid, List, Calendar } from 'lucide-react';

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

interface EmployeeFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const ROLE_OPTIONS = [
  { value: 'all', label: 'Todas as Funções' },
  { value: 'atendente', label: 'Atendente' },
  { value: 'garcom', label: 'Garçom' },
  { value: 'cozinheiro', label: 'Cozinheiro' },
  { value: 'barman', label: 'Barman' },
  { value: 'gerente', label: 'Gerente' }
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos os Status' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
  { value: 'suspenso', label: 'Suspenso' }
];

const SHIFT_OPTIONS = [
  { value: 'all', label: 'Todos os Turnos' },
  { value: 'manha', label: 'Manhã' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'noite', label: 'Noite' },
  { value: 'qualquer', label: 'Qualquer' }
];

// ============================================================================
// COMPONENTE
// ============================================================================

export const EmployeeFilters: React.FC<EmployeeFiltersProps> = ({
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange
}) => {
  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      role: 'all',
      status: 'all',
      shift: 'all',
      dateRange: {
        start: '',
        end: ''
      }
    });
  };

  const hasActiveFilters = filters.search || 
    filters.role !== 'all' || 
    filters.status !== 'all' || 
    filters.shift !== 'all' ||
    filters.dateRange.start ||
    filters.dateRange.end;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="font-medium text-gray-900">Filtros</h3>
          {hasActiveFilters && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              Filtros ativos
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2 rounded ${
                viewMode === 'list' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 rounded ${
                viewMode === 'grid' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Buscar
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Nome, email ou telefone..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Role Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Função
          </label>
          <select
            value={filters.role}
            onChange={(e) => updateFilter('role', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {ROLE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {STATUS_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Shift Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Turno
          </label>
          <select
            value={filters.shift}
            onChange={(e) => updateFilter('shift', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {SHIFT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="border-t pt-4">
        <div className="flex items-center space-x-2 mb-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <label className="text-sm font-medium text-gray-700">
            Período de Contratação
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Data inicial
            </label>
            <input
              type="date"
              value={filters.dateRange.start}
              onChange={(e) => updateFilter('dateRange', {
                ...filters.dateRange,
                start: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Data final
            </label>
            <input
              type="date"
              value={filters.dateRange.end}
              onChange={(e) => updateFilter('dateRange', {
                ...filters.dateRange,
                end: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeFilters;