/**
 * Componente de Status do Modo Live
 * Mostra se o sistema está funcionando em modo live ou demo
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Zap, Database, RefreshCw } from 'lucide-react';
import { useEnvironmentContext } from '../../contexts/EnvironmentContext';
import { isSupabaseConfigured } from '../../lib/supabase';

export const LiveModeStatus: React.FC = () => {
  const { config, healthStatus, performHealthCheck, isLoading } = useEnvironmentContext();
  const [isLiveMode, setIsLiveMode] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Verifica se está em modo live
  useEffect(() => {
    const checkLiveMode = async () => {
      try {
        const configured = await isSupabaseConfigured();
        setIsLiveMode(configured && config?.name === 'production');
      } catch (error) {
        console.error('Erro ao verificar modo live:', error);
        setIsLiveMode(false);
      }
    };

    if (config) {
      checkLiveMode();
    }
  }, [config]);

  const handleCheck = async () => {
    setIsChecking(true);
    try {
      await performHealthCheck();
      const configured = await isSupabaseConfigured();
      setIsLiveMode(configured && config?.name === 'production');
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusInfo = () => {
    if (isLiveMode === null) {
      return {
        icon: <AlertTriangle className="text-yellow-500" size={24} />,
        title: 'Verificando Modo...',
        description: 'Detectando configuração do sistema',
        color: 'border-yellow-200 bg-yellow-50',
        textColor: 'text-yellow-800'
      };
    }

    if (isLiveMode) {
      return {
        icon: <CheckCircle className="text-green-500" size={24} />,
        title: 'Modo Live Ativo',
        description: 'Sistema funcionando com Supabase real',
        color: 'border-green-200 bg-green-50',
        textColor: 'text-green-800'
      };
    }

    return {
      icon: <XCircle className="text-blue-500" size={24} />,
      title: 'Modo Demonstração',
      description: 'Sistema funcionando com dados mock',
      color: 'border-blue-200 bg-blue-50',
      textColor: 'text-blue-800'
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`border rounded-lg p-4 ${statusInfo.color}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          {statusInfo.icon}
          <div>
            <h3 className={`font-semibold ${statusInfo.textColor}`}>
              {statusInfo.title}
            </h3>
            <p className="text-sm text-gray-600">
              {statusInfo.description}
            </p>
          </div>
        </div>

        <button
          onClick={handleCheck}
          disabled={isChecking || isLoading}
          className="flex items-center space-x-2 px-3 py-1 bg-white border rounded hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={14} className={isChecking ? 'animate-spin' : ''} />
          <span className="text-sm">Verificar</span>
        </button>
      </div>

      {/* Detalhes do Status */}
      {config && (
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Ambiente:</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              config.name === 'production' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
              {config.name === 'production' ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-600">Banco:</span>
            <span className="font-mono text-xs">{config.databaseName}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-600">Debug:</span>
            <span className={config.debugMode ? 'text-yellow-600' : 'text-green-600'}>
              {config.debugMode ? 'Ativo' : 'Inativo'}
            </span>
          </div>

          {healthStatus && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Conectividade:</span>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  healthStatus.overall.status === 'healthy' ? 'bg-green-500' :
                  healthStatus.overall.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-xs">{healthStatus.overall.score}%</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ações Específicas por Modo */}
      <div className="mt-4 pt-3 border-t">
        {isLiveMode ? (
          <div className="flex items-center space-x-2 text-sm text-green-700">
            <Database size={16} />
            <span>Sistema conectado ao Supabase real</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-sm text-blue-700">
            <Zap size={16} />
            <span>Sistema em modo demonstração</span>
          </div>
        )}
      </div>

      {/* Instruções para Ativar Modo Live */}
      {!isLiveMode && isLiveMode !== null && (
        <div className="mt-3 p-3 bg-white rounded border text-sm">
          <h4 className="font-medium text-gray-900 mb-2">Para Ativar Modo Live:</h4>
          <ol className="list-decimal list-inside space-y-1 text-gray-700">
            <li>Configure credenciais reais no .env.local</li>
            <li>Recarregue a página (Ctrl+F5)</li>
            <li>Verifique conectividade</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default LiveModeStatus;