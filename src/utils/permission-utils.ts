/**
 * Utilitários para Validação e Verificação de Permissões
 * 
 * Fornece funções utilitárias para trabalhar com permissões,
 * validação de acesso e verificações de segurança.
 * 
 * @version 1.0.0
 */

import {
  BarRole,
  SystemModule,
  ModulePermission,
  ModulePermissions,
  PermissionAction,
  UserPermissionContext,
  PermissionValidationResult,
  EMPTY_PERMISSION,
  READ_ONLY_PERMISSION,
  READ_WRITE_PERMISSION,
  FULL_PERMISSION,
  OPERATIONAL_PERMISSION,
} from '../types/permissions';

import { permissionPresetManager } from '../services/permission-presets';

// ============================================================================
// FUNÇÕES DE VALIDAÇÃO DE PERMISSÕES
// ============================================================================

/**
 * Verifica se um usuário tem permissão para uma ação específica
 */
export function hasPermission(
  userRole: BarRole,
  module: SystemModule,
  action: PermissionAction,
  customPermissions?: ModulePermissions
): boolean {
  try {
    const permissions = customPermissions || permissionPresetManager.getDefaultPermissions(userRole);
    const modulePermission = permissions[module];
    
    if (!modulePermission) {
      return false;
    }

    return modulePermission[action];
  } catch (error) {
    console.error('Erro ao verificar permissão:', error);
    return false;
  }
}

/**
 * Verifica múltiplas permissões de uma vez
 */
export function hasMultiplePermissions(
  userRole: BarRole,
  checks: Array<{
    module: SystemModule;
    action: PermissionAction;
    required?: boolean; // Se true, todas devem ser válidas
  }>,
  customPermissions?: ModulePermissions
): { hasAccess: boolean; results: Array<{ module: SystemModule; action: PermissionAction; hasPermission: boolean }> } {
  const results = checks.map(check => ({
    module: check.module,
    action: check.action,
    hasPermission: hasPermission(userRole, check.module, check.action, customPermissions)
  }));

  const requiredChecks = checks.filter(check => check.required !== false);
  const hasAccess = requiredChecks.length === 0 || 
    requiredChecks.every(check => 
      results.find(r => r.module === check.module && r.action === check.action)?.hasPermission
    );

  return { hasAccess, results };
}

/**
 * Verifica se um usuário pode acessar um módulo (pelo menos visualizar)
 */
export function canAccessModule(
  userRole: BarRole,
  module: SystemModule,
  customPermissions?: ModulePermissions
): boolean {
  return hasPermission(userRole, module, 'visualizar', customPermissions);
}

/**
 * Verifica se um usuário pode gerenciar outro usuário baseado na função
 */
export function canManageUser(managerRole: BarRole, targetRole: BarRole): boolean {
  return permissionPresetManager.canManageRole(managerRole, targetRole);
}

// ============================================================================
// FUNÇÕES DE COMPARAÇÃO DE PERMISSÕES
// ============================================================================

/**
 * Compara duas permissões de módulo
 */
export function compareModulePermissions(
  permission1: ModulePermission,
  permission2: ModulePermission
): {
  isEqual: boolean;
  differences: Array<{
    action: PermissionAction;
    permission1: boolean;
    permission2: boolean;
  }>;
} {
  const actions: PermissionAction[] = ['visualizar', 'criar', 'editar', 'excluir', 'administrar'];
  const differences: Array<{
    action: PermissionAction;
    permission1: boolean;
    permission2: boolean;
  }> = [];

  let isEqual = true;

  for (const action of actions) {
    if (permission1[action] !== permission2[action]) {
      isEqual = false;
      differences.push({
        action,
        permission1: permission1[action],
        permission2: permission2[action]
      });
    }
  }

  return { isEqual, differences };
}

/**
 * Verifica se uma permissão é mais restritiva que outra
 */
export function isMoreRestrictive(
  permission1: ModulePermission,
  permission2: ModulePermission
): boolean {
  const actions: PermissionAction[] = ['visualizar', 'criar', 'editar', 'excluir', 'administrar'];
  
  return actions.every(action => {
    // Se permission1 não tem a permissão mas permission2 tem, então permission1 é mais restritiva
    return !permission1[action] || permission2[action];
  });
}

/**
 * Calcula o nível de acesso de uma permissão (0-5)
 */
export function calculatePermissionLevel(permission: ModulePermission): number {
  let level = 0;
  if (permission.visualizar) level += 1;
  if (permission.criar) level += 1;
  if (permission.editar) level += 1;
  if (permission.excluir) level += 1;
  if (permission.administrar) level += 1;
  return level;
}

