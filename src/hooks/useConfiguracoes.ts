import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { CategoriaConfiguracao } from '../types/multitenant';
import { useMultitenantAuth } from '../contexts/MultitenantAuthContextSimple';

/**
 * Interface para configurações tipadas
 */
export interface ConfiguracaoSeguranca {
  tempo_sessao: number;
  tentativas_login: number;
  bloqueio_temporario: number;
  exigir_2fa: boolean;
  senha_minima_caracteres: number;
  senha_exigir_maiuscula: boolean;
  senha_exigir_numero: boolean;
  senha_exigir_simbolo: boolean;
  logout_automatico_inatividade: boolean;
}

export interface ConfiguracaoSistema {
  tema: 'claro' | 'escuro' | 'auto';
  idioma: string;
  timezone: string;
  formato_data: string;
  formato_moeda: string;
  moeda_padrao: string;
  primeira_pagina: string;
  itens_por_pagina: number;
}

export interface ConfiguracaoNotificacoes {
  email_novos_usuarios: boolean;
  email_tentativas_login: boolean;
  email_alteracoes_config: boolean;
  email_backup_diario: boolean;
  email_relatorios_semanais: boolean;
  notificacao_browser: boolean;
  som_notificacoes: boolean;
}

export interface ConfiguracaoIntegracao {
  webhook_url?: string;
  api_keys: Record<string, string>;
  backup_automatico: boolean;
  backup_frequencia: 'diario' | 'semanal' | 'mensal';
  backup_horario: string;
  manutencao_automatica: boolean;
}

export type TodasConfiguracoes = {
  [CategoriaConfiguracao.SEGURANCA]: ConfiguracaoSeguranca;
  [CategoriaConfiguracao.SISTEMA]: ConfiguracaoSistema;
  [CategoriaConfiguracao.NOTIFICACOES]: ConfiguracaoNotificacoes;
  [CategoriaConfiguracao.INTEGRACAO]: ConfiguracaoIntegracao;
};

/**
 * Configurações padrão para novas empresas
 */
export const CONFIGURACOES_PADRAO: TodasConfiguracoes = {
  [CategoriaConfiguracao.SEGURANCA]: {
    tempo_sessao: 480, // 8 horas
    tentativas_login: 5,
    bloqueio_temporario: 30,
    exigir_2fa: false,
    senha_minima_caracteres: 8,
    senha_exigir_maiuscula: true,
    senha_exigir_numero: true,
    senha_exigir_simbolo: false,
    logout_automatico_inatividade: true
  },
  [CategoriaConfiguracao.SISTEMA]: {
    tema: 'auto',
    idioma: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    formato_data: 'DD/MM/YYYY',
    formato_moeda: 'R$ 0,00',
    moeda_padrao: 'BRL',
    primeira_pagina: '/dashboard',
    itens_por_pagina: 20
  },
  [CategoriaConfiguracao.NOTIFICACOES]: {
    email_novos_usuarios: true,
    email_tentativas_login: true,
    email_alteracoes_config: true,
    email_backup_diario: false,
    email_relatorios_semanais: false,
    notificacao_browser: true,
    som_notificacoes: true
  },
  [CategoriaConfiguracao.INTEGRACAO]: {
    webhook_url: '',
    api_keys: {},
    backup_automatico: true,
    backup_frequencia: 'diario',
    backup_horario: '02:00',
    manutencao_automatica: true
  }
};

/**
 * Interface para retorno do hook
 */
export interface UseConfiguracoes {
  configuracoes: TodasConfiguracoes;
  isLoading: boolean;
  error: string | null;
  carregarConfiguracoes: () => Promise<void>;
  salvarConfiguracao: <T extends CategoriaConfiguracao>(
    categoria: T,
    novasConfigs: TodasConfiguracoes[T]
  ) => Promise<{ success: boolean; error?: string }>;
  obterConfiguracao: <T extends CategoriaConfiguracao>(
    categoria: T
  ) => TodasConfiguracoes[T];
  atualizarConfiguracao: <T extends CategoriaConfiguracao>(
    categoria: T,
    campo: keyof TodasConfiguracoes[T],
    valor: any
  ) => void;
  resetarConfiguracoes: (categoria?: CategoriaConfiguracao) => Promise<{ success: boolean; error?: string }>;
  exportarConfiguracoes: () => string;
  importarConfiguracoes: (dados: string) => Promise<{ success: boolean; error?: string }>;
}

/**
 * Hook para gerenciar configurações da empresa
 */
