import { supabase } from '../lib/supabase';
import { ModuloSistema, PermissaoModulo } from '../types/multitenant';

/**
 * Interface para resultado de autorização
 */
export interface AuthorizationResult {
  authorized: boolean;
  user?: {
    id: string;
    empresa_id: string;
    tipo_usuario: 'administrador' | 'funcionario';
    status: string;
  };
  error?: string;
  permissions?: Record<ModuloSistema, PermissaoModulo>;
}

/**
 * Interface para contexto de autorização
 */
export interface AuthorizationContext {
  userId: string;
  empresaId: string;
  userType: 'administrador' | 'funcionario';
  permissions: Record<ModuloSistema, PermissaoModulo>;
}

/**
 * Classe principal para middleware de autorização
 */
export class AuthorizationMiddleware {
  /**
   * Verifica se o usuário está autenticado e autorizado
   */
  static async checkAuth(token?: string): Promise<AuthorizationResult> {
    try {
      // Verificar token JWT
      if (!token) {
        return { authorized: false, error: 'Token não fornecido' };
      }

      // Verificar usuário no Supabase Auth
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return { authorized: false, error: 'Token inválido ou expirado' };
      }

      // Buscar dados do usuário na empresa
      const { data: usuarioEmpresa, error: userError } = await supabase
        .from('usuarios_empresa')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (userError || !usuarioEmpresa) {
        return { authorized: false, error: 'Usuário não encontrado na empresa' };
      }

      // Verificar se usuário está ativo
      if (usuarioEmpresa.status !== 'ativo') {
        return { 
          authorized: false, 
          error: `Usuário ${usuarioEmpresa.status}. Contate o administrador.` 
        };
      }

      // Carregar permissões do usuário
      const permissions = await this.loadUserPermissions(usuarioEmpresa.id);

      return {
        authorized: true,
        user: {
          id: usuarioEmpresa.id,
          empresa_id: usuarioEmpresa.empresa_id,
          tipo_usuario: usuarioEmpresa.tipo_usuario,
          status: usuarioEmpresa.status
        },
        permissions
      };
    } catch (error) {
      console.error('Erro na verificação de autorização:', error);
      return { authorized: false, error: 'Erro interno de autorização' };
    }
  }

  /**
   * Verifica permissão específica para um módulo e ação
   */
  static async checkPermission(
    token: string,
    modulo: ModuloSistema,
    acao: keyof PermissaoModulo
  ): Promise<AuthorizationResult> {
    const authResult = await this.checkAuth(token);
    
    if (!authResult.authorized) {
      return authResult;
    }

    const { user, permissions } = authResult;
    
    // ⚠️ CORREÇÃO CRÍTICA: Verificar permissões específicas para TODOS os usuários
    // Administradores REAIS (proprietários) têm acesso total apenas se explicitamente definido
    // Funcionários com tipo_usuario 'administrador' devem seguir suas permissões específicas
    
    // Somente usuários específicos (donos) têm acesso total irrestrito
    const isSystemOwner = user?.email === 'admin@sistema.com' || user?.is_system_admin === true;
    
    if (isSystemOwner) {
      console.log('🔓 Acesso total concedido para proprietário do sistema');
      return authResult;
    }
    
    // TODOS os outros usuários (incluindo administradores de empresas) devem ter permissões verificadas
    console.log(`🔍 Verificando permissões para ${user?.email}: ${modulo}.${acao}`);
    
    // Verificar permissão específica
    const moduloPermissions = permissions?.[modulo];
    if (!moduloPermissions || !moduloPermissions[acao]) {
      console.log(`❌ Permissão negada para ${user?.email}: ${modulo}.${acao}`);
      console.log('Permissões disponíveis:', moduloPermissions);
      return {
        authorized: false,
        error: `Sem permissão para ${acao} no módulo ${modulo}`
      };
    }
    
    console.log(`✅ Permissão concedida para ${user?.email}: ${modulo}.${acao}`);
    return authResult;
  }

  /**
   * Middleware para verificar se usuário é administrador
   */
  static async requireAdmin(token: string): Promise<AuthorizationResult> {
    const authResult = await this.checkAuth(token);
    
    if (!authResult.authorized) {
      return authResult;
    }

    if (authResult.user?.tipo_usuario !== 'administrador') {
      return {
        authorized: false,
        error: 'Acesso restrito a administradores'
      };
    }

    return authResult;
  }

  /**
   * Middleware para verificar isolamento por empresa
   */
  static async checkTenantIsolation(
    token: string,
    resourceEmpresaId: string
  ): Promise<AuthorizationResult> {
    const authResult = await this.checkAuth(token);
    
    if (!authResult.authorized) {
      return authResult;
    }

    if (authResult.user?.empresa_id !== resourceEmpresaId) {
      return {
        authorized: false,
        error: 'Acesso negado: recurso de outra empresa'
      };
    }

    return authResult;
  }

  /**
   * Carregar permissões do usuário
   */
  private static async loadUserPermissions(
    usuarioEmpresaId: string
  ): Promise<Record<ModuloSistema, PermissaoModulo>> {
    try {
      const { data: permissoesData, error } = await supabase
        .from('permissoes_usuario')
        .select('*')
        .eq('usuario_empresa_id', usuarioEmpresaId);

      if (error) {
        console.error('Erro ao carregar permissões:', error);
        return {} as Record<ModuloSistema, PermissaoModulo>;
      }

      // Inicializar todas as permissões como false
      const permissions: Record<ModuloSistema, PermissaoModulo> = {} as Record<ModuloSistema, PermissaoModulo>;
      
      Object.values(ModuloSistema).forEach(modulo => {
        permissions[modulo] = {
          visualizar: false,
          criar: false,
          editar: false,
          excluir: false,
          administrar: false
        };
      });

      // Aplicar permissões específicas
      permissoesData?.forEach(permissao => {
        permissions[permissao.modulo as ModuloSistema] = permissao.permissoes;
      });

      return permissions;
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
      return {} as Record<ModuloSistema, PermissaoModulo>;
    }
  }

  /**
   * Registrar tentativa de acesso para auditoria
   */
  static async logAccessAttempt(
    userId: string,
    empresaId: string,
    action: string,
    resource: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await supabase.rpc('registrar_log_auditoria', {
        p_empresa_id: empresaId,
        p_usuario_id: userId,
        p_acao: success ? action : `FAILED_${action}`,
        p_recurso: resource,
        p_detalhes: {
          success,
          timestamp: new Date().toISOString(),
          ip_address: ipAddress,
          user_agent: userAgent
        },
        p_ip_address: ipAddress,
        p_user_agent: userAgent
      });
    } catch (error) {
      console.error('Erro ao registrar log de acesso:', error);
    }
  }
}

