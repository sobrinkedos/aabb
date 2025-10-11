/**
 * Testes Unitários para Middleware de Autenticação
 */

import {
  hasModuleAccess,
  isAdmin,
  canManageEmployees,
  requireAuth,
  requireModulePermission
} from '../../middleware/authMiddleware';

// Mock do Supabase
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      getSession: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }
}));

describe('Auth Middleware', () => {
  const mockUserPermissions = {
    userId: 'user123',
    empresaId: 'empresa123',
    role: 'garcom',
    permissions: {
      dashboard: { visualizar: true, criar: false, editar: false, excluir: false, administrar: false },
      monitor_bar: { visualizar: true, criar: false, editar: false, excluir: false, administrar: false },
      atendimento_bar: { visualizar: true, criar: true, editar: true, excluir: false, administrar: false },
      monitor_cozinha: { visualizar: false, criar: false, editar: false, excluir: false, administrar: false },
      gestao_caixa: { visualizar: false, criar: false, editar: false, excluir: false, administrar: false },
      clientes: { visualizar: true, criar: false, editar: false, excluir: false, administrar: false },
      funcionarios: { visualizar: false, criar: false, editar: false, excluir: false, administrar: false },
      relatorios: { visualizar: false, criar: false, editar: false, excluir: false, administrar: false },
      configuracoes: { visualizar: false, criar: false, editar: false, excluir: false, administrar: false }
    },
    isActive: true,
    hasSystemAccess: true
  };

  const mockManagerPermissions = {
    ...mockUserPermissions,
    role: 'gerente',
    permissions: {
      dashboard: { visualizar: true, criar: true, editar: true, excluir: true, administrar: true },
      monitor_bar: { visualizar: true, criar: true, editar: true, excluir: true, administrar: true },
      atendimento_bar: { visualizar: true, criar: true, editar: true, excluir: true, administrar: true },
      monitor_cozinha: { visualizar: true, criar: true, editar: true, excluir: true, administrar: true },
      gestao_caixa: { visualizar: true, criar: true, editar: true, excluir: true, administrar: true },
      clientes: { visualizar: true, criar: true, editar: true, excluir: true, administrar: true },
      funcionarios: { visualizar: true, criar: true, editar: true, excluir: true, administrar: true },
      relatorios: { visualizar: true, criar: true, editar: true, excluir: true, administrar: true },
      configuracoes: { visualizar: true, criar: true, editar: true, excluir: true, administrar: true }
    }
  };

  describe('hasModuleAccess', () => {
    it('should return true when user has required permission', () => {
      expect(hasModuleAccess(mockUserPermissions, 'dashboard', 'visualizar')).toBe(true);
      expect(hasModuleAccess(mockUserPermissions, 'atendimento_bar', 'criar')).toBe(true);
    });

    it('should return false when user lacks required permission', () => {
      expect(hasModuleAccess(mockUserPermissions, 'funcionarios', 'visualizar')).toBe(false);
      expect(hasModuleAccess(mockUserPermissions, 'atendimento_bar', 'administrar')).toBe(false);
    });

    it('should return false when user is inactive', () => {
      const inactiveUser = { ...mockUserPermissions, isActive: false };
      expect(hasModuleAccess(inactiveUser, 'dashboard', 'visualizar')).toBe(false);
    });

    it('should return false when user has no system access', () => {
      const noAccessUser = { ...mockUserPermissions, hasSystemAccess: false };
      expect(hasModuleAccess(noAccessUser, 'dashboard', 'visualizar')).toBe(false);
    });

    it('should return false when permissions is null', () => {
      expect(hasModuleAccess(null, 'dashboard', 'visualizar')).toBe(false);
    });

    it('should default to visualizar action', () => {
      expect(hasModuleAccess(mockUserPermissions, 'dashboard')).toBe(true);
    });
  });

  describe('isAdmin', () => {
    it('should return true for manager role', () => {
      expect(isAdmin(mockManagerPermissions)).toBe(true);
    });

    it('should return true for users with admin permissions', () => {
      const adminUser = {
        ...mockUserPermissions,
        permissions: {
          ...mockUserPermissions.permissions,
          configuracoes: { ...mockUserPermissions.permissions.configuracoes, administrar: true }
        }
      };
      expect(isAdmin(adminUser)).toBe(true);
    });

    it('should return false for regular users', () => {
      expect(isAdmin(mockUserPermissions)).toBe(false);
    });

    it('should return false when permissions is null', () => {
      expect(isAdmin(null)).toBe(false);
    });
  });

  describe('canManageEmployees', () => {
    it('should return true for managers', () => {
      expect(canManageEmployees(mockManagerPermissions)).toBe(true);
    });

    it('should return true for users with employee admin permissions', () => {
      const employeeAdmin = {
        ...mockUserPermissions,
        permissions: {
          ...mockUserPermissions.permissions,
          funcionarios: { ...mockUserPermissions.permissions.funcionarios, administrar: true }
        }
      };
      expect(canManageEmployees(employeeAdmin)).toBe(true);
    });

    it('should return true for users with employee edit permissions', () => {
      const employeeEditor = {
        ...mockUserPermissions,
        permissions: {
          ...mockUserPermissions.permissions,
          funcionarios: { ...mockUserPermissions.permissions.funcionarios, editar: true }
        }
      };
      expect(canManageEmployees(employeeEditor)).toBe(true);
    });

    it('should return false for users without employee permissions', () => {
      expect(canManageEmployees(mockUserPermissions)).toBe(false);
    });

    it('should return false when permissions is null', () => {
      expect(canManageEmployees(null)).toBe(false);
    });
  });

  describe('requireAuth', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return success when user is authenticated and active', async () => {
      const { supabase } = require('../../lib/supabase');
      supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null
      });

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                user_id: 'user123',
                empresa_id: 'empresa123',
                ativo: true,
                tem_acesso_sistema: true,
                cargo: 'garcom',
                permissoes_usuario: []
              },
              error: null
            })
          })
        })
      });

      const result = await requireAuth();
      expect(result.success).toBe(true);
      expect(result.permissions).toBeDefined();
    });

    it('should return failure when user is not authenticated', async () => {
      const { supabase } = require('../../lib/supabase');
      supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      });

      const result = await requireAuth();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Usuário não autenticado');
    });
  });

  describe('requireModulePermission', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return success when user has required permission', async () => {
      // Mock requireAuth to return success
      jest.doMock('../../middleware/authMiddleware', () => ({
        ...jest.requireActual('../../middleware/authMiddleware'),
        requireAuth: jest.fn().mockResolvedValue({
          success: true,
          permissions: mockUserPermissions
        })
      }));

      const result = await requireModulePermission('dashboard', 'visualizar');
      expect(result.success).toBe(true);
    });

    it('should return failure when user lacks required permission', async () => {
      // Mock requireAuth to return success but user lacks permission
      jest.doMock('../../middleware/authMiddleware', () => ({
        ...jest.requireActual('../../middleware/authMiddleware'),
        requireAuth: jest.fn().mockResolvedValue({
          success: true,
          permissions: mockUserPermissions
        })
      }));

      const result = await requireModulePermission('funcionarios', 'administrar');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Sem permissão');
    });
  });
});