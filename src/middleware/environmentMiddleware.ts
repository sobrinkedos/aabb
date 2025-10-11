/**
 * Middleware de Ambiente
 * Gerencia a integração entre o sistema de ambientes e outros serviços
 */

import { environmentSystem } from '../config';
import { reinitializeSupabase } from '../lib/supabase';

// Tipo para callbacks de mudança de ambiente
type EnvironmentChangeCallback = (environment: 'development' | 'production') => void | Promise<void>;

// Lista de callbacks registrados
const environmentChangeCallbacks: EnvironmentChangeCallback[] = [];

/**
 * Registra um callback para ser executado quando o ambiente mudar
 */
export const onEnvironmentChange = (callback: EnvironmentChangeCallback): void => {
  environmentChangeCallbacks.push(callback);
};

/**
 * Remove um callback da lista
 */
export const removeEnvironmentChangeCallback = (callback: EnvironmentChangeCallback): void => {
  const index = environmentChangeCallbacks.indexOf(callback);
  if (index > -1) {
    environmentChangeCallbacks.splice(index, 1);
  }
};

/**
 * Executa todos os callbacks registrados
 */
const executeEnvironmentChangeCallbacks = async (environment: 'development' | 'production'): Promise<void> => {
  console.log(`🔄 Executando ${environmentChangeCallbacks.length} callbacks de mudança de ambiente`);
  
  for (const callback of environmentChangeCallbacks) {
    try {
      await callback(environment);
    } catch (error) {
      console.error('Erro ao executar callback de mudança de ambiente:', error);
    }
  }
};

/**
 * Middleware principal que intercepta mudanças de ambiente
 */
export const environmentMiddleware = {
  /**
   * Inicializa o middleware
   */
  initialize: async (): Promise<void> => {
    console.log('🔧 Inicializando middleware de ambiente...');
    
    // Registra callback para reinicializar Supabase
    onEnvironmentChange(async (environment) => {
      console.log(`🔄 Reinicializando Supabase para ambiente: ${environment}`);
      await reinitializeSupabase();
    });
    
    // Registra callback para logs
    onEnvironmentChange(async (environment) => {
      console.log(`📝 Ambiente alterado para: ${environment}`);
      
      // Aqui você pode adicionar outros serviços que precisam ser notificados
      // Por exemplo: analytics, logging, cache, etc.
    });
    
    console.log('✅ Middleware de ambiente inicializado');
  },

  /**
   * Executa troca de ambiente com todos os callbacks
   */
  switchEnvironment: async (environment: 'development' | 'production'): Promise<void> => {
    try {
      console.log(`🔄 Iniciando troca para ambiente: ${environment}`);
      
      // Executa a troca no sistema de ambientes
      environmentSystem.switchEnvironment(environment);
      
      // Executa todos os callbacks registrados
      await executeEnvironmentChangeCallbacks(environment);
      
      // Reinicializa o sistema
      await environmentSystem.initialize();
      
      console.log(`✅ Troca de ambiente concluída: ${environment}`);
      
    } catch (error) {
      console.error('❌ Erro na troca de ambiente:', error);
      throw error;
    }
  },

  /**
   * Obtém informações do ambiente atual
   */
  getCurrentEnvironment: async () => {
    try {
      const config = await environmentSystem.getConfig();
      return {
        name: config.name,
        databaseName: config.databaseName,
        debugMode: config.debugMode,
        isConnected: true // Será atualizado pelo health check
      };
    } catch (error) {
      console.error('Erro ao obter ambiente atual:', error);
      return null;
    }
  },

  /**
   * Executa health check completo
   */
  performHealthCheck: async () => {
    try {
      return await environmentSystem.performHealthCheck();
    } catch (error) {
      console.error('Erro no health check:', error);
      throw error;
    }
  }
};

// Callback específico para desenvolvimento
onEnvironmentChange(async (environment) => {
  if (environment === 'development') {
    console.log('🛠️ Modo desenvolvimento ativado');
    // Ativar ferramentas de desenvolvimento
    if (typeof window !== 'undefined') {
      (window as any).__ENVIRONMENT__ = 'development';
    }
  } else {
    console.log('🚀 Modo produção ativado');
    // Desativar ferramentas de desenvolvimento
    if (typeof window !== 'undefined') {
      (window as any).__ENVIRONMENT__ = 'production';
    }
  }
});

// Inicialização será feita pelo contexto principal