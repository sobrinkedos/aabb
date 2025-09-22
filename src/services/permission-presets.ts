/**
 * Sistema de Presets de Permissões por Função
 * 
 * Define e gerencia os presets de permissões para cada função de funcionário,
 * incluindo hierarquia, validação e customização de permissões.
 * 
 * @version 1.0.0
 */

import {
  BarRole,
  SystemModule,
  ModulePermission,
  ModulePermissions,
  RolePermissionConfig,
  RoleConfigMap,
  ModuleDescriptionMap,
  PermissionPreset,
  UserPermissionContext,
  PermissionValidationResult,
  AccessLevel,
  UserType,
  EMPTY_PERMISSION,
  READ_ONLY_PERMISSION,
  READ_WRITE_PERMISSION,
  FULL_PERMISSION,
  OPERATIONAL_PERMISSION,
} from '../types/permissions';

// ============================================================================
// DESCRIÇÕES DOS MÓDULOS
// ============================================================================

/**
 * Mapeamento de módulos com suas descrições e categorias
 */
export const MODULE_DESCRIPTIONS: ModuleDescriptionMap = {
  dashboard: {
    name: "Dashboard",
    description: "Painel principal com visão geral do estabelecimento",
    category: "operacional",
    requiredForRole: ["atendente", "garcom", "cozinheiro", "barman", "gerente"],
    icon: "dashboard"
  },
  monitor_bar: {
    name: "Monitor do Bar",
    description: "Monitoramento de pedidos e preparação de bebidas",
    category: "operacional",
    requiredForRole: ["barman", "gerente"],
    icon: "local_bar"
  },
  atendimento_bar: {
    name: "Atendimento do Bar",
    description: "Gestão de pedidos e atendimento aos clientes",
    category: "operacional",
    requiredForRole: ["garcom", "atendente", "gerente"],
    icon: "restaurant_menu"
  },
  monitor_cozinha: {
    name: "Monitor da Cozinha",
    description: "Acompanhamento de pedidos e preparação de pratos",
    category: "operacional",
    requiredForRole: ["cozinheiro", "gerente"],
    icon: "restaurant"
  },
  gestao_caixa: {
    name: "Gestão de Caixa",
    description: "Controle de vendas, pagamentos e fechamento de caixa",
    category: "financeiro",
    requiredForRole: ["atendente", "gerente"],
    icon: "point_of_sale"
  },
  clientes: {
    name: "Gestão de Clientes",
    description: "Cadastro e acompanhamento de clientes",
    category: "operacional",
    requiredForRole: ["atendente", "garcom", "gerente"],
    icon: "people"
  },
  funcionarios: {
    name: "Gestão de Funcionários",
    description: "Cadastro e gerenciamento da equipe",
    category: "administrativo",
    requiredForRole: ["gerente"],
    icon: "badge"
  },
  relatorios: {
    name: "Relatórios",
    description: "Relatórios de vendas, performance e análises",
    category: "relatorios",
    requiredForRole: ["gerente"],
    icon: "analytics"
  },
  configuracoes: {
    name: "Configurações",
    description: "Configurações do sistema e estabelecimento",
    category: "administrativo",
    requiredForRole: ["gerente"],
    icon: "settings"
  },
  estoque: {
    name: "Controle de Estoque",
    description: "Gestão de produtos e ingredientes",
    category: "operacional",
    requiredForRole: ["cozinheiro", "barman", "gerente"],
    icon: "inventory"
  },
  cardapio: {
    name: "Gestão de Cardápio",
    description: "Criação e edição de pratos e bebidas",
    category: "operacional",
    requiredForRole: ["cozinheiro", "barman", "gerente"],
    icon: "menu_book"
  },
  promocoes: {
    name: "Promoções",
    description: "Criação e gestão de promoções e descontos",
    category: "administrativo",
    requiredForRole: ["gerente"],
    icon: "local_offer"
  },
  financeiro: {
    name: "Financeiro",
    description: "Controle financeiro e contabilidade",
    category: "financeiro",
    requiredForRole: ["gerente"],
    icon: "account_balance"
  }
};

