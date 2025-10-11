import { supabase } from '../lib/supabase';
import { PapelUsuario, CategoriaConfiguracao } from '../types/multitenant';
import { PrivilegeUtils } from '../utils/privilegeUtils';

export interface ConfiguracaoEmpresaData {
  categoria: string;
  configuracoes: Record<string, any>;
}

export interface ConfiguracaoGeral {
  nome_empresa: string;
  logo_url?: string;
  tema: 'claro' | 'escuro' | 'auto';
  idioma: string;
  timezone: string;
  formato_data: string;
}

export interface ConfiguracaoSeguranca {
  tempo_sessao: number;
  tentativas_login: number;
  bloqueio_temporario: number;
  exigir_2fa: boolean;
  whitelist_ips?: string[];
  politica_senha: {
    min_caracteres: number;
    exigir_maiuscula: boolean;
    exigir_numero: boolean;
    exigir_simbolo: boolean;
  };
}

export interface ConfiguracaoSistema {
  backup_automatico: boolean;
  retencao_logs_dias: number;
  limite_usuarios: number;
  modulos_habilitados: string[];
}

export interface ConfiguracaoNotificacoes {
  email_novos_usuarios: boolean;
  email_tentativas_login: boolean;
  email_alteracoes_config: boolean;
  webhook_eventos: string[];
}

export interface ConfiguracaoIntegracao {
  webhook_url?: string;
  api_keys: Record<string, string>;
  integracao_externa: {
    erp_ativo: boolean;
    api_endpoint?: string;
    token_acesso?: string;
  };
}

