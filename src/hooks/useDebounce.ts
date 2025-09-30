/**
 * Hook para debounce de valores
 * Reduz consultas desnecessárias em campos de busca
 */

import { useState, useEffect, useRef } from 'react';

/**
 * Hook básico de debounce
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook avançado de debounce com controle de loading
 */
export const useAdvancedDebounce = <T>(
  value: T, 
  delay: number,
  options: {
    leading?: boolean; // Executar imediatamente na primeira chamada
    trailing?: boolean; // Executar após o delay (padrão: true)
    maxWait?: number; // Tempo máximo para esperar
  } = {}
) => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const maxTimeoutRef = useRef<NodeJS.Timeout>();
  const lastCallTimeRef = useRef<number>(0);
  const lastInvokeTimeRef = useRef<number>(0);

  const { leading = false, trailing = true, maxWait } = options;

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTimeRef.current;
    const timeSinceLastInvoke = now - lastInvokeTimeRef.current;

    lastCallTimeRef.current = now;

    const shouldInvoke = () => {
      // Primeira chamada com leading
      if (leading && lastInvokeTimeRef.current === 0) {
        return true;
      }
      
      // MaxWait atingido
      if (maxWait && timeSinceLastInvoke >= maxWait) {
        return true;
      }
      
      return false;
    };

    const invokeFunc = () => {
      setDebouncedValue(value);
      setIsDebouncing(false);
      lastInvokeTimeRef.current = Date.now();
    };

    const startTimer = (pendingFunc: () => void, wait: number) => {
      return setTimeout(pendingFunc, wait);
    };

    // Limpar timers existentes
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
    }

    // Invocar imediatamente se necessário
    if (shouldInvoke()) {
      invokeFunc();
      return;
    }

    setIsDebouncing(true);

    // Timer principal
    if (trailing) {
      timeoutRef.current = startTimer(invokeFunc, delay);
    }

    // Timer de maxWait
    if (maxWait && timeSinceLastInvoke < maxWait) {
      maxTimeoutRef.current = startTimer(invokeFunc, maxWait - timeSinceLastInvoke);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
      }
    };
  }, [value, delay, leading, trailing, maxWait]);

  return {
    debouncedValue,
    isDebouncing
  };
};

/**
 * Hook para debounce de funções de callback
 */
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);

  // Atualizar callback ref quando deps mudarem
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback, ...deps]);

  const debouncedCallback = useRef((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }).current;

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

/**
 * Hook para debounce de busca com histórico
 */
export const useSearchDebounce = (
  initialValue: string = '',
  delay: number = 300,
  options: {
    minLength?: number; // Comprimento mínimo para buscar
    maxHistory?: number; // Máximo de itens no histórico
  } = {}
) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const debouncedSearchTerm = useDebounce(searchTerm, delay);
  
  const { minLength = 2, maxHistory = 10 } = options;

  // Adicionar ao histórico quando busca é executada
  useEffect(() => {
    if (debouncedSearchTerm && 
        debouncedSearchTerm.length >= minLength && 
        !searchHistory.includes(debouncedSearchTerm)) {
      
      setSearchHistory(prev => {
        const newHistory = [debouncedSearchTerm, ...prev];
        return newHistory.slice(0, maxHistory);
      });
    }
  }, [debouncedSearchTerm, minLength, maxHistory, searchHistory]);

  const clearHistory = () => setSearchHistory([]);
  
  const removeFromHistory = (term: string) => {
    setSearchHistory(prev => prev.filter(item => item !== term));
  };

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    searchHistory,
    clearHistory,
    removeFromHistory,
    isSearching: searchTerm !== debouncedSearchTerm,
    shouldSearch: debouncedSearchTerm.length >= minLength
  };
};

export default useDebounce;