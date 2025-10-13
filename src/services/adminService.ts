import { supabase } from '../lib/supabase';
import { PapelUsuario, UsuarioEmpresa, PrivilegiosAdmin } from '../types/multitenant';

export class AdminService {
  /**
   * Verifica se o usuário atual tem um privilégio específico
   */
  static async verificarPrivilegio(privilegio: keyof PrivilegiosAdmin): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('tem_privilegio_admin', {
        privilegio: privilegio
      });

      if (error) {
        console.error('Erro ao verificar privilégio:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Erro ao verificar privilégio:', error);
      return false;
    }
  }

  /**
   * Verifica se o usuário atual é o primeiro usuário da empresa
   */
  static async isPrimeiroUsuario(): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('is_primeiro_usuario');

      if (error) {
        console.error('Erro ao verificar primeiro usuário:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Erro ao verificar primeiro usuário:', error);
      return false;
    }
  }

  /**
   * Obtém os dados completos do usuário atual incluindo papel e privilégios
   */
  static async obterDadosUsuarioAtual(): Promise<UsuarioEmpresa | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      const { data, error } = await supabase
        .from('usuarios_empresa')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Erro ao obter dados do usuário:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao obter dados do usuário:', error);
      return null;
    }
  }

  /**
   * Atualiza o papel de um usuário (apenas para usuários com privilégios)
   */
  static async atualizarPapelUsuario(
    usuarioId: string, 
    novoPapel: PapelUsuario,
    motivo?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Verificar se tem privilégio para alterar papéis
      const podeAlterar = await this.verificarPrivilegio('gerenciar_usuarios');
      
      if (!podeAlterar) {
        return { success: false, error: 'Sem privilégios para alterar papéis de usuário' };
      }

      // Obter dados do usuário atual para verificar restrições
      const usuarioAtual = await this.obterDadosUsuarioAtual();
      
      if (!usuarioAtual) {
        return { success: false, error: 'Usuário atual não encontrado' };
      }

      // Verificar se pode criar/alterar para este papel específico
      const podeGerenciar = this.podeGerenciarPapel(usuarioAtual.papel as PapelUsuario, novoPapel);
      
      if (!podeGerenciar) {
        return { success: false, error: `Sem privilégios para definir papel ${novoPapel}` };
      }

      // Atualizar o papel
      const { error } = await supabase
        .from('usuarios_empresa')
        .update({ papel: novoPapel })
        .eq('id', usuarioId);

      if (error) {
        console.error('Erro ao atualizar papel:', error);
        return { success: false, error: error.message };
      }

      // Registrar no log de auditoria
      await this.registrarMudancaPapel(usuarioId, novoPapel, motivo);

      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar papel do usuário:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Verifica se um papel pode gerenciar outro papel
   */
  static podeGerenciarPapel(papelAtual: PapelUsuario, papelAlvo: PapelUsuario): boolean {
    const hierarquia = {
      [PapelUsuario.SUPER_ADMIN]: [PapelUsuario.SUPER_ADMIN, PapelUsuario.ADMIN, PapelUsuario.MANAGER, PapelUsuario.USER],
      [PapelUsuario.ADMIN]: [PapelUsuario.MANAGER, PapelUsuario.USER],
      [PapelUsuario.MANAGER]: [PapelUsuario.USER],
      [PapelUsuario.USER]: []
    };

    return hierarquia[papelAtual]?.includes(papelAlvo) || false;
  }

  /**
   * Registra mudança de papel no log de auditoria
   */
  private static async registrarMudancaPapel(
    usuarioId: string, 
    novoPapel: PapelUsuario, 
    motivo?: string
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
          acao: 'MUDANCA_PAPEL_USUARIO',
          recurso: 'usuarios_empresa',
          detalhes: {
            usuario_afetado: usuarioId,
            novo_papel: novoPapel,
            motivo: motivo || 'Não informado'
          }
        });
    } catch (error) {
      console.error('Erro ao registrar mudança de papel:', error);
    }
  }

  /**
   * Lista usuários da empresa com filtros por papel
   */
  static async listarUsuarios(filtros?: {
    papel?: PapelUsuario;
    status?: string;
    busca?: string;
  }): Promise<{ data: UsuarioEmpresa[]; error?: string }> {
    try {
      let query = supabase
        .from('usuarios_empresa')
        .select('*')
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filtros?.papel) {
        query = query.eq('papel', filtros.papel);
      }

      if (filtros?.status) {
        query = query.eq('status', filtros.status);
      }

      if (filtros?.busca) {
        query = query.or(`nome_completo.ilike.%${filtros.busca}%,email.ilike.%${filtros.busca}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao listar usuários:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [] };
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      return { data: [], error: 'Erro interno do servidor' };
    }
  }

  /**
   * Cria um novo usuário com papel específico
   */
  static async criarUsuario(dadosUsuario: {
    nome_completo: string;
    email: string;
    telefone?: string;
    cargo?: string;
    papel: PapelUsuario;
  }): Promise<{ success: boolean; error?: string; userId?: string }> {
    try {
      // Verificar privilégios
      const podeGerenciar = await this.verificarPrivilegio('gerenciar_usuarios');
      
      if (!podeGerenciar) {
        return { success: false, error: 'Sem privilégios para criar usuários' };
      }

      // Verificar se pode criar este papel específico
      const usuarioAtual = await this.obterDadosUsuarioAtual();
      
      if (!usuarioAtual) {
        return { success: false, error: 'Usuário atual não encontrado' };
      }

      const podeGerenciarPapel = this.podeGerenciarPapel(
        usuarioAtual.papel as PapelUsuario, 
        dadosUsuario.papel
      );
      
      if (!podeGerenciarPapel) {
        return { success: false, error: `Sem privilégios para criar usuário com papel ${dadosUsuario.papel}` };
      }

      // Criar usuário no auth (isso seria feito via convite por email)
      // Por enquanto, apenas criar o registro na tabela usuarios_empresa
      const { data, error } = await supabase
        .from('usuarios_empresa')
        .insert({
          empresa_id: usuarioAtual.empresa_id,
          nome_completo: dadosUsuario.nome_completo,
          email: dadosUsuario.email,
          telefone: dadosUsuario.telefone,
          cargo: dadosUsuario.cargo,
          papel: dadosUsuario.papel,
          senha_provisoria: true,
          status: 'ativo'
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar usuário:', error);
        return { success: false, error: error.message };
      }

      return { success: true, userId: data.id };
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Obtém estatísticas administrativas
   */
  static async obterEstatisticasAdmin(): Promise<{
    total_usuarios: number;
    usuarios_por_papel: Record<PapelUsuario, number>;
    usuarios_ativos: number;
    usuarios_inativos: number;
  }> {
    try {
      const { data: usuarios, error } = await supabase
        .from('usuarios_empresa')
        .select('papel, status');

      if (error) {
        console.error('Erro ao obter estatísticas:', error);
        return {
          total_usuarios: 0,
          usuarios_por_papel: {
            [PapelUsuario.SUPER_ADMIN]: 0,
            [PapelUsuario.ADMIN]: 0,
            [PapelUsuario.MANAGER]: 0,
            [PapelUsuario.USER]: 0
          },
          usuarios_ativos: 0,
          usuarios_inativos: 0
        };
      }

      const stats = {
        total_usuarios: usuarios.length,
        usuarios_por_papel: {
          [PapelUsuario.SUPER_ADMIN]: 0,
          [PapelUsuario.ADMIN]: 0,
          [PapelUsuario.MANAGER]: 0,
          [PapelUsuario.USER]: 0
        },
        usuarios_ativos: 0,
        usuarios_inativos: 0
      };

      usuarios.forEach(usuario => {
        // Contar por papel
        if (usuario.papel in stats.usuarios_por_papel) {
          stats.usuarios_por_papel[usuario.papel as PapelUsuario]++;
        }

        // Contar por status
        if (usuario.status === 'ativo') {
          stats.usuarios_ativos++;
        } else {
          stats.usuarios_inativos++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return {
        total_usuarios: 0,
        usuarios_por_papel: {
          [PapelUsuario.SUPER_ADMIN]: 0,
          [PapelUsuario.ADMIN]: 0,
          [PapelUsuario.MANAGER]: 0,
          [PapelUsuario.USER]: 0
        },
        usuarios_ativos: 0,
        usuarios_inativos: 0
      };
    }
  }
}