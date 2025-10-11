/**
 * Utilitários de Validação de Conectividade com Supabase
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EnvironmentConfig } from '../config/environment';

export interface ConnectivityResult {
  isConnected: boolean;
  responseTime: number;
  error?: string;
  databaseInfo?: {
    version: string;
    name: string;
  };
}

export interface HealthCheckResult {
  database: ConnectivityResult;
  auth: ConnectivityResult;
  storage: ConnectivityResult;
  realtime: ConnectivityResult;
  overall: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    score: number; // 0-100
  };
}

export class ConnectivityValidator {
  private supabaseClient: SupabaseClient;
  private config: EnvironmentConfig;

  constructor(config: EnvironmentConfig) {
    this.config = config;
    this.supabaseClient = createClient(
      config.supabaseUrl,
      config.supabaseAnonKey
    );
  }

  /**
   * Valida conectividade básica com o banco Supabase
   */
  public async validateConnection(): Promise<ConnectivityResult> {
    const startTime = Date.now();

    try {
      // Testa uma query simples para verificar conectividade
      const { data, error } = await this.supabaseClient
        .from('information_schema.tables')
        .select('table_name')
        .limit(1);

      const responseTime = Date.now() - startTime;

      if (error) {
        return {
          isConnected: false,
          responseTime,
          error: error.message
        };
      }

      return {
        isConnected: true,
        responseTime,
        databaseInfo: {
          version: 'PostgreSQL', // Supabase usa PostgreSQL
          name: this.config.databaseName
        }
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        isConnected: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Executa verificação completa de saúde do sistema
   */
  public async performHealthCheck(): Promise<HealthCheckResult> {
    const results = await Promise.allSettled([
      this.checkDatabase(),
      this.checkAuth(),
      this.checkStorage(),
      this.checkRealtime()
    ]);

    const [database, auth, storage, realtime] = results.map(result => 
      result.status === 'fulfilled' ? result.value : {
        isConnected: false,
        responseTime: 0,
        error: 'Falha na verificação'
      }
    );

    // Calcula score geral baseado nos resultados
    const services = [database, auth, storage, realtime];
    const connectedServices = services.filter(s => s.isConnected).length;
    const score = (connectedServices / services.length) * 100;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (score === 100) {
      status = 'healthy';
    } else if (score >= 50) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      database,
      auth,
      storage,
      realtime,
      overall: {
        status,
        score
      }
    };
  }

  /**
   * Verifica conectividade com o banco de dados
   */
  private async checkDatabase(): Promise<ConnectivityResult> {
    return this.validateConnection();
  }

  /**
   * Verifica serviço de autenticação
   */
  private async checkAuth(): Promise<ConnectivityResult> {
    const startTime = Date.now();

    try {
      // Testa endpoint de autenticação
      const { data, error } = await this.supabaseClient.auth.getSession();
      const responseTime = Date.now() - startTime;

      if (error && error.message !== 'No session found') {
        return {
          isConnected: false,
          responseTime,
          error: error.message
        };
      }

      return {
        isConnected: true,
        responseTime
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        isConnected: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Erro no serviço de auth'
      };
    }
  }

  /**
   * Verifica serviço de storage
   */
  private async checkStorage(): Promise<ConnectivityResult> {
    const startTime = Date.now();

    try {
      // Lista buckets para testar conectividade do storage
      const { data, error } = await this.supabaseClient.storage.listBuckets();
      const responseTime = Date.now() - startTime;

      if (error) {
        return {
          isConnected: false,
          responseTime,
          error: error.message
        };
      }

      return {
        isConnected: true,
        responseTime
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        isConnected: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Erro no serviço de storage'
      };
    }
  }

  /**
   * Verifica serviço de realtime
   */
  private async checkRealtime(): Promise<ConnectivityResult> {
    const startTime = Date.now();

    try {
      // Verifica status do realtime
      const channel = this.supabaseClient.channel('health-check');
      
      return new Promise<ConnectivityResult>((resolve) => {
        const timeout = setTimeout(() => {
          channel.unsubscribe();
          resolve({
            isConnected: false,
            responseTime: Date.now() - startTime,
            error: 'Timeout na conexão realtime'
          });
        }, 5000);

        channel
          .on('presence', { event: 'sync' }, () => {
            clearTimeout(timeout);
            channel.unsubscribe();
            resolve({
              isConnected: true,
              responseTime: Date.now() - startTime
            });
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              clearTimeout(timeout);
              channel.unsubscribe();
              resolve({
                isConnected: true,
                responseTime: Date.now() - startTime
              });
            }
          });
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        isConnected: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Erro no serviço de realtime'
      };
    }
  }

  /**
   * Testa conectividade com configuração específica
   */
  public static async testConfiguration(config: EnvironmentConfig): Promise<ConnectivityResult> {
    const validator = new ConnectivityValidator(config);
    return validator.validateConnection();
  }

  /**
   * Compara conectividade entre dois ambientes
   */
  public static async compareEnvironments(
    devConfig: EnvironmentConfig,
    prodConfig: EnvironmentConfig
  ): Promise<{
    development: ConnectivityResult;
    production: ConnectivityResult;
    comparison: {
      bothConnected: boolean;
      performanceDiff: number; // diferença em ms
    };
  }> {
    const [development, production] = await Promise.all([
      ConnectivityValidator.testConfiguration(devConfig),
      ConnectivityValidator.testConfiguration(prodConfig)
    ]);

    return {
      development,
      production,
      comparison: {
        bothConnected: development.isConnected && production.isConnected,
        performanceDiff: production.responseTime - development.responseTime
      }
    };
  }
}