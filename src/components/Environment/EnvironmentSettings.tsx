/**
 * Componente de Configurações de Ambiente
 * Permite visualizar e gerenciar configurações do sistema de ambientes
 */

import React, { useState } from 'react';
import { useEnvironmentContext } from '../../contexts/EnvironmentContext';
import { Database, RefreshCw, Settings, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import SupabaseConfigStatus from './SupabaseConfigStatus';

export const EnvironmentSettings: React.FC = () => {
  const {
    config,
    environment,
    isConnected,
    healthStatus,
    isLoading,
    error,
    switchEnvironment,
    performHealthCheck,
    getSystemInfo
  } = useEnvironmentContext();

  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [loadingSystemInfo, setLoadingSystemInfo] = useState(false);

  const handleHealthCheck = async () => {
    await performHealthCheck();
  };

  const handleSwitchEnvironment = async () => {
    const newEnv = environment === 'development' ? 'production' : 'development';
    if (window.confirm(`Tem certeza que deseja trocar para ${newEnv}?`)) {
      await switchEnvironment(newEnv);
    }
  };

  const handleGetSystemInfo = async () => {
    setLoadingSystemInfo(true);
    try {
      const info = await getSystemInfo();
      setSystemInfo(info);
    } catch (err) {
      console.error('Erro ao obter informações do sistema:', err);
    } finally {
      setLoadingSystemInfo(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="flex items-center space-x-2">
          <RefreshCw className="animate-spin" size={20} />
          <span>Carregando configurações...</span>
        </div>
      </div>
    );
  }

  if (error && !config) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center space-x-2 text-red-700">
          <AlertTriangle size={20} />
          <span>Erro: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status da Configuração Supabase */}
      <SupabaseConfigStatus />
      {/* Status Geral */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center space-x-2">
            <Settings size={24} />
            <span>Configurações de Ambiente</span>
          </h2>
          
          <div className="flex space-x-2">
            <button
              onClick={handleHealthCheck}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              <span>Verificar Saúde</span>
            </button>
            
            <button
              onClick={handleSwitchEnvironment}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
            >
              <Database size={16} />
              <span>Trocar Ambiente</span>
            </button>
          </div>
        </div>

        {/* Informações Básicas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Database size={20} className="text-blue-600" />
              <span className="font-medium">Ambiente Atual</span>
            </div>
            <div className={`text-lg font-bold ${
              environment === 'production' ? 'text-red-600' : 'text-green-600'
            }`}>
              {environment === 'production' ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              {isConnected ? (
                <CheckCircle size={20} className="text-green-600" />
              ) : (
                <XCircle size={20} className="text-red-600" />
              )}
              <span className="font-medium">Conectividade</span>
            </div>
            <div className={`text-lg font-bold ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? 'CONECTADO' : 'DESCONECTADO'}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Database size={20} className="text-purple-600" />
              <span className="font-medium">Banco de Dados</span>
            </div>
            <div className="text-lg font-bold text-purple-600">
              {config?.databaseName || 'N/A'}
            </div>
          </div>
        </div>

        {/* Configurações Detalhadas */}
        {config && (
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Configurações Detalhadas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">URL do Supabase:</span>
                <div className="font-mono bg-gray-100 p-2 rounded mt-1 break-all">
                  {config.supabaseUrl}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Chave Anônima:</span>
                <div className="font-mono bg-gray-100 p-2 rounded mt-1">
                  {config.supabaseAnonKey ? `${config.supabaseAnonKey.substring(0, 20)}...` : 'N/A'}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Modo Debug:</span>
                <div className={`font-medium mt-1 ${config.debugMode ? 'text-green-600' : 'text-gray-600'}`}>
                  {config.debugMode ? 'Ativo' : 'Inativo'}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Nível de Log:</span>
                <div className="font-medium mt-1 text-blue-600">
                  {config.logLevel.toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status de Saúde dos Serviços */}
      {healthStatus && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-4">Status dos Serviços</h3>
          
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Status Geral</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                healthStatus.overall.status === 'healthy' ? 'bg-green-100 text-green-800' :
                healthStatus.overall.status === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {healthStatus.overall.status.toUpperCase()} ({healthStatus.overall.score}%)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'Database', status: healthStatus.database },
              { name: 'Auth', status: healthStatus.auth },
              { name: 'Storage', status: healthStatus.storage },
              { name: 'Realtime', status: healthStatus.realtime }
            ].map(({ name, status }) => (
              <div key={name} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="font-medium">{name}</span>
                <div className="flex items-center space-x-2">
                  {status.isConnected ? (
                    <CheckCircle size={16} className="text-green-600" />
                  ) : (
                    <XCircle size={16} className="text-red-600" />
                  )}
                  <span className={`text-sm ${status.isConnected ? 'text-green-600' : 'text-red-600'}`}>
                    {status.isConnected ? 'OK' : 'Falha'}
                  </span>
                  {status.responseTime && (
                    <span className="text-xs text-gray-500">
                      ({status.responseTime}ms)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Informações do Sistema */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Informações do Sistema</h3>
          <button
            onClick={handleGetSystemInfo}
            disabled={loadingSystemInfo}
            className="flex items-center space-x-2 px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loadingSystemInfo ? 'animate-spin' : ''} />
            <span>Atualizar</span>
          </button>
        </div>

        {systemInfo ? (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Ambiente:</span>
              <span className="font-medium">{systemInfo.environment}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Branch Git:</span>
              <span className="font-mono">{systemInfo.branch}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Banco:</span>
              <span className="font-mono">{systemInfo.database}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Inicializado:</span>
              <span className={systemInfo.initialized ? 'text-green-600' : 'text-red-600'}>
                {systemInfo.initialized ? 'Sim' : 'Não'}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Clique em "Atualizar" para obter informações do sistema</p>
        )}
      </div>
    </div>
  );
};

export default EnvironmentSettings;