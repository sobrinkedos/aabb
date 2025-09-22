/**
 * Hook para Gerenciamento de Permissões
 * 
 * Fornece funcionalidades para verificar, validar e gerenciar permissões
 * de usuários baseadas em suas funções no sistema.
 * 
 * @version 1.0.0
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  BarRole,
  SystemModule,
  PermissionAction,
  ModulePermissions,
  UserPermissionContext,
  PermissionValidationResult,
  PermissionPreset,
} from '../types/permissions';

import { permissionPresetManager } from '../services/permission-presets';
import {
  hasPermission,
  hasMultiplePermissions,
  canAccessModule,
  canManageUser,
  validatePermissionConfiguration,
  sanitizePermissions,
  generatePermissionSummary,
  getDefaultPermissionsForRole,
  isDefaultPermissionSet,
} from '../utils/permission-utils';

// ============================================================================
// INTERFACES DO HOOK
// ============================================================================

interface UsePermissionsOptions {
  userId?: string;
  role: BarRole;
  customPermissions?: ModulePermissions;
  enableLogging?: boolean;
}

interface UsePermissionsReturn {
  // Estado
  permissions: ModulePermissions;
  isLoading: boolean;
  error: string | null;
  
  // Verificações básicas
  hasPermission: (module: SystemModule, action: PermissionAction) => boolean;
  canAccess: (module: SystemModule) => boolean;
  canManage: (targetRole: BarRole) => boolean;
  
  // Verificações avançadas
  hasMultiplePermissions: (checks: Array<{
    module: SystemModule;
    action: PermissionAction;
    required?: boolean;
  }>) => { hasAccess: boolean; results: any[] };
  
  // Validação
  validatePermissions: () => PermissionValidationResult;
  isValidConfiguration: boolean;
  
  // Informações
  roleConfig: ReturnType<typeof permissionPresetManager.getRoleConfig>;
  permissionSummary: ReturnType<typeof generatePermissionSummary>;
  isDefaultPermissions: boolean;
  
  // Ações
  updatePermissions: (newPermissions: Partial<ModulePermissions>) => void;
  resetToDefault: () => void;
  sanitizeCurrentPermissions: () => void;
  
  // Presets
  availablePresets: PermissionPreset[];
  applyPreset: (presetId: string) => boolean;
  createCustomPreset: (name: string, description: string) => PermissionPreset | null;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

/**
 * Hook principal para gerenciamento de permissões
 */
