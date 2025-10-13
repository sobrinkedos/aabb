/**
 * Hook para monitoramento de performance integrado
 * Facilita o uso do sistema de performance em qualquer componente
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getPerformanceStats, cleanExpiredCache } from '../middleware/performanceMiddleware';

interface PerformanceMetrics {
  totalQueries: number;
  averageQueryTime: number;
  cacheHitRate: number;
  slowQueries: any[];
  errorRate: number;
}

interface UsePerformanceMonitorOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableAutoCleanup?: boolean;
  cleanupInterval?: number;
}

export const usePerformanceMonitor = (options: UsePerformanceMonitorOptions = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 5000, // 5 segundos
    enableAutoCleanup = true,
    cleanupInterval = 10 * 60 * 1000 // 10 minutos
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMonitorVisible, setIsMonitorVisible] = useState(false);

  const refreshIntervalRef = useRef<NodeJS.Timeout>();
  const cleanupIntervalRef = useRef<NodeJS.Timeout>();

  // Atualizar métricas
  const refreshMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const stats = getPerformanceStats();
      setMetrics(stats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao obter métricas';
      setError(errorMessage);
      console.error('Erro ao obter métricas de performance:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Configurar auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      // Refresh inicial
      refreshMetrics();
      
      // Configurar intervalo
      refreshIntervalRef.current = setInterval(refreshMetrics, refreshInterval);
      
      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, refreshMetrics]);

  // Configurar limpeza automática de cache
  useEffect(() => {
    if (enableAutoCleanup) {
      cleanupIntervalRef.current = setInterval(() => {
        const cleaned = cleanExpiredCache();
        if (cleaned > 0) {
          console.log(`🧹 Auto-cleanup: ${cleaned} itens expirados removidos`);
          // Atualizar métricas após limpeza
          refreshMetrics();
        }
      }, cleanupInterval);
      
      return () => {
        if (cleanupIntervalRef.current) {
          clearInterval(cleanupIntervalRef.current);
        }
      };
    }
  }, [enableAutoCleanup, cleanupInterval, refreshMetrics]);

  // Calcular status de saúde
  const healthStatus = useCallback(() => {
    if (!metrics) return 'unknown';
    
    const { averageQueryTime, cacheHitRate, errorRate, slowQueries } = metrics;
    
    // Crítico: muitos erros ou queries muito lentas
    if (errorRate > 10 || slowQueries.length > 10 || averageQueryTime > 2000) {
      return 'critical';
    }
    
    // Atenção: performance degradada
    if (errorRate > 5 || slowQueries.length > 5 || averageQueryTime > 1000 || cacheHitRate < 30) {
      return 'warning';
    }
    
    // Bom: performance aceitável
    if (averageQueryTime < 500 && cacheHitRate > 70 && errorRate < 2) {
      return 'excellent';
    }
    
    return 'good';
  }, [metrics]);

  // Obter recomendações baseadas nas métricas
  const getRecommendations = useCallback(() => {
    if (!metrics) return [];
    
    const recommendations: string[] = [];
    const { averageQueryTime, cacheHitRate, errorRate, slowQueries } = metrics;
    
    if (averageQueryTime > 1000) {
      recommendations.push('Otimize queries lentas - tempo médio muito alto');
    }
    
    if (cacheHitRate < 50) {
      recommendations.push('Aumente o uso de cache - taxa de acerto baixa');
    }
    
    if (errorRate > 5) {
      recommendations.push('Investigue erros frequentes - taxa de erro alta');
    }
    
    if (slowQueries.length > 5) {
      recommendations.push('Identifique e otimize queries mais lentas');
    }
    
    if (metrics.totalQueries > 1000 && cacheHitRate < 80) {
      recommendations.push('Considere implementar cache mais agressivo');
    }
    
    return recommendations;
  }, [metrics]);

  // Detectar problemas críticos
  const getCriticalIssues = useCallback(() => {
    if (!metrics) return [];
    
    const issues: string[] = [];
    const { averageQueryTime, errorRate, slowQueries } = metrics;
    
    if (errorRate > 10) {
      issues.push(`Taxa de erro crítica: ${errorRate.toFixed(1)}%`);
    }
    
    if (averageQueryTime > 2000) {
      issues.push(`Queries extremamente lentas: ${averageQueryTime.toFixed(0)}ms média`);
    }
    
    if (slowQueries.length > 10) {
      issues.push(`Muitas queries lentas: ${slowQueries.length} queries >1s`);
    }
    
    return issues;
  }, [metrics]);

  // Alternar visibilidade do monitor
  const toggleMonitor = useCallback(() => {
    setIsMonitorVisible(prev => !prev);
  }, []);

  // Mostrar monitor
  const showMonitor = useCallback(() => {
    setIsMonitorVisible(true);
  }, []);

  // Esconder monitor
  const hideMonitor = useCallback(() => {
    setIsMonitorVisible(false);
  }, []);

  // Verificar se há alertas
  const hasAlerts = useCallback(() => {
    const health = healthStatus();
    return health === 'critical' || health === 'warning';
  }, [healthStatus]);

  // Obter cor do status
  const getStatusColor = useCallback(() => {
    const health = healthStatus();
    switch (health) {
      case 'excellent': return 'green';
      case 'good': return 'blue';
      case 'warning': return 'yellow';
      case 'critical': return 'red';
      default: return 'gray';
    }
  }, [healthStatus]);

  // Obter ícone do status
  const getStatusIcon = useCallback(() => {
    const health = healthStatus();
    switch (health) {
      case 'excellent': return '🚀';
      case 'good': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '🚨';
      default: return '❓';
    }
  }, [healthStatus]);

  return {
    // Estado
    metrics,
    isLoading,
    error,
    isMonitorVisible,
    
    // Funções
    refreshMetrics,
    toggleMonitor,
    showMonitor,
    hideMonitor,
    
    // Análises
    healthStatus: healthStatus(),
    recommendations: getRecommendations(),
    criticalIssues: getCriticalIssues(),
    hasAlerts: hasAlerts(),
    statusColor: getStatusColor(),
    statusIcon: getStatusIcon(),
    
    // Métricas específicas (para fácil acesso)
    totalQueries: metrics?.totalQueries || 0,
    averageQueryTime: metrics?.averageQueryTime || 0,
    cacheHitRate: metrics?.cacheHitRate || 0,
    errorRate: metrics?.errorRate || 0,
    slowQueriesCount: metrics?.slowQueries?.length || 0
  };
};

export default usePerformanceMonitor;