// ============================================================================
// CONFIGURAÇÕES DE PERMISSÕES POR FUNÇÃO
// ============================================================================

/**
 * Configurações completas de permissões para cada função
 */
export const ROLE_PERMISSION_CONFIGS: RoleConfigMap = {
  atendente: {
    role: "atendente",
    displayName: "Atendente de Caixa",
    description: "Responsável pelo atendimento ao cliente e operação do caixa",
    accessLevel: "USER",
    userType: "funcionario",
    hierarchy: 2,
    permissions: {
      dashboard: READ_ONLY_PERMISSION,
      gestao_caixa: OPERATIONAL_PERMISSION,
      clientes: READ_WRITE_PERMISSION,
      atendimento_bar: READ_ONLY_PERMISSION,
      promocoes: READ_ONLY_PERMISSION,
    }
  },

  garcom: {
    role: "garcom",
    displayName: "Garçom",
    description: "Responsável pelo atendimento às mesas e pedidos",
    accessLevel: "USER",
    userType: "funcionario",
    hierarchy: 2,
    permissions: {
      dashboard: READ_ONLY_PERMISSION,
      atendimento_bar: OPERATIONAL_PERMISSION,
      clientes: READ_WRITE_PERMISSION,
      cardapio: READ_ONLY_PERMISSION,
      promocoes: READ_ONLY_PERMISSION,
    }
  },

  cozinheiro: {
    role: "cozinheiro",
    displayName: "Cozinheiro",
    description: "Responsável pela preparação de pratos e controle da cozinha",
    accessLevel: "USER",
    userType: "funcionario",
    hierarchy: 2,
    permissions: {
      dashboard: READ_ONLY_PERMISSION,
      monitor_cozinha: OPERATIONAL_PERMISSION,
      estoque: READ_WRITE_PERMISSION,
      cardapio: READ_WRITE_PERMISSION,
    }
  },

  barman: {
    role: "barman",
    displayName: "Barman",
    description: "Responsável pela preparação de bebidas e gestão do bar",
    accessLevel: "USER",
    userType: "funcionario",
    hierarchy: 3,
    permissions: {
      dashboard: READ_ONLY_PERMISSION,
      monitor_bar: OPERATIONAL_PERMISSION,
      atendimento_bar: READ_WRITE_PERMISSION,
      estoque: READ_WRITE_PERMISSION,
      cardapio: READ_WRITE_PERMISSION,
      clientes: READ_ONLY_PERMISSION,
    }
  },

  gerente: {
    role: "gerente",
    displayName: "Gerente",
    description: "Responsável pela gestão geral do estabelecimento",
    accessLevel: "MANAGER",
    userType: "administrador",
    hierarchy: 5,
    canManageRoles: ["atendente", "garcom", "cozinheiro", "barman"],
    permissions: {
      dashboard: FULL_PERMISSION,
      monitor_bar: FULL_PERMISSION,
      atendimento_bar: FULL_PERMISSION,
      monitor_cozinha: FULL_PERMISSION,
      gestao_caixa: FULL_PERMISSION,
      clientes: FULL_PERMISSION,
      funcionarios: FULL_PERMISSION,
      relatorios: FULL_PERMISSION,
      configuracoes: READ_WRITE_PERMISSION,
      estoque: FULL_PERMISSION,
      cardapio: FULL_PERMISSION,
      promocoes: FULL_PERMISSION,
      financeiro: READ_WRITE_PERMISSION,
    }
  }
};

// ============================================================================
// CLASSE PRINCIPAL DE GERENCIAMENTO DE PRESETS
// ============================================================================

/**
 * Gerenciador de presets de permissões
 */
export class PermissionPresetManager {
  private static instance: PermissionPresetManager;
  private customPresets: Map<string, PermissionPreset> = new Map();

