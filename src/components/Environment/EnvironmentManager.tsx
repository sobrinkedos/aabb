/**
 * Componente de Gerenciamento de Ambiente
 * 
 * Interface visual para monitorar e gerenciar configurações de ambiente.
 * Permite alternar entre desenvolvimento e produção com validação.
 * 
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  Database, 
  GitBranch, 
  Settings, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Download,
  AlertTriangle,
  Info
} from 'lucide-react';
import { environmentManager, EnvironmentConfig, EnvironmentInfo } from '../../config/environment';
import { 
  useEnvironmentConfig, 
  generateEnvironmentReport, 
  saveEnvironmentReport 
} from '../../utils/environmentLoader';

// ============================================================================
// INTERFACES
// ============================================================================

interface EnvironmentManagerProps {
  /** Se deve mostrar informações detalhadas */
  showDetails?: boolean;
  
  /** Callback quando ambiente é alterado */
  onEnvironmentChange?: (environment: "development" | "production") => void;
  
  /** Classe CSS customizada */
  className?: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const EnvironmentManager: React.FC<EnvironmentManagerProps> = ({
  showDetails = true,
  onEnvironmentChange,
  className = ''
}) => {
  // Estados
  const [environmentInfo, setEnvironmentInfo] = useState<EnvironmentInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Hook de configuração
  const { environment, config, isValid, missingFields, debugInfo } = useEnvironmentConfig();

  // ============================================================================
  // EFEITOS
  // ============================================================================

  useEffect(() => {
    loadEnvironmentInfo();
  }, []);

  // ============================================================================
  // FUNÇÕES
  // ============================================================================

  const loadEnvironmentInfo = async () => {
    setLoading(true);
    try {
      const info = await environmentManager.getEnvironmentInfo();
      setEnvironmentInfo(info);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('❌ Erro ao carregar informações do ambiente:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchEnvironment = async (newEnv: "development" | "production") => {
    setSwitching(true);
    try {
      console.log(`🔄 Alternando para ambiente: ${newEnv}`);
      
      await environmentManager.switchEnvironment(newEnv);
      await loadEnvironmentInfo();
      
      if (onEnvironmentChange) {
        onEnvironmentChange(newEnv);
      }
      
      console.log(`✅ Ambiente alternado com sucesso: ${newEnv}`);
      
      // Recarrega a página para aplicar as novas configurações
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error(`❌ Erro ao alternar ambiente:`, error);
    } finally {
      setSwitching(false);
    }
  };

  const handleDownloadReport = () => {
    saveEnvironmentReport();
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderEnvironmentBadge = (envName: string) => {
    const isProduction = envName === 'production';
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
        isProduction 
          ? 'bg-red-100 text-red-700' 
          : 'bg-blue-100 text-blue-700'
      }`}>
        {isProduction ? '🔴 Produção' : '🟢 Desenvolvimento'}
      </span>
    );
  };

  const renderConnectionStatus = (connected: boolean) => {
    return (
      <div className={`flex items-center gap-2 ${
        connected ? 'text-green-600' : 'text-red-600'
      }`}>
        {connected ? (
          <CheckCircle className="w-4 h-4" />
        ) : (
          <XCircle className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">
          {connected ? 'Conectado' : 'Desconectado'}
        </span>
      </div>
    );
  };

  // ============================================================================
  // RENDER PRINCIPAL
  // ============================================================================

  return (
    <div className={`environment-manager ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Monitor className="w-6 h-6" />
            Gerenciador de Ambiente
          </h2>
          <p className="text-gray-600">
            Monitore e gerencie configurações de ambiente
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadReport}
            className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Relatório
          </button>

          <button
            onClick={loadEnvironmentInfo}
            disabled={loading}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Atual */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Info className="w-5 h-5" />
            Status Atual
          </h3>

          <div className="space-y-4">
            {/* Ambiente */}
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Ambiente:</span>
              {renderEnvironmentBadge(environment)}
            </div>

            {/* Branch Git */}
            <div className="flex items-center justify-between">
              <span className="text-gray-600 flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                Branch:
              </span>
              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                {config.gitBranch}
              </span>
            </div>

            {/* Database */}
            <div className="flex items-center justify-between">
              <span className="text-gray-600 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Database:
              </span>
              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                {config.databaseName}
              </span>
            </div>

            {/* Conectividade */}
            {environmentInfo && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Conectividade:</span>
                {renderConnectionStatus(environmentInfo.supabaseConnected)}
              </div>
            )}

            {/* Validação */}
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Configuração:</span>
              <div className={`flex items-center gap-2 ${
                isValid ? 'text-green-600' : 'text-red-600'
              }`}>
                {isValid ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {isValid ? 'Válida' : 'Inválida'}
                </span>
              </div>
            </div>

            {/* Última atualização */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Última atualização:</span>
              <span>{lastRefresh.toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Campos ausentes */}
          {!isValid && missingFields.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm font-medium mb-1">
                Campos obrigatórios ausentes:
              </p>
              <ul className="text-red-600 text-sm list-disc list-inside">
                {missingFields.map(field => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Controles de Ambiente */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Controles
          </h3>

          <div className="space-y-4">
            {/* Alternador de Ambiente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alternar Ambiente
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => switchEnvironment('development')}
                  disabled={switching || environment === 'development'}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    environment === 'development'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  } disabled:opacity-50`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">🟢</div>
                    <div className="text-sm font-medium">Desenvolvimento</div>
                  </div>
                </button>

                <button
                  onClick={() => switchEnvironment('production')}
                  disabled={switching || environment === 'production'}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    environment === 'production'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
                  } disabled:opacity-50`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">🔴</div>
                    <div className="text-sm font-medium">Produção</div>
                  </div>
                </button>
              </div>
            </div>

            {switching && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-700">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">
                    Alternando ambiente... A página será recarregada.
                  </span>
                </div>
              </div>
            )}

            {/* Informações de Debug */}
            {showDetails && config.debugMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Informações de Debug
                </label>
                <div className="bg-gray-50 rounded-lg p-3 text-xs font-mono">
                  <div>URL: {config.supabaseUrl}</div>
                  <div>Debug: {config.debugMode ? 'ON' : 'OFF'}</div>
                  <div>Log Level: {config.logLevel}</div>
                  <div>Timestamp: {debugInfo.timestamp}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detalhes Expandidos */}
      {showDetails && (
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Configuração Detalhada
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Configuração Atual */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Configuração Atual
              </h4>
              <div className="bg-gray-50 rounded-lg p-3 text-sm font-mono space-y-1">
                <div><span className="text-gray-600">Nome:</span> {config.name}</div>
                <div><span className="text-gray-600">URL:</span> {config.supabaseUrl}</div>
                <div><span className="text-gray-600">Database:</span> {config.databaseName}</div>
                <div><span className="text-gray-600">Branch:</span> {config.gitBranch}</div>
                <div><span className="text-gray-600">Debug:</span> {config.debugMode ? 'true' : 'false'}</div>
                <div><span className="text-gray-600">Log Level:</span> {config.logLevel}</div>
              </div>
            </div>

            {/* Informações do Sistema */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Informações do Sistema
              </h4>
              <div className="bg-gray-50 rounded-lg p-3 text-sm font-mono space-y-1">
                <div><span className="text-gray-600">User Agent:</span> {navigator.userAgent.substring(0, 50)}...</div>
                <div><span className="text-gray-600">Location:</span> {window.location.hostname}</div>
                <div><span className="text-gray-600">Protocol:</span> {window.location.protocol}</div>
                <div><span className="text-gray-600">Timestamp:</span> {new Date().toISOString()}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnvironmentManager;