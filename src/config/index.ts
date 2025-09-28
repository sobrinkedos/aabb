/**
 * Configuração Principal do Sistema de Ambientes
 * Ponto de entrada para inicialização e configuração
 */

import { EnvironmentManager, EnvironmentConfig } from './environment';
import { ConnectivityValidator, HealthCheckResult } from '../utils/connectivity';

export class EnvironmentSystem {
  private static instance: EnvironmentSystem;
  private environmentManager: EnvironmentManager;
  private connectivityValidator: ConnectivityValidator | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<any> | null = null;

  private constructor() {
    this.environmentManager = EnvironmentManager.getInstance();
  }

  public static getInstance(): EnvironmentSystem {
    if (!EnvironmentSystem.instance) {
      EnvironmentSystem.instance = new EnvironmentSystem();
    }
    return EnvironmentSystem.instance;
  }

  /**
   * Inicializa o sistema de ambientes
   */
  public async initialize(): Promise<{
    config: EnvironmentConfig;
    connectivity: boolean;
    environment: string;
  }> {
    // Se já está inicializando, retorna a promise existente
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Se já foi inicializado, retorna os dados atuais
    if (this.isInitialized) {
      const config = await this.environmentManager.getCurrentEnvironment();
      const connectivityResult = this.connectivityValidator 
        ? await this.connectivityValidator.validateConnection()
        : { isConnected: false };
      
      return {
        config,
        connectivity: connectivityResult.isConnected,
        environment: config.name
      };
    }

    // Cria nova promise de inicialização
    this.initializationPromise = this.performInitialization();
    
    try {
      const result = await this.initializationPromise;
      this.isInitialized = true;
      return result;
    } finally {
      this.initializationPromise = null;
    }
  }

  private async performInitialization(): Promise<{
    config: EnvironmentConfig;
    connectivity: boolean;
    environment: string;
  }> {
    try {
      console.log('🔧 Inicializando sistema de ambientes...');

      // 1. Detecta e carrega configuração do ambiente
      const config = await this.environmentManager.getCurrentEnvironment();
      console.log(`📍 Ambiente detectado: ${config.name}`);
      console.log(`🗄️ Banco de dados: ${config.databaseName}`);

      // 2. Verifica se as configurações são válidas antes de testar conectividade
      const hasValidConfig = config.supabaseUrl && 
                            config.supabaseUrl !== 'https://your-project-dev.supabase.co' &&
                            config.supabaseUrl !== 'https://your-project-prod.supabase.co' &&
                            config.supabaseAnonKey && 
                            config.supabaseAnonKey !== 'your_development_anon_key_here' &&
                            config.supabaseAnonKey !== 'your_production_anon_key_here';

      let connectivityResult = { isConnected: false, responseTime: 0, error: 'Configuração não definida' };

      if (hasValidConfig) {
        // 3. Inicializa validador de conectividade
        this.connectivityValidator = new ConnectivityValidator(config);

        // 4. Valida conectividade inicial
        console.log('🔍 Validando conectividade...');
        connectivityResult = await this.connectivityValidator.validateConnection();

        if (connectivityResult.isConnected) {
          console.log(`✅ Conectado ao Supabase (${connectivityResult.responseTime}ms)`);
        } else {
          console.warn(`❌ Falha na conectividade: ${connectivityResult.error}`);
        }
      } else {
        console.warn('⚠️ Configurações do Supabase não definidas. Configure os arquivos .env para conectividade completa.');
      }

      // 5. Exibe informações do ambiente se debug estiver ativo
      if (config.debugMode) {
        const envInfo = await this.environmentManager.getEnvironmentInfo();
        console.log('🐛 Informações de debug:', envInfo);
      }

      return {
        config,
        connectivity: connectivityResult.isConnected,
        environment: config.name
      };
    } catch (error) {
      console.error('❌ Erro na inicialização do sistema de ambientes:', error);
      throw error;
    }
  }

  /**
   * Obtém a configuração atual do ambiente
   */
  public async getConfig(): Promise<EnvironmentConfig> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.environmentManager.getCurrentEnvironment();
  }

  /**
   * Executa verificação de saúde completa
   */
  public async performHealthCheck(): Promise<HealthCheckResult> {
    if (!this.connectivityValidator) {
      throw new Error('Sistema não inicializado. Chame initialize() primeiro.');
    }
    return this.connectivityValidator.performHealthCheck();
  }

  /**
   * Força troca de ambiente (para testes)
   */
  public switchEnvironment(environment: 'development' | 'production'): void {
    this.environmentManager.switchEnvironment(environment);
    this.connectivityValidator = null; // Força recriação na próxima operação
    this.isInitialized = false;
  }

  /**
   * Obtém informações detalhadas do sistema
   */
  public async getSystemInfo(): Promise<{
    environment: string;
    branch: string;
    database: string;
    connectivity: HealthCheckResult;
    initialized: boolean;
  }> {
    const config = await this.getConfig();
    const envInfo = await this.environmentManager.getEnvironmentInfo();
    const healthCheck = await this.performHealthCheck();

    return {
      environment: config.name,
      branch: envInfo.branch,
      database: config.databaseName,
      connectivity: healthCheck,
      initialized: this.isInitialized
    };
  }
}

// Exporta instância singleton para uso global
export const environmentSystem = EnvironmentSystem.getInstance();

// Exporta tipos e classes para uso direto
export type { EnvironmentConfig } from './environment';
export { EnvironmentManager } from './environment';
export type { ConnectivityResult, HealthCheckResult } from '../utils/connectivity';
export { ConnectivityValidator } from '../utils/connectivity';

// Função de conveniência para inicialização rápida
export async function initializeEnvironment() {
  return environmentSystem.initialize();
}