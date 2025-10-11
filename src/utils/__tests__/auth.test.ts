import { describe, it, expect } from 'vitest';
import { 
  hasPermission, 
  hasRole, 
  isAdmin, 
  isDemoUser, 
  formatUserName, 
  getRoleName 
} from '../auth';
import { User } from '../../types/auth';
import { AUTH_CONFIG } from '../../config/auth';

describe('Auth Utils', () => {
  const mockAdminUser: User = {
    id: '1',
    name: 'Admin User',
    email: 'admin@test.com',
    role: 'admin'
  };

  const mockEmployeeUser: User = {
    id: '2',
    name: 'Employee User',
    email: 'employee@test.com',
    role: 'employee'
  };

  const mockDemoUser: User = {
    id: 'demo-user-id',
    name: 'Demo User',
    email: AUTH_CONFIG.DEMO_USER.email,
    role: 'admin'
  };

  describe('hasPermission', () => {
    it('should return true for admin user with any permission', () => {
      expect(hasPermission(mockAdminUser, 'read')).toBe(true);
      expect(hasPermission(mockAdminUser, 'write')).toBe(true);
      expect(hasPermission(mockAdminUser, 'delete')).toBe(true);
    });

    it('should return true for employee with read permission', () => {
      expect(hasPermission(mockEmployeeUser, 'read')).toBe(true);
    });

    it('should return true for employee with write permission', () => {
      expect(hasPermission(mockEmployeeUser, 'write')).toBe(true);
    });

    it('should return false for employee with manage_employees permission', () => {
      expect(hasPermission(mockEmployeeUser, 'manage_employees')).toBe(false);
    });

    it('should return false for null user', () => {
      expect(hasPermission(null, 'read')).toBe(false);
    });

    it('should return false for user with unknown role', () => {
      const unknownUser: User = {
        id: '3',
        name: 'Unknown User',
        email: 'unknown@test.com',
        role: 'unknown' as any
      };
      expect(hasPermission(unknownUser, 'read')).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return true when user has one of the required roles', () => {
      expect(hasRole(mockAdminUser, ['admin', 'manager'])).toBe(true);
      expect(hasRole(mockEmployeeUser, ['employee', 'manager'])).toBe(true);
    });

    it('should return false when user does not have any of the required roles', () => {
      expect(hasRole(mockEmployeeUser, ['admin', 'manager'])).toBe(false);
    });

    it('should return false for null user', () => {
      expect(hasRole(null, ['admin'])).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin user', () => {
      expect(isAdmin(mockAdminUser)).toBe(true);
    });

    it('should return false for non-admin user', () => {
      expect(isAdmin(mockEmployeeUser)).toBe(false);
    });

    it('should return false for null user', () => {
      expect(isAdmin(null)).toBe(false);
    });
  });

  describe('isDemoUser', () => {
    it('should return true for demo user', () => {
      expect(isDemoUser(mockDemoUser)).toBe(true);
    });

    it('should return false for regular user', () => {
      expect(isDemoUser(mockAdminUser)).toBe(false);
      expect(isDemoUser(mockEmployeeUser)).toBe(false);
    });

    it('should return false for null user', () => {
      expect(isDemoUser(null)).toBe(false);
    });
  });

  describe('formatUserName', () => {
    it('should return user name when available', () => {
      expect(formatUserName(mockAdminUser)).toBe('Admin User');
    });

    it('should return email prefix when name is not available', () => {
      const userWithoutName: User = {
        id: '4',
        name: '',
        email: 'test@example.com',
        role: 'employee'
      };
      expect(formatUserName(userWithoutName)).toBe('test');
    });

    it('should return default text for null user', () => {
      expect(formatUserName(null)).toBe('Usuário');
    });
  });

  describe('getRoleName', () => {
    it('should return correct role names', () => {
      expect(getRoleName('admin')).toBe('Administrador');
      expect(getRoleName('manager')).toBe('Gerente');
      expect(getRoleName('employee')).toBe('Funcionário');
      expect(getRoleName('member')).toBe('Membro');
    });

    it('should return role key for unknown roles', () => {
      expect(getRoleName('unknown' as any)).toBe('unknown');
    });
  });
});