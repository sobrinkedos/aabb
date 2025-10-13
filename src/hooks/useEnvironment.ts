/**
 * Hook React para Sistema de Ambientes
 * Facilita o uso do sistema de configuração de ambientes em componentes React
 */

import { useState, useEffect, useCallback } from 'react';
import { environmentSystem, EnvironmentConfig, HealthCheckResult } from '../config';

interface EnvironmentState {
  config: EnvironmentConfig | null;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  healthStatus: HealthCheckResult | null;
}

interface EnvironmentActions {
  initialize: () => Promise<void>;
  switchEnvironment: (env: 'development' | 'production') => Promise<void>;
  performHealthCheck: () => Promise<void>;
  getSystemInfo: () => Promise<any>;
}

export function useEnvironment(): EnvironmentState & EnvironmentActions {
  const [state, setState] = useState<EnvironmentState>({
    config: null,
    isLoading: true,
    error: null,
    isConnected: false,
    healthStatus: null
  });

  const updateState = useCallback((updates: Partial<EnvironmentState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const initialize = useCallback(async () => {
    try {
      updateState({ isLoading: true, error: null });
      
      const result = await environmentSystem.initialize();
      
      updateState({
        config: result.config,
        isConnected: result.connectivity,
        isLoading: false,
        error: null
      });
      
      // Executa health check inicial se conectado
      if (result.connectivity) {
        try {
          const healthStatus = await environmentSystem.performHealthCheck();
          updateState({ healthStatus });
        } catch (healthError) {
          console.warn('Health check falhou:', healthError);
        }
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      updateState({
        isLoading: false,
        error: errorMessage,
        isConnected: false
      });
    }
  }, [updateState]);

  const switchEnvironment = useCallback(async (env: 'development' | 'production') => {
    try {
      updateState({ isLoading: true, error: null });
      
      environmentSystem.switchEnvironment(env);
      await initialize();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro na troca de ambiente';
      updateState({
        isLoading: false,
        error: errorMessage
      });
    }
  }, [initialize, updateState]);

  const performHealthCheck = useCallback(async () => {
    try {
      const healthStatus = await environmentSystem.performHealthCheck();
      updateState({ 
        healthStatus,
        isConnected: healthStatus.overall.status !== 'unhealthy'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro no health check';
      updateState({ 
        error: errorMessage,
        isConnected: false,
        healthStatus: null
      });
    }
  }, [updateState]);

  const getSystemInfo = useCallback(async () => {
    try {
      return await environmentSystem.getSystemInfo();
    } catch (error) {
      console.error('Erro ao obter informações do sistema:', error);
      throw error;
    }
  }, []);

  // Inicialização automática
  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    ...state,
    initialize,
    switchEnvironment,
    performHealthCheck,
    getSystemInfo
  };
}

/**
 * Hook simplificado para obter apenas a configuração atual
 */
export function useEnvironmentConfig(): {
  config: EnvironmentConfig | null;
  isLoading: boolean;
  error: string | null;
} {
  const { config, isLoading, error } = useEnvironment();
  return { config, isLoading, error };
}

/**
 * Hook para monitoramento de conectividade
 */
export function useConnectivity(): {
  isConnected: boolean;
  healthStatus: HealthCheckResult | null;
  checkHealth: () => Promise<void>;
  isLoading: boolean;
} {
  const { isConnected, healthStatus, performHealthCheck, isLoading } = useEnvironment();
  
  return {
    isConnected,
    healthStatus,
    checkHealth: performHealthCheck,
    isLoading
  };
}