/**
 * Componente de Status do Ambiente
 * Exibe informações sobre o ambiente atual e conectividade
 */

import React, { useState } from 'react';
import { useEnvironment } from '../hooks/useEnvironment';
import ConfigurationWarning from './Environment/ConfigurationWarning';

interface EnvironmentStatusProps {
  showDetails?: boolean;
  className?: string;
}

export const EnvironmentStatus: React.FC<EnvironmentStatusProps> = ({ 
  showDetails = false, 
  className = '' 
}) => {
  const {
    config,
    isLoading,
    error,
    isConnected,
    healthStatus,
    switchEnvironment,
    performHealthCheck
  } = useEnvironment();
  
  const [showConfigWarning, setShowConfigWarning] = useState(true);

  // Verifica se as configurações são placeholders
  const hasValidConfig = config && 
    config.supabaseUrl !== 'https://your-project-dev.supabase.co' &&
    config.supabaseUrl !== 'https://your-project-prod.supabase.co' &&
    config.supabaseAnonKey !== 'your_development_anon_key_here' &&
    config.supabaseAnonKey !== 'your_production_anon_key_here';

  if (isLoading) {
    return (
      <div className={`p-4 bg-gray-100 rounded-lg ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Carregando configuração do ambiente...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-100 border border-red-400 rounded-lg ${className}`}>
        <div className="flex items-center space-x-2">
          <span className="text-red-600">❌</span>
          <span className="text-red-800">Erro: {error}</span>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className={`p-4 bg-yellow-100 border border-yellow-400 rounded-lg ${className}`}>
        <span className="text-yellow-800">Configuração não disponível</span>
      </div>
    );
  }

  const getStatusColor = () => {
    if (!isConnected) return 'text-red-600';
    if (healthStatus?.overall.status === 'healthy') return 'text-green-600';
    if (healthStatus?.overall.status === 'degraded') return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = () => {
    if (!isConnected) return '❌';
    if (healthStatus?.overall.status === 'healthy') return '✅';
    if (healthStatus?.overall.status === 'degraded') return '⚠️';
    return '❌';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Aviso de Configuração */}
      {config && !hasValidConfig && showConfigWarning && (
        <ConfigurationWarning 
          environment={config.name}
          onDismiss={() => setShowConfigWarning(false)}
        />
      )}
      
      <div className="p-4 bg-white border rounded-lg shadow-sm">
      {/* Status Principal */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <span className="text-lg">{getStatusIcon()}</span>
          <div>
            <h3 className="font-semibold text-gray-900">
              Ambiente: {config.name === 'development' ? 'Desenvolvimento' : 'Produção'}
            </h3>
            <p className={`text-sm ${getStatusColor()}`}>
              {isConnected ? 'Conectado' : 'Desconectado'}
              {healthStatus && ` (${healthStatus.overall.score}%)`}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={performHealthCheck}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Verificar
          </button>
          
          <button
            onClick={() => switchEnvironment(
              config.name === 'development' ? 'production' : 'development'
            )}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Trocar
          </button>
        </div>
      </div>

      {/* Informações Básicas */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Banco:</span>
          <span className="ml-2 font-mono">{config.databaseName}</span>
        </div>
        <div>
          <span className="text-gray-600">Debug:</span>
          <span className="ml-2">{config.debugMode ? 'Ativo' : 'Inativo'}</span>
        </div>
      </div>

      {/* Detalhes Expandidos */}
      {showDetails && healthStatus && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="font-medium text-gray-900 mb-2">Status dos Serviços</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span>Database:</span>
              <span className={healthStatus.database.isConnected ? 'text-green-600' : 'text-red-600'}>
                {healthStatus.database.isConnected ? 'OK' : 'Falha'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Auth:</span>
              <span className={healthStatus.auth.isConnected ? 'text-green-600' : 'text-red-600'}>
                {healthStatus.auth.isConnected ? 'OK' : 'Falha'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Storage:</span>
              <span className={healthStatus.storage.isConnected ? 'text-green-600' : 'text-red-600'}>
                {healthStatus.storage.isConnected ? 'OK' : 'Falha'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Realtime:</span>
              <span className={healthStatus.realtime.isConnected ? 'text-green-600' : 'text-red-600'}>
                {healthStatus.realtime.isConnected ? 'OK' : 'Falha'}
              </span>
            </div>
          </div>
          
          {healthStatus.database.responseTime && (
            <div className="mt-2 text-xs text-gray-600">
              Tempo de resposta: {healthStatus.database.responseTime}ms
            </div>
          )}
        </div>
      )}

      {/* Debug Info */}
      {config.debugMode && showDetails && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="font-medium text-gray-900 mb-2">Informações de Debug</h4>
          <div className="text-xs text-gray-600 font-mono bg-gray-50 p-2 rounded">
            <div>URL: {config.supabaseUrl}</div>
            <div>Log Level: {config.logLevel}</div>
            <div>Mock Data: {config.enableMockData ? 'Habilitado' : 'Desabilitado'}</div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default EnvironmentStatus;