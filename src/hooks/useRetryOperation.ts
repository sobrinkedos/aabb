import { useState, useCallback } from 'react';

interface RetryOptions {
  maxRetries: number;
  retryDelay: number;
  timeoutDuration: number;
}

export const useRetryOperation = () => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    options: RetryOptions = {
      maxRetries: 2,
      retryDelay: 3000,
      timeoutDuration: 45000
    }
  ): Promise<T> => {
    const { maxRetries, retryDelay, timeoutDuration } = options;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        setRetryCount(attempt);
        
        if (attempt > 0) {
          setIsRetrying(true);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
        
        // Criar timeout para esta tentativa
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error(`Timeout na tentativa ${attempt + 1}`)), timeoutDuration)
        );
        
        const result = await Promise.race([operation(), timeoutPromise]);
        
        // Se chegou aqui, a operação foi bem-sucedida
        setRetryCount(0);
        setIsRetrying(false);
        return result;
        
      } catch (error) {
        console.log(`Tentativa ${attempt + 1} falhou:`, error);
        
        // Se é a última tentativa, re-throw o erro
        if (attempt === maxRetries) {
          setRetryCount(0);
          setIsRetrying(false);
          throw error;
        }
        
        // Se não é timeout, não tenta novamente
        if (error instanceof Error && !error.message.includes('Timeout')) {
          setRetryCount(0);
          setIsRetrying(false);
          throw error;
        }
      }
    }
    
    throw new Error('Todas as tentativas falharam');
  }, []);

  const reset = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  return {
    executeWithRetry,
    retryCount,
    isRetrying,
    reset
  };
};