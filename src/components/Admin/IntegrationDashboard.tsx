import React, { useState, useEffect } from 'react';
import { useIntegrations } from '../../hooks/useIntegrations';
import { APIConfigForm } from './APIConfigForm';
import { ConnectionTester } from './ConnectionTester';
import { DataMappingEditor } from './DataMappingEditor';
import { Integration, IntegrationType, ConnectionStatus } from '../../types/integrations';

interface IntegrationDashboardProps {
  className?: string;
}

export const IntegrationDashboard: React.FC<IntegrationDashboardProps> = ({ className }) => {
  const {
    integrations,
    isLoading,
    error,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    testConnection,
    syncData,
    getIntegrationLogs
  } = useIntegrations();

  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [showTester, setShowTester] = useState(false);
  const [showMapping, setShowMapping] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'settings'>('overview');

  const getStatusColor = (status: ConnectionStatus): string => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'disconnected': return 'bg-red-100 text-red-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'testing': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: ConnectionStatus): string => {
    switch (status) {
      case 'connected': return 'Conectado';
      case 'disconnected': return 'Desconectado';
      case 'error': return 'Erro';
      case 'testing': return 'Testando';
      default: return 'Inativo';
    }
  };

  const getTypeDisplayName = (type: IntegrationType): string => {
    const names: Record<IntegrationType, string> = {
      'webhook': 'Webhook',
      'api_rest': 'API REST',
      'database': 'Banco de Dados',
      'file_sync': 'Sincronização de Arquivos',
      'email': 'Email/SMTP',
      'payment': 'Gateway de Pagamento',
      'erp': 'Sistema ERP',
      'crm': 'Sistema CRM'
    };
    return names[type] || type;
  };

  const handleTestConnection = async (integration: Integration) => {
    try {
      const result = await testConnection(integration.id);
      if (result.success) {
        alert('Conexão testada com sucesso!');
      } else {
        alert(`Erro na conexão: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      alert('Erro ao testar conexão');
    }
  };

  const handleSyncData = async (integration: Integration) => {
    try {
      const result = await syncData(integration.id);
      if (result.success) {
        alert(`Sincronização concluída! ${result.recordsProcessed} registros processados.`);
      } else {
        alert(`Erro na sincronização: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro ao sincronizar dados:', error);
      alert('Erro ao sincronizar dados');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Erro: {error}</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Integrações Externas</h2>
            <p className="text-sm text-gray-600 mt-1">
              Gerencie conexões com sistemas externos
            </p>
          </div>
          <button
            onClick={() => setShowConfigForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Nova Integração
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Ativas</p>
                <p className="text-2xl font-semibold text-green-600">
                  {integrations.filter(i => i.status === 'connected').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Com Erro</p>
                <p className="text-2xl font-semibold text-red-600">
                  {integrations.filter(i => i.status === 'error').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Total</p>
                <p className="text-2xl font-semibold text-blue-600">{integrations.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Última Sync</p>
                <p className="text-sm font-semibold text-yellow-600">
                  {integrations.length > 0 
                    ? new Date(Math.max(...integrations.map(i => new Date(i.lastSync || 0).getTime()))).toLocaleDateString('pt-BR')
                    : 'Nunca'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Integrations List */}
      <div className="p-6">
        <div className="space-y-4">
          {integrations.map(integration => (
            <div key={integration.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{integration.name}</h3>
                    <p className="text-sm text-gray-600">{getTypeDisplayName(integration.type)}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(integration.status)}`}>
                        {getStatusText(integration.status)}
                      </span>
                      {integration.lastSync && (
                        <span className="text-xs text-gray-500">
                          Última sync: {new Date(integration.lastSync).toLocaleString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleTestConnection(integration)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Testar
                  </button>
                  <button
                    onClick={() => handleSyncData(integration)}
                    disabled={integration.status !== 'connected'}
                    className="text-green-600 hover:text-green-800 text-sm font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    Sincronizar
                  </button>
                  <button
                    onClick={() => {
                      setSelectedIntegration(integration);
                      setShowConfigForm(true);
                    }}
                    className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                  >
                    Configurar
                  </button>
                  <button
                    onClick={() => {
                      setSelectedIntegration(integration);
                      setShowMapping(true);
                    }}
                    className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                  >
                    Mapeamento
                  </button>
                </div>
              </div>

              {/* Error Log */}
              {integration.errorLog && integration.errorLog.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 rounded-md">
                  <h4 className="text-sm font-medium text-red-800 mb-2">Últimos Erros:</h4>
                  <div className="space-y-1">
                    {integration.errorLog.slice(0, 3).map((error, index) => (
                      <div key={index} className="text-xs text-red-700">
                        <span className="font-medium">{new Date(error.timestamp).toLocaleString('pt-BR')}:</span> {error.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {integrations.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma integração configurada</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Comece criando sua primeira integração com sistemas externos
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowConfigForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Nova Integração
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showConfigForm && (
        <APIConfigForm
          integration={selectedIntegration}
          onSave={async (data) => {
            if (selectedIntegration) {
              await updateIntegration(selectedIntegration.id, data);
            } else {
              await createIntegration(data);
            }
            setShowConfigForm(false);
            setSelectedIntegration(null);
          }}
          onCancel={() => {
            setShowConfigForm(false);
            setSelectedIntegration(null);
          }}
        />
      )}

      {showTester && selectedIntegration && (
        <ConnectionTester
          integration={selectedIntegration}
          onClose={() => {
            setShowTester(false);
            setSelectedIntegration(null);
          }}
        />
      )}

      {showMapping && selectedIntegration && (
        <DataMappingEditor
          integration={selectedIntegration}
          onSave={async (mapping) => {
            await updateIntegration(selectedIntegration.id, { 
              config: { 
                ...selectedIntegration.config, 
                dataMapping: mapping 
              } 
            });
            setShowMapping(false);
            setSelectedIntegration(null);
          }}
          onCancel={() => {
            setShowMapping(false);
            setSelectedIntegration(null);
          }}
        />
      )}
    </div>
  );
};