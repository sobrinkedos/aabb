import React, { useState, useEffect } from 'react';
import { Integration, IntegrationType, IntegrationConfig } from '../../types/integrations';

interface APIConfigFormProps {
  integration?: Integration | null;
  onSave: (data: Partial<Integration>) => Promise<void>;
  onCancel: () => void;
}

export const APIConfigForm: React.FC<APIConfigFormProps> = ({
  integration,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'api_rest' as IntegrationType,
    config: {
      baseUrl: '',
      apiKey: '',
      headers: {},
      timeout: 30000,
      retryAttempts: 3,
      authType: 'api_key',
      credentials: {}
    } as IntegrationConfig
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (integration) {
      setFormData({
        name: integration.name,
        type: integration.type,
        config: integration.config
      });
    }
  }, [integration]);

  const integrationTypes: { value: IntegrationType; label: string }[] = [
    { value: 'api_rest', label: 'API REST' },
    { value: 'webhook', label: 'Webhook' },
    { value: 'database', label: 'Banco de Dados' },
    { value: 'file_sync', label: 'Sincronização de Arquivos' },
    { value: 'email', label: 'Email/SMTP' },
    { value: 'payment', label: 'Gateway de Pagamento' },
    { value: 'erp', label: 'Sistema ERP' },
    { value: 'crm', label: 'Sistema CRM' }
  ];

  const authTypes = [
    { value: 'api_key', label: 'API Key' },
    { value: 'bearer_token', label: 'Bearer Token' },
    { value: 'basic_auth', label: 'Basic Auth' },
    { value: 'oauth2', label: 'OAuth 2.0' },
    { value: 'none', label: 'Sem Autenticação' }
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (formData.type === 'api_rest' || formData.type === 'webhook') {
      if (!formData.config.baseUrl?.trim()) {
        newErrors.baseUrl = 'URL base é obrigatória';
      } else {
        try {
          new URL(formData.config.baseUrl);
        } catch {
          newErrors.baseUrl = 'URL inválida';
        }
      }

      if (formData.config.authType === 'api_key' && !formData.config.apiKey?.trim()) {
        newErrors.apiKey = 'API Key é obrigatória';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      await onSave(formData);
    } catch (error) {
      console.error('Erro ao salvar integração:', error);
      setErrors({ general: 'Erro ao salvar integração' });
    } finally {
      setIsLoading(false);
    }
  };

  const updateConfig = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: value
      }
    }));
  };

  const addHeader = () => {
    const key = prompt('Nome do header:');
    const value = prompt('Valor do header:');
    
    if (key && value) {
      updateConfig('headers', {
        ...formData.config.headers,
        [key]: value
      });
    }
  };

  const removeHeader = (key: string) => {
    const headers = { ...formData.config.headers };
    delete headers[key];
    updateConfig('headers', headers);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {integration ? 'Editar Integração' : 'Nova Integração'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome da Integração
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ex: Sistema ERP Principal"
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Integração
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as IntegrationType }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {integrationTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Configurações específicas para API REST/Webhook */}
          {(formData.type === 'api_rest' || formData.type === 'webhook') && (
            <>
              {/* URL Base */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL Base
                </label>
                <input
                  type="url"
                  value={formData.config.baseUrl || ''}
                  onChange={(e) => updateConfig('baseUrl', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.baseUrl ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="https://api.exemplo.com"
                />
                {errors.baseUrl && <p className="text-red-600 text-sm mt-1">{errors.baseUrl}</p>}
              </div>

              {/* Tipo de Autenticação */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Autenticação
                </label>
                <select
                  value={formData.config.authType || 'api_key'}
                  onChange={(e) => updateConfig('authType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {authTypes.map(auth => (
                    <option key={auth.value} value={auth.value}>
                      {auth.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* API Key */}
              {formData.config.authType === 'api_key' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={formData.config.apiKey || ''}
                    onChange={(e) => updateConfig('apiKey', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.apiKey ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Sua API Key"
                  />
                  {errors.apiKey && <p className="text-red-600 text-sm mt-1">{errors.apiKey}</p>}
                </div>
              )}

              {/* Headers Customizados */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Headers Customizados
                  </label>
                  <button
                    type="button"
                    onClick={addHeader}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    + Adicionar Header
                  </button>
                </div>
                <div className="space-y-2">
                  {Object.entries(formData.config.headers || {}).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={key}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                      />
                      <input
                        type="text"
                        value={value as string}
                        onChange={(e) => updateConfig('headers', {
                          ...formData.config.headers,
                          [key]: e.target.value
                        })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeHeader(key)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeout */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timeout (ms)
                </label>
                <input
                  type="number"
                  value={formData.config.timeout || 30000}
                  onChange={(e) => updateConfig('timeout', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1000"
                  max="300000"
                />
              </div>

              {/* Tentativas de Retry */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tentativas de Retry
                </label>
                <input
                  type="number"
                  value={formData.config.retryAttempts || 3}
                  onChange={(e) => updateConfig('retryAttempts', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="10"
                />
              </div>
            </>
          )}

          {/* Botões */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};