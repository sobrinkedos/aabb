import { useState, useEffect, useCallback } from 'react';
import { ConfigurationService } from '../services/configurationService';
import { usePrivileges } from '../contexts/PrivilegeContext';

export interface UseConfiguracoesReturn {
  configuracoes: Record<string, any>;
  categoriasAcessiveis: string[];
  isLoading: boolean;
  error: string | null;
  
  // Métodos
  obterConfiguracao: <T = any>(categoria: string) => Promise<T | null>;
  atualizarConfiguracao: (categoria: string, config: Record<string, any>) => Promise<boolean>;
  podeAcessarCategoria: (categoria: string) => boolean;
  getInfoRestricao: (categoria: string) => any;
  recarregarConfiguracoes: () => Promise<void>;
}

export function useConfiguracoes(): UseConfiguracoesReturn {
  const { podeAcessarConfiguracao } = usePrivileges();
  const [configuracoes, setConfiguracoes] = useState<Record<string, any>>({});
  const [categoriasAcessiveis, setCategoriasAcessiveis] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarConfiguracoes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const resultado = await ConfigurationService.obterConfiguracoes();
      
      if (resultado.error) {
        setError(resultado.error);
      } else {
        setConfiguracoes(resultado.data);
        setCategoriasAcessiveis(resultado.categorias_acessiveis);
      }
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
      setError('Erro ao carregar configurações');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarConfiguracoes();
  }, [carregarConfiguracoes]);

  const obterConfiguracao = useCallback(async <T = any>(categoria: string): Promise<T | null> => {
    try {
      const resultado = await ConfigurationService.obterConfiguracaoCategoria<T>(categoria);
      
      if (resultado.error) {
        console.error(`Erro ao obter configuração ${categoria}:`, resultado.error);
        return null;
      }
      
      return resultado.data;
    } catch (error) {
      console.error(`Erro ao obter configuração ${categoria}:`, error);
      return null;
    }
  }, []);

  const atualizarConfiguracao = useCallback(async (
    categoria: string, 
    config: Record<string, any>
  ): Promise<boolean> => {
    try {
      const resultado = await ConfigurationService.atualizarConfiguracaoCategoria(categoria, config);
      
      if (resultado.success) {
        // Atualizar estado local
        setConfiguracoes(prev => ({
          ...prev,
          [categoria]: config
        }));
        return true;
      } else {
        setError(resultado.error || 'Erro ao atualizar configuração');
        return false;
      }
    } catch (error) {
      console.error(`Erro ao atualizar configuração ${categoria}:`, error);
      setError('Erro interno ao atualizar configuração');
      return false;
    }
  }, []);

  const podeAcessarCategoria = useCallback((categoria: string): boolean => {
    return podeAcessarConfiguracao(categoria);
  }, [podeAcessarConfiguracao]);

  const getInfoRestricao = useCallback((categoria: string) => {
    return ConfigurationService.getInfoRestricaoCategoria(categoria);
  }, []);

  const recarregarConfiguracoes = useCallback(async () => {
    await carregarConfiguracoes();
  }, [carregarConfiguracoes]);

  return {
    configuracoes,
    categoriasAcessiveis,
    isLoading,
    error,
    obterConfiguracao,
    atualizarConfiguracao,
    podeAcessarCategoria,
    getInfoRestricao,
    recarregarConfiguracoes
  };
}

// Hook específico para cada categoria de configuração
export function useConfiguracaoGeral() {
  const { obterConfiguracao, atualizarConfiguracao, podeAcessarCategoria } = useConfiguracoes();
  
  return {
    obterConfiguracao: () => obterConfiguracao('geral'),
    atualizarConfiguracao: (config: any) => atualizarConfiguracao('geral', config),
    podeAcessar: () => podeAcessarCategoria('geral')
  };
}

export function useConfiguracaoSeguranca() {
  const { obterConfiguracao, atualizarConfiguracao, podeAcessarCategoria } = useConfiguracoes();
  
  return {
    obterConfiguracao: () => obterConfiguracao('seguranca'),
    atualizarConfiguracao: (config: any) => atualizarConfiguracao('seguranca', config),
    podeAcessar: () => podeAcessarCategoria('seguranca')
  };
}

export function useConfiguracaoSistema() {
  const { obterConfiguracao, atualizarConfiguracao, podeAcessarCategoria } = useConfiguracoes();
  
  return {
    obterConfiguracao: () => obterConfiguracao('sistema'),
    atualizarConfiguracao: (config: any) => atualizarConfiguracao('sistema', config),
    podeAcessar: () => podeAcessarCategoria('sistema')
  };
}

export function useConfiguracaoNotificacoes() {
  const { obterConfiguracao, atualizarConfiguracao, podeAcessarCategoria } = useConfiguracoes();
  
  return {
    obterConfiguracao: () => obterConfiguracao('notificacoes'),
    atualizarConfiguracao: (config: any) => atualizarConfiguracao('notificacoes', config),
    podeAcessar: () => podeAcessarCategoria('notificacoes')
  };
}

export function useConfiguracaoIntegracao() {
  const { obterConfiguracao, atualizarConfiguracao, podeAcessarCategoria } = useConfiguracoes();
  
  return {
    obterConfiguracao: () => obterConfiguracao('integracao'),
    atualizarConfiguracao: (config: any) => atualizarConfiguracao('integracao', config),
    podeAcessar: () => podeAcessarCategoria('integracao')
  };
}