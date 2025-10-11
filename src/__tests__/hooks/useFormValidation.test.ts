/**
 * Testes Unitários para Hook de Validação de Formulários
 */

import { renderHook, act } from '@testing-library/react';
import { useFormValidation } from '../../hooks/useFormValidation';

// Mock das funções de validação
jest.mock('../../utils/validation', () => ({
  validateRequired: jest.fn((value, field) => 
    value ? { isValid: true } : { isValid: false, error: `${field} é obrigatório` }
  ),
  validateEmail: jest.fn((email) => 
    email && email.includes('@') ? { isValid: true } : { isValid: false, error: 'Email inválido' }
  ),
  validateCPF: jest.fn(() => ({ isValid: true })),
  validatePhone: jest.fn(() => ({ isValid: true })),
  validateCommissionRate: jest.fn(() => ({ isValid: true })),
  validateEmployeeForm: jest.fn(() => Promise.resolve({ isValid: true, errors: [], warnings: [] })),
  debounce: jest.fn((fn) => fn)
}));

describe('useFormValidation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with empty form state', () => {
    const { result } = renderHook(() => useFormValidation());
    
    expect(result.current.formState.fields).toEqual({});
    expect(result.current.isValid).toBe(false);
    expect(result.current.hasErrors).toBe(false);
    expect(result.current.hasWarnings).toBe(false);
  });

  it('should initialize with provided data', () => {
    const initialData = {
      nome_completo: 'João Silva',
      email: 'joao@example.com'
    };

    const { result } = renderHook(() => useFormValidation(initialData));
    
    expect(result.current.formState.fields.nome_completo?.value).toBe('João Silva');
    expect(result.current.formState.fields.email?.value).toBe('joao@example.com');
  });

  it('should update field values', () => {
    const { result } = renderHook(() => useFormValidation());
    
    act(() => {
      result.current.setFieldValue('nome_completo', 'Maria Santos');
    });
    
    expect(result.current.formState.fields.nome_completo?.value).toBe('Maria Santos');
    expect(result.current.formState.fields.nome_completo?.touched).toBe(true);
  });

  it('should mark fields as touched', () => {
    const { result } = renderHook(() => useFormValidation({ nome_completo: 'João' }));
    
    act(() => {
      result.current.setFieldTouched('nome_completo');
    });
    
    expect(result.current.formState.fields.nome_completo?.touched).toBe(true);
  });

  it('should clear field errors', () => {
    const { result } = renderHook(() => useFormValidation());
    
    // Set an error first
    act(() => {
      result.current.setFieldValue('nome_completo', '');
    });
    
    act(() => {
      result.current.clearFieldError('nome_completo');
    });
    
    expect(result.current.formState.fields.nome_completo?.error).toBeUndefined();
  });

  it('should return field props correctly', () => {
    const { result } = renderHook(() => useFormValidation({ nome_completo: 'João' }));
    
    const fieldProps = result.current.getFieldProps('nome_completo');
    
    expect(fieldProps.value).toBe('João');
    expect(typeof fieldProps.onChange).toBe('function');
    expect(typeof fieldProps.onBlur).toBe('function');
    expect(typeof fieldProps.onClearError).toBe('function');
  });

  it('should return form data correctly', () => {
    const initialData = {
      nome_completo: 'João Silva',
      email: 'joao@example.com'
    };

    const { result } = renderHook(() => useFormValidation(initialData));
    
    const formData = result.current.getFormData();
    
    expect(formData.nome_completo).toBe('João Silva');
    expect(formData.email).toBe('joao@example.com');
  });

  it('should reset form correctly', () => {
    const { result } = renderHook(() => useFormValidation({ nome_completo: 'João' }));
    
    act(() => {
      result.current.setFieldValue('nome_completo', 'Maria');
    });
    
    act(() => {
      result.current.resetForm({ nome_completo: 'Pedro' });
    });
    
    expect(result.current.formState.fields.nome_completo?.value).toBe('Pedro');
    expect(result.current.formState.fields.nome_completo?.touched).toBe(false);
  });

  it('should validate form and return result', async () => {
    const { result } = renderHook(() => useFormValidation({
      nome_completo: 'João Silva',
      email: 'joao@example.com',
      bar_role: 'garcom'
    }));
    
    let validationResult;
    await act(async () => {
      validationResult = await result.current.validateForm();
    });
    
    expect(validationResult).toBeDefined();
    expect(result.current.formState.isValidating).toBe(false);
  });

  it('should handle validation options correctly', () => {
    const { result } = renderHook(() => useFormValidation({}, {
      validateOnChange: false,
      validateOnBlur: false,
      debounceMs: 1000
    }));
    
    // Should not validate on change when disabled
    act(() => {
      result.current.setFieldValue('nome_completo', 'João');
    });
    
    // Validation should not be triggered immediately
    expect(result.current.formState.fields.nome_completo?.isValidating).toBeFalsy();
  });
});