// ============================================================================
// FUNÇÕES DE MANIPULAÇÃO DE PERMISSÕES
// ============================================================================

/**
 * Mescla duas configurações de permissões
 */
export function mergePermissions(
  basePermissions: ModulePermissions,
  overridePermissions: Partial<ModulePermissions>
): ModulePermissions {
  const merged = { ...basePermissions };

  for (const [module, permissions] of Object.entries(overridePermissions)) {
    if (permissions) {
      merged[module as SystemModule] = {
        ...merged[module as SystemModule],
        ...permissions
      };
    }
  }

  return merged;
}

/**
 * Remove permissões específicas de uma configuração
 */
export function removePermissions(
  permissions: ModulePermissions,
  toRemove: Array<{
    module: SystemModule;
    actions: PermissionAction[];
  }>
): ModulePermissions {
  const result = { ...permissions };

  for (const removal of toRemove) {
    if (result[removal.module]) {
      const modulePermission = { ...result[removal.module] };
      
      for (const action of removal.actions) {
        modulePermission[action] = false;
      }
      
      result[removal.module] = modulePermission;
    }
  }

  return result;
}

/**
 * Adiciona permissões específicas a uma configuração
 */
export function addPermissions(
  permissions: ModulePermissions,
  toAdd: Array<{
    module: SystemModule;
    actions: PermissionAction[];
  }>
): ModulePermissions {
  const result = { ...permissions };

  for (const addition of toAdd) {
    if (!result[addition.module]) {
      result[addition.module] = { ...EMPTY_PERMISSION };
    }
    
    const modulePermission = { ...result[addition.module] };
    
    for (const action of addition.actions) {
      modulePermission[action] = true;
    }
    
    result[addition.module] = modulePermission;
  }

  return result;
}

// ============================================================================
// FUNÇÕES DE VALIDAÇÃO E SANITIZAÇÃO
// ============================================================================

/**
 * Valida se uma configuração de permissões é válida
 */
