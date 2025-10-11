/**
 * Botão flutuante para acesso rápido ao monitor de performance
 */

import React from 'react';
import { TrendingUpIcon } from 'lucide-react';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';

interface PerformanceFloatingButtonProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  showInProduction?: boolean;
}

const PerformanceFloatingButton: React.FC<PerformanceFloatingButtonProps> = ({
  position = 'bottom-left',
  showInProduction = false
}) => {
  const {
    toggleMonitor,
    hasAlerts,
    statusColor,
    statusIcon,
    totalQueries,
    cacheHitRate,
    averageQueryTime
  } = usePerformanceMonitor();

  // Não mostrar em produção por padrão
  if (!showInProduction && process.env.NODE_ENV === 'production') {
    return null;
  }

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  };

  const colorClasses = {
    green: 'bg-green-500 hover:bg-green-600',
    blue: 'bg-blue-500 hover:bg-blue-600',
    yellow: 'bg-yellow-500 hover:bg-yellow-600',
    red: 'bg-red-500 hover:bg-red-600',
    gray: 'bg-gray-500 hover:bg-gray-600'
  };

  return (
    <button
      onClick={toggleMonitor}
      className={`fixed ${positionClasses[position]} z-40 ${colorClasses[statusColor]} text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 group`}
      title={`Performance: ${statusIcon} | Queries: ${totalQueries} | Cache: ${cacheHitRate.toFixed(0)}% | Avg: ${averageQueryTime.toFixed(0)}ms`}
    >
      <TrendingUpIcon className="w-5 h-5" />
      
      {/* Badge de alerta */}
      {hasAlerts && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
      )}
      
      {/* Tooltip com métricas rápidas */}
      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        {statusIcon} Q:{totalQueries} C:{cacheHitRate.toFixed(0)}% T:{averageQueryTime.toFixed(0)}ms
      </div>
    </button>
  );
};

export default PerformanceFloatingButton;