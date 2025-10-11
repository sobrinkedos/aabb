import { useState, useCallback, useRef } from 'react';

interface UseLazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
}

interface UseLazyLoadReturn {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  loadData: () => Promise<void>;
  ref: React.RefObject<HTMLElement>;
}

export const useLazyLoad = (
  loadFunction: () => Promise<void>,
  options: UseLazyLoadOptions = {}
): UseLazyLoadReturn => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const loadData = useCallback(async () => {
    if (isLoaded || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      await loadFunction();
      setIsLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  }, [loadFunction, isLoaded, isLoading]);

  // Configurar Intersection Observer para carregamento automático
  const setupObserver = useCallback(() => {
    if (!ref.current || observerRef.current) return;

    const { threshold = 0.1, rootMargin = '50px' } = options;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isLoaded && !isLoading) {
          loadData();
        }
      },
      { threshold, rootMargin }
    );

    observerRef.current.observe(ref.current);
  }, [loadData, isLoaded, isLoading, options]);

  // Cleanup observer
  const cleanup = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  return {
    isLoaded,
    isLoading,
    error,
    loadData,
    ref
  };
};

// Hook específico para carregamento de dados com debounce
export const useDebouncedLazyLoad = (
  loadFunction: () => Promise<void>,
  delay: number = 300,
  options: UseLazyLoadOptions = {}
) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const debouncedLoadFunction = useCallback(async () => {
    return new Promise<void>((resolve, reject) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(async () => {
        try {
          await loadFunction();
          resolve();
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  }, [loadFunction, delay]);

  return useLazyLoad(debouncedLoadFunction, options);
};