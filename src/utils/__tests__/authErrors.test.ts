import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  processAuthError, 
  AuthRetryManager, 
  AuthErrorLogger 
} from '../authErrors';

describe('Auth Errors', () => {
  describe('processAuthError', () => {
    it('should process network errors correctly', () => {
      const error = new Error('Failed to fetch');
      const result = processAuthError(error);
      
      expect(result.code).toBe('NETWORK_ERROR');
      expect(result.retryable).toBe(true);
      expect(result.action).toBe('retry');
      expect(result.userMessage).toContain('conexão');
    });

    it('should process invalid credentials correctly', () => {
      const error = new Error('Invalid login credentials');
      const result = processAuthError(error);
      
      expect(result.code).toBe('INVALID_CREDENTIALS');
      expect(result.retryable).toBe(false);
      expect(result.userMessage).toContain('Email ou senha incorretos');
    });

    it('should process rate limit errors correctly', () => {
      const error = new Error('Too many requests');
      const result = processAuthError(error);
      
      expect(result.code).toBe('RATE_LIMIT');
      expect(result.retryable).toBe(true);
      expect(result.userMessage).toContain('Muitas tentativas');
    });

    it('should handle unknown errors', () => {
      const error = new Error('Some unknown error');
      const result = processAuthError(error);
      
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.retryable).toBe(true);
      expect(result.action).toBe('retry');
    });

    it('should handle non-Error objects', () => {
      const error = 'String error';
      const result = processAuthError(error);
      
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('String error');
    });
  });

  describe('AuthRetryManager', () => {
    let retryManager: AuthRetryManager;

    beforeEach(() => {
      retryManager = new AuthRetryManager();
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should execute operation successfully on first try', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      
      const result = await retryManager.executeWithRetry(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
      expect(retryManager.getRetryCount()).toBe(0);
    });

    it('should retry on retryable errors', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Failed to fetch'))
        .mockResolvedValue('success');
      
      const onRetry = vi.fn();
      
      const promise = retryManager.executeWithRetry(operation, onRetry);
      
      // Fast-forward time to trigger retry
      await vi.advanceTimersByTimeAsync(1000);
      
      const result = await promise;
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
    });

    it('should not retry on non-retryable errors', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Invalid login credentials'));
      
      await expect(retryManager.executeWithRetry(operation)).rejects.toThrow('Invalid login credentials');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should stop retrying after max attempts', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Failed to fetch'));
      
      const promise = retryManager.executeWithRetry(operation);
      
      // Fast-forward through all retry attempts
      for (let i = 0; i < 3; i++) {
        await vi.advanceTimersByTimeAsync(Math.pow(2, i) * 1000);
      }
      
      await expect(promise).rejects.toThrow();
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should reset retry count after successful operation', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Failed to fetch'))
        .mockResolvedValue('success');
      
      const promise = retryManager.executeWithRetry(operation);
      await vi.advanceTimersByTimeAsync(1000);
      await promise;
      
      expect(retryManager.getRetryCount()).toBe(0);
    });
  });

  describe('AuthErrorLogger', () => {
    let logger: AuthErrorLogger;
    let consoleSpy: any;

    beforeEach(() => {
      logger = AuthErrorLogger.getInstance();
      consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock environment
      vi.stubEnv('NODE_ENV', 'development');
    });

    afterEach(() => {
      consoleSpy.mockRestore();
      vi.unstubAllEnvs();
    });

    it('should be a singleton', () => {
      const logger1 = AuthErrorLogger.getInstance();
      const logger2 = AuthErrorLogger.getInstance();
      
      expect(logger1).toBe(logger2);
    });

    it('should log errors in development', () => {
      const error = new Error('Test error');
      
      const logEntry = logger.logError(error, 'test_context', 'user123');
      
      expect(consoleSpy).toHaveBeenCalledWith('Auth Error:', expect.objectContaining({
        context: 'test_context',
        userId: 'user123',
        errorCode: 'UNKNOWN_ERROR'
      }));
      
      expect(logEntry).toMatchObject({
        context: 'test_context',
        userId: 'user123',
        errorCode: 'UNKNOWN_ERROR',
        errorMessage: 'Test error'
      });
    });

    it('should not log to console in production', () => {
      vi.stubEnv('NODE_ENV', 'production');
      
      const error = new Error('Test error');
      logger.logError(error, 'test_context');
      
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should include browser information in log entry', () => {
      const error = new Error('Test error');
      
      const logEntry = logger.logError(error, 'test_context');
      
      expect(logEntry).toHaveProperty('userAgent');
      expect(logEntry).toHaveProperty('url');
      expect(logEntry).toHaveProperty('timestamp');
    });
  });
});