/**
 * Testes Unitários para Sistema de Recuperação de Erros
 */

import {
  withRetry,
  withFallback,
  getErrorMessage,
  getRecoveryMessage,
  isOnline
} from '../../utils/errorRecovery';

// Mock do navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

describe('Error Recovery Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset navigator.onLine
    (navigator as any).onLine = true;
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      
      const result = await withRetry(mockFn, { maxAttempts: 3 });
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.attempts).toBe(1);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');
      
      const result = await withRetry(mockFn, { 
        maxAttempts: 3, 
        delay: 10 // Fast for testing
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.attempts).toBe(3);
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should fail after max attempts', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Persistent error'));
      
      const result = await withRetry(mockFn, { 
        maxAttempts: 2, 
        delay: 10 
      });
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Persistent error');
      expect(result.attempts).toBe(2);
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable errors', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('auth error'));
      
      const result = await withRetry(mockFn, { maxAttempts: 3 });
      
      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('withFallback', () => {
    it('should use fallback when main function fails', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Main error'));
      const mockFallback = jest.fn().mockResolvedValue('fallback result');
      
      const result = await withFallback(mockFn, {
        maxAttempts: 1,
        fallbackFn: mockFallback
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('fallback result');
      expect(result.usedFallback).toBe(true);
      expect(mockFallback).toHaveBeenCalledTimes(1);
    });

    it('should not use fallback when main function succeeds', async () => {
      const mockFn = jest.fn().mockResolvedValue('main result');
      const mockFallback = jest.fn().mockResolvedValue('fallback result');
      
      const result = await withFallback(mockFn, {
        fallbackFn: mockFallback
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('main result');
      expect(result.usedFallback).toBe(false);
      expect(mockFallback).not.toHaveBeenCalled();
    });
  });

  describe('getErrorMessage', () => {
    it('should return friendly messages for known errors', () => {
      expect(getErrorMessage(new Error('network error')))
        .toBe('Problema de conexão. Verifique sua internet.');
      
      expect(getErrorMessage(new Error('timeout')))
        .toBe('A operação demorou muito para responder. Tente novamente.');
      
      expect(getErrorMessage(new Error('auth failed')))
        .toBe('Erro de autenticação. Faça login novamente.');
      
      expect(getErrorMessage(new Error('permission denied')))
        .toBe('Você não tem permissão para esta operação.');
    });

    it('should return generic message for unknown errors', () => {
      expect(getErrorMessage(new Error('Unknown error')))
        .toBe('Ocorreu um erro inesperado. Tente novamente.');
      
      expect(getErrorMessage(null))
        .toBe('Erro desconhecido');
    });
  });

  describe('getRecoveryMessage', () => {
    it('should return appropriate messages for different recovery scenarios', () => {
      expect(getRecoveryMessage({
        success: true,
        attempts: 1,
        usedFallback: false,
        fromCache: false
      })).toBe('Operação realizada com sucesso');

      expect(getRecoveryMessage({
        success: true,
        attempts: 3,
        usedFallback: false,
        fromCache: false
      })).toBe('Operação realizada após 3 tentativas');

      expect(getRecoveryMessage({
        success: true,
        attempts: 1,
        usedFallback: true,
        fromCache: false
      })).toBe('Operação realizada com método alternativo');

      expect(getRecoveryMessage({
        success: true,
        attempts: 1,
        usedFallback: false,
        fromCache: true
      })).toBe('Dados carregados do cache local (sem conexão)');

      expect(getRecoveryMessage({
        success: false,
        error: new Error('Test error'),
        attempts: 1,
        usedFallback: false,
        fromCache: false
      })).toBe('Ocorreu um erro inesperado. Tente novamente.');
    });
  });

  describe('isOnline', () => {
    it('should return navigator.onLine value', () => {
      (navigator as any).onLine = true;
      expect(isOnline()).toBe(true);

      (navigator as any).onLine = false;
      expect(isOnline()).toBe(false);
    });
  });
});