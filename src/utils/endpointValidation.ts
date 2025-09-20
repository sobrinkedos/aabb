import { PapelUsuario, PrivilegiosAdmin } from '../types/multitenant';
import { AuthorizationMiddleware } from '../middleware/authorizationMiddleware';

export interface EndpointConfig {
  path: string;
  method: string;
  requiredRole?: PapelUsuario[];
  requiredPrivilege?: keyof PrivilegiosAdmin;
  category?: string;
  description: string;
}

// Configuração de endpoints com seus requisitos de acesso
export const ENDPOINT_CONFIGS: EndpointConfig[] = [
  // Endpoints de usuários
  {
    path: '/api/usuarios',
    method: 'GET',
    requiredPrivilege: 'gerenciar_usuarios',
    description: 'Listar usuários da empresa'
  },
  {
    path: '/api/usuarios',
    method: 'POST',
    requiredPrivilege: 'gerenciar_usuarios',
    description: 'Criar novo usuário'
  },
  {
    path: '/api/usuarios/:id',
    method: 'PUT',
    requiredPrivilege: 'gerenciar_usuarios',
    description: 'Atualizar usuário'
  },
  {
    path: '/api/usuarios/:id',
    method: 'DELETE',
    requiredPrivilege: 'gerenciar_usuarios',
    description: 'Excluir usuário'
  },

  // Endpoints de configurações gerais
  {
    path: '/api/configuracoes/geral',
    method: 'GET',
    category: 'geral',
    description: 'Obter configurações gerais'
  },
  {
    path: '/api/configuracoes/geral',
    method: 'PUT',
    category: 'geral',
    description: 'Atualizar configurações gerais'
  },

  // Endpoints de configurações de segurança (apenas SUPER_ADMIN)
  {
    path: '/api/configuracoes/seguranca',
    method: 'GET',
    requiredRole: [PapelUsuario.SUPER_ADMIN],
    category: 'seguranca',
    description: 'Obter configurações de segurança'
  },
  {
    path: '/api/configuracoes/seguranca',
    method: 'PUT',
    requiredRole: [PapelUsuario.SUPER_ADMIN],
    category: 'seguranca',
    description: 'Atualizar configurações de segurança'
  },

  // Endpoints de configurações do sistema (apenas SUPER_ADMIN)
  {
    path: '/api/configuracoes/sistema',
    method: 'GET',
    requiredRole: [PapelUsuario.SUPER_ADMIN],
    category: 'sistema',
    description: 'Obter configurações do sistema'
  },
  {
    path: '/api/configuracoes/sistema',
    method: 'PUT',
    requiredRole: [PapelUsuario.SUPER_ADMIN],
    category: 'sistema',
    description: 'Atualizar configurações do sistema'
  },

  // Endpoints de integrações (apenas SUPER_ADMIN)
  {
    path: '/api/configuracoes/integracao',
    method: 'GET',
    requiredRole: [PapelUsuario.SUPER_ADMIN],
    category: 'integracao',
    description: 'Obter configurações de integração'
  },
  {
    path: '/api/configuracoes/integracao',
    method: 'PUT',
    requiredRole: [PapelUsuario.SUPER_ADMIN],
    category: 'integracao',
    description: 'Atualizar configurações de integração'
  },

  // Endpoints de relatórios avançados
  {
    path: '/api/relatorios/avancados',
    method: 'GET',
    requiredPrivilege: 'relatorios_avancados',
    description: 'Obter relatórios avançados'
  },

  // Endpoints de auditoria completa
  {
    path: '/api/auditoria',
    method: 'GET',
    requiredPrivilege: 'auditoria_completa',
    description: 'Obter logs de auditoria completos'
  },

  // Endpoints de backup (apenas SUPER_ADMIN)
  {
    path: '/api/backup',
    method: 'POST',
    requiredRole: [PapelUsuario.SUPER_ADMIN],
    description: 'Executar backup do sistema'
  },
  {
    path: '/api/backup/restore',
    method: 'POST',
    requiredRole: [PapelUsuario.SUPER_ADMIN],
    description: 'Restaurar backup do sistema'
  }
];

export class EndpointValidator {
  /**
   * Valida se o usuário atual pode acessar um endpoint específico
   */
  static async validateEndpointAccess(
    path: string, 
    method: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const context = await AuthorizationMiddleware.getAuthorizationContext();
      
      if (!context) {
        return { allowed: false, reason: 'Usuário não autenticado' };
      }

      // Encontrar configuração do endpoint
      const config = ENDPOINT_CONFIGS.find(c => 
        this.matchPath(c.path, path) && c.method.toLowerCase() === method.toLowerCase()
      );

      if (!config) {
        // Se não há configuração específica, permitir (endpoints públicos)
        return { allowed: true };
      }

      // Verificar papel requerido
      if (config.requiredRole) {
        if (!config.requiredRole.includes(context.papel)) {
          return { 
            allowed: false, 
            reason: `Papel insuficiente. Requerido: ${config.requiredRole.join(' ou ')}. Atual: ${context.papel}` 
          };
        }
      }

      // Verificar privilégio requerido
      if (config.requiredPrivilege) {
        const temPrivilegio = await AuthorizationMiddleware.verificarPrivilegio(config.requiredPrivilege);
        
        if (!temPrivilegio) {
          return { 
            allowed: false, 
            reason: `Privilégio insuficiente. Requerido: ${config.requiredPrivilege}` 
          };
        }
      }

      // Verificar categoria de configuração
      if (config.category) {
        const podeAcessar = await AuthorizationMiddleware.podeAcessarConfiguracao(config.category);
        
        if (!podeAcessar) {
          return { 
            allowed: false, 
            reason: `Sem acesso à categoria ${config.category}` 
          };
        }
      }

      return { allowed: true };
    } catch (error) {
      console.error('Erro na validação do endpoint:', error);
      return { allowed: false, reason: 'Erro interno na validação' };
    }
  }

  /**
   * Verifica se um path corresponde ao padrão (suporte a parâmetros como :id)
   */
  private static matchPath(pattern: string, path: string): boolean {
    // Converter padrão para regex
    const regexPattern = pattern
      .replace(/:[^/]+/g, '[^/]+') // :id vira [^/]+
      .replace(/\//g, '\\/');      // escapar barras
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  }

  /**
   * Obtém todos os endpoints acessíveis para um papel específico
   */
  static getAccessibleEndpoints(papel: PapelUsuario): EndpointConfig[] {
    return ENDPOINT_CONFIGS.filter(config => {
      // Se não tem restrição, é acessível
      if (!config.requiredRole && !config.requiredPrivilege && !config.category) {
        return true;
      }

      // Verificar papel
      if (config.requiredRole) {
        return config.requiredRole.includes(papel);
      }

      // Para privilégios e categorias, seria necessário verificar no banco
      // Por simplicidade, assumir que SUPER_ADMIN tem acesso a tudo
      if (papel === PapelUsuario.SUPER_ADMIN) {
        return true;
      }

      return false;
    });
  }
}