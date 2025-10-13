/**
 * Contexto de Ambiente para React
 * Fornece acesso ao sistema de configuração de ambientes em toda a aplicação
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { environmentSystem, EnvironmentConfig, HealthCheckResult } from '../config';
import { environmentMiddleware } from '../middleware/environmentMiddleware';

interface EnvironmentContextType {
  config: EnvironmentConfig | null;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  healthStatus: HealthCheckResult | null;
  environment: 'development' | 'production' | null;
  
  // Ações
  initialize: () => Promise<void>;
  switchEnvironment: (env: 'development' | 'production') => Promise<void>;
  performHealthCheck: () => Promise<void>;
  getSystemInfo: () => Promise<any>;
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined);

interface EnvironmentProviderProps {
  children: React.ReactNode;
}

export const EnvironmentProvider: React.FC<EnvironmentProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<EnvironmentConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthCheckResult | null>(null);
  const [environment, setEnvironment] = useState<'development' | 'production' | null>(null);

  const initialize = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🚀 Inicializando sistema de ambientes...');
      const result = await environmentSystem.initialize();
      
      setConfig(result.config);
      setIsConnected(result.connectivity);
      setEnvironment(result.environment as 'development' | 'production');
      
      // Executa health check inicial se conectado
      if (result.connectivity) {
        try {
          const health = await environmentSystem.performHealthCheck();
          setHealthStatus(health);
        } catch (healthError) {
          console.warn('Health check inicial falhou:', healthError);
        }
      }
      
      console.log(`✅ Sistema de ambientes inicializado: ${result.environment}`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido na inicialização';
      console.error('❌ Erro na inicialização do sistema de ambientes:', err);
      setError(errorMessage);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const switchEnvironment = async (env: 'development' | 'production') => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Usa o middleware para troca de ambiente
      await environmentMiddleware.switchEnvironment(env);
      
      // Atualiza o estado local
      const config = await environmentSystem.getConfig();
      setConfig(config);
      setEnvironment(config.name as 'development' | 'production');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na troca de ambiente';
      console.error('❌ Erro na troca de ambiente:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const performHealthCheck = async () => {
    try {
      console.log('🔍 Executando health check...');
      const health = await environmentSystem.performHealthCheck();
      setHealthStatus(health);
      setIsConnected(health.overall.status !== 'unhealthy');
      console.log(`✅ Health check concluído: ${health.overall.status} (${health.overall.score}%)`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro no health check';
      console.error('❌ Erro no health check:', err);
      setError(errorMessage);
      setIsConnected(false);
      setHealthStatus(null);
    }
  };

  const getSystemInfo = async () => {
    try {
      return await environmentSystem.getSystemInfo();
    } catch (err) {
      console.error('❌ Erro ao obter informações do sistema:', err);
      throw err;
    }
  };

  // Inicialização automática
  useEffect(() => {
    initialize();
  }, []);

  const contextValue: EnvironmentContextType = {
    config,
    isLoading,
    error,
    isConnected,
    healthStatus,
    environment,
    initialize,
    switchEnvironment,
    performHealthCheck,
    getSystemInfo
  };

  return (
    <EnvironmentContext.Provider value={contextValue}>
      {children}
    </EnvironmentContext.Provider>
  );
};

// Hook para usar o contexto de ambiente
export const useEnvironmentContext = (): EnvironmentContextType => {
  const context = useContext(EnvironmentContext);
  if (context === undefined) {
    throw new Error('useEnvironmentContext deve ser usado dentro de um EnvironmentProvider');
  }
  return context;
};

// Hook simplificado para obter apenas a configuração
export const useEnvironmentConfig = () => {
  const { config, isLoading, error } = useEnvironmentContext();
  return { config, isLoading, error };
};

// Hook para monitoramento de conectividade
export const useConnectivity = () => {
  const { isConnected, healthStatus, performHealthCheck, isLoading } = useEnvironmentContext();
  return { isConnected, healthStatus, checkHealth: performHealthCheck, isLoading };
};