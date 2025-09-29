/**
 * Testes unitários para o EnvironmentManager
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EnvironmentManagerImpl, environmentManager } from '../../config/environment';

// Mock das variáveis de ambiente
const mockEnv = {
  VITE_SUPABASE_URL: 'https://test.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'test-anon-key',
  VITE_SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
  VITE_DATABASE_NAME: 'test-db',
  VITE_DEBUG_MODE: 'true',
  VITE_LOG_LEVEL: 'debug',
  VITE_ENABLE_MOCK_DATA: 'true',
  VITE_GIT_BRANCH: 'development'
};

describe('EnvironmentManager', () => {
  let testEnvironmentManager: EnvironmentManagerImpl;

  beforeEach(() => {
    // Use a instância singleton existente
    testEnvironmentManager = environmentManager;

    // Mock import.meta.env
    vi.stubGlobal('import', {
      meta: {
        env: mockEnv
      }
    });

    // Mock fetch para testes de conectividade
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('Singleton Pattern', () => {
    it('deve retornar a mesma instância', () => {
      const instance1 = environmentManager;
      const instance2 = environmentManager;
      expect(instance1).toBe(instance2);
    });
  });

  describe('detectEnvironment', () => {
    it('deve detectar produção quando branch é main', async () => {
      vi.stubGlobal('import', {
        meta: {
          env: { ...mockEnv, VITE_GIT_BRANCH: 'main' }
        }
      });

      const environment = await testEnvironmentManager.detectEnvironment();
      expect(environment).toBe('production');
    });

    it('deve detectar desenvolvimento para outras branches', async () => {
      vi.stubGlobal('import', {
        meta: {
          env: { ...mockEnv, VITE_GIT_BRANCH: 'development' }
        }
      });

      const environment = await testEnvironmentManager.detectEnvironment();
      expect(environment).toBe('development');
    });

    it('deve usar desenvolvimento como fallback', async () => {
      vi.stubGlobal('import', {
        meta: {
          env: { ...mockEnv, VITE_GIT_BRANCH: undefined }
        }
      });

      // Mock window para simular browser
      Object.defineProperty(window, 'location', {
        value: { hostname: 'localhost' },
        writable: true
      });

      const environment = await testEnvironmentManager.detectEnvironment();
      expect(environment).toBe('development');
    });
  });

  describe('getCurrentEnvironment', () => {
    it('deve carregar configuração corretamente', async () => {
      const config = await testEnvironmentManager.getCurrentEnvironment();

      expect(config).toEqual({
        name: 'development',
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
        supabaseServiceRoleKey: 'test-service-key',
        databaseName: 'test-db',
        debugMode: true,
        logLevel: 'debug',
        enableMockData: true
      });
    });

    it('deve cachear a configuração', async () => {
      const config1 = await testEnvironmentManager.getCurrentEnvironment();
      const config2 = await testEnvironmentManager.getCurrentEnvironment();

      expect(config1).toBe(config2); // Mesma referência
    });

    it('deve lançar erro para configuração incompleta', async () => {
      vi.stubGlobal('import', {
        meta: {
          env: { ...mockEnv, VITE_SUPABASE_URL: '' }
        }
      });

      await expect(testEnvironmentManager.getCurrentEnvironment())
        .rejects.toThrow('Configuração incompleta');
    });
  });

  describe('validateEnvironment', () => {
    it('deve validar configuração válida', async () => {
      const validation = await environmentManager.validateEnvironment();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('deve detectar URL faltando', async () => {
      vi.stubGlobal('import', {
        meta: {
          env: { ...mockEnv, VITE_SUPABASE_URL: '' }
        }
      });

      const validation = await environmentManager.validateEnvironment();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('VITE_SUPABASE_URL não configurada');
    });

    it('deve detectar URL inválida', async () => {
      vi.stubGlobal('import', {
        meta: {
          env: { ...mockEnv, VITE_SUPABASE_URL: 'http://invalid-url' }
        }
      });

      const validation = await environmentManager.validateEnvironment();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('VITE_SUPABASE_URL deve começar com https://');
    });

    it('deve detectar debug em produção como warning', async () => {
      vi.stubGlobal('import', {
        meta: {
          env: { ...mockEnv, VITE_GIT_BRANCH: 'main', VITE_DEBUG_MODE: 'true' }
        }
      });

      const validation = await environmentManager.validateEnvironment();

      expect(validation.warnings).toContain('Debug mode ativado em produção');
    });
  });

  describe('testConnectivity', () => {
    it('deve testar conectividade com sucesso', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK'
      });

      const connectivity = await environmentManager.testConnectivity();

      expect(connectivity.isConnected).toBe(true);
      expect(connectivity.responseTime).toBeGreaterThan(0);
      expect(connectivity.error).toBeUndefined();
    });

    it('deve detectar falha de conectividade', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const connectivity = await environmentManager.testConnectivity();

      expect(connectivity.isConnected).toBe(false);
      expect(connectivity.error).toBe('HTTP 404: Not Found');
    });

    it('deve tratar erro de rede', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const connectivity = await environmentManager.testConnectivity();

      expect(connectivity.isConnected).toBe(false);
      expect(connectivity.error).toBe('Network error');
    });
  });

  describe('switchEnvironment', () => {
    it('deve trocar ambiente manualmente', async () => {
      // Primeiro carrega desenvolvimento
      await environmentManager.getCurrentEnvironment();

      // Troca para produção
      environmentManager.switchEnvironment('production');

      const config = await environmentManager.getCurrentEnvironment();
      expect(config.name).toBe('production');
    });
  });

  describe('reloadConfiguration', () => {
    it('deve recarregar configuração', async () => {
      // Carrega configuração inicial
      const config1 = await environmentManager.getCurrentEnvironment();

      // Recarrega
      environmentManager.reloadConfiguration();

      // Carrega novamente
      const config2 = await environmentManager.getCurrentEnvironment();

      // Deve ser nova instância
      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2); // Mas com mesmo conteúdo
    });
  });

  describe('getEnvironmentInfo', () => {
    it('deve retornar informações completas do ambiente', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      const info = await environmentManager.getEnvironmentInfo();

      expect(info).toEqual({
        environment: 'development',
        branch: 'development',
        databaseName: 'test-db',
        debugMode: true,
        isValid: true,
        connectivity: true
      });
    });
  });
});