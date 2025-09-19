import React, { useState } from 'react';
import { Integration, ConnectionTestResult } from '../../types/integrations';

interface ConnectionTesterProps {
  integration: Integration;
  onClose: () => void;
}

export const ConnectionTester: React.FC<ConnectionTesterProps> = ({
  integration,
  onClose
}) => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [testHistory, setTestHistory] = useState<ConnectionTestResult[]>([]);

  const runConnectionTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const startTime = Date.now();
      
      // Simular teste de conexão baseado no tipo de integração
      const result = await performConnectionTest(integration);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      const testResult: ConnectionTestResult = {
        success: result.success,
        responseTime,
        timestamp: new Date(),
        error: result.error,
        details: result.details
      };

      setTestResult(testResult);
      setTestHistory(prev => [testResult, ...prev.slice(0, 9)]); // Manter últimos 10 testes
    } catch (error) {
      const testResult: ConnectionTestResult = {
        success: false,
        responseTime: 0,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
      
      setTestResult(testResult);
      setTestHistory(prev => [testResult, ...prev.slice(0, 9)]);
    } finally {
      setIsTesting(false);
    }
  };

  const performConnectionTest = async (integration: Integration): Promise<{
    success: boolean;
    error?: string;
    details?: Record<string, any>;
  }> => {
    switch (integration.type) {
      case 'api_rest':
        return await testRestAPI(integration);
      case 'webhook':
        return await testWebhook(integration);
      case 'database':
        return await testDatabase(integration);
      case 'email':
        return await testEmail(integration);
      default:
        return { success: false, error: 'Tipo de integração não suportado para teste' };
    }
  };

  const testRestAPI = async (integration: Integration): Promise<{
    success: boolean;
    error?: string;
    details?: Record<string, any>;
  }> => {
    try {
      const { baseUrl, apiKey, headers, timeout } = integration.config;
      
      if (!baseUrl) {
        return { success: false, error: 'URL base não configurada' };
      }

      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers
      };

      if (apiKey) {
        requestHeaders['Authorization'] = `Bearer ${apiKey}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout || 30000);

      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        headers: requestHeaders,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      return {
        success: response.ok,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
        details: {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        }
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return { success: false, error: 'Timeout na conexão' };
        }
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Erro desconhecido' };
    }
  };

  const testWebhook = async (integration: Integration): Promise<{
    success: boolean;
    error?: string;
    details?: Record<string, any>;
  }> => {
    try {
      const { baseUrl } = integration.config;
      
      if (!baseUrl) {
        return { success: false, error: 'URL do webhook não configurada' };
      }

      const testPayload = {
        test: true,
        timestamp: new Date().toISOString(),
        source: 'ClubManager Pro'
      };

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ClubManager-Pro-Test'
        },
        body: JSON.stringify(testPayload)
      });

      return {
        success: response.ok,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
        details: {
          status: response.status,
          statusText: response.statusText
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  };

  const testDatabase = async (integration: Integration): Promise<{
    success: boolean;
    error?: string;
    details?: Record<string, any>;
  }> => {
    // Simulação de teste de banco de dados
    return {
      success: false,
      error: 'Teste de banco de dados não implementado nesta versão'
    };
  };

  const testEmail = async (integration: Integration): Promise<{
    success: boolean;
    error?: string;
    details?: Record<string, any>;
  }> => {
    // Simulação de teste de email
    return {
      success: false,
      error: 'Teste de email não implementado nesta versão'
    };
  };

  const getStatusIcon = (success: boolean) => {
    if (success) {
      return (
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      );
    } else {
      return (
        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Teste de Conexão - {integration.name}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Verificar conectividade e configurações da integração
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Informações da Integração */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Informações da Integração</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Tipo:</span>
                <span className="ml-2 font-medium">{integration.type}</span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                  integration.status === 'connected' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {integration.status}
                </span>
              </div>
              {integration.config.baseUrl && (
                <div className="col-span-2">
                  <span className="text-gray-600">URL:</span>
                  <span className="ml-2 font-mono text-sm">{integration.config.baseUrl}</span>
                </div>
              )}
            </div>
          </div>

          {/* Botão de Teste */}
          <div className="text-center mb-6">
            <button
              onClick={runConnectionTest}
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Testando Conexão...
                </div>
              ) : (
                'Executar Teste de Conexão'
              )}
            </button>
          </div>

          {/* Resultado do Teste Atual */}
          {testResult && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Resultado do Teste</h4>
              <div className={`border rounded-lg p-4 ${
                testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}>
                <div className="flex items-start space-x-3">
                  {getStatusIcon(testResult.success)}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className={`font-medium ${
                          testResult.success ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {testResult.success ? 'Conexão Bem-sucedida' : 'Falha na Conexão'}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Tempo de resposta: {testResult.responseTime}ms
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {testResult.timestamp.toLocaleString('pt-BR')}
                      </span>
                    </div>
                    
                    {testResult.error && (
                      <div className="mt-2 p-2 bg-red-100 rounded text-sm text-red-700">
                        <strong>Erro:</strong> {testResult.error}
                      </div>
                    )}
                    
                    {testResult.details && (
                      <div className="mt-2">
                        <details className="text-sm">
                          <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                            Detalhes Técnicos
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                            {JSON.stringify(testResult.details, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Histórico de Testes */}
          {testHistory.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Histórico de Testes</h4>
              <div className="space-y-2">
                {testHistory.map((test, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        test.success ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span className="text-sm text-gray-900">
                        {test.success ? 'Sucesso' : 'Falha'}
                      </span>
                      <span className="text-sm text-gray-600">
                        {test.responseTime}ms
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {test.timestamp.toLocaleString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};