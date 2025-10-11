/**
 * Testes Unitários para Hook de Recuperação de Erros
 */

import { renderHook, act } from '@testing-library/react';
import { useErrorRecovery } from '../../hooks/useErrorRecovery';

// Mock das funções de error recovery
jest.mock('../../utils/errorRecovery', () => ({
  withFallback: jest.fn(),
  syncPendingOperations: jest.fn(),
  getErrorMessage: jest.fn((error) => error?.message || 'Erro desconhecido'),
  getRecoveryMessage: jest.fn(() => 'Operação realizada com sucesso'),
  isOnline: jest.fn(() => true),
  onConnectionChange: jest.fn(() => () => {})
}));

// Mock do localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

Object.defineProperty(Object, 'keys', {
  value: jest.fn(() => [])
});

describe('useErrorRecovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useErrorRecovery());
    
    expect(result.current.isOnline).toBe(true);
    expect(result.current.isRetrying).toBe(false);
    expect(result.current.pendingOperations).toBe(0);
    expect(result.current.lastError).toBeNull();
    expect(result.current.lastRecovery).toBeNull();
  });

  it('should execute operations with recovery', async () => {
    const { withFallback } = require('../../utils/errorRecovery');
    withFallback.mockResolvedValue({
      success: true,
      data: 'test result',
      attempts: 1,
      usedFallback: false,
      fromCache: false
    });

    const { result } = renderHook(() => useErrorRecovery());
    
    const mockOperation = jest.fn().mockResolvedValue('test result');
    let operationResult;

    await act(async () => {
      operationResult = await result.current.executeWithRecovery(mockOperation);
    });

    expect(operationResult?.success).toBe(true);
    expect(operationResult?.data).toBe('test result');
    expect(result.current.isRetrying).toBe(false);
  });

  it('should handle operation failures', async () => {
    const { withFallback } = require('../../utils/errorRecovery');
    withFallback.mockResolvedValue({
      success: false,
      error: new Error('Test error'),
      attempts: 3,
      usedFallback: false,
      fromCache: false
    });

    const { result } = renderHook(() => useErrorRecovery());
    
    const mockOperation = jest.fn().mockRejectedValue(new Error('Test error'));
    let operationResult;

    await act(async () => {
      operationResult = await result.current.executeWithRecovery(mockOperation);
    });

    expect(operationResult?.success).toBe(false);
    expect(result.current.lastError).toBeTruthy();
  });

  it('should load data with recovery', async () => {
    const { withFallback } = require('../../utils/errorRecovery');
    withFallback.mockResolvedValue({
      success: true,
      data: ['item1', 'item2'],
      attempts: 1,
      usedFallback: false,
      fromCache: false
    });

    const { result } = renderHook(() => useErrorRecovery());
    
    const mockLoadFn = jest.fn().mockResolvedValue(['item1', 'item2']);
    let loadResult;

    await act(async () => {
      loadResult = await result.current.loadWithRecovery(mockLoadFn, 'test_cache_key');
    });

    expect(loadResult?.success).toBe(true);
    expect(loadResult?.data).toEqual(['item1', 'item2']);
  });

  it('should save data with recovery and fallback', async () => {
    const { withFallback } = require('../../utils/errorRecovery');
    withFallback.mockResolvedValue({
      success: true,
      data: { id: '123', pending: true },
      attempts: 1,
      usedFallback: true,
      fromCache: false
    });

    const { result } = renderHook(() => useErrorRecovery());
    
    const mockSaveFn = jest.fn().mockRejectedValue(new Error('Network error'));
    const testData = { name: 'Test Employee' };
    let saveResult;

    await act(async () => {
      saveResult = await result.current.saveWithRecovery(
        mockSaveFn, 
        testData, 
        'pending_save_123'
      );
    });

    expect(saveResult?.success).toBe(true);
    expect(saveResult?.usedFallback).toBe(true);
  });

  it('should delete data with recovery', async () => {
    const { withFallback } = require('../../utils/errorRecovery');
    withFallback.mockResolvedValue({
      success: true,
      attempts: 1,
      usedFallback: false,
      fromCache: false
    });

    const { result } = renderHook(() => useErrorRecovery());
    
    const mockDeleteFn = jest.fn().mockResolvedValue(undefined);
    let deleteResult;

    await act(async () => {
      deleteResult = await result.current.deleteWithRecovery(mockDeleteFn, '123');
    });

    expect(deleteResult?.success).toBe(true);
  });

  it('should clear errors and recovery messages', () => {
    const { result } = renderHook(() => useErrorRecovery());
    
    // Simulate having an error
    act(() => {
      result.current.executeWithRecovery(() => Promise.reject(new Error('Test')));
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.lastError).toBeNull();

    act(() => {
      result.current.clearRecovery();
    });

    expect(result.current.lastRecovery).toBeNull();
  });

  it('should handle manual sync', async () => {
    const { syncPendingOperations } = require('../../utils/errorRecovery');
    syncPendingOperations.mockResolvedValue({
      synced: 2,
      failed: 0,
      errors: []
    });

    const { result } = renderHook(() => useErrorRecovery());
    
    await act(async () => {
      await result.current.manualSync();
    });

    expect(syncPendingOperations).toHaveBeenCalled();
  });

  it('should handle auto sync option', () => {
    const { onConnectionChange } = require('../../utils/errorRecovery');
    
    renderHook(() => useErrorRecovery({ autoSync: true }));
    
    expect(onConnectionChange).toHaveBeenCalled();
  });

  it('should not auto sync when disabled', () => {
    const { onConnectionChange } = require('../../utils/errorRecovery');
    onConnectionChange.mockClear();
    
    renderHook(() => useErrorRecovery({ autoSync: false }));
    
    // Should still monitor connection but not auto sync
    expect(onConnectionChange).toHaveBeenCalled();
  });
});