export const useConfiguracoes = (): UseConfiguracoes => {
  const { empresa, user } = useMultitenantAuth();
  const [configuracoes, setConfiguracoes] = useState<TodasConfiguracoes>(CONFIGURACOES_PADRAO);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carregar configurações da empresa
   */
  const carregarConfiguracoes = useCallback(async () => {
    if (!empresa?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('configuracoes_empresa')
        .select('*')
        .eq('empresa_id', empresa.id);

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      // Inicializar com configurações padrão
      const configsCarregadas = { ...CONFIGURACOES_PADRAO };

      // Aplicar configurações salvas
      data?.forEach(config => {
        const categoria = config.categoria as CategoriaConfiguracao;
        if (categoria in configsCarregadas) {
          configsCarregadas[categoria] = {
            ...configsCarregadas[categoria],
            ...config.configuracoes
          };
        }
      });

      setConfiguracoes(configsCarregadas);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar configurações';
      setError(errorMessage);
      console.error('Erro ao carregar configurações:', err);
    } finally {
      setIsLoading(false);
    }
  }, [empresa?.id]);

  /**
   * Salvar configuração específica
   */
  const salvarConfiguracao = async <T extends CategoriaConfiguracao>(
    categoria: T,
    novasConfigs: TodasConfiguracoes[T]
  ): Promise<{ success: boolean; error?: string }> => {
    if (!empresa?.id) {
      return { success: false, error: 'Empresa não identificada' };
    }

    try {
      setError(null);

      // Validar configurações antes de salvar
      const validacao = validarConfiguracao(categoria, novasConfigs);
      if (!validacao.valido) {
        return { success: false, error: validacao.erro };
      }

      // Upsert das configurações
      const { error: supabaseError } = await supabase
        .from('configuracoes_empresa')
        .upsert({
          empresa_id: empresa.id,
          categoria,
          configuracoes: novasConfigs
        }, {
          onConflict: 'empresa_id,categoria'
        });

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      // Atualizar estado local
      setConfiguracoes(prev => ({
        ...prev,
        [categoria]: novasConfigs
      }));

      // Registrar log de auditoria
      await registrarLogConfiguracao('UPDATE', categoria, novasConfigs);

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar configuração';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Obter configuração específica
   */
  const obterConfiguracao = <T extends CategoriaConfiguracao>(
    categoria: T
  ): TodasConfiguracoes[T] => {
    return configuracoes[categoria];
  };

  /**
   * Atualizar configuração específica (apenas no estado local)
   */
  const atualizarConfiguracao = <T extends CategoriaConfiguracao>(
    categoria: T,
    campo: keyof TodasConfiguracoes[T],
    valor: any
  ): void => {
    setConfiguracoes(prev => ({
      ...prev,
      [categoria]: {
        ...prev[categoria],
        [campo]: valor
      }
    }));
  };

  /**
   * Resetar configurações para padrão
   */
  const resetarConfiguracoes = async (
    categoria?: CategoriaConfiguracao
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (categoria) {
        // Resetar categoria específica
        const configPadrao = CONFIGURACOES_PADRAO[categoria];
        return await salvarConfiguracao(categoria, configPadrao);
      } else {
        // Resetar todas as configurações
        const resultados = await Promise.all(
          Object.entries(CONFIGURACOES_PADRAO).map(([cat, config]) =>
            salvarConfiguracao(cat as CategoriaConfiguracao, config)
          )
        );

        const falhas = resultados.filter(r => !r.success);
        if (falhas.length > 0) {
          return { success: false, error: `Falha ao resetar ${falhas.length} categoria(s)` };
        }

        await registrarLogConfiguracao('RESET', 'TODAS', CONFIGURACOES_PADRAO);
        return { success: true };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao resetar configurações';
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Exportar configurações como JSON
   */
  const exportarConfiguracoes = (): string => {
    const dadosExportacao = {
      empresa: empresa?.nome,
      data_exportacao: new Date().toISOString(),
      configuracoes
    };
    return JSON.stringify(dadosExportacao, null, 2);
  };

  /**
   * Importar configurações de JSON
   */
  const importarConfiguracoes = async (
    dados: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const dadosImportacao = JSON.parse(dados);
      
      if (!dadosImportacao.configuracoes) {
        return { success: false, error: 'Formato de dados inválido' };
      }

      // Validar e importar cada categoria
      const resultados = await Promise.all(
        Object.entries(dadosImportacao.configuracoes).map(([categoria, config]) => {
          const cat = categoria as CategoriaConfiguracao;
          if (cat in CONFIGURACOES_PADRAO) {
            return salvarConfiguracao(cat, config as any);
          }
          return Promise.resolve({ success: true });
        })
      );

      const falhas = resultados.filter(r => !r.success);
      if (falhas.length > 0) {
        return { success: false, error: `Falha ao importar ${falhas.length} categoria(s)` };
      }

      await registrarLogConfiguracao('IMPORT', 'TODAS', dadosImportacao.configuracoes);
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Erro ao processar dados de importação' };
    }
  };

  /**
   * Validar configuração antes de salvar
   */
  const validarConfiguracao = (
    categoria: CategoriaConfiguracao,
    config: any
  ): { valido: boolean; erro?: string } => {
    switch (categoria) {
      case CategoriaConfiguracao.SEGURANCA:
        const seguranca = config as ConfiguracaoSeguranca;
        if (seguranca.tempo_sessao < 30 || seguranca.tempo_sessao > 1440) {
          return { valido: false, erro: 'Tempo de sessão deve estar entre 30 e 1440 minutos' };
        }
        if (seguranca.tentativas_login < 3 || seguranca.tentativas_login > 10) {
          return { valido: false, erro: 'Tentativas de login deve estar entre 3 e 10' };
        }
        if (seguranca.senha_minima_caracteres < 6 || seguranca.senha_minima_caracteres > 20) {
          return { valido: false, erro: 'Tamanho mínimo da senha deve estar entre 6 e 20 caracteres' };
        }
        break;

      case CategoriaConfiguracao.SISTEMA:
        const sistema = config as ConfiguracaoSistema;
        if (sistema.itens_por_pagina < 5 || sistema.itens_por_pagina > 200) {
          return { valido: false, erro: 'Itens por página deve estar entre 5 e 200' };
        }
        break;

      case CategoriaConfiguracao.INTEGRACAO:
        const integracao = config as ConfiguracaoIntegracao;
        if (integracao.webhook_url && !isValidUrl(integracao.webhook_url)) {
          return { valido: false, erro: 'URL do webhook inválida' };
        }
        break;
    }

    return { valido: true };
  };

  /**
   * Registrar log de auditoria para alterações de configuração
   */
  const registrarLogConfiguracao = async (
    acao: string,
    categoria: string | CategoriaConfiguracao,
    detalhes: any
  ): Promise<void> => {
    try {
      await supabase.rpc('registrar_log_auditoria', {
        p_empresa_id: empresa?.id,
        p_usuario_id: user?.user_id,
        p_acao: `CONFIG_${acao}`,
        p_recurso: `configuracoes_${categoria}`,
        p_detalhes: {
          categoria,
          acao,
          timestamp: new Date().toISOString(),
          detalhes
        }
      });
    } catch (error) {
      console.error('Erro ao registrar log de configuração:', error);
    }
  };

  /**
   * Validar URL
   */
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Carregar configurações quando a empresa mudar
  useEffect(() => {
    if (empresa?.id) {
      carregarConfiguracoes();
    }
  }, [empresa?.id, carregarConfiguracoes]);

  return {
    configuracoes,
    isLoading,
    error,
    carregarConfiguracoes,
    salvarConfiguracao,
    obterConfiguracao,
    atualizarConfiguracao,
    resetarConfiguracoes,
    exportarConfiguracoes,
    importarConfiguracoes
  };
};

/**
 * Hook para configurações específicas de uma categoria
 */
export const useConfiguracaoCategoria = <T extends CategoriaConfiguracao>(
  categoria: T
) => {
  const {
    configuracoes,
    isLoading,
    error,
    salvarConfiguracao,
    atualizarConfiguracao
  } = useConfiguracoes();

  const config = configuracoes[categoria];

  const salvar = (novasConfigs: TodasConfiguracoes[T]) => {
    return salvarConfiguracao(categoria, novasConfigs);
  };

  const atualizar = (campo: keyof TodasConfiguracoes[T], valor: any) => {
    atualizarConfiguracao(categoria, campo, valor);
  };

  return {
    configuracao: config,
    isLoading,
    error,
    salvar,
    atualizar
  };
};

/**
 * Hook para aplicar configurações do sistema
 */
export const useAplicarConfiguracoes = () => {
  const { configuracoes } = useConfiguracoes();

  // Aplicar tema
  useEffect(() => {
    const tema = configuracoes.sistema.tema;
    const root = document.documentElement;
    
    if (tema === 'escuro') {
      root.classList.add('dark');
    } else if (tema === 'claro') {
      root.classList.remove('dark');
    } else {
      // Auto - detectar preferência do sistema
      const prefereDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefereDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [configuracoes.sistema.tema]);

  // Aplicar idioma
  useEffect(() => {
    document.documentElement.lang = configuracoes.sistema.idioma;
  }, [configuracoes.sistema.idioma]);

  // Configurar notificações do navegador
  useEffect(() => {
    if (configuracoes.notificacoes.notificacao_browser) {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [configuracoes.notificacoes.notificacao_browser]);

  return {
    tema: configuracoes.sistema.tema,
    idioma: configuracoes.sistema.idioma,
    timezone: configuracoes.sistema.timezone,
    formatoData: configuracoes.sistema.formato_data,
    moeda: configuracoes.sistema.moeda_padrao,
    itensPorPagina: configuracoes.sistema.itens_por_pagina
  };
};