export function validatePermissionConfiguration(
  permissions: ModulePermissions,
  role: BarRole
): PermissionValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingPermissions: PermissionValidationResult['missingPermissions'] = [];

  // Verificar módulos obrigatórios para a função
  const requiredModules = permissionPresetManager.getRequiredModulesForRole(role);
  
  for (const module of requiredModules) {
    if (!permissions[module] || !permissions[module].visualizar) {
      errors.push(`Módulo obrigatório ${module} não tem permissão de visualização para a função ${role}`);
      missingPermissions.push({
        module,
        action: 'visualizar',
        required: true,
        current: false
      });
    }
  }

  // Verificar consistência de permissões
  for (const [module, permission] of Object.entries(permissions)) {
    if (permission) {
      // Se pode administrar, deve ter todas as outras permissões
      if (permission.administrar) {
        const requiredActions: PermissionAction[] = ['visualizar', 'criar', 'editar', 'excluir'];
        for (const action of requiredActions) {
          if (!permission[action]) {
            warnings.push(`Módulo ${module}: permissão de administrar requer ${action}`);
          }
        }
      }

      // Se pode excluir, deve poder editar
      if (permission.excluir && !permission.editar) {
        warnings.push(`Módulo ${module}: permissão de excluir requer editar`);
      }

      // Se pode editar, deve poder visualizar
      if (permission.editar && !permission.visualizar) {
        errors.push(`Módulo ${module}: permissão de editar requer visualizar`);
      }

      // Se pode criar, deve poder visualizar
      if (permission.criar && !permission.visualizar) {
        errors.push(`Módulo ${module}: permissão de criar requer visualizar`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    hasAccess: true, // Será determinado pelo contexto
    missingPermissions,
    warnings,
    errors
  };
}

/**
 * Sanitiza uma configuração de permissões, corrigindo inconsistências
 */
export function sanitizePermissions(permissions: ModulePermissions): ModulePermissions {
  const sanitized = { ...permissions };

  for (const [module, permission] of Object.entries(sanitized)) {
    if (permission) {
      const sanitizedPermission = { ...permission };

      // Se pode administrar, deve ter todas as outras permissões
      if (sanitizedPermission.administrar) {
        sanitizedPermission.visualizar = true;
        sanitizedPermission.criar = true;
        sanitizedPermission.editar = true;
        sanitizedPermission.excluir = true;
      }

      // Se pode excluir, deve poder editar e visualizar
      if (sanitizedPermission.excluir) {
        sanitizedPermission.visualizar = true;
        sanitizedPermission.editar = true;
      }

      // Se pode editar, deve poder visualizar
      if (sanitizedPermission.editar) {
        sanitizedPermission.visualizar = true;
      }

      // Se pode criar, deve poder visualizar
      if (sanitizedPermission.criar) {
        sanitizedPermission.visualizar = true;
      }

      sanitized[module as SystemModule] = sanitizedPermission;
    }
  }

  return sanitized;
}

// ============================================================================
// FUNÇÕES DE FORMATAÇÃO E EXIBIÇÃO
// ============================================================================

/**
 * Converte permissões para formato legível
 */
export function formatPermissionsForDisplay(
  permissions: ModulePermissions
): Array<{
  module: SystemModule;
  moduleName: string;
  permissions: Array<{
    action: PermissionAction;
    actionName: string;
    hasPermission: boolean;
  }>;
}> {
  const actionNames: Record<PermissionAction, string> = {
    visualizar: 'Visualizar',
    criar: 'Criar',
    editar: 'Editar',
    excluir: 'Excluir',
    administrar: 'Administrar'
  };

  return Object.entries(permissions).map(([module, permission]) => ({
    module: module as SystemModule,
    moduleName: module, // Pode ser substituído por nomes mais amigáveis
    permissions: Object.entries(actionNames).map(([action, actionName]) => ({
      action: action as PermissionAction,
      actionName,
      hasPermission: permission ? permission[action as PermissionAction] : false
    }))
  }));
}

/**
 * Gera resumo de permissões
 */
export function generatePermissionSummary(
  permissions: ModulePermissions
): {
  totalModules: number;
  accessibleModules: number;
  editableModules: number;
  adminModules: number;
  permissionLevel: 'baixo' | 'médio' | 'alto' | 'completo';
} {
  const modules = Object.entries(permissions);
  const totalModules = modules.length;
  
  let accessibleModules = 0;
  let editableModules = 0;
  let adminModules = 0;
  let totalPermissionLevel = 0;

  for (const [_, permission] of modules) {
    if (permission) {
      if (permission.visualizar) accessibleModules++;
      if (permission.editar) editableModules++;
      if (permission.administrar) adminModules++;
      totalPermissionLevel += calculatePermissionLevel(permission);
    }
  }

  const averageLevel = totalModules > 0 ? totalPermissionLevel / (totalModules * 5) : 0;
  
  let permissionLevel: 'baixo' | 'médio' | 'alto' | 'completo';
  if (averageLevel < 0.25) permissionLevel = 'baixo';
  else if (averageLevel < 0.5) permissionLevel = 'médio';
  else if (averageLevel < 0.8) permissionLevel = 'alto';
  else permissionLevel = 'completo';

  return {
    totalModules,
    accessibleModules,
    editableModules,
    adminModules,
    permissionLevel
  };
}

// ============================================================================
// FUNÇÕES DE PRESET
// ============================================================================

/**
 * Obtém permissões padrão para uma função
 */
export function getDefaultPermissionsForRole(role: BarRole): ModulePermissions {
  return permissionPresetManager.getDefaultPermissions(role);
}

/**
 * Verifica se permissões são iguais ao padrão da função
 */
export function isDefaultPermissionSet(
  permissions: ModulePermissions,
  role: BarRole
): boolean {
  const defaultPermissions = getDefaultPermissionsForRole(role);
  
  // Comparar cada módulo
  for (const module of Object.keys(defaultPermissions) as SystemModule[]) {
    const defaultPermission = defaultPermissions[module];
    const currentPermission = permissions[module];
    
    if (!currentPermission || !defaultPermission) {
      if (currentPermission !== defaultPermission) return false;
      continue;
    }
    
    const comparison = compareModulePermissions(defaultPermission, currentPermission);
    if (!comparison.isEqual) return false;
  }
  
  return true;
}

/**
 * Cria conjunto de permissões baseado em template
 */
export function createPermissionsFromTemplate(
  template: 'read_only' | 'operational' | 'full' | 'custom',
  modules: SystemModule[],
  customPermission?: ModulePermission
): ModulePermissions {
  const permissions: ModulePermissions = {};
  
  let basePermission: ModulePermission;
  switch (template) {
    case 'read_only':
      basePermission = READ_ONLY_PERMISSION;
      break;
    case 'operational':
      basePermission = OPERATIONAL_PERMISSION;
      break;
    case 'full':
      basePermission = FULL_PERMISSION;
      break;
    case 'custom':
      basePermission = customPermission || EMPTY_PERMISSION;
      break;
    default:
      basePermission = EMPTY_PERMISSION;
  }
  
  for (const module of modules) {
    permissions[module] = { ...basePermission };
  }
  
  return permissions;
}