/**
 * Testes de Integração - Fluxo de Autenticação e Permissões
 */

import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  requireAuth, 
  requireModulePermission, 
  hasModuleAccess 
} from '../../middleware/authMiddleware';

// Mock do Supabase
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      }))
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

// Mock do loadUserPermissions
jest.mock('../../middleware/authMiddleware', () => ({
  ...jest.requireActual('../../middleware/authMiddleware'),
  loadUserPermissions: jest.fn()
}));

describe('Authentication Flow Integration Tests', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com'
  };

  const mockUserPermissions = {
    userId: 'user-123',
    empresaId: 'empresa-123',
    role: 'garcom',
    permissions: {
      dashboard: { visualizar: true, criar: false, editar: false, excluir: false, administrar: false },
      atendimento_bar: { visualizar: true, criar: true, editar: true, excluir: false, administrar: false },
      funcionarios: { visualizar: false, criar: false, editar: false, excluir: false, administrar: false }
    },
    isActive: true,
    hasSystemAccess: true
  };

  const mockManagerPermissions = {
    ...mockUserPermissions,
    role: 'gerente',
    permissions: {
      dashboard: { visualizar: true, criar: true, editar: true, excluir: true, administrar: true },
      atendimento_bar: { visualizar: true, criar: true, editar: true, excluir: true, administrar: true },
      funcionarios: { visualizar: true, criar: true, editar: true, excluir: true, administrar: true }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Login Flow', () => {
    it('should authenticate user with valid credentials', async () => {
      const { supabase } = require('../../lib/supabase');
      const { loadUserPermissions } = require('../../middleware/authMiddleware');

      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      loadUserPermissions.mockResolvedValue(mockUserPermissions);

      const { result } = renderHook(() => useAuth());

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'password123');
      });

      expect(loginResult.success).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.permissions).toEqual(mockUserPermissions);
    });

    it('should reject invalid credentials', async () => {
      const { supabase } = require('../../lib/supabase');

      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid login credentials' }
      });

      const { result } = renderHook(() => useAuth());

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login('wrong@example.com', 'wrongpassword');
      });

      expect(loginResult.success).toBe(false);
      expect(loginResult.error).toBe('Email ou senha incorretos');
    });

    it('should reject inactive users', async () => {
      const { supabase } = require('../../lib/supabase');
      const { loadUserPermissions } = require('../../middleware/authMiddleware');

      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      loadUserPermissions.mockResolvedValue({
        ...mockUserPermissions,
        isActive: false
      });

      const { result } = renderHook(() => useAuth());

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'password123');
      });

      expect(loginResult.success).toBe(false);
      expect(loginResult.error).toBe('Usuário inativo');
    });

    it('should reject users without system access', async () => {
      const { supabase } = require('../../lib/supabase');
      const { loadUserPermissions } = require('../../middleware/authMiddleware');

      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      loadUserPermissions.mockResolvedValue({
        ...mockUserPermissions,
        hasSystemAccess: false
      });

      const { result } = renderHook(() => useAuth());

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'password123');
      });

      expect(loginResult.success).toBe(false);
      expect(loginResult.error).toBe('Usuário sem acesso ao sistema');
    });
  });

  describe('Permission Checking Flow', () => {
    it('should allow access to permitted modules', () => {
      expect(hasModuleAccess(mockUserPermissions, 'dashboard', 'visualizar')).toBe(true);
      expect(hasModuleAccess(mockUserPermissions, 'atendimento_bar', 'criar')).toBe(true);
    });

    it('should deny access to restricted modules', () => {
      expect(hasModuleAccess(mockUserPermissions, 'funcionarios', 'visualizar')).toBe(false);
      expect(hasModuleAccess(mockUserPermissions, 'atendimento_bar', 'administrar')).toBe(false);
    });

    it('should allow managers full access', () => {
      expect(hasModuleAccess(mockManagerPermissions, 'funcionarios', 'administrar')).toBe(true);
      expect(hasModuleAccess(mockManagerPermissions, 'dashboard', 'excluir')).toBe(true);
    });
  });

  describe('Auth Middleware Flow', () => {
    it('should pass authentication check for valid user', async () => {
      const { loadUserPermissions } = require('../../middleware/authMiddleware');
      const { supabase } = require('../../lib/supabase');

      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      loadUserPermissions.mockResolvedValue(mockUserPermissions);

      const result = await requireAuth();

      expect(result.success).toBe(true);
      expect(result.permissions).toEqual(mockUserPermissions);
    });

    it('should fail authentication check for invalid user', async () => {
      const { supabase } = require('../../lib/supabase');

      supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      });

      const result = await requireAuth();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Usuário não autenticado');
    });

    it('should pass module permission check for authorized user', async () => {
      const { loadUserPermissions } = require('../../middleware/authMiddleware');
      const { supabase } = require('../../lib/supabase');

      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      loadUserPermissions.mockResolvedValue(mockUserPermissions);

      const result = await requireModulePermission('dashboard', 'visualizar');

      expect(result.success).toBe(true);
    });

    it('should fail module permission check for unauthorized user', async () => {
      const { loadUserPermissions } = require('../../middleware/authMiddleware');
      const { supabase } = require('../../lib/supabase');

      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      loadUserPermissions.mockResolvedValue(mockUserPermissions);

      const result = await requireModulePermission('funcionarios', 'administrar');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Sem permissão');
    });
  });

  describe('Logout Flow', () => {
    it('should logout user successfully', async () => {
      const { supabase } = require('../../lib/supabase');

      supabase.auth.signOut.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.logout();
      });

      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('Permission Utility Functions', () => {
    it('should correctly identify admin users', async () => {
      const { result } = renderHook(() => useAuth());

      // Simulate manager login
      act(() => {
        (result.current as any).permissions = mockManagerPermissions;
      });

      expect(result.current.isAdmin()).toBe(true);

      // Simulate regular user
      act(() => {
        (result.current as any).permissions = mockUserPermissions;
      });

      expect(result.current.isAdmin()).toBe(false);
    });

    it('should correctly identify employee managers', async () => {
      const { result } = renderHook(() => useAuth());

      // Simulate manager
      act(() => {
        (result.current as any).permissions = mockManagerPermissions;
      });

      expect(result.current.canManageEmployees()).toBe(true);

      // Simulate regular user
      act(() => {
        (result.current as any).permissions = mockUserPermissions;
      });

      expect(result.current.canManageEmployees()).toBe(false);
    });

    it('should check specific permissions correctly', async () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        (result.current as any).permissions = mockUserPermissions;
      });

      expect(result.current.hasPermission('dashboard', 'visualizar')).toBe(true);
      expect(result.current.hasPermission('funcionarios', 'visualizar')).toBe(false);
    });
  });

  describe('Session Management', () => {
    it('should handle session restoration on app load', async () => {
      const { supabase } = require('../../lib/supabase');
      const { loadUserPermissions } = require('../../middleware/authMiddleware');

      supabase.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } },
        error: null
      });

      loadUserPermissions.mockResolvedValue(mockUserPermissions);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.permissions).toEqual(mockUserPermissions);
    });

    it('should handle expired sessions', async () => {
      const { supabase } = require('../../lib/supabase');

      supabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.user).toBeNull();
      expect(result.current.permissions).toBeNull();
    });
  });
});