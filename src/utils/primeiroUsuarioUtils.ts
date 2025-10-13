import { supabase } from '../lib/supabase';
import { PapelUsuario } from '../types/multitenant';

/**
 * Utilitários para gerenciar o processo do primeiro usuário
 */
export class PrimeiroUsuarioUtils {
  /**
   * Verifica se uma empresa já tem um primeiro usuário
   */
  static async empresaTemPrimeiroUsuario(empresaId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('usuarios_empresa')
        .select('id')
        .eq('empresa_id', empresaId)
        .eq('is_primeiro_usuario', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Erro ao verificar primeiro usuário:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Erro ao verificar primeiro usuário:', error);
      return false;
    }
  }

  /**
   * Cria o primeiro usuário de uma empresa com configuração automática
   */
  static async criarPrimeiroUsuario(dadosUsuario: {
    user_id: string;
    empresa_id: string;
    nome_completo: string;
    email: string;
    telefone?: string;
    cargo?: string;
  }): Promise<{ success: boolean; error?: string; usuarioId?: string }> {
    try {
      // Verificar se já existe um primeiro usuário para esta empresa
      const jaTemPrimeiro = await this.empresaTemPrimeiroUsuario(dadosUsuario.empresa_id);
      
      if (jaTemPrimeiro) {
        return { 
          success: false, 
          error: 'Esta empresa já possui um primeiro usuário (SUPER_ADMIN)' 
        };
      }

      // Criar o usuário marcado como primeiro usuário
      // O trigger validate_primeiro_usuario automaticamente definirá papel = 'SUPER_ADMIN'
      // O trigger setup_primeiro_usuario criará configurações e permissões automaticamente
      const { data, error } = await supabase
        .from('usuarios_empresa')
        .insert({
          user_id: dadosUsuario.user_id,
          empresa_id: dadosUsuario.empresa_id,
          nome_completo: dadosUsuario.nome_completo,
          email: dadosUsuario.email,
          telefone: dadosUsuario.telefone,
          cargo: dadosUsuario.cargo,
          is_primeiro_usuario: true, // Isso ativará os triggers
          status: 'ativo'
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar primeiro usuário:', error);
        return { success: false, error: error.message };
      }

      return { success: true, usuarioId: data.id };
    } catch (error) {
      console.error('Erro ao criar primeiro usuário:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Valida se um usuário pode ser marcado como primeiro usuário
   */
  static async validarPrimeiroUsuario(
    empresaId: string, 
    usuarioId?: string
  ): Promise<{ valido: boolean; motivo?: string }> {
    try {
      // Verificar se já existe um primeiro usuário
      const { data: existente, error } = await supabase
        .from('usuarios_empresa')
        .select('id, nome_completo')
        .eq('empresa_id', empresaId)
        .eq('is_primeiro_usuario', true);

      if (error) {
        console.error('Erro ao validar primeiro usuário:', error);
        return { valido: false, motivo: 'Erro ao verificar dados existentes' };
      }

      // Se não há primeiro usuário, pode criar
      if (!existente || existente.length === 0) {
        return { valido: true };
      }

      // Se já existe e é o mesmo usuário (edição), pode continuar
      if (usuarioId && existente.some(u => u.id === usuarioId)) {
        return { valido: true };
      }

      // Se já existe outro primeiro usuário, não pode
      return { 
        valido: false, 
        motivo: `Já existe um primeiro usuário: ${existente[0].nome_completo}` 
      };
    } catch (error) {
      console.error('Erro ao validar primeiro usuário:', error);
      return { valido: false, motivo: 'Erro interno do servidor' };
    }
  }

  /**
   * Obtém informações do primeiro usuário de uma empresa
   */
  static async obterPrimeiroUsuario(empresaId: string) {
    try {
      const { data, error } = await supabase
        .from('usuarios_empresa')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('is_primeiro_usuario', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao obter primeiro usuário:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao obter primeiro usuário:', error);
      return null;
    }
  }

  /**
   * Verifica se as configurações automáticas foram criadas para uma empresa
   */
  static async verificarConfiguracaoesAutomaticas(empresaId: string): Promise<{
    criadas: boolean;
    categorias_faltando: string[];
  }> {
    try {
      const { data, error } = await supabase
        .from('configuracoes_empresa')
        .select('categoria')
        .eq('empresa_id', empresaId);

      if (error) {
        console.error('Erro ao verificar configurações:', error);
        return { criadas: false, categorias_faltando: [] };
      }

      const categoriasExistentes = data.map(c => c.categoria);
      const categoriasEsperadas = ['geral', 'seguranca', 'sistema', 'notificacoes', 'integracao'];
      const categoriasFaltando = categoriasEsperadas.filter(cat => !categoriasExistentes.includes(cat));

      return {
        criadas: categoriasFaltando.length === 0,
        categorias_faltando: categoriasFaltando
      };
    } catch (error) {
      console.error('Erro ao verificar configurações:', error);
      return { criadas: false, categorias_faltando: [] };
    }
  }

  /**
   * Verifica se as permissões automáticas foram criadas para um usuário
   */
  static async verificarPermissoesAutomaticas(usuarioEmpresaId: string): Promise<{
    criadas: boolean;
    modulos_faltando: string[];
  }> {
    try {
      const { data, error } = await supabase
        .from('permissoes_usuario')
        .select('modulo')
        .eq('usuario_empresa_id', usuarioEmpresaId);

      if (error) {
        console.error('Erro ao verificar permissões:', error);
        return { criadas: false, modulos_faltando: [] };
      }

      const modulosExistentes = data.map(p => p.modulo);
      const modulosEsperados = [
        'dashboard', 'monitor_bar', 'atendimento_bar', 
        'monitor_cozinha', 'gestao_caixa', 'clientes', 
        'funcionarios', 'socios', 'configuracoes', 'relatorios'
      ];
      const modulosFaltando = modulosEsperados.filter(mod => !modulosExistentes.includes(mod));

      return {
        criadas: modulosFaltando.length === 0,
        modulos_faltando: modulosFaltando
      };
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      return { criadas: false, modulos_faltando: [] };
    }
  }

  /**
   * Força a criação das configurações padrão se não existirem
   */
  static async criarConfiguracoesPadrao(empresaId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const configuracoesPadrao = [
        {
          empresa_id: empresaId,
          categoria: 'geral',
          configuracoes: {
            tema: 'claro',
            idioma: 'pt-BR',
            timezone: 'America/Sao_Paulo'
          }
        },
        {
          empresa_id: empresaId,
          categoria: 'seguranca',
          configuracoes: {
            tempo_sessao: 480,
            tentativas_login: 5,
            bloqueio_temporario: 15
          }
        },
        {
          empresa_id: empresaId,
          categoria: 'sistema',
          configuracoes: {
            backup_automatico: true,
            retencao_logs_dias: 90,
            limite_usuarios: 50
          }
        },
        {
          empresa_id: empresaId,
          categoria: 'notificacoes',
          configuracoes: {
            email_novos_usuarios: true,
            email_tentativas_login: true
          }
        },
        {
          empresa_id: empresaId,
          categoria: 'integracao',
          configuracoes: {}
        }
      ];

      const { error } = await supabase
        .from('configuracoes_empresa')
        .upsert(configuracoesPadrao, { 
          onConflict: 'empresa_id,categoria',
          ignoreDuplicates: true 
        });

      if (error) {
        console.error('Erro ao criar configurações padrão:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao criar configurações padrão:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Força a criação das permissões completas para um usuário
   */
  static async criarPermissoesCompletas(usuarioEmpresaId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const modulos = [
        'dashboard', 'monitor_bar', 'atendimento_bar', 
        'monitor_cozinha', 'gestao_caixa', 'clientes', 
        'funcionarios', 'socios', 'configuracoes', 'relatorios'
      ];

      const permissoes = modulos.map(modulo => ({
        usuario_empresa_id: usuarioEmpresaId,
        modulo,
        permissoes: {
          visualizar: true,
          criar: true,
          editar: true,
          excluir: true,
          administrar: true
        }
      }));

      const { error } = await supabase
        .from('permissoes_usuario')
        .upsert(permissoes, { 
          onConflict: 'usuario_empresa_id,modulo',
          ignoreDuplicates: true 
        });

      if (error) {
        console.error('Erro ao criar permissões completas:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao criar permissões completas:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }
}