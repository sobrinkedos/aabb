/**
 * Gerenciador de Configuração de Ambiente
 * 
 * Sistema robusto para gerenciar configurações específicas de cada ambiente
 * (desenvolvimento e produção) com detecção automática baseada na branch Git.
 * 
 * @version 1.0.0
 */

// ============================================================================
// INTERFACES
// ============================================================================

export interface EnvironmentConfig {
  name: "development" | "production";
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  databaseName: string;
  gitBranch: string;
  debugMode: boolean;
  logLevel: "debug" | "info" | "warn" | "error";
}

export interface EnvironmentManager {
  getCurrentEnvironment(): EnvironmentConfig;
  switchEnvironment(env: "development" | "production"): Promise<void>;
  validateConnection(config: EnvironmentConfig): Promise<boolean>;
  getEnvironmentInfo(): Promise<EnvironmentInfo>;
}

export interface EnvironmentInfo {
  currentEnvironment: string;
  gitBranch: string;
  supabaseConnected: boolean;
  databaseName: string;
  lastValidated: Date;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const ENVIRONMENT_CONFIGS: Record<string, Partial<EnvironmentConfig>> = {
  development: {
    name: "development",
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "https://wznycskqsavpmejwpksp.supabase.co",
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
    databaseName: import.meta.env.VITE_DATABASE_NAME || "wznycskqsavpmejwpksp",
    gitBranch: "desenvolvimento",
    debugMode: true,
    logLevel: "debug"
  },
  production: {
    name: "production",
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "https://jtfdzjmravketpkwjkvp.supabase.co",
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0ZmR6am1yYXZrZXRwa3dqa3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNjM1NjIsImV4cCI6MjA3MzkzOTU2Mn0.AOFSlSLFVw-pU1-lpUzxJ2fov3kR95eBlz_92mtSMgs",
    supabaseServiceRoleKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0ZmR6am1yYXZrZXRwa3dqa3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNjM1NjIsImV4cCI6MjA3MzkzOTU2Mn0.AOFSlSLFVw-pU1-lpUzxJ2fov3kR95eBlz_92mtSMgs",
    databaseName: import.meta.env.VITE_DATABASE_NAME || "jtfdzjmravketpkwjkvp",
    gitBranch: "main",
    debugMode: false,
    logLevel: "error"
  }
};

// ============================================================================
// CLASSE PRINCIPAL
// ============================================================================

export class EnvironmentManagerImpl implements EnvironmentManager {
  private currentConfig: EnvironmentConfig | null = null;
  private lastValidation: Date | null = null;
  private initialized: boolean = false;

  constructor() {
    this.initializeEnvironmentSync();
  }

  /**
   * Inicializa o ambiente baseado na configuração atual (síncrono)
   */
  private initializeEnvironmentSync(): void {
    try {
      console.log('🔧 Inicializando gerenciador de ambiente...');
      
      // Detecta ambiente baseado na branch Git ou variável de ambiente
      const environment = this.detectEnvironment();
      console.log(`🎯 Ambiente detectado: ${environment}`);
      
      // Carrega configuração do ambiente (síncrono)
      this.loadEnvironmentConfigSync(environment);
      
      this.initialized = true;
      
    } catch (error) {
      console.error('❌ Erro ao inicializar ambiente:', error);
      // Fallback para desenvolvimento
      this.loadEnvironmentConfigSync('development');
      this.initialized = true;
    }
  }

  /**
   * Detecta o ambiente atual baseado na branch Git e variáveis de ambiente
   */
  private detectEnvironment(): "development" | "production" {
    // 1. Verifica variável de ambiente explícita
    const envVar = import.meta.env.VITE_ENVIRONMENT;
    console.log(`🔍 VITE_ENVIRONMENT: ${envVar}`);
    
    if (envVar === "production") {
      console.log('🎯 Ambiente forçado via VITE_ENVIRONMENT: production');
      return "production";
    }
    if (envVar === "development") {
      console.log('🎯 Ambiente forçado via VITE_ENVIRONMENT: development');
      return "development";
    }
    
    // 2. Verifica se está na Vercel em produção
    const vercelEnv = import.meta.env.VERCEL_ENV;
    console.log(`🔍 VERCEL_ENV: ${vercelEnv}`);
    
    if (vercelEnv === "production") {
      console.log('🎯 Vercel produção detectada → Ambiente: production');
      return "production";
    }
    
    // 3. Verifica URL do Supabase para determinar ambiente
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    console.log(`🔍 VITE_SUPABASE_URL: ${supabaseUrl}`);
    
    if (supabaseUrl && supabaseUrl.includes('jtfdzjmravketpkwjkvp')) {
      console.log('🎯 URL de produção detectada → Ambiente: production');
      return "production";
    }
    
    // 4. Verifica branch Git via variável de ambiente
    const gitBranch = import.meta.env.VITE_GIT_BRANCH || "desenvolvimento";
    console.log(`🌿 Branch Git detectada: ${gitBranch}`);
    
    if (gitBranch === "main" || gitBranch === "master") {
      console.log('🎯 Branch principal detectada → Ambiente: production');
      return "production";
    }
    
    // 5. Padrão: desenvolvimento
    console.log('🎯 Ambiente padrão: development');
    return "development";
  }

