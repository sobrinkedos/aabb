/**
 * Testes Unitários para Sistema de Validação
 */

import {
  validateRequired,
  validateEmail,
  validateCPF,
  validatePhone,
  validateCommissionRate,
  validateRole,
  validateEmployeeForm,
  formatCPF,
  formatPhone,
  removeFormatting
} from '../../utils/validation';

describe('Validation Utils', () => {
  describe('validateRequired', () => {
    it('should validate required fields correctly', () => {
      expect(validateRequired('test', 'Field')).toEqual({ isValid: true });
      expect(validateRequired('', 'Field')).toEqual({ 
        isValid: false, 
        error: 'Field é obrigatório' 
      });
      expect(validateRequired(null, 'Field')).toEqual({ 
        isValid: false, 
        error: 'Field é obrigatório' 
      });
      expect(validateRequired(undefined, 'Field')).toEqual({ 
        isValid: false, 
        error: 'Field é obrigatório' 
      });
      expect(validateRequired([], 'Field')).toEqual({ 
        isValid: false, 
        error: 'Field é obrigatório' 
      });
    });
  });

  describe('validateEmail', () => {
    it('should validate email formats correctly', () => {
      expect(validateEmail('test@example.com')).toEqual({ isValid: true });
      expect(validateEmail('user.name@domain.co.uk')).toEqual({ isValid: true });
      expect(validateEmail('')).toEqual({ isValid: true }); // Optional field
      
      expect(validateEmail('invalid-email')).toEqual({ 
        isValid: false, 
        error: 'Email deve ter um formato válido' 
      });
      expect(validateEmail('test@')).toEqual({ 
        isValid: false, 
        error: 'Email deve ter um formato válido' 
      });
      expect(validateEmail('@domain.com')).toEqual({ 
        isValid: false, 
        error: 'Email deve ter um formato válido' 
      });
    });
  });

  describe('validateCPF', () => {
    it('should validate CPF correctly', () => {
      expect(validateCPF('11144477735')).toEqual({ isValid: true });
      expect(validateCPF('111.444.777-35')).toEqual({ isValid: true });
      expect(validateCPF('')).toEqual({ isValid: true }); // Optional field
      
      expect(validateCPF('12345678901')).toEqual({ 
        isValid: false, 
        error: 'CPF inválido' 
      });
      expect(validateCPF('111.111.111-11')).toEqual({ 
        isValid: false, 
        error: 'CPF inválido' 
      });
      expect(validateCPF('123')).toEqual({ 
        isValid: false, 
        error: 'CPF deve ter 11 dígitos' 
      });
    });
  });

  describe('validatePhone', () => {
    it('should validate phone numbers correctly', () => {
      expect(validatePhone('11999887766')).toEqual({ isValid: true });
      expect(validatePhone('1133334444')).toEqual({ isValid: true });
      expect(validatePhone('(11) 99988-7766')).toEqual({ isValid: true });
      expect(validatePhone('')).toEqual({ isValid: true }); // Optional field
      
      expect(validatePhone('123')).toEqual({ 
        isValid: false, 
        error: 'Telefone deve ter 10 ou 11 dígitos (com DDD)' 
      });
      expect(validatePhone('0199887766')).toEqual({ 
        isValid: false, 
        error: 'DDD inválido' 
      });
    });
  });

  describe('validateCommissionRate', () => {
    it('should validate commission rates correctly', () => {
      expect(validateCommissionRate(10)).toEqual({ isValid: true });
      expect(validateCommissionRate(0)).toEqual({ isValid: true });
      expect(validateCommissionRate(undefined)).toEqual({ isValid: true });
      
      expect(validateCommissionRate(60)).toEqual({ 
        isValid: true, 
        warning: 'Taxa de comissão muito alta (acima de 50%)' 
      });
      
      expect(validateCommissionRate(-5)).toEqual({ 
        isValid: false, 
        error: 'Taxa de comissão não pode ser negativa' 
      });
      expect(validateCommissionRate(150)).toEqual({ 
        isValid: false, 
        error: 'Taxa de comissão não pode ser maior que 100%' 
      });
    });
  });

  describe('validateRole', () => {
    it('should validate roles correctly', () => {
      expect(validateRole('atendente')).toEqual({ isValid: true });
      expect(validateRole('garcom')).toEqual({ isValid: true });
      expect(validateRole('gerente')).toEqual({ isValid: true });
      
      expect(validateRole('')).toEqual({ 
        isValid: false, 
        error: 'Função é obrigatória' 
      });
      expect(validateRole('invalid-role')).toEqual({ 
        isValid: false, 
        error: 'Função inválida' 
      });
    });
  });

  describe('validateEmployeeForm', () => {
    it('should validate complete employee form', async () => {
      const validData = {
        nome_completo: 'João Silva',
        email: 'joao@example.com',
        telefone: '11999887766',
        cpf: '11144477735',
        bar_role: 'garcom',
        shift_preference: 'noite',
        specialties: ['Drinks'],
        commission_rate: 10,
        tem_acesso_sistema: false,
        observacoes: 'Funcionário experiente'
      };

      const result = await validateEmployeeForm(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid data', async () => {
      const invalidData = {
        nome_completo: '',
        email: 'invalid-email',
        telefone: '123',
        cpf: '111.111.111-11',
        bar_role: '',
        shift_preference: 'noite',
        specialties: [],
        commission_rate: -5,
        tem_acesso_sistema: true, // Requires email
        observacoes: ''
      };

      const result = await validateEmployeeForm(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('formatCPF', () => {
    it('should format CPF correctly', () => {
      expect(formatCPF('11144477735')).toBe('111.444.777-35');
      expect(formatCPF('111.444.777-35')).toBe('111.444.777-35');
      expect(formatCPF('123')).toBe('123');
    });
  });

  describe('formatPhone', () => {
    it('should format phone numbers correctly', () => {
      expect(formatPhone('11999887766')).toBe('(11) 99988-7766');
      expect(formatPhone('1133334444')).toBe('(11) 3333-4444');
      expect(formatPhone('123')).toBe('123');
    });
  });

  describe('removeFormatting', () => {
    it('should remove formatting correctly', () => {
      expect(removeFormatting('111.444.777-35')).toBe('11144477735');
      expect(removeFormatting('(11) 99988-7766')).toBe('11999887766');
      expect(removeFormatting('abc123def')).toBe('123');
    });
  });
});