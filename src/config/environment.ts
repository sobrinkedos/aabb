/**
 * Sistema de Configuração de Ambiente
 * Detecta automaticamente o ambiente baseado na branch Git
 */

export interface EnvironmentConfig {
  name: 'development' | 'production';
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  databaseName: string;
  debugMode: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableMockData: boolean;
}

export class EnvironmentManager {
  private static instance: EnvironmentManager;
  private currentConfig: EnvironmentConfig | null = null;

  private constructor() {}

  public static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }

  /**
   * Detecta o ambiente atual baseado na branch Git
   */
  public async detectEnvironment(): Promise<'development' | 'production'> {
    try {
      // Tenta detectar a branch atual via Git
      const currentBranch = await this.getCurrentGitBranch();
      
      // Se estiver na branch main, usa produção
      if (currentBranch === 'main') {
        return 'production';
      }
      
      // Para qualquer outra branch (development, feature branches, etc), usa desenvolvimento
      return 'development';
    } catch (error) {
      console.warn('Não foi possível detectar a branch Git, usando desenvolvimento como padrão:', error);
      return 'development';
    }
  }

  /**
   * Obtém a branch Git atual
   */
  private async getCurrentGitBranch(): Promise<string> {
    // Em ambiente de produção (build), pode usar variável de ambiente
    if (import.meta.env.VITE_GIT_BRANCH) {
      return import.meta.env.VITE_GIT_BRANCH;
    }

    // No browser, usa fallback baseado na URL ou outras heurísticas
    if (typeof window !== 'undefined') {
      // Detecta baseado na URL
      if (window.location.hostname.includes('localhost') || 
          window.location.hostname.includes('127.0.0.1') ||
          window.location.hostname.includes('dev.')) {
        return 'development';
      }
      
      // Se estiver em produção (domínio real), assume main
      return 'main';
    }

    // Em ambiente Node.js (SSR ou testes)
    try {
      // Tenta ler variável de ambiente primeiro
      if (process.env.GIT_BRANCH) {
        return process.env.GIT_BRANCH;
      }
      
      // Fallback para desenvolvimento em Node.js
      return 'development';
    } catch (error) {
      console.warn('Não foi possível detectar branch Git:', error);
      return 'development';
    }
  }

  /**
   * Carrega a configuração do ambiente atual
   */
  public async getCurrentEnvironment(): Promise<EnvironmentConfig> {
    if (this.currentConfig) {
      return this.currentConfig;
    }

    const environment = await this.detectEnvironment();
    this.currentConfig = this.loadEnvironmentConfig(environment);
    
    return this.currentConfig;
  }

  /**
   * Carrega configuração específica do ambiente
   */
  private loadEnvironmentConfig(environment: 'development' | 'production'): EnvironmentConfig {
    const config: EnvironmentConfig = {
      name: environment,
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      supabaseServiceRoleKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '',
      databaseName: import.meta.env.VITE_DATABASE_NAME || '',
      debugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
      logLevel: (import.meta.env.VITE_LOG_LEVEL as any) || 'info',
      enableMockData: import.meta.env.VITE_ENABLE_MOCK_DATA === 'true'
    };

    // Validação básica
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      throw new Error(`Configuração incompleta para o ambiente ${environment}`);
    }

    return config;
  }

  /**
   * Força a troca de ambiente (para testes ou casos especiais)
   */
  public switchEnvironment(environment: 'development' | 'production'): void {
    this.currentConfig = this.loadEnvironmentConfig(environment);
  }

  /**
   * Valida se a configuração atual está completa e funcional
   */
  public async validateEnvironment(): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const config = await this.getCurrentEnvironment();

      // Validações obrigatórias
      if (!config.supabaseUrl) {
        errors.push('VITE_SUPABASE_URL não configurada');
      }
      if (!config.supabaseAnonKey) {
        errors.push('VITE_SUPABASE_ANON_KEY não configurada');
      }
      if (!config.databaseName) {
        warnings.push('VITE_DATABASE_NAME não configurado');
      }

      // Validações de formato
      if (config.supabaseUrl && !config.supabaseUrl.startsWith('https://')) {
        errors.push('VITE_SUPABASE_URL deve começar com https://');
      }
      if (config.supabaseUrl && !config.supabaseUrl.includes('.supabase.co')) {
        warnings.push('URL do Supabase não parece ser válida');
      }

      // Validações de ambiente
      if (config.name === 'production' && config.debugMode) {
        warnings.push('Debug mode ativado em produção');
      }
      if (config.name === 'development' && !config.enableMockData) {
        warnings.push('Mock data desabilitado em desenvolvimento');
      }

    } catch (error) {
      errors.push(`Erro ao carregar configuração: ${error}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Testa conectividade com o Supabase
   */
  public async testConnectivity(): Promise<{
    isConnected: boolean;
    responseTime: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const config = await this.getCurrentEnvironment();
      
      // Testa conectividade básica
      const response = await fetch(`${config.supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': config.supabaseAnonKey,
          'Authorization': `Bearer ${config.supabaseAnonKey}`
        }
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          isConnected: true,
          responseTime
        };
      } else {
        return {
          isConnected: false,
          responseTime,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        isConnected: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Recarrega a configuração (útil para hot-reload em desenvolvimento)
   */
  public reloadConfiguration(): void {
    this.currentConfig = null;
  }

  /**
   * Obtém informações sobre o ambiente atual
   */
  public async getEnvironmentInfo(): Promise<{
    environment: string;
    branch: string;
    databaseName: string;
    debugMode: boolean;
    isValid: boolean;
    connectivity: boolean;
  }> {
    const config = await this.getCurrentEnvironment();
    const branch = await this.getCurrentGitBranch().catch(() => 'unknown');
    const validation = await this.validateEnvironment();
    const connectivity = await this.testConnectivity();

    return {
      environment: config.name,
      branch,
      databaseName: config.databaseName,
      debugMode: config.debugMode,
      isValid: validation.isValid,
      connectivity: connectivity.isConnected
    };
  }
}