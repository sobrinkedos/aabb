/**
 * Componente de Monitoramento de Performance em Tempo Real
 * Exibe métricas de performance e permite otimizações
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUpIcon, 
  ClockIcon, 
  DatabaseIcon, 
  RefreshCwIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  BarChart3Icon,
  CacheIcon,
  ZapIcon
} from 'lucide-react';
import { 
  getPerformanceStats, 
  cleanCache, 
  cleanExpiredCache, 
  exportPerformanceMetrics 
} from '../../middleware/performanceMiddleware';

interface PerformanceMonitorProps {
  isOpen: boolean;
  onClose: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  isOpen,
  onClose,
  position = 'bottom-right'
}) => {
  const [stats, setStats] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Atualizar estatísticas
  const refreshStats = async () => {
    setIsRefreshing(true);
    try {
      const performanceStats = getPerformanceStats();
      setStats(performanceStats);
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh a cada 5 segundos
  useEffect(() => {
    if (isOpen && autoRefresh) {
      const interval = setInterval(refreshStats, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, autoRefresh]);

  // Refresh inicial
  useEffect(() => {
    if (isOpen) {
      refreshStats();
    }
  }, [isOpen]);

  // Calcular status geral
  const overallStatus = useMemo(() => {
    if (!stats) return 'loading';
    
    const { averageQueryTime, cacheHitRate, errorRate, slowQueries } = stats;
    
    if (errorRate > 5 || slowQueries.length > 5) return 'critical';
    if (averageQueryTime > 500 || cacheHitRate < 50) return 'warning';
    return 'good';
  }, [stats]);

  // Limpar cache
  const handleCleanCache = async (pattern?: string) => {
    const cleaned = cleanCache(pattern);
    console.log(`Cache limpo: ${cleaned} itens removidos`);
    refreshStats();
  };

  // Limpar cache expirado
  const handleCleanExpiredCache = async () => {
    const cleaned = cleanExpiredCache();
    console.log(`Cache expirado limpo: ${cleaned} itens removidos`);
    refreshStats();
  };

  // Exportar métricas
  const handleExportMetrics = () => {
    const metrics = exportPerformanceMetrics();
    const blob = new Blob([JSON.stringify(metrics, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  };

  const statusColors = {
    loading: 'bg-gray-100 text-gray-600',
    good: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    critical: 'bg-red-100 text-red-700'
  };

  const statusIcons = {
    loading: RefreshCwIcon,
    good: CheckCircleIcon,
    warning: AlertTriangleIcon,
    critical: XCircleIcon
  };

  const StatusIcon = statusIcons[overallStatus];

  return (
    <div className={`fixed ${positionClasses[position]} z-50 w-96 bg-white rounded-lg shadow-2xl border border-gray-200`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <TrendingUpIcon className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Performance Monitor</h3>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[overallStatus]}`}>
            <StatusIcon className="w-3 h-3 inline mr-1" />
            {overallStatus === 'loading' ? 'Carregando...' : 
             overallStatus === 'good' ? 'Ótimo' :
             overallStatus === 'warning' ? 'Atenção' : 'Crítico'}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-1 rounded ${autoRefresh ? 'text-green-600' : 'text-gray-400'}`}
            title={autoRefresh ? 'Auto-refresh ativo' : 'Auto-refresh inativo'}
          >
            <RefreshCwIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <XCircleIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {!stats ? (
          <div className="text-center py-8">
            <RefreshCwIcon className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500">Carregando estatísticas...</p>
          </div>
        ) : (
          <>
            {/* Métricas Principais */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <DatabaseIcon className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Queries</span>
                </div>
                <p className="text-lg font-bold text-blue-700">{stats.totalQueries}</p>
                <p className="text-xs text-blue-600">{stats.averageQueryTime.toFixed(1)}ms média</p>
              </div>

              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CacheIcon className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Cache</span>
                </div>
                <p className="text-lg font-bold text-green-700">{stats.cacheHitRate.toFixed(1)}%</p>
                <p className="text-xs text-green-600">Taxa de acerto</p>
              </div>

              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-900">Lentas</span>
                </div>
                <p className="text-lg font-bold text-yellow-700">{stats.slowQueries.length}</p>
                <p className="text-xs text-yellow-600">&gt;1s</p>
              </div>

              <div className="bg-red-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangleIcon className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-900">Erros</span>
                </div>
                <p className="text-lg font-bold text-red-700">{stats.errorRate.toFixed(1)}%</p>
                <p className="text-xs text-red-600">Taxa de erro</p>
              </div>
            </div>

            {/* Queries Lentas */}
            {stats.slowQueries.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Queries Lentas</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {stats.slowQueries.slice(0, 5).map((query: any, index: number) => (
                    <div key={index} className="bg-red-50 p-2 rounded text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-red-900 truncate">{query.query}</span>
                        <span className="text-red-700">{query.duration.toFixed(0)}ms</span>
                      </div>
                      {query.error && (
                        <p className="text-red-600 mt-1 truncate">{query.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Ações de Otimização</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleCleanExpiredCache()}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                >
                  <ZapIcon className="w-3 h-3 inline mr-1" />
                  Limpar Expirado
                </button>
                
                <button
                  onClick={() => handleCleanCache()}
                  className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded text-xs hover:bg-yellow-200 transition-colors"
                >
                  <RefreshCwIcon className="w-3 h-3 inline mr-1" />
                  Limpar Cache
                </button>
                
                <button
                  onClick={refreshStats}
                  className="px-3 py-2 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors"
                >
                  <BarChart3Icon className="w-3 h-3 inline mr-1" />
                  Atualizar
                </button>
                
                <button
                  onClick={handleExportMetrics}
                  className="px-3 py-2 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200 transition-colors"
                >
                  <DatabaseIcon className="w-3 h-3 inline mr-1" />
                  Exportar
                </button>
              </div>
            </div>

            {/* Recomendações */}
            {overallStatus !== 'good' && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Recomendações</h4>
                <div className="space-y-1 text-xs">
                  {stats.averageQueryTime > 500 && (
                    <div className="bg-yellow-50 p-2 rounded text-yellow-800">
                      • Queries muito lentas - considere otimizar índices
                    </div>
                  )}
                  {stats.cacheHitRate < 50 && (
                    <div className="bg-blue-50 p-2 rounded text-blue-800">
                      • Taxa de cache baixa - aumente TTL ou use mais cache
                    </div>
                  )}
                  {stats.errorRate > 5 && (
                    <div className="bg-red-50 p-2 rounded text-red-800">
                      • Muitos erros - verifique conectividade e queries
                    </div>
                  )}
                  {stats.slowQueries.length > 5 && (
                    <div className="bg-orange-50 p-2 rounded text-orange-800">
                      • Muitas queries lentas - otimize as consultas mais usadas
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PerformanceMonitor;