  private constructor() {}

  /**
   * Obtém a instância singleton
   */
  static getInstance(): PermissionPresetManager {
    if (!PermissionPresetManager.instance) {
      PermissionPresetManager.instance = new PermissionPresetManager();
    }
    return PermissionPresetManager.instance;
  }

  // ============================================================================
  // MÉTODOS DE OBTENÇÃO DE PRESETS
  // ============================================================================

  /**
   * Obtém as permissões padrão para uma função específica
   */
  getDefaultPermissions(role: BarRole): ModulePermissions {
    const config = ROLE_PERMISSION_CONFIGS[role];
    if (!config) {
      throw new Error(`Função não encontrada: ${role}`);
    }
    return { ...config.permissions };
  }

  /**
   * Obtém a configuração completa de uma função
   */
  getRoleConfig(role: BarRole): RolePermissionConfig {
    const config = ROLE_PERMISSION_CONFIGS[role];
    if (!config) {
      throw new Error(`Configuração não encontrada para a função: ${role}`);
    }
    return { ...config };
  }

  /**
   * Obtém todas as configurações de funções
   */
  getAllRoleConfigs(): RoleConfigMap {
    return { ...ROLE_PERMISSION_CONFIGS };
  }

  /**
   * Obtém preset por ID (incluindo customizados)
   */
  getPresetById(presetId: string): PermissionPreset | null {
    // Verificar presets customizados primeiro
    if (this.customPresets.has(presetId)) {
      return this.customPresets.get(presetId)!;
    }

    // Verificar presets padrão
    const role = presetId as BarRole;
    if (ROLE_PERMISSION_CONFIGS[role]) {
      return this.createPresetFromRole(role);
    }

    return null;
  }

  /**
   * Lista todos os presets disponíveis
   */
  getAllPresets(): PermissionPreset[] {
    const defaultPresets = Object.keys(ROLE_PERMISSION_CONFIGS).map(role => 
      this.createPresetFromRole(role as BarRole)
    );

    const customPresets = Array.from(this.customPresets.values());

    return [...defaultPresets, ...customPresets];
  }

  // ============================================================================
  // MÉTODOS DE VALIDAÇÃO E HIERARQUIA
  // ============================================================================

  /**
   * Valida se uma função pode gerenciar outra
   */
  canManageRole(managerRole: BarRole, targetRole: BarRole): boolean {
    const managerConfig = ROLE_PERMISSION_CONFIGS[managerRole];
    const targetConfig = ROLE_PERMISSION_CONFIGS[targetRole];

    if (!managerConfig || !targetConfig) {
      return false;
    }

    // Verificar hierarquia
    if (managerConfig.hierarchy <= targetConfig.hierarchy) {
      return false;
    }

    // Verificar lista específica de funções gerenciáveis
    if (managerConfig.canManageRoles) {
      return managerConfig.canManageRoles.includes(targetRole);
    }

    return true;
  }

  /**
   * Valida permissões de um usuário para um módulo e ação
   */
  validatePermission(
    userRole: BarRole,
    module: SystemModule,
    action: keyof ModulePermission
  ): PermissionValidationResult {
    const config = ROLE_PERMISSION_CONFIGS[userRole];
    
    if (!config) {
      return {
        isValid: false,
        hasAccess: false,
        missingPermissions: [],
        warnings: [],
        errors: [`Função não encontrada: ${userRole}`]
      };
    }

    const modulePermission = config.permissions[module];
    
    if (!modulePermission) {
      return {
        isValid: true,
        hasAccess: false,
        missingPermissions: [{
          module,
          action,
          required: true,
          current: false
        }],
        warnings: [`Módulo ${module} não configurado para a função ${userRole}`],
        errors: []
      };
    }

    const hasAccess = modulePermission[action];

    return {
      isValid: true,
      hasAccess,
      missingPermissions: hasAccess ? [] : [{
        module,
        action,
        required: true,
        current: false
      }],
      warnings: [],
      errors: []
    };
  }

