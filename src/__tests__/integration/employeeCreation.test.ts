/**
 * Testes de Integração - Fluxo Completo de Criação de Funcionários
 */

import { renderHook, act } from '@testing-library/react';
import { useBarEmployees } from '../../hooks/useBarEmployees';
import { validateEmployeeForm } from '../../utils/validation';

// Mock do Supabase
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      getSession: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          data: [],
          error: null
        })),
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: null,
            error: null
          }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: { id: 'new-employee-123' },
            error: null
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: null,
          error: null
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: null,
          error: null
        }))
      }))
    }))
  },
  supabaseAdmin: {
    auth: {
      admin: {
        createUser: jest.fn(),
        updateUserById: jest.fn()
      }
    }
  }
}));

// Mock das funções de autenticação
jest.mock('../../utils/auth-helper', () => ({
  ensureAuthenticated: jest.fn(() => Promise.resolve({ success: true, useAdmin: false })),
  getCurrentUserEmpresaId: jest.fn(() => Promise.resolve('empresa-123'))
}));

describe('Employee Creation Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Employee Creation Flow', () => {
    it('should create employee with valid data', async () => {
      const { result } = renderHook(() => useBarEmployees());

      // Wait for initial load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const employeeData = {
        name: 'João Silva',
        email: 'joao@example.com',
        phone: '11999887766',
        cpf: '11144477735',
        bar_role: 'garcom' as const,
        shift_preference: 'noite' as const,
        specialties: ['Drinks Clássicos'],
        commission_rate: 10,
        notes: 'Funcionário experiente'
      };

      let createdEmployeeId: string;

      await act(async () => {
        createdEmployeeId = await result.current.createEmployee(employeeData);
      });

      expect(createdEmployeeId).toBe('new-employee-123');
      expect(result.current.error).toBeNull();
    });

    it('should validate employee data before creation', async () => {
      const validData = {
        nome_completo: 'Maria Santos',
        email: 'maria@example.com',
        telefone: '11888776655',
        cpf: '11144477735',
        bar_role: 'atendente',
        shift_preference: 'manha',
        specialties: ['Atendimento VIP'],
        commission_rate: 5,
        tem_acesso_sistema: true,
        observacoes: 'Nova funcionária'
      };

      const validationResult = await validateEmployeeForm(validData);
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);
    });

    it('should handle validation errors during creation', async () => {
      const invalidData = {
        nome_completo: '', // Required field missing
        email: 'invalid-email',
        telefone: '123', // Invalid phone
        cpf: '111.111.111-11', // Invalid CPF
        bar_role: '',
        shift_preference: 'manha',
        specialties: [],
        commission_rate: -5, // Invalid commission
        tem_acesso_sistema: true,
        observacoes: ''
      };

      const validationResult = await validateEmployeeForm(invalidData);
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors.length).toBeGreaterThan(0);
    });

    it('should create employee with system access', async () => {
      const { result } = renderHook(() => useBarEmployees());

      const employeeWithAccess = {
        name: 'Pedro Manager',
        email: 'pedro@example.com',
        phone: '11777665544',
        bar_role: 'gerente' as const,
        shift_preference: 'qualquer' as const,
        specialties: ['Gestão', 'Atendimento'],
        commission_rate: 0,
        notes: 'Gerente com acesso ao sistema'
      };

      await act(async () => {
        await result.current.createEmployee(employeeWithAccess);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Employee Management Flow', () => {
    it('should update employee information', async () => {
      const { result } = renderHook(() => useBarEmployees());

      const updateData = {
        name: 'João Silva Santos',
        phone: '11999887799',
        commission_rate: 15,
        notes: 'Funcionário promovido'
      };

      await act(async () => {
        await result.current.updateEmployee('employee-123', updateData);
      });

      expect(result.current.error).toBeNull();
    });

    it('should deactivate employee', async () => {
      const { result } = renderHook(() => useBarEmployees());

      await act(async () => {
        await result.current.deactivateEmployee('employee-123');
      });

      expect(result.current.error).toBeNull();
    });

    it('should reactivate employee', async () => {
      const { result } = renderHook(() => useBarEmployees());

      await act(async () => {
        await result.current.reactivateEmployee('employee-123');
      });

      expect(result.current.error).toBeNull();
    });

    it('should get employee by id', async () => {
      const { supabase } = require('../../lib/supabase');
      
      // Mock successful employee fetch
      supabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                id: 'employee-123',
                bar_role: 'garcom',
                is_active: true,
                notes: 'Nome: João Silva, Email: joao@example.com'
              },
              error: null
            }))
          }))
        }))
      });

      const { result } = renderHook(() => useBarEmployees());

      let employee;
      await act(async () => {
        employee = await result.current.getEmployeeById('employee-123');
      });

      expect(employee).toBeDefined();
      expect(employee?.id).toBe('employee-123');
      expect(employee?.bar_role).toBe('garcom');
    });
  });

  describe('Employee Statistics Flow', () => {
    it('should calculate employee statistics correctly', async () => {
      const { result } = renderHook(() => useBarEmployees());

      // Mock employees data
      const mockEmployees = [
        { id: '1', bar_role: 'garcom', status: 'active', start_date: '2024-01-01' },
        { id: '2', bar_role: 'atendente', status: 'active', start_date: '2024-02-01' },
        { id: '3', bar_role: 'garcom', status: 'inactive', start_date: '2024-01-15' },
        { id: '4', bar_role: 'gerente', status: 'active', start_date: '2023-12-01' }
      ];

      // Simulate loaded employees
      act(() => {
        (result.current as any).employees = mockEmployees;
      });

      const stats = result.current.getStats();

      expect(stats.total).toBe(4);
      expect(stats.active).toBe(3);
      expect(stats.inactive).toBe(1);
      expect(stats.byRole.garcom).toBe(2);
      expect(stats.byRole.atendente).toBe(1);
      expect(stats.byRole.gerente).toBe(1);
    });
  });

  describe('Error Handling Flow', () => {
    it('should handle network errors gracefully', async () => {
      const { supabase } = require('../../lib/supabase');
      
      // Mock network error
      supabase.from.mockReturnValue({
        select: jest.fn(() => ({
          order: jest.fn(() => {
            throw new Error('Network error');
          })
        }))
      });

      const { result } = renderHook(() => useBarEmployees());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.loading).toBe(false);
    });

    it('should handle authentication errors', async () => {
      const { ensureAuthenticated } = require('../../utils/auth-helper');
      ensureAuthenticated.mockResolvedValue({ 
        success: false, 
        error: 'Authentication failed' 
      });

      const { result } = renderHook(() => useBarEmployees());

      const employeeData = {
        name: 'Test Employee',
        bar_role: 'garcom' as const
      };

      await act(async () => {
        try {
          await result.current.createEmployee(employeeData);
        } catch (error) {
          expect(error.message).toContain('Authentication failed');
        }
      });
    });

    it('should handle database constraint errors', async () => {
      const { supabase } = require('../../lib/supabase');
      
      // Mock constraint violation
      supabase.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: null,
              error: { message: 'Duplicate key violation' }
            }))
          }))
        }))
      });

      const { result } = renderHook(() => useBarEmployees());

      const employeeData = {
        name: 'Duplicate Employee',
        email: 'existing@example.com',
        bar_role: 'garcom' as const
      };

      await act(async () => {
        try {
          await result.current.createEmployee(employeeData);
        } catch (error) {
          expect(error.message).toContain('Duplicate key violation');
        }
      });
    });
  });

  describe('Filtering and Search Flow', () => {
    it('should filter employees correctly', async () => {
      const { result } = renderHook(() => useBarEmployees());

      const mockEmployees = [
        { 
          id: '1', 
          bar_role: 'garcom', 
          status: 'active',
          employee: { name: 'João Silva', email: 'joao@example.com' }
        },
        { 
          id: '2', 
          bar_role: 'atendente', 
          status: 'active',
          employee: { name: 'Maria Santos', email: 'maria@example.com' }
        },
        { 
          id: '3', 
          bar_role: 'garcom', 
          status: 'inactive',
          employee: { name: 'Pedro Costa', email: 'pedro@example.com' }
        }
      ];

      // Simulate loaded employees
      act(() => {
        (result.current as any).employees = mockEmployees;
      });

      // Test role filter
      const garcons = result.current.filterEmployees('', 'garcom', 'all');
      expect(garcons).toHaveLength(2);

      // Test status filter
      const activeEmployees = result.current.filterEmployees('', 'all', 'active');
      expect(activeEmployees).toHaveLength(2);

      // Test search filter
      const searchResults = result.current.filterEmployees('João', 'all', 'all');
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].employee?.name).toBe('João Silva');
    });
  });
});