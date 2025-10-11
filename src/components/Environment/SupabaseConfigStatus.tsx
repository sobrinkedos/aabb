/**
 * Componente de Status da Configuração do Supabase
 * Mostra se as credenciais estão configuradas corretamente
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, ExternalLink, Copy, Check } from 'lucide-react';
import { useEnvironmentContext } from '../../contexts/EnvironmentContext';

export const SupabaseConfigStatus: React.FC = () => {
  const { config, healthStatus, performHealthCheck, isLoading } = useEnvironmentContext();
  const [isValidating, setIsValidating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Verifica se as configurações são válidas
  const isValidConfig = config && 
    config.supabaseUrl !== 'https://your-project-dev.supabase.co' &&
    config.supabaseUrl !== 'https://your-project-prod.supabase.co' &&
    config.supabaseUrl !== 'https://mock.supabase.co' &&
    config.supabaseAnonKey !== 'your_development_anon_key_here' &&
    config.supabaseAnonKey !== 'your_production_anon_key_here' &&
    config.supabaseAnonKey !== 'mock-anon-key';

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      await performHealthCheck();
    } finally {
      setIsValidating(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const getStatusIcon = () => {
    if (!isValidConfig) return <XCircle className="text-red-500" size={24} />;
    if (!healthStatus) return <AlertTriangle className="text-yellow-500" size={24} />;
    if (healthStatus.overall.status === 'healthy') return <CheckCircle className="text-green-500" size={24} />;
    if (healthStatus.overall.status === 'degraded') return <AlertTriangle className="text-yellow-500" size={24} />;
    return <XCircle className="text-red-500" size={24} />;
  };

  const getStatusText = () => {
    if (!isValidConfig) return 'Configuração Necessária';
    if (!healthStatus) return 'Validação Pendente';
    if (healthStatus.overall.status === 'healthy') return 'Configuração Perfeita';
    if (healthStatus.overall.status === 'degraded') return 'Configuração Parcial';
    return 'Configuração com Problemas';
  };

  const getStatusColor = () => {
    if (!isValidConfig) return 'border-red-200 bg-red-50';
    if (!healthStatus) return 'border-yellow-200 bg-yellow-50';
    if (healthStatus.overall.status === 'healthy') return 'border-green-200 bg-green-50';
    if (healthStatus.overall.status === 'degraded') return 'border-yellow-200 bg-yellow-50';
    return 'border-red-200 bg-red-50';
  };

  return (
    <div className={`border rounded-lg p-6 ${getStatusColor()}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Status da Configuração Supabase
            </h3>
            <p className="text-sm text-gray-600">{getStatusText()}</p>
          </div>
        </div>
        
        <button
          onClick={handleValidate}
          disabled={isValidating || isLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw size={16} className={isValidating ? 'animate-spin' : ''} />
          <span>Validar</span>
        </button>
      </div>

      {/* Status das Configurações */}
      {config && (
        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">URL do Projeto:</span>
              <div className="flex items-center space-x-2">
                {isValidConfig && config.supabaseUrl.includes('.supabase.co') ? (
                  <CheckCircle size={16} className="text-green-500" />
                ) : (
                  <XCircle size={16} className="text-red-500" />
                )}
                <span className="font-mono text-xs">
                  {config.supabaseUrl.length > 30 ? 
                    `${config.supabaseUrl.substring(0, 30)}...` : 
                    config.supabaseUrl
                  }
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Chave Anônima:</span>
              <div className="flex items-center space-x-2">
                {isValidConfig && config.supabaseAnonKey.length > 50 ? (
                  <CheckCircle size={16} className="text-green-500" />
                ) : (
                  <XCircle size={16} className="text-red-500" />
                )}
                <span className="font-mono text-xs">
                  {config.supabaseAnonKey.length > 20 ? 
                    `${config.supabaseAnonKey.substring(0, 20)}...` : 
                    config.supabaseAnonKey
                  }
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Chave de Serviço:</span>
              <div className="flex items-center space-x-2">
                {config.supabaseServiceRoleKey && 
                 config.supabaseServiceRoleKey !== 'mock-service-role-key' &&
                 config.supabaseServiceRoleKey.length > 50 ? (
                  <CheckCircle size={16} className="text-green-500" />
                ) : (
                  <AlertTriangle size={16} className="text-yellow-500" />
                )}
                <span className="font-mono text-xs">
                  {config.supabaseServiceRoleKey && config.supabaseServiceRoleKey.length > 20 ? 
                    `${config.supabaseServiceRoleKey.substring(0, 20)}...` : 
                    'Não configurada'
                  }
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Ambiente:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                config.name === 'production' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              }`}>
                {config.name === 'production' ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Status dos Serviços */}
      {healthStatus && (
        <div className="border-t pt-4 mb-4">
          <h4 className="font-medium text-gray-900 mb-3">Status dos Serviços</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: 'Database', status: healthStatus.database },
              { name: 'Auth', status: healthStatus.auth },
              { name: 'Storage', status: healthStatus.storage },
              { name: 'Realtime', status: healthStatus.realtime }
            ].map(({ name, status }) => (
              <div key={name} className="flex items-center space-x-2 p-2 bg-white rounded border">
                {status.isConnected ? (
                  <CheckCircle size={14} className="text-green-500" />
                ) : (
                  <XCircle size={14} className="text-red-500" />
                )}
                <div>
                  <div className="text-xs font-medium">{name}</div>
                  <div className="text-xs text-gray-500">
                    {status.isConnected ? `${status.responseTime}ms` : 'Falha'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instruções de Configuração */}
      {!isValidConfig && (
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Como Configurar:</h4>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center space-x-2">
              <span>1.</span>
              <span>Acesse o</span>
              <a 
                href="https://supabase.com/dashboard" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <span>Dashboard do Supabase</span>
                <ExternalLink size={12} />
              </a>
            </div>
            <div>2. Selecione seu projeto → Settings → API</div>
            <div>3. Configure o arquivo .env.local com suas credenciais:</div>
          </div>
          
          <div className="mt-3 bg-gray-800 text-green-400 p-3 rounded font-mono text-xs relative">
            <button
              onClick={() => copyToClipboard(`VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
VITE_SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role`, 'config')}
              className="absolute top-2 right-2 text-gray-400 hover:text-white"
              title="Copiar configuração"
            >
              {copiedField === 'config' ? <Check size={14} /> : <Copy size={14} />}
            </button>
            <pre>{`VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
VITE_SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role`}</pre>
          </div>
          
          <div className="mt-2 text-xs text-gray-600">
            4. Recarregue a página após configurar
          </div>
        </div>
      )}

      {/* Score Geral */}
      {healthStatus && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Score Geral:</span>
            <div className="flex items-center space-x-2">
              <div className={`w-16 h-2 rounded-full ${
                healthStatus.overall.score >= 80 ? 'bg-green-200' :
                healthStatus.overall.score >= 50 ? 'bg-yellow-200' : 'bg-red-200'
              }`}>
                <div 
                  className={`h-full rounded-full ${
                    healthStatus.overall.score >= 80 ? 'bg-green-500' :
                    healthStatus.overall.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${healthStatus.overall.score}%` }}
                />
              </div>
              <span className="text-sm font-medium">{healthStatus.overall.score}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupabaseConfigStatus;