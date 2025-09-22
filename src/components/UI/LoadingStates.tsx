/**
 * Componentes de Estados de Loading
 * 
 * Estados de carregamento consistentes e acessíveis
 */

import React from 'react';
import { Loader2, Users, Search, AlertCircle } from 'lucide-react';

// ============================================================================
// LOADING SPINNER
// ============================================================================

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <Loader2 
      className={`animate-spin ${sizeClasses[size]} ${className}`}
      aria-label="Carregando"
    />
  );
};

// ============================================================================
// LOADING STATES
// ============================================================================

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = 'Carregando...', 
  size = 'md' 
}) => (
  <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
    <LoadingSpinner size={size} className="text-blue-600 mr-3" />
    <span className="text-gray-600">{message}</span>
  </div>
);

export const EmployeeListLoading: React.FC = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="w-16 h-6 bg-gray-200 rounded"></div>
        </div>
      </div>
    ))}
  </div>
);

export const StatsLoading: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-6 bg-gray-200 rounded w-12"></div>
          </div>
          <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    ))}
  </div>
);

// ============================================================================
// EMPTY STATES
// ============================================================================

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action
}) => (
  <div className="text-center py-12">
    {icon && (
      <div className="mx-auto mb-4 text-gray-400">
        {icon}
      </div>
    )}
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    {description && (
      <p className="text-gray-600 mb-4 max-w-sm mx-auto">{description}</p>
    )}
    {action}
  </div>
);

export const NoEmployeesFound: React.FC<{ onCreateNew?: () => void }> = ({ onCreateNew }) => (
  <EmptyState
    icon={<Users className="h-12 w-12" />}
    title="Nenhum funcionário encontrado"
    description="Comece adicionando o primeiro funcionário da sua equipe"
    action={onCreateNew && (
      <button
        onClick={onCreateNew}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Adicionar Funcionário
      </button>
    )}
  />
);

export const NoSearchResults: React.FC<{ searchTerm: string; onClearSearch?: () => void }> = ({ 
  searchTerm, 
  onClearSearch 
}) => (
  <EmptyState
    icon={<Search className="h-12 w-12" />}
    title="Nenhum resultado encontrado"
    description={`Não encontramos funcionários para "${searchTerm}"`}
    action={onClearSearch && (
      <button
        onClick={onClearSearch}
        className="text-blue-600 hover:text-blue-700"
      >
        Limpar busca
      </button>
    )}
  />
);

// ============================================================================
// ERROR STATES
// ============================================================================

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Ops! Algo deu errado',
  message,
  onRetry,
  onDismiss
}) => (
  <div className="text-center py-12">
    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 mb-4 max-w-sm mx-auto">{message}</p>
    <div className="flex justify-center space-x-3">
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Tentar novamente
        </button>
      )}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Dispensar
        </button>
      )}
    </div>
  </div>
);

export default LoadingSpinner;