export function usePermissions(options: UsePermissionsOptions): UsePermissionsReturn {
  const { userId, role, customPermissions, enableLogging = false } = options;
  
  // Estados
  const [permissions, setPermissions] = useState<ModulePermissions>(() => 
    customPermissions || getDefaultPermissionsForRole(role)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Configuração da função
  const roleConfig = useMemo(() => {
    try {
      return permissionPresetManager.getRoleConfig(role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar configuração da função');
      return null;
    }
  }, [role]);

  // Presets disponíveis
  const availablePresets = useMemo(() => {
    try {
      return permissionPresetManager.getAllPresets();
    } catch (err) {
      if (enableLogging) {
        console.error('Erro ao carregar presets:', err);
      }
      return [];
    }
  }, [enableLogging]);

  // Resumo de permissões
  const permissionSummary = useMemo(() => 
    generatePermissionSummary(permissions), 
    [permissions]
  );

  // Verificar se são permissões padrão
  const isDefaultPermissions = useMemo(() => 
    isDefaultPermissionSet(permissions, role), 
    [permissions, role]
  );

  // Validação de permissões
  const validationResult = useMemo(() => 
    validatePermissionConfiguration(permissions, role), 
    [permissions, role]
  );

  const isValidConfiguration = validationResult.isValid;

  // ============================================================================
  // FUNÇÕES DE VERIFICAÇÃO
  // ============================================================================

  const checkPermission = useCallback((module: SystemModule, action: PermissionAction): boolean => {
    return hasPermission(role, module, action, permissions);
  }, [role, permissions]);

  const checkAccess = useCallback((module: SystemModule): boolean => {
    return canAccessModule(role, module, permissions);
  }, [role, permissions]);

  const checkManage = useCallback((targetRole: BarRole): boolean => {
    return canManageUser(role, targetRole);
  }, [role]);

  const checkMultiplePermissions = useCallback((checks: Array<{
    module: SystemModule;
    action: PermissionAction;
    required?: boolean;
  }>) => {
    return hasMultiplePermissions(role, checks, permissions);
  }, [role, permissions]);

  // ============================================================================
  // FUNÇÕES DE VALIDAÇÃO
  // ============================================================================

  const validatePermissions = useCallback((): PermissionValidationResult => {
    return validatePermissionConfiguration(permissions, role);
  }, [permissions, role]);

  // ============================================================================
  // FUNÇÕES DE ATUALIZAÇÃO
  // ============================================================================

  const updatePermissions = useCallback((newPermissions: Partial<ModulePermissions>) => {
    setIsLoading(true);
    setError(null);

    try {
      const updatedPermissions = { ...permissions };
      
      for (const [module, modulePermissions] of Object.entries(newPermissions)) {
        if (modulePermissions) {
          updatedPermissions[module as SystemModule] = {
            ...updatedPermissions[module as SystemModule],
            ...modulePermissions
          };
        }
      }

      // Validar as novas permissões
      const validation = validatePermissionConfiguration(updatedPermissions, role);
      
      if (!validation.isValid) {
        setError(`Permissões inválidas: ${validation.errors.join(', ')}`);
        return;
      }

      setPermissions(updatedPermissions);
      
      if (enableLogging) {
        console.log('Permissões atualizadas:', updatedPermissions);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar permissões');
    } finally {
      setIsLoading(false);
    }
  }, [permissions, role, enableLogging]);

  const resetToDefault = useCallback(() => {
    setIsLoading(true);
    setError(null);

    try {
      const defaultPermissions = getDefaultPermissionsForRole(role);
      setPermissions(defaultPermissions);
      
      if (enableLogging) {
        console.log('Permissões resetadas para padrão:', defaultPermissions);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao resetar permissões');
    } finally {
      setIsLoading(false);
    }
  }, [role, enableLogging]);

  const sanitizeCurrentPermissions = useCallback(() => {
    setIsLoading(true);
    setError(null);

    try {
      const sanitizedPermissions = sanitizePermissions(permissions);
      setPermissions(sanitizedPermissions);
      
      if (enableLogging) {
        console.log('Permissões sanitizadas:', sanitizedPermissions);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao sanitizar permissões');
    } finally {
      setIsLoading(false);
    }
  }, [permissions, enableLogging]);

  // ============================================================================
  // FUNÇÕES DE PRESET
  // ============================================================================

  const applyPreset = useCallback((presetId: string): boolean => {
    setIsLoading(true);
    setError(null);

    try {
      const preset = permissionPresetManager.getPresetById(presetId);
      
      if (!preset) {
        setError(`Preset não encontrado: ${presetId}`);
        return false;
      }

      // Verificar se o preset é compatível com a função atual
      if (preset.role !== role) {
        setError(`Preset incompatível: esperado ${role}, encontrado ${preset.role}`);
        return false;
      }

      setPermissions(preset.permissions);
      
      if (enableLogging) {
        console.log('Preset aplicado:', preset);
      }
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao aplicar preset');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [role, enableLogging]);

  const createCustomPreset = useCallback((name: string, description: string): PermissionPreset | null => {
    try {
      const preset = permissionPresetManager.createCustomPreset(
        name,
        description,
        role,
        permissions
      );
      
      if (enableLogging) {
        console.log('Preset customizado criado:', preset);
      }
      
      return preset;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar preset customizado');
      return null;
    }
  }, [role, permissions, enableLogging]);

  // ============================================================================
  // EFEITOS
  // ============================================================================

  // Atualizar permissões quando customPermissions mudar
  useEffect(() => {
    if (customPermissions) {
      setPermissions(customPermissions);
    }
  }, [customPermissions]);

  // Log de mudanças de permissões (se habilitado)
  useEffect(() => {
    if (enableLogging) {
      console.log('Permissões atuais:', permissions);
      console.log('Resumo:', permissionSummary);
      console.log('Validação:', validationResult);
    }
  }, [permissions, permissionSummary, validationResult, enableLogging]);

  // ============================================================================
  // RETORNO DO HOOK
  // ============================================================================

  return {
    // Estado
    permissions,
    isLoading,
    error,
    
    // Verificações básicas
    hasPermission: checkPermission,
    canAccess: checkAccess,
    canManage: checkManage,
    
    // Verificações avançadas
    hasMultiplePermissions: checkMultiplePermissions,
    
    // Validação
    validatePermissions,
    isValidConfiguration,
    
    // Informações
    roleConfig: roleConfig!,
    permissionSummary,
    isDefaultPermissions,
    
    // Ações
    updatePermissions,
    resetToDefault,
    sanitizeCurrentPermissions,
    
    // Presets
    availablePresets,
    applyPreset,
    createCustomPreset,
  };
}

// ============================================================================
// HOOKS ESPECIALIZADOS
// ============================================================================

/**
 * Hook simplificado para verificação de permissões
 */
export function usePermissionCheck(role: BarRole, customPermissions?: ModulePermissions) {
  return useMemo(() => ({
    hasPermission: (module: SystemModule, action: PermissionAction) => 
      hasPermission(role, module, action, customPermissions),
    canAccess: (module: SystemModule) => 
      canAccessModule(role, module, customPermissions),
    canManage: (targetRole: BarRole) => 
      canManageUser(role, targetRole),
  }), [role, customPermissions]);
}

/**
 * Hook para gerenciamento de presets
 */
export function usePermissionPresets() {
  const [presets, setPresets] = useState<PermissionPreset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPresets = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const allPresets = permissionPresetManager.getAllPresets();
      setPresets(allPresets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar presets');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPreset = useCallback((
    name: string,
    description: string,
    baseRole: BarRole,
    customPermissions: Partial<ModulePermissions>
  ) => {
    try {
      const preset = permissionPresetManager.createCustomPreset(
        name,
        description,
        baseRole,
        customPermissions
      );
      
      // Recarregar presets
      loadPresets();
      
      return preset;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar preset');
      return null;
    }
  }, [loadPresets]);

  const updatePreset = useCallback((
    presetId: string,
    updates: Partial<Pick<PermissionPreset, 'name' | 'description' | 'permissions'>>
  ) => {
    try {
      const updated = permissionPresetManager.updateCustomPreset(presetId, updates);
      
      if (updated) {
        loadPresets();
      }
      
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar preset');
      return null;
    }
  }, [loadPresets]);

  const deletePreset = useCallback((presetId: string) => {
    try {
      const deleted = permissionPresetManager.deleteCustomPreset(presetId);
      
      if (deleted) {
        loadPresets();
      }
      
      return deleted;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar preset');
      return false;
    }
  }, [loadPresets]);

  // Carregar presets na inicialização
  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  return {
    presets,
    isLoading,
    error,
    loadPresets,
    createPreset,
    updatePreset,
    deletePreset,
  };
}

/**
 * Hook para contexto de usuário com permissões
 */
export function useUserPermissionContext(userId: string, role: BarRole, customPermissions?: ModulePermissions) {
  return useMemo(() => {
    return permissionPresetManager.createUserPermissionContext(userId, role, customPermissions);
  }, [userId, role, customPermissions]);
}