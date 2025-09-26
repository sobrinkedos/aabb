/**
 * Middleware de Autenticação e Autorização
 * 
 * Valida permissões de acesso baseadas na função do funcionário
 */

import { supabase } from '../lib/supabase';
import { loadUserPermissionsRobust } from './authMiddlewareRobust';

// ============================================================================
// INTERFACES
// ============================================================================

export interface UserPermissions {
  userId: string;
  empresaId: string;
  role: string;
  permissions: ModulePermissions;
  isActive: boolean;
  hasSystemAccess: boolean;
}

export interface ModulePermission {
  visualizar: boolean;
  criar: boolean;
  editar: boolean;
  excluir: boolean;
  administrar: boolean;
}

export interface ModulePermissions {
  dashboard: ModulePermission;
  monitor_bar: ModulePermission;
  atendimento_bar: ModulePermission;
  monitor_cozinha: ModulePermission;
  gestao_caixa: ModulePermission;
  clientes: ModulePermission;
  funcionarios: ModulePermission;
  relatorios: ModulePermission;
  configuracoes: ModulePermission;
}

export interface AuthContext {
  user: any;
  permissions: UserPermissions | null;
  loading: boolean;
  error: string | null;
}

// ============================================================================
// VALIDAÇÃO DE PERMISSÕES
// ============================================================================

/**
 * Verifica se o usuário tem permissão para acessar um módulo específico
 */
export const hasModuleAccess = (
  permissions: UserPermissions | null,
  module: keyof ModulePermissions,
  action: keyof ModulePermission = 'visualizar'
): boolean => {
  if (!permissions || !permissions.isActive || !permissions.hasSystemAccess) {
    return false;
  }

  const modulePermission = permissions.permissions[module];
  if (!modulePermission) {
    return false;
  }

  return modulePermission[action];
};

/**
 * Verifica se o usuário é administrador
 */
export const isAdmin = (permissions: UserPermissions | null): boolean => {
  if (!permissions) return false;
  
  return permissions.role === 'gerente' || 
         permissions.permissions.configuracoes?.administrar || 
         permissions.permissions.funcionarios?.administrar;
};

/**
 * Verifica se o usuário pode gerenciar funcionários
 */
export const canManageEmployees = (permissions: UserPermissions | null): boolean => {
  if (!permissions) return false;
  
  return permissions.role === 'gerente' || 
         permissions.permissions.funcionarios?.administrar ||
         permissions.permissions.funcionarios?.editar;
};

/**
 * Verifica se o usuário pode acessar relatórios
 */
export const canAccessReports = (permissions: UserPermissions | null): boolean => {
  if (!permissions) return false;
  
  return permissions.role === 'gerente' || 
         permissions.permissions.relatorios?.visualizar;
};

// ============================================================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ============================================================================

/**
 * Carrega as permissões do usuário atual usando versão robusta
 */
export const loadUserPermissions = async (): Promise<UserPermissions | null> => {
  return await loadUserPermissionsRobust();
};

/**
 * Constrói permissões baseadas na função do usuário
 */