  /**
   * Carrega configuração do ambiente especificado (síncrono)
   */
  private loadEnvironmentConfigSync(environment: "development" | "production"): void {
    const config = ENVIRONMENT_CONFIGS[environment];
    
    if (!config) {
      throw new Error(`Configuração não encontrada para ambiente: ${environment}`);
    }

    // Valida se todas as configurações obrigatórias estão presentes
    const requiredFields = ['supabaseUrl', 'supabaseAnonKey', 'supabaseServiceRoleKey'];
    const missingFields = requiredFields.filter(field => !config[field as keyof EnvironmentConfig]);
    
    if (missingFields.length > 0) {
      console.warn(`⚠️ Campos obrigatórios ausentes para ${environment}:`, missingFields);
    }

    this.currentConfig = config as EnvironmentConfig;
    console.log(`✅ Configuração carregada para ambiente: ${environment}`);
    console.log(`📊 Database: ${config.databaseName}`);
    console.log(`🔗 URL: ${config.supabaseUrl}`);
  }

  /**
   * Carrega configuração do ambiente especificado (async - para compatibilidade)
   */
  private async loadEnvironmentConfig(environment: "development" | "production"): Promise<void> {
    this.loadEnvironmentConfigSync(environment);
  }

  /**
   * Obtém a configuração do ambiente atual
   */
  getCurrentEnvironment(): EnvironmentConfig {
    if (!this.initialized || !this.currentConfig) {
      // Tenta inicializar novamente se não estiver inicializado
      this.initializeEnvironmentSync();
    }
    
    if (!this.currentConfig) {
      throw new Error('Ambiente não inicializado corretamente.');
    }
    
    return this.currentConfig;
  }

  /**
   * Alterna para um ambiente específico
   */
  async switchEnvironment(env: "development" | "production"): Promise<void> {
    console.log(`🔄 Alternando para ambiente: ${env}`);
    
    try {
      await this.loadEnvironmentConfig(env);
      
      if (this.currentConfig) {
        const isValid = await this.validateConnection(this.currentConfig);
        if (!isValid) {
          console.warn(`⚠️ Conectividade falhou para ambiente: ${env}`);
        }
      }
      
      console.log(`✅ Ambiente alternado com sucesso: ${env}`);
    } catch (error) {
      console.error(`❌ Erro ao alternar para ambiente ${env}:`, error);
      throw error;
    }
  }

  /**
   * Valida conectividade com o Supabase
   */
  async validateConnection(config: EnvironmentConfig): Promise<boolean> {
    try {
      console.log(`🔍 Validando conectividade com ${config.name}...`);
      
      // Importação dinâmica para evitar problemas de inicialização
      const { createClient } = await import('@supabase/supabase-js');
      
      const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
      
      // Testa conectividade com uma query simples
      const { data, error } = await supabase
        .from('usuarios_empresa')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error(`❌ Erro de conectividade (${config.name}):`, error.message);
        return false;
      }
      
      this.lastValidation = new Date();
      console.log(`✅ Conectividade OK (${config.name})`);
      return true;
      
    } catch (error) {
      console.error(`❌ Erro inesperado na validação (${config.name}):`, error);
      return false;
    }
  }

  /**
   * Obtém informações detalhadas do ambiente atual
   */
  async getEnvironmentInfo(): Promise<EnvironmentInfo> {
    const config = this.getCurrentEnvironment();
    
    const isConnected = await this.validateConnection(config);
    
    return {
      currentEnvironment: config.name,
      gitBranch: config.gitBranch,
      supabaseConnected: isConnected,
      databaseName: config.databaseName,
      lastValidated: this.lastValidation || new Date()
    };
  }
}

// ============================================================================
// INSTÂNCIA SINGLETON
// ============================================================================

export const environmentManager = new EnvironmentManagerImpl();

// ============================================================================
// UTILITÁRIOS
// ============================================================================

/**
 * Hook para obter configuração do ambiente atual
 */
export function useEnvironment(): EnvironmentConfig {
  return environmentManager.getCurrentEnvironment();
}

/**
 * Função para obter informações do ambiente de forma assíncrona
 */
export async function getEnvironmentInfo(): Promise<EnvironmentInfo> {
  return environmentManager.getEnvironmentInfo();
}

/**
 * Função para validar se estamos em produção
 */
export function isProduction(): boolean {
  try {
    const config = environmentManager.getCurrentEnvironment();
    return config.name === "production";
  } catch {
    return false;
  }
}

/**
 * Função para validar se estamos em desenvolvimento
 */
export function isDevelopment(): boolean {
  try {
    const config = environmentManager.getCurrentEnvironment();
    return config.name === "development";
  } catch {
    return true; // Padrão para desenvolvimento
  }
}

/**
 * Função para obter logs formatados do ambiente
 */
export function logEnvironmentInfo(): void {
  try {
    const config = environmentManager.getCurrentEnvironment();
    console.group('🌍 Informações do Ambiente');
    console.log(`📍 Ambiente: ${config.name}`);
    console.log(`🌿 Branch: ${config.gitBranch}`);
    console.log(`🗄️ Database: ${config.databaseName}`);
    console.log(`🔗 URL: ${config.supabaseUrl}`);
    console.log(`🐛 Debug: ${config.debugMode ? 'Ativado' : 'Desativado'}`);
    console.log(`📊 Log Level: ${config.logLevel}`);
    console.groupEnd();
  } catch (error) {
    console.error('❌ Erro ao obter informações do ambiente:', error);
  }
}