/**
 * Decorator para proteger métodos com autorização
 */
export function RequirePermission(
  modulo: ModuloSistema,
  acao: keyof PermissaoModulo
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const token = this.getAuthToken?.() || args[0]?.token;
      
      if (!token) {
        throw new Error('Token de autorização não fornecido');
      }

      const authResult = await AuthorizationMiddleware.checkPermission(token, modulo, acao);
      
      if (!authResult.authorized) {
        throw new Error(authResult.error || 'Não autorizado');
      }

      // Adicionar contexto de autorização aos argumentos
      const context: AuthorizationContext = {
        userId: authResult.user!.id,
        empresaId: authResult.user!.empresa_id,
        userType: authResult.user!.tipo_usuario,
        permissions: authResult.permissions!
      };

      return method.apply(this, [context, ...args]);
    };
  };
}

/**
 * Decorator para requerer privilégios de administrador
 */
export function RequireAdmin() {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const token = this.getAuthToken?.() || args[0]?.token;
      
      if (!token) {
        throw new Error('Token de autorização não fornecido');
      }

      const authResult = await AuthorizationMiddleware.requireAdmin(token);
      
      if (!authResult.authorized) {
        throw new Error(authResult.error || 'Acesso restrito a administradores');
      }

      const context: AuthorizationContext = {
        userId: authResult.user!.id,
        empresaId: authResult.user!.empresa_id,
        userType: authResult.user!.tipo_usuario,
        permissions: authResult.permissions!
      };

      return method.apply(this, [context, ...args]);
    };
  };
}

