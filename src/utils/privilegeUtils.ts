import { PapelUsuario, PrivilegiosAdmin, PRIVILEGIOS_POR_PAPEL } from '../types/multitenant';

/**
 * Utilitários para gerenciamento de privilégios administrativos
 */
export class PrivilegeUtils {
  /**
   * Obtém os privilégios para um papel específico
   */
  static getPrivilegiosPorPapel(papel: PapelUsuario): PrivilegiosAdmin {
    return PRIVILEGIOS_POR_PAPEL[papel] || PRIVILEGIOS_POR_PAPEL[PapelUsuario.USER];
  }

  /**
   * Verifica se um papel tem um privilégio específico
   */
  static temPrivilegio(papel: PapelUsuario, privilegio: keyof PrivilegiosAdmin): boolean {
    const privilegios = this.getPrivilegiosPorPapel(papel);
    return privilegios[privilegio] || false;
  }

  /**
   * Obtém a lista de privilégios ativos para um papel
   */
  static getPrivilegiosAtivos(papel: PapelUsuario): (keyof PrivilegiosAdmin)[] {
    const privilegios = this.getPrivilegiosPorPapel(papel);
    return Object.entries(privilegios)
      .filter(([_, ativo]) => ativo)
      .map(([privilegio]) => privilegio as keyof PrivilegiosAdmin);
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
   * Obtém os papéis que um papel pode gerenciar
   */
  static getPapeisGerenciaveis(papel: PapelUsuario): PapelUsuario[] {
    const hierarquia = {
      [PapelUsuario.SUPER_ADMIN]: [PapelUsuario.SUPER_ADMIN, PapelUsuario.ADMIN, PapelUsuario.MANAGER, PapelUsuario.USER],
      [PapelUsuario.ADMIN]: [PapelUsuario.MANAGER, PapelUsuario.USER],
      [PapelUsuario.MANAGER]: [PapelUsuario.USER],
      [PapelUsuario.USER]: []
    };

    return hierarquia[papel] || [];
  }

  /**
   * Verifica se um papel pode acessar uma categoria de configuração
   */
  static podeAcessarConfiguracao(papel: PapelUsuario, categoria: string): boolean {
    const acessoConfiguracoes = {
      geral: [PapelUsuario.SUPER_ADMIN, PapelUsuario.ADMIN],
      seguranca: [PapelUsuario.SUPER_ADMIN],
      sistema: [PapelUsuario.SUPER_ADMIN],
      notificacoes: [PapelUsuario.SUPER_ADMIN, PapelUsuario.ADMIN],
      integracao: [PapelUsuario.SUPER_ADMIN]
    };

    return acessoConfiguracoes[categoria as keyof typeof acessoConfiguracoes]?.includes(papel) || false;
  }

  /**
   * Obtém as categorias de configuração acessíveis para um papel
   */
  static getCategoriasAcessiveis(papel: PapelUsuario): string[] {
    const todasCategorias = ['geral', 'seguranca', 'sistema', 'notificacoes', 'integracao'];
    return todasCategorias.filter(categoria => this.podeAcessarConfiguracao(papel, categoria));
  }

  /**
   * Obtém o nível hierárquico de um papel (maior número = mais privilégios)
   */
  static getNivelHierarquico(papel: PapelUsuario): number {
    const niveis = {
      [PapelUsuario.SUPER_ADMIN]: 4,
      [PapelUsuario.ADMIN]: 3,
      [PapelUsuario.MANAGER]: 2,
      [PapelUsuario.USER]: 1
    };

    return niveis[papel] || 0;
  }

  /**
   * Compara dois papéis e retorna se o primeiro tem mais privilégios que o segundo
   */
  static temMaisPrivilegios(papel1: PapelUsuario, papel2: PapelUsuario): boolean {
    return this.getNivelHierarquico(papel1) > this.getNivelHierarquico(papel2);
  }

  /**
   * Valida se uma operação é permitida baseada nos papéis envolvidos
   */
  static validarOperacao(
    papelExecutor: PapelUsuario,
    papelAlvo: PapelUsuario,
    operacao: 'criar' | 'editar' | 'excluir' | 'visualizar'
  ): { permitido: boolean; motivo?: string } {
    // Regras básicas de hierarquia
    if (operacao === 'visualizar') {
      // Todos podem visualizar usuários do mesmo nível ou inferior
      if (this.getNivelHierarquico(papelExecutor) >= this.getNivelHierarquico(papelAlvo)) {
        return { permitido: true };
      }
      return { permitido: false, motivo: 'Sem privilégios para visualizar este usuário' };
    }

    if (operacao === 'criar') {
      // Pode criar usuários de nível inferior
      if (this.podeGerenciarPapel(papelExecutor, papelAlvo)) {
        return { permitido: true };
      }
      return { permitido: false, motivo: `Sem privilégios para criar usuário com papel ${papelAlvo}` };
    }

    if (operacao === 'editar' || operacao === 'excluir') {
      // Pode editar/excluir usuários de nível inferior
      if (this.temMaisPrivilegios(papelExecutor, papelAlvo)) {
        return { permitido: true };
      }
      
      // SUPER_ADMIN pode editar outros SUPER_ADMINs (mas não excluir se for o último)
      if (papelExecutor === PapelUsuario.SUPER_ADMIN && papelAlvo === PapelUsuario.SUPER_ADMIN) {
        if (operacao === 'excluir') {
          return { permitido: false, motivo: 'Não é possível excluir outro SUPER_ADMIN' };
        }
        return { permitido: true };
      }

      return { permitido: false, motivo: `Sem privilégios para ${operacao} este usuário` };
    }

    return { permitido: false, motivo: 'Operação não reconhecida' };
  }

  /**
   * Obtém uma descrição amigável de um privilégio
   */
  static getDescricaoPrivilegio(privilegio: keyof PrivilegiosAdmin): string {
    const descricoes = {
      configuracoes_empresa: 'Configurações da Empresa',
      gerenciar_usuarios: 'Gerenciar Usuários',
      configuracoes_seguranca: 'Configurações de Segurança',
      integracao_externa: 'Integrações Externas',
      backup_restauracao: 'Backup e Restauração',
      relatorios_avancados: 'Relatórios Avançados',
      auditoria_completa: 'Auditoria Completa',
      configuracoes_sistema: 'Configurações do Sistema'
    };

    return descricoes[privilegio] || privilegio;
  }

  /**
   * Obtém uma descrição amigável de um papel
   */
  static getDescricaoPapel(papel: PapelUsuario): string {
    const descricoes = {
      [PapelUsuario.SUPER_ADMIN]: 'Administrador Principal',
      [PapelUsuario.ADMIN]: 'Administrador',
      [PapelUsuario.MANAGER]: 'Gerente',
      [PapelUsuario.USER]: 'Usuário'
    };

    return descricoes[papel] || papel;
  }

  /**
   * Obtém a cor associada a um papel (para UI)
   */
  static getCorPapel(papel: PapelUsuario): string {
    const cores = {
      [PapelUsuario.SUPER_ADMIN]: 'red',
      [PapelUsuario.ADMIN]: 'orange',
      [PapelUsuario.MANAGER]: 'blue',
      [PapelUsuario.USER]: 'gray'
    };

    return cores[papel] || 'gray';
  }

  /**
   * Obtém o ícone associado a um papel (para UI)
   */
  static getIconePapel(papel: PapelUsuario): string {
    const icones = {
      [PapelUsuario.SUPER_ADMIN]: 'crown',
      [PapelUsuario.ADMIN]: 'shield',
      [PapelUsuario.MANAGER]: 'users',
      [PapelUsuario.USER]: 'user'
    };

    return icones[papel] || 'user';
  }
}