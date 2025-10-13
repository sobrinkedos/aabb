/**
 * Sistema de Tipos para Permissões de Funcionários
 * 
 * Define todas as interfaces e tipos relacionados ao sistema de permissões
 * baseado em funções para funcionários do estabelecimento.
 * 
 * @version 1.0.0
 */

// ============================================================================
// TIPOS BÁSICOS
// ============================================================================

/**
 * Funções disponíveis no estabelecimento
 */
export type BarRole = "atendente" | "garcom" | "cozinheiro" | "barman" | "gerente";

/**
 * Níveis de acesso no sistema
 */
export type AccessLevel = "USER" | "MANAGER" | "ADMIN";

/**
 * Tipos de usuário
 */
export type UserType = "funcionario" | "administrador";

/**
 * Módulos disponíveis no sistema
 */
export type SystemModule = 
  | "dashboard"
  | "monitor_bar"
  | "atendimento_bar"
  | "monitor_cozinha"
  | "gestao_caixa"
  | "clientes"
  | "funcionarios"
  | "relatorios"
  | "configuracoes"
  | "estoque"
  | "cardapio"
  | "promocoes"
  | "financeiro";

/**
 * Ações possíveis em cada módulo
 */
export type PermissionAction = "visualizar" | "criar" | "editar" | "excluir" | "administrar";

// ============================================================================
// INTERFACES DE PERMISSÕES
// ============================================================================

/**
 * Permissões específicas para um módulo
 */
export interface ModulePermission {
  visualizar: boolean;
  criar: boolean;
  editar: boolean;
  excluir: boolean;
  administrar: boolean;
}

/**
 * Conjunto completo de permissões por módulo
 */
export interface ModulePermissions {
  [K in SystemModule]?: ModulePermission;
}

/**
 * Configuração de permissões para uma função específica
 */
export interface RolePermissionConfig {
  role: BarRole;
  displayName: string;
  description: string;
  accessLevel: AccessLevel;
  userType: UserType;
  permissions: ModulePermissions;
  hierarchy: number; // 1 = menor privilégio, 5 = maior privilégio
  canManageRoles?: BarRole[]; // Funções que esta função pode gerenciar
}

/**
 * Preset de permissões com metadados
 */
export interface PermissionPreset {
  id: string;
  name: string;
  description: string;
  role: BarRole;
  permissions: ModulePermissions;
  isDefault: boolean;
  isCustomizable: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Contexto de permissões para um usuário específico
 */
export interface UserPermissionContext {
  userId: string;
  role: BarRole;
  permissions: ModulePermissions;
  effectivePermissions: ModulePermissions; // Após aplicar hierarquia
  canAccess: (module: SystemModule, action: PermissionAction) => boolean;
  canManage: (targetRole: BarRole) => boolean;
}

/**
 * Resultado de validação de permissões
 */
export interface PermissionValidationResult {
  isValid: boolean;
  hasAccess: boolean;
  missingPermissions: Array<{
    module: SystemModule;
    action: PermissionAction;
    required: boolean;
    current: boolean;
  }>;
  warnings: string[];
  errors: string[];
}

/**
 * Configuração de herança de permissões
 */
export interface PermissionInheritance {
  parentRole: BarRole;
  childRole: BarRole;
  inheritedModules: SystemModule[];
  overrides: Partial<ModulePermissions>;
}

// ============================================================================
// TIPOS UTILITÁRIOS
// ============================================================================

/**
 * Mapeamento de função para configuração
 */
export type RoleConfigMap = {
  [K in BarRole]: RolePermissionConfig;
};

/**
 * Mapeamento de módulo para descrição
 */
export type ModuleDescriptionMap = {
  [K in SystemModule]: {
    name: string;
    description: string;
    category: "operacional" | "administrativo" | "financeiro" | "relatorios";
    requiredForRole?: BarRole[];
    icon?: string;
  };
};

/**
 * Configuração de validação de permissões
 */
export interface PermissionValidationConfig {
  enforceHierarchy: boolean;
  allowCustomPermissions: boolean;
  requireMinimumPermissions: boolean;
  logPermissionChecks: boolean;
}

/**
 * Evento de mudança de permissões
 */
export interface PermissionChangeEvent {
  userId: string;
  oldRole: BarRole;
  newRole: BarRole;
  oldPermissions: ModulePermissions;
  newPermissions: ModulePermissions;
  changedBy: string;
  timestamp: string;
  reason?: string;
}

// ============================================================================
// CONSTANTES DE PERMISSÕES
// ============================================================================

/**
 * Permissão vazia (sem acesso)
 */
export const EMPTY_PERMISSION: ModulePermission = {
  visualizar: false,
  criar: false,
  editar: false,
  excluir: false,
  administrar: false,
};

/**
 * Permissão de leitura apenas
 */
export const READ_ONLY_PERMISSION: ModulePermission = {
  visualizar: true,
  criar: false,
  editar: false,
  excluir: false,
  administrar: false,
};

/**
 * Permissão de leitura e escrita
 */
export const READ_WRITE_PERMISSION: ModulePermission = {
  visualizar: true,
  criar: true,
  editar: true,
  excluir: false,
  administrar: false,
};

/**
 * Permissão completa
 */
export const FULL_PERMISSION: ModulePermission = {
  visualizar: true,
  criar: true,
  editar: true,
  excluir: true,
  administrar: true,
};

/**
 * Permissão operacional (sem administrar)
 */
export const OPERATIONAL_PERMISSION: ModulePermission = {
  visualizar: true,
  criar: true,
  editar: true,
  excluir: true,
  administrar: false,
};