const buildPermissionsFromRole = (
  role: string, 
  customPermissions: any[] = []
): ModulePermissions => {
  // Permissões padrão por função
  const rolePermissions: Record<string, Partial<ModulePermissions>> = {
    gerente: {
      dashboard: { visualizar: true, criar: true, editar: true, excluir: true, administrar: true },
      monitor_bar: { visualizar: true, criar: true, editar: true, excluir: true, administrar: true },
      atendimento_bar: { visualizar: true, criar: true, editar: true, excluir: true, administrar: true },
      monitor_cozinha: { visualizar: true, criar: true, editar: true, excluir: true, administrar: true },
      gestao_caixa: { visualizar: true, criar: true, editar: true, excluir: true, administrar: true },
      clientes: { visualizar: true, criar: true, editar: true, excluir: true, administrar: true },
      funcionarios: { visualizar: true, criar: true, editar: true, excluir: true, administrar: true },
      relatorios: { visualizar: true, criar: true, editar: true, excluir: true, administrar: true },
      configuracoes: { visualizar: true, criar: true, editar: true, excluir: true, administrar: true }
    },
    atendente: {
      dashboard: { visualizar: true, criar: false, editar: false, excluir: false, administrar: false },
      monitor_bar: { visualizar: true, criar: false, editar: false, excluir: false, administrar: false },
      atendimento_bar: { visualizar: true, criar: true, editar: true, excluir: false, administrar: false },
      clientes: { visualizar: true, criar: true, editar: true, excluir: false, administrar: false }
    },
    garcom: {
      dashboard: { visualizar: true, criar: false, editar: false, excluir: false, administrar: false },
      monitor_bar: { visualizar: true, criar: false, editar: false, excluir: false, administrar: false },
      atendimento_bar: { visualizar: true, criar: true, editar: true, excluir: false, administrar: false },
      clientes: { visualizar: true, criar: false, editar: false, excluir: false, administrar: false }
    },
    cozinheiro: {
      dashboard: { visualizar: true, criar: false, editar: false, excluir: false, administrar: false },
      monitor_cozinha: { visualizar: true, criar: true, editar: true, excluir: false, administrar: false }
    },
    barman: {
      dashboard: { visualizar: true, criar: false, editar: false, excluir: false, administrar: false },
      monitor_bar: { visualizar: true, criar: true, editar: true, excluir: false, administrar: false },
      atendimento_bar: { visualizar: true, criar: true, editar: true, excluir: false, administrar: false }
    }
  };

  // Permissões base (negadas por padrão)
  const basePermissions: ModulePermissions = {
    dashboard: { visualizar: false, criar: false, editar: false, excluir: false, administrar: false },
    monitor_bar: { visualizar: false, criar: false, editar: false, excluir: false, administrar: false },
    atendimento_bar: { visualizar: false, criar: false, editar: false, excluir: false, administrar: false },
    monitor_cozinha: { visualizar: false, criar: false, editar: false, excluir: false, administrar: false },
    gestao_caixa: { visualizar: false, criar: false, editar: false, excluir: false, administrar: false },
    clientes: { visualizar: false, criar: false, editar: false, excluir: false, administrar: false },
    funcionarios: { visualizar: false, criar: false, editar: false, excluir: false, administrar: false },
    relatorios: { visualizar: false, criar: false, editar: false, excluir: false, administrar: false },
    configuracoes: { visualizar: false, criar: false, editar: false, excluir: false, administrar: false }
  };

  // Aplicar permissões da função
  const permissions = { ...basePermissions };
  const rolePerms = rolePermissions[role] || {};
  
  Object.keys(rolePerms).forEach(module => {
    if (permissions[module as keyof ModulePermissions]) {
      permissions[module as keyof ModulePermissions] = {
        ...permissions[module as keyof ModulePermissions],
        ...rolePerms[module as keyof ModulePermissions]
      };
    }
  });

  // Aplicar permissões customizadas (sobrescreve as da função)
  customPermissions.forEach(perm => {
    if (permissions[perm.modulo as keyof ModulePermissions]) {
      permissions[perm.modulo as keyof ModulePermissions] = {
        ...permissions[perm.modulo as keyof ModulePermissions],
        ...perm.permissoes
      };
    }
  });

  return permissions;
};

/**
 * Middleware para verificar autenticação antes de acessar rotas protegidas
 */
export const requireAuth = async (): Promise<{ success: boolean; permissions?: UserPermissions; error?: string }> => {
  try {
    const permissions = await loadUserPermissions();
    
    if (!permissions) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    if (!permissions.isActive) {
      return { success: false, error: 'Usuário inativo' };
    }

    if (!permissions.hasSystemAccess) {
      return { success: false, error: 'Usuário sem acesso ao sistema' };
    }

    return { success: true, permissions };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro de autenticação' 
    };
  }
};

/**
 * Middleware para verificar permissão específica de módulo
 */
export const requireModulePermission = async (
  module: keyof ModulePermissions,
  action: keyof ModulePermission = 'visualizar'
): Promise<{ success: boolean; permissions?: UserPermissions; error?: string }> => {
  const authResult = await requireAuth();
  
  if (!authResult.success) {
    return authResult;
  }

  const hasPermission = hasModuleAccess(authResult.permissions!, module, action);
  
  if (!hasPermission) {
    return { 
      success: false, 
      error: `Sem permissão para ${action} no módulo ${module}` 
    };
  }

  return authResult;
};

// ============================================================================
// UTILITÁRIOS DE LOGOUT E LIMPEZA
// ============================================================================

/**
 * Realiza logout do usuário
 */
export const logout = async (): Promise<void> => {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
  }
};

/**
 * Verifica se a sessão ainda é válida
 */
export const validateSession = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    console.error('Erro ao validar sessão:', error);
    return false;
  }
};