  /**
   * Cria contexto de permissões para um usuário
   */
  createUserPermissionContext(
    userId: string,
    role: BarRole,
    customPermissions?: ModulePermissions
  ): UserPermissionContext {
    const defaultPermissions = this.getDefaultPermissions(role);
    const effectivePermissions = customPermissions || defaultPermissions;

    return {
      userId,
      role,
      permissions: defaultPermissions,
      effectivePermissions,
      canAccess: (module: SystemModule, action: keyof ModulePermission) => {
        const modulePermission = effectivePermissions[module];
        return modulePermission ? modulePermission[action] : false;
      },
      canManage: (targetRole: BarRole) => {
        return this.canManageRole(role, targetRole);
      }
    };
  }

  // ============================================================================
  // MÉTODOS DE CUSTOMIZAÇÃO
  // ============================================================================

  /**
   * Cria um preset customizado
   */
  createCustomPreset(
    name: string,
    description: string,
    baseRole: BarRole,
    customPermissions: Partial<ModulePermissions>
  ): PermissionPreset {
    const basePermissions = this.getDefaultPermissions(baseRole);
    const mergedPermissions = this.mergePermissions(basePermissions, customPermissions);
    
    const preset: PermissionPreset = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      role: baseRole,
      permissions: mergedPermissions,
      isDefault: false,
      isCustomizable: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.customPresets.set(preset.id, preset);
    return preset;
  }

  /**
   * Atualiza um preset customizado
   */
  updateCustomPreset(
    presetId: string,
    updates: Partial<Pick<PermissionPreset, 'name' | 'description' | 'permissions'>>
  ): PermissionPreset | null {
    const preset = this.customPresets.get(presetId);
    
    if (!preset || !preset.isCustomizable) {
      return null;
    }

    const updatedPreset = {
      ...preset,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.customPresets.set(presetId, updatedPreset);
    return updatedPreset;
  }

  /**
   * Remove um preset customizado
   */
  deleteCustomPreset(presetId: string): boolean {
    const preset = this.customPresets.get(presetId);
    
    if (!preset || !preset.isCustomizable) {
      return false;
    }

    return this.customPresets.delete(presetId);
  }

  // ============================================================================
  // MÉTODOS UTILITÁRIOS
  // ============================================================================

  /**
   * Mescla permissões base com customizações
   */
  private mergePermissions(
    basePermissions: ModulePermissions,
    customPermissions: Partial<ModulePermissions>
  ): ModulePermissions {
    const merged = { ...basePermissions };

    for (const [module, permissions] of Object.entries(customPermissions)) {
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
   * Cria preset a partir de uma função
   */
  private createPresetFromRole(role: BarRole): PermissionPreset {
    const config = ROLE_PERMISSION_CONFIGS[role];
    
    return {
      id: role,
      name: config.displayName,
      description: config.description,
      role,
      permissions: config.permissions,
      isDefault: true,
      isCustomizable: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Obtém lista de módulos obrigatórios para uma função
   */
  getRequiredModulesForRole(role: BarRole): SystemModule[] {
    return Object.entries(MODULE_DESCRIPTIONS)
      .filter(([_, desc]) => desc.requiredForRole?.includes(role))
      .map(([module, _]) => module as SystemModule);
  }

  /**
   * Obtém hierarquia de uma função
   */
  getRoleHierarchy(role: BarRole): number {
    return ROLE_PERMISSION_CONFIGS[role]?.hierarchy || 0;
  }

  /**
   * Lista funções que uma função pode gerenciar
   */
  getManageableRoles(role: BarRole): BarRole[] {
    const config = ROLE_PERMISSION_CONFIGS[role];
    return config?.canManageRoles || [];
  }
}

// ============================================================================
// INSTÂNCIA SINGLETON EXPORTADA
// ============================================================================

export const permissionPresetManager = PermissionPresetManager.getInstance();
export default permissionPresetManager;