export class ConfigurationService {
  /**
   * Obtém as categorias de configuração acessíveis para o usuário atual
   */
  static async getCategoriasAcessiveis(): Promise<string[]> {
    try {
      const { data: usuario } = await supabase
        .from('usuarios_empresa')
        .select('papel')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!usuario) return [];

      return PrivilegeUtils.getCategoriasAcessiveis(usuario.papel as PapelUsuario);
    } catch (error) {
      console.error('Erro ao obter categorias acessíveis:', error);
      return [];
    }
  }

  /**
   * Verifica se o usuário atual pode acessar uma categoria específica
   */
  static async podeAcessarCategoria(categoria: string): Promise<boolean> {
    try {
      const { data: usuario } = await supabase
        .from('usuarios_empresa')
        .select('papel')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!usuario) return false;

      return PrivilegeUtils.podeAcessarConfiguracao(usuario.papel as PapelUsuario, categoria);
    } catch (error) {
      console.error('Erro ao verificar acesso à categoria:', error);
      return false;
    }
  }

  /**
   * Obtém todas as configurações acessíveis para o usuário atual
   */
  static async obterConfiguracoes(): Promise<{ 
    data: Record<string, any>; 
    categorias_acessiveis: string[];
    error?: string 
  }> {
    try {
      const categoriasAcessiveis = await this.getCategoriasAcessiveis();
      
      if (categoriasAcessiveis.length === 0) {
        return { 
          data: {}, 
          categorias_acessiveis: [],
          error: 'Sem acesso a configurações' 
        };
      }

      const { data: configs, error } = await supabase
        .from('configuracoes_empresa')
        .select('categoria, configuracoes')
        .in('categoria', categoriasAcessiveis);

      if (error) {
        console.error('Erro ao obter configurações:', error);
        return { 
          data: {}, 
          categorias_acessiveis: categoriasAcessiveis,
          error: error.message 
        };
      }

      const configuracoes = configs.reduce((acc, config) => {
        acc[config.categoria] = config.configuracoes;
        return acc;
      }, {} as Record<string, any>);

      return { 
        data: configuracoes, 
        categorias_acessiveis: categoriasAcessiveis 
      };
    } catch (error) {
      console.error('Erro ao obter configurações:', error);
      return { 
        data: {}, 
        categorias_acessiveis: [],
        error: 'Erro interno do servidor' 
      };
    }
  }

  /**
   * Obtém configuração de uma categoria específica
   */
  static async obterConfiguracaoCategoria<T = any>(categoria: string): Promise<{
    data: T | null;
    error?: string;
  }> {
    try {
      const podeAcessar = await this.podeAcessarCategoria(categoria);
      
      if (!podeAcessar) {
        return { 
          data: null, 
          error: `Sem acesso à categoria ${categoria}` 
        };
      }

      const { data, error } = await supabase
        .from('configuracoes_empresa')
        .select('configuracoes')
        .eq('categoria', categoria)
        .single();

      if (error) {
        console.error(`Erro ao obter configuração ${categoria}:`, error);
        return { data: null, error: error.message };
      }

      return { data: data.configuracoes as T };
    } catch (error) {
      console.error(`Erro ao obter configuração ${categoria}:`, error);
      return { data: null, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Atualiza configuração de uma categoria específica
   */
  static async atualizarConfiguracaoCategoria(
    categoria: string, 
    configuracoes: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const podeAcessar = await this.podeAcessarCategoria(categoria);
      
      if (!podeAcessar) {
        return { 
          success: false, 
          error: `Sem privilégios para alterar configurações de ${categoria}` 
        };
      }

      // Validar configurações baseado na categoria
      const validacao = this.validarConfiguracaoCategoria(categoria, configuracoes);
      if (!validacao.valida) {
        return { success: false, error: validacao.erro };
      }

      const { error } = await supabase
        .from('configuracoes_empresa')
        .upsert({
          categoria,
          configuracoes
        }, {
          onConflict: 'empresa_id,categoria'
        });

      if (error) {
        console.error(`Erro ao atualizar configuração ${categoria}:`, error);
        return { success: false, error: error.message };
      }

      // Registrar no log de auditoria
      await this.registrarAlteracaoConfiguracao(categoria, configuracoes);

      return { success: true };
    } catch (error) {
      console.error(`Erro ao atualizar configuração ${categoria}:`, error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Valida configurações baseado na categoria
   */
  private static validarConfiguracaoCategoria(
    categoria: string, 
    configuracoes: Record<string, any>
  ): { valida: boolean; erro?: string } {
    try {
      switch (categoria) {
        case 'geral':
          return this.validarConfiguracaoGeral(configuracoes);
        case 'seguranca':
          return this.validarConfiguracaoSeguranca(configuracoes);
        case 'sistema':
          return this.validarConfiguracaoSistema(configuracoes);
        case 'notificacoes':
          return this.validarConfiguracaoNotificacoes(configuracoes);
        case 'integracao':
          return this.validarConfiguracaoIntegracao(configuracoes);
        default:
          return { valida: true }; // Categoria desconhecida, permitir
      }
    } catch (error) {
      return { valida: false, erro: 'Erro na validação das configurações' };
    }
  }

  private static validarConfiguracaoGeral(config: any): { valida: boolean; erro?: string } {
    if (!config.nome_empresa || config.nome_empresa.trim().length === 0) {
      return { valida: false, erro: 'Nome da empresa é obrigatório' };
    }
    
    if (config.tema && !['claro', 'escuro', 'auto'].includes(config.tema)) {
      return { valida: false, erro: 'Tema deve ser: claro, escuro ou auto' };
    }
    
    return { valida: true };
  }

  private static validarConfiguracaoSeguranca(config: any): { valida: boolean; erro?: string } {
    if (config.tempo_sessao && (config.tempo_sessao < 5 || config.tempo_sessao > 1440)) {
      return { valida: false, erro: 'Tempo de sessão deve estar entre 5 e 1440 minutos' };
    }
    
    if (config.tentativas_login && (config.tentativas_login < 3 || config.tentativas_login > 10)) {
      return { valida: false, erro: 'Tentativas de login deve estar entre 3 e 10' };
    }
    
    if (config.bloqueio_temporario && (config.bloqueio_temporario < 1 || config.bloqueio_temporario > 60)) {
      return { valida: false, erro: 'Bloqueio temporário deve estar entre 1 e 60 minutos' };
    }
    
    return { valida: true };
  }

  private static validarConfiguracaoSistema(config: any): { valida: boolean; erro?: string } {
    if (config.retencao_logs_dias && (config.retencao_logs_dias < 30 || config.retencao_logs_dias > 365)) {
      return { valida: false, erro: 'Retenção de logs deve estar entre 30 e 365 dias' };
    }
    
    if (config.limite_usuarios && (config.limite_usuarios < 1 || config.limite_usuarios > 1000)) {
      return { valida: false, erro: 'Limite de usuários deve estar entre 1 e 1000' };
    }
    
    return { valida: true };
  }

  private static validarConfiguracaoNotificacoes(config: any): { valida: boolean; erro?: string } {
    // Validações básicas para notificações
    return { valida: true };
  }

  private static validarConfiguracaoIntegracao(config: any): { valida: boolean; erro?: string } {
    if (config.webhook_url && !this.isValidUrl(config.webhook_url)) {
      return { valida: false, erro: 'URL do webhook inválida' };
    }
    
    return { valida: true };
  }

  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Registra alteração de configuração no log de auditoria
   */
  private static async registrarAlteracaoConfiguracao(
    categoria: string, 
    configuracoes: Record<string, any>
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data: empresa } = await supabase
        .from('usuarios_empresa')
        .select('empresa_id')
        .eq('user_id', user.id)
        .single();

      if (!empresa) return;

      await supabase
        .from('logs_auditoria')
        .insert({
          empresa_id: empresa.empresa_id,
          usuario_id: user.id,
          acao: categoria === 'seguranca' ? 'CONFIGURACAO_SEGURANCA_ALTERADA' : 'CONFIGURACAO_ALTERADA',
          recurso: 'configuracoes_empresa',
          detalhes: {
            categoria,
            configuracoes_alteradas: Object.keys(configuracoes)
          }
        });
    } catch (error) {
      console.error('Erro ao registrar alteração de configuração:', error);
    }
  }

  /**
   * Obtém configurações padrão para uma categoria
   */
  static getConfiguracoesPadrao(categoria: string): Record<string, any> {
    const padroes = {
      geral: {
        nome_empresa: '',
        tema: 'claro',
        idioma: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        formato_data: 'DD/MM/YYYY'
      },
      seguranca: {
        tempo_sessao: 480,
        tentativas_login: 5,
        bloqueio_temporario: 15,
        exigir_2fa: false,
        politica_senha: {
          min_caracteres: 8,
          exigir_maiuscula: true,
          exigir_numero: true,
          exigir_simbolo: false
        }
      },
      sistema: {
        backup_automatico: true,
        retencao_logs_dias: 90,
        limite_usuarios: 50,
        modulos_habilitados: [
          'dashboard', 'monitor_bar', 'atendimento_bar',
          'monitor_cozinha', 'gestao_caixa', 'clientes',
          'funcionarios', 'socios', 'configuracoes', 'relatorios'
        ]
      },
      notificacoes: {
        email_novos_usuarios: true,
        email_tentativas_login: true,
        email_alteracoes_config: true,
        webhook_eventos: []
      },
      integracao: {
        api_keys: {},
        integracao_externa: {
          erp_ativo: false
        }
      }
    };

    return padroes[categoria as keyof typeof padroes] || {};
  }

  /**
   * Inicializa configurações padrão para uma empresa
   */
  static async inicializarConfiguracoesPadrao(empresaId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const categorias = ['geral', 'seguranca', 'sistema', 'notificacoes', 'integracao'];
      
      const configuracoes = categorias.map(categoria => ({
        empresa_id: empresaId,
        categoria,
        configuracoes: this.getConfiguracoesPadrao(categoria)
      }));

      const { error } = await supabase
        .from('configuracoes_empresa')
        .upsert(configuracoes, {
          onConflict: 'empresa_id,categoria',
          ignoreDuplicates: true
        });

      if (error) {
        console.error('Erro ao inicializar configurações padrão:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao inicializar configurações padrão:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Obtém informações sobre restrições de acesso por categoria
   */
  static getInfoRestricaoCategoria(categoria: string): {
    papeis_permitidos: PapelUsuario[];
    descricao: string;
    nivel_criticidade: 'baixo' | 'medio' | 'alto' | 'critico';
  } {
    const restricoes = {
      geral: {
        papeis_permitidos: [PapelUsuario.SUPER_ADMIN, PapelUsuario.ADMIN],
        descricao: 'Configurações gerais da empresa (tema, idioma, etc.)',
        nivel_criticidade: 'baixo' as const
      },
      seguranca: {
        papeis_permitidos: [PapelUsuario.SUPER_ADMIN],
        descricao: 'Configurações críticas de segurança (senhas, 2FA, etc.)',
        nivel_criticidade: 'critico' as const
      },
      sistema: {
        papeis_permitidos: [PapelUsuario.SUPER_ADMIN],
        descricao: 'Configurações do sistema (backup, logs, limites)',
        nivel_criticidade: 'alto' as const
      },
      notificacoes: {
        papeis_permitidos: [PapelUsuario.SUPER_ADMIN, PapelUsuario.ADMIN],
        descricao: 'Configurações de notificações e alertas',
        nivel_criticidade: 'medio' as const
      },
      integracao: {
        papeis_permitidos: [PapelUsuario.SUPER_ADMIN],
        descricao: 'Configurações de integrações externas e APIs',
        nivel_criticidade: 'alto' as const
      }
    };

    return restricoes[categoria as keyof typeof restricoes] || {
      papeis_permitidos: [],
      descricao: 'Categoria desconhecida',
      nivel_criticidade: 'baixo' as const
    };
  }
}