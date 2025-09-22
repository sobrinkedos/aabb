/**
 * Testes Unitários para o Sistema de Presets de Permissões
 * 
 * Testa todas as funcionalidades do sistema de permissões baseado em funções,
 * incluindo validação, hierarquia e customização.
 */

import {
  BarRole,
  SystemModule,
  ModulePermissions,
  EMPTY_PERMISSION,
  READ_ONLY_PERMISSION,
  FULL_PERMISSION,
} from '../../types/permissions';

import { PermissionPresetManager, ROLE_PERMISSION_CONFIGS } from '../permission-presets';
import {
  hasPermission,
  canManageUser,
  validatePermissionConfiguration,
  sanitizePermissions,
  generatePermissionSummary,
  isDefaultPermissionSet,
} from '../../utils/permission-utils';

describe('PermissionPresetManager', () => {
  let manager: PermissionPresetManager;

  beforeEach(() => {
    manager = PermissionPresetManager.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('deve retornar a mesma instância', () => {
      const instance1 = PermissionPresetManager.getInstance();
      const instance2 = PermissionPresetManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getDefaultPermissions', () => {
    it('deve retornar permissões padrão para garçom', () => {
      const permissions = manager.getDefaultPermissions('garcom');
      
      expect(permissions).toBeDefined();
      expect(permissions.dashboard).toBeDefined();
      expect(permissions.dashboard.visualizar).toBe(true);
      expect(permissions.atendimento_bar).toBeDefined();
      expect(permissions.atendimento_bar.editar).toBe(true);
    });

    it('deve retornar permissões padrão para gerente', () => {
      const permissions = manager.getDefaultPermissions('gerente');
      
      expect(permissions).toBeDefined();
      expect(permissions.funcionarios).toBeDefined();
      expect(permissions.funcionarios.administrar).toBe(true);
      expect(permissions.relatorios).toBeDefined();
    });

    it('deve lançar erro para função inválida', () => {
      expect(() => {
        manager.getDefaultPermissions('funcao_inexistente' as BarRole);
      }).toThrow();
    });
  });

  describe('getRoleConfig', () => {
    it('deve retornar configuração completa para atendente', () => {
      const config = manager.getRoleConfig('atendente');
      
      expect(config.role).toBe('atendente');
      expect(config.displayName).toBe('Atendente de Caixa');
      expect(config.hierarchy).toBe(2);
      expect(config.accessLevel).toBe('USER');
      expect(config.userType).toBe('funcionario');
    });

    it('deve retornar configuração completa para gerente', () => {
      const config = manager.getRoleConfig('gerente');
      
      expect(config.role).toBe('gerente');
      expect(config.displayName).toBe('Gerente');
      expect(config.hierarchy).toBe(5);
      expect(config.accessLevel).toBe('MANAGER');
      expect(config.userType).toBe('administrador');
      expect(config.canManageRoles).toContain('garcom');
    });
  });

  describe('canManageRole', () => {
    it('gerente deve poder gerenciar garçom', () => {
      const canManage = manager.canManageRole('gerente', 'garcom');
      expect(canManage).toBe(true);
    });

    it('garçom não deve poder gerenciar gerente', () => {
      const canManage = manager.canManageRole('garcom', 'gerente');
      expect(canManage).toBe(false);
    });

    it('atendente não deve poder gerenciar barman', () => {
      const canManage = manager.canManageRole('atendente', 'barman');
      expect(canManage).toBe(false);
    });

    it('deve retornar false para funções inexistentes', () => {
      const canManage = manager.canManageRole('funcao_inexistente' as BarRole, 'garcom');
      expect(canManage).toBe(false);
    });
  });

  describe('validatePermission', () => {
    it('deve validar permissão existente', () => {
      const result = manager.validatePermission('garcom', 'atendimento_bar', 'visualizar');
      
      expect(result.isValid).toBe(true);
      expect(result.hasAccess).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('deve invalidar permissão inexistente', () => {
      const result = manager.validatePermission('garcom', 'funcionarios', 'administrar');
      
      expect(result.isValid).toBe(true);
      expect(result.hasAccess).toBe(false);
      expect(result.missingPermissions).toHaveLength(1);
    });

    it('deve retornar erro para função inexistente', () => {
      const result = manager.validatePermission('funcao_inexistente' as BarRole, 'dashboard', 'visualizar');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('createUserPermissionContext', () => {
    it('deve criar contexto válido para usuário', () => {
      const context = manager.createUserPermissionContext('user-123', 'barman');
      
      expect(context.userId).toBe('user-123');
      expect(context.role).toBe('barman');
      expect(context.canAccess('monitor_bar', 'visualizar')).toBe(true);
      expect(context.canAccess('funcionarios', 'administrar')).toBe(false);
      expect(context.canManage('garcom')).toBe(false);
    });

    it('deve usar permissões customizadas quando fornecidas', () => {
      const customPermissions: ModulePermissions = {
        dashboard: FULL_PERMISSION,
        funcionarios: READ_ONLY_PERMISSION
      };
      
      const context = manager.createUserPermissionContext('user-456', 'garcom', customPermissions);
      
      expect(context.canAccess('funcionarios', 'visualizar')).toBe(true);
      expect(context.canAccess('funcionarios', 'administrar')).toBe(false);
    });
  });

  describe('Custom Presets', () => {
    it('deve criar preset customizado', () => {
      const preset = manager.createCustomPreset(
        'Garçom Senior',
        'Garçom com permissões extras',
        'garcom',
        {
          relatorios: READ_ONLY_PERMISSION
        }
      );
      
      expect(preset.name).toBe('Garçom Senior');
      expect(preset.isDefault).toBe(false);
      expect(preset.isCustomizable).toBe(true);
      expect(preset.permissions.relatorios).toBeDefined();
    });

    it('deve atualizar preset customizado', () => {
      const preset = manager.createCustomPreset('Test', 'Test desc', 'garcom', {});
      
      const updated = manager.updateCustomPreset(preset.id, {
        name: 'Updated Name',
        description: 'Updated Description'
      });
      
      expect(updated).toBeDefined();
      expect(updated!.name).toBe('Updated Name');
      expect(updated!.description).toBe('Updated Description');
    });

    it('deve deletar preset customizado', () => {
      const preset = manager.createCustomPreset('To Delete', 'Test', 'garcom', {});
      
      const deleted = manager.deleteCustomPreset(preset.id);
      expect(deleted).toBe(true);
      
      const retrieved = manager.getPresetById(preset.id);
      expect(retrieved).toBeNull();
    });

    it('não deve permitir atualizar preset padrão', () => {
      const updated = manager.updateCustomPreset('garcom', { name: 'New Name' });
      expect(updated).toBeNull();
    });
  });

  describe('Utility Methods', () => {
    it('deve retornar módulos obrigatórios para função', () => {
      const requiredModules = manager.getRequiredModulesForRole('gerente');
      expect(requiredModules).toContain('dashboard');
      expect(requiredModules.length).toBeGreaterThan(0);
    });

    it('deve retornar hierarquia correta', () => {
      expect(manager.getRoleHierarchy('gerente')).toBe(5);
      expect(manager.getRoleHierarchy('garcom')).toBe(2);
    });

    it('deve retornar funções gerenciáveis', () => {
      const manageable = manager.getManageableRoles('gerente');
      expect(manageable).toContain('garcom');
      expect(manageable).toContain('atendente');
    });
  });
});

describe('Permission Utils', () => {
  describe('hasPermission', () => {
    it('deve verificar permissão existente', () => {
      const hasAccess = hasPermission('gerente', 'funcionarios', 'administrar');
      expect(hasAccess).toBe(true);
    });

    it('deve negar permissão inexistente', () => {
      const hasAccess = hasPermission('garcom', 'funcionarios', 'administrar');
      expect(hasAccess).toBe(false);
    });

    it('deve usar permissões customizadas', () => {
      const customPermissions: ModulePermissions = {
        funcionarios: FULL_PERMISSION
      };
      
      const hasAccess = hasPermission('garcom', 'funcionarios', 'administrar', customPermissions);
      expect(hasAccess).toBe(true);
    });
  });

  describe('canManageUser', () => {
    it('deve permitir gerente gerenciar garçom', () => {
      const canManage = canManageUser('gerente', 'garcom');
      expect(canManage).toBe(true);
    });

    it('deve negar garçom gerenciar gerente', () => {
      const canManage = canManageUser('garcom', 'gerente');
      expect(canManage).toBe(false);
    });
  });

  describe('validatePermissionConfiguration', () => {
    it('deve validar configuração consistente', () => {
      const permissions: ModulePermissions = {
        dashboard: {
          visualizar: true,
          criar: true,
          editar: true,
          excluir: false,
          administrar: false
        }
      };
      
      const result = validatePermissionConfiguration(permissions, 'garcom');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('deve detectar inconsistências', () => {
      const permissions: ModulePermissions = {
        dashboard: {
          visualizar: false,
          criar: true, // Inconsistente: pode criar mas não visualizar
          editar: false,
          excluir: false,
          administrar: false
        }
      };
      
      const result = validatePermissionConfiguration(permissions, 'garcom');
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('sanitizePermissions', () => {
    it('deve corrigir inconsistências', () => {
      const permissions: ModulePermissions = {
        dashboard: {
          visualizar: false,
          criar: true,
          editar: false,
          excluir: false,
          administrar: false
        }
      };
      
      const sanitized = sanitizePermissions(permissions);
      expect(sanitized.dashboard.visualizar).toBe(true); // Deve ser corrigido
    });

    it('deve manter permissões consistentes', () => {
      const permissions: ModulePermissions = {
        dashboard: READ_ONLY_PERMISSION
      };
      
      const sanitized = sanitizePermissions(permissions);
      expect(sanitized.dashboard).toEqual(READ_ONLY_PERMISSION);
    });
  });

  describe('generatePermissionSummary', () => {
    it('deve gerar resumo correto', () => {
      const permissions: ModulePermissions = {
        dashboard: READ_ONLY_PERMISSION,
        funcionarios: FULL_PERMISSION,
        clientes: EMPTY_PERMISSION
      };
      
      const summary = generatePermissionSummary(permissions);
      
      expect(summary.totalModules).toBe(3);
      expect(summary.accessibleModules).toBe(2); // dashboard e funcionarios
      expect(summary.editableModules).toBe(1); // apenas funcionarios
      expect(summary.adminModules).toBe(1); // apenas funcionarios
    });
  });

  describe('isDefaultPermissionSet', () => {
    it('deve identificar permissões padrão', () => {
      const defaultPermissions = manager.getDefaultPermissions('garcom');
      const isDefault = isDefaultPermissionSet(defaultPermissions, 'garcom');
      expect(isDefault).toBe(true);
    });

    it('deve identificar permissões customizadas', () => {
      const customPermissions: ModulePermissions = {
        dashboard: FULL_PERMISSION // Diferente do padrão
      };
      
      const isDefault = isDefaultPermissionSet(customPermissions, 'garcom');
      expect(isDefault).toBe(false);
    });
  });
});

describe('Role Permission Configs', () => {
  it('deve ter configurações para todas as funções', () => {
    const roles: BarRole[] = ['atendente', 'garcom', 'cozinheiro', 'barman', 'gerente'];
    
    for (const role of roles) {
      expect(ROLE_PERMISSION_CONFIGS[role]).toBeDefined();
      expect(ROLE_PERMISSION_CONFIGS[role].role).toBe(role);
      expect(ROLE_PERMISSION_CONFIGS[role].displayName).toBeTruthy();
      expect(ROLE_PERMISSION_CONFIGS[role].hierarchy).toBeGreaterThan(0);
    }
  });

  it('deve ter hierarquia crescente correta', () => {
    expect(ROLE_PERMISSION_CONFIGS.gerente.hierarchy).toBeGreaterThan(
      ROLE_PERMISSION_CONFIGS.barman.hierarchy
    );
    expect(ROLE_PERMISSION_CONFIGS.barman.hierarchy).toBeGreaterThanOrEqual(
      ROLE_PERMISSION_CONFIGS.garcom.hierarchy
    );
  });

  it('gerente deve ter mais permissões que outras funções', () => {
    const gerentePermissions = Object.keys(ROLE_PERMISSION_CONFIGS.gerente.permissions).length;
    const garcomPermissions = Object.keys(ROLE_PERMISSION_CONFIGS.garcom.permissions).length;
    
    expect(gerentePermissions).toBeGreaterThan(garcomPermissions);
  });
});

// Mock para testes que precisam de instância singleton limpa
const manager = PermissionPresetManager.getInstance();