/**
 * Utilitários para verificação de permissões
 */
export class PermissionUtils {
  /**
   * Verificar se uma ação implica em outras ações
   */
  static impliesPermissions(acao: keyof PermissaoModulo): (keyof PermissaoModulo)[] {
    switch (acao) {
      case 'administrar':
        return ['visualizar', 'criar', 'editar', 'excluir', 'administrar'];
      case 'excluir':
        return ['visualizar', 'editar', 'excluir'];
      case 'editar':
        return ['visualizar', 'editar'];
      case 'criar':
        return ['visualizar', 'criar'];
      case 'visualizar':
        return ['visualizar'];
      default:
        return [];
    }
  }

  /**
   * Verificar se usuário tem permissão mínima necessária
   */
  static hasMinimumPermission(
    userPermissions: PermissaoModulo,
    requiredAction: keyof PermissaoModulo
  ): boolean {
    const impliedPermissions = this.impliesPermissions(requiredAction);
    return impliedPermissions.every(permission => userPermissions[permission]);
  }

  /**
   * Calcular nível de acesso do usuário para um módulo
   */
  static getAccessLevel(permissions: PermissaoModulo): 'none' | 'read' | 'write' | 'admin' {
    if (permissions.administrar) return 'admin';
    if (permissions.criar || permissions.editar || permissions.excluir) return 'write';
    if (permissions.visualizar) return 'read';
    return 'none';
  }

  /**
   * Filtrar módulos baseado nas permissões do usuário
   */
  static getAccessibleModules(
    allPermissions: Record<ModuloSistema, PermissaoModulo>,
    minimumLevel: 'read' | 'write' | 'admin' = 'read'
  ): ModuloSistema[] {
    return Object.entries(allPermissions)
      .filter(([_, permissions]) => {
        const level = this.getAccessLevel(permissions);
        switch (minimumLevel) {
          case 'admin':
            return level === 'admin';
          case 'write':
            return level === 'write' || level === 'admin';
          case 'read':
            return level !== 'none';
          default:
            return false;
        }
      })
      .map(([modulo]) => modulo as ModuloSistema);
  }
}

/**
 * Classe para cache de permissões
 */
export class PermissionCache {
  private static cache = new Map<string, {
    permissions: Record<ModuloSistema, PermissaoModulo>;
    timestamp: number;
    ttl: number;
  }>();

  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos

  /**
   * Obter permissões do cache
   */
  static get(
    userId: string
  ): Record<ModuloSistema, PermissaoModulo> | null {
    const cached = this.cache.get(userId);
    
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(userId);
      return null;
    }
    
    return cached.permissions;
  }

  /**
   * Armazenar permissões no cache
   */
  static set(
    userId: string,
    permissions: Record<ModuloSistema, PermissaoModulo>,
    ttl: number = this.DEFAULT_TTL
  ): void {
    this.cache.set(userId, {
      permissions,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Invalidar cache de um usuário
   */
  static invalidate(userId: string): void {
    this.cache.delete(userId);
  }

  /**
   * Limpar todo o cache
   */
  static clear(): void {
    this.cache.clear();
  }

  /**
   * Limpar entradas expiradas
   */
  static cleanup(): void {
    const now = Date.now();
    for (const [userId, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(userId);
      }
    }
  }
}

// Limpar cache automaticamente a cada 10 minutos
if (typeof window !== 'undefined') {
  setInterval(() => {
    PermissionCache.cleanup();
  }, 10 * 60 * 1000);
}