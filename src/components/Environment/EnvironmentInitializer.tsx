/**
 * Componente de Inicialização do Ambiente
 * Exibe status de carregamento e inicialização do sistema de ambientes
 */

import React from 'react';
import { useEnvironmentContext } from '../../contexts/EnvironmentContext';

interface EnvironmentInitializerProps {
  children: React.ReactNode;
  showLoadingScreen?: boolean;
}

export const EnvironmentInitializer: React.FC<EnvironmentInitializerProps> = ({ 
  children, 
  showLoadingScreen = true 
}) => {
  const { isLoading, error, config, isConnected, environment } = useEnvironmentContext();

  // Tela de carregamento durante inicialização
  if (isLoading && showLoadingScreen) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Inicializando Sistema
            </h2>
            <p className="text-gray-600 mb-4">
              Configurando ambiente e conectividade...
            </p>
            <div className="text-sm text-gray-500">
              Detectando configurações do ambiente
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tela de erro se a inicialização falhar
  if (error && !config) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Erro na Inicialização
            </h2>
            <p className="text-gray-600 mb-4">
              Não foi possível inicializar o sistema de ambientes.
            </p>
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Aviso se não estiver conectado (mas permite continuar)
  if (config && !isConnected && showLoadingScreen) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-yellow-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Conectividade Limitada
            </h2>
            <p className="text-gray-600 mb-4">
              Sistema inicializado em modo offline para ambiente: <strong>{environment}</strong>
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
              <p className="text-sm text-yellow-700">
                Algumas funcionalidades podem não estar disponíveis.
                Verifique sua conexão e configurações do Supabase.
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mr-2"
            >
              Tentar Reconectar
            </button>
            <button
              onClick={() => {
                // Força renderização dos children mesmo sem conectividade
                const event = new CustomEvent('forceRender');
                window.dispatchEvent(event);
              }}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Continuar Offline
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Renderiza os children quando tudo estiver pronto
  return <>{children}</>;
};

export default EnvironmentInitializer;