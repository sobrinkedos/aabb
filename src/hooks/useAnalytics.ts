/**
 * Hook para Analytics de Funcionários
 * 
 * Facilita o uso do sistema de analytics em componentes React
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  employeeAnalytics, 
  EmployeeAnalytics,
  CreationMetrics,
  PerformanceMetrics,
  UsageMetrics,
  DistributionMetrics
} from '../utils/analytics';

// ============================================================================
// INTERFACES
// ============================================================================

interface UseAnalyticsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  trackPageViews?: boolean;
}

interface AnalyticsState {
  data: EmployeeAnalytics | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export const useAnalytics = (options: UseAnalyticsOptions = {}) => {
  const {
    autoRefresh = false,
    refreshInterval = 60000, // 1 minuto
    trackPageViews = true
  } = options;

  const [state, setState] = useState<AnalyticsState>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null
  });

  // ============================================================================
  // CARREGAMENTO DE DADOS
  // ============================================================================

  const loadAnalytics = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const analytics = employeeAnalytics.generateCompleteAnalytics();
      
      setState({
        data: analytics,
        loading: false,
        error: null,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro ao carregar analytics'
      }));
    }
  }, []);

  // ============================================================================
  // TRACKING DE EVENTOS
  // ============================================================================

  const trackEmployeeCreation = useCallback((data: {
    employeeId: string;
    role: string;
    source?: string;
    duration?: number;
    success: boolean;
    errors?: string[];
  }) => {
    const startTime = performance.now();
    
    employeeAnalytics.trackEmployeeCreation({
      ...data,
      source: data.source || 'manual',
      duration: data.duration || (performance.now() - startTime)
    });
    
    // Refresh analytics se auto-refresh estiver habilitado
    if (autoRefresh) {
      loadAnalytics();
    }
  }, [autoRefresh, loadAnalytics]);

  const trackValidationError = useCallback((data: {
    field: string;
    errorType: string;
    value?: string;
    employeeId?: string;
  }) => {
    employeeAnalytics.trackValidationError(data);
  }, []);

  const trackSystemAccess = useCallback((data: {
    userId: string;
    module: string;
    action: string;
    duration?: number;
    success?: boolean;
  }) => {
    employeeAnalytics.trackSystemAccess({
      ...data,
      success: data.success !== false
    });
  }, []);

  const trackPerformance = useCallback((data: {
    operation: string;
    duration: number;
    success?: boolean;
    retryCount?: number;
    cacheHit?: boolean;
  }) => {
    employeeAnalytics.trackPerformance({
      ...data,
      success: data.success !== false
    });
  }, []);

  // ============================================================================
  // MÉTRICAS ESPECÍFICAS
  // ============================================================================

  const getCreationMetrics = useCallback((period: 'day' | 'week' | 'month' = 'week'): CreationMetrics => {
    return employeeAnalytics.generateCreationMetrics(period);
  }, []);

  const getPerformanceMetrics = useCallback((): PerformanceMetrics => {
    return employeeAnalytics.generatePerformanceMetrics();
  }, []);

  const getUsageMetrics = useCallback((): UsageMetrics => {
    return employeeAnalytics.generateUsageMetrics();
  }, []);

  const getDistributionMetrics = useCallback((): DistributionMetrics => {
    return employeeAnalytics.generateDistributionMetrics();
  }, []);

  // ============================================================================
  // EFEITOS
  // ============================================================================

  // Carregar dados iniciais
  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(loadAnalytics, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadAnalytics]);

  // Track page view
  useEffect(() => {
    if (trackPageViews) {
      trackSystemAccess({
        userId: 'current_user', // Em um sistema real, seria o ID do usuário atual
        module: 'analytics',
        action: 'view',
        duration: 0
      });
    }
  }, [trackPageViews, trackSystemAccess]);

  // ============================================================================
  // UTILITÁRIOS
  // ============================================================================

  const refresh = useCallback(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const exportData = useCallback((format: 'json' | 'csv' = 'json') => {
    if (!state.data) return null;

    if (format === 'json') {
      return JSON.stringify(state.data, null, 2);
    }

    // Implementação básica de CSV
    if (format === 'csv') {
      const { creationMetrics } = state.data;
      let csv = 'Period,Count,Role,Percentage\n';
      
      creationMetrics.creationsByPeriod.forEach(item => {
        csv += `${item.period},${item.count},,\n`;
      });
      
      creationMetrics.creationsByRole.forEach(item => {
        csv += `,,${item.role},${item.percentage}\n`;
      });
      
      return csv;
    }

    return null;
  }, [state.data]);

  const downloadReport = useCallback((filename: string = 'employee-analytics', format: 'json' | 'csv' = 'json') => {
    const data = exportData(format);
    if (!data) return;

    const blob = new Blob([data], { 
      type: format === 'json' ? 'application/json' : 'text/csv' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportData]);

  return {
    // Estado
    ...state,
    
    // Ações
    refresh,
    trackEmployeeCreation,
    trackValidationError,
    trackSystemAccess,
    trackPerformance,
    
    // Métricas específicas
    getCreationMetrics,
    getPerformanceMetrics,
    getUsageMetrics,
    getDistributionMetrics,
    
    // Utilitários
    exportData,
    downloadReport
  };
};

// ============================================================================
// HOOK PARA MÉTRICAS EM TEMPO REAL
// ============================================================================

export const useRealTimeMetrics = (metricType: 'creation' | 'performance' | 'usage' | 'distribution') => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateMetrics = () => {
      setLoading(true);
      
      let data;
      switch (metricType) {
        case 'creation':
          data = employeeAnalytics.generateCreationMetrics();
          break;
        case 'performance':
          data = employeeAnalytics.generatePerformanceMetrics();
          break;
        case 'usage':
          data = employeeAnalytics.generateUsageMetrics();
          break;
        case 'distribution':
          data = employeeAnalytics.generateDistributionMetrics();
          break;
        default:
          data = null;
      }
      
      setMetrics(data);
      setLoading(false);
    };

    updateMetrics();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(updateMetrics, 30000);
    
    return () => clearInterval(interval);
  }, [metricType]);

  return { metrics, loading };
};

// ============================================================================
// HOOK PARA TRACKING AUTOMÁTICO
// ============================================================================

export const useAutoTracking = () => {
  const { trackSystemAccess, trackPerformance } = useAnalytics();

  // Track navigation
  useEffect(() => {
    const handleNavigation = () => {
      trackSystemAccess({
        userId: 'current_user',
        module: window.location.pathname.split('/')[1] || 'home',
        action: 'navigate'
      });
    };

    window.addEventListener('popstate', handleNavigation);
    return () => window.removeEventListener('popstate', handleNavigation);
  }, [trackSystemAccess]);

  // Track performance
  const trackOperation = useCallback((operation: string) => {
    const startTime = performance.now();
    
    return {
      end: (success: boolean = true) => {
        const duration = performance.now() - startTime;
        trackPerformance({
          operation,
          duration,
          success
        });
      }
    };
  }, [trackPerformance]);

  return {
    trackOperation
  };
};

export default useAnalytics;