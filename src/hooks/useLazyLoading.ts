/**
 * Hook para Lazy Loading
 * 
 * Carregamento sob demanda com paginação e virtualização
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// INTERFACES
// ============================================================================

interface LazyLoadingOptions<T> {
  pageSize?: number;
  threshold?: number;
  enabled?: boolean;
  initialData?: T[];
}

interface LazyLoadingResult<T> {
  items: T[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  reset: () => void;
  totalLoaded: number;
}

interface VirtualizedOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

interface VirtualizedResult<T> {
  visibleItems: Array<{ index: number; item: T; style: React.CSSProperties }>;
  totalHeight: number;
  scrollToIndex: (index: number) => void;
}

// ============================================================================
// HOOK DE LAZY LOADING
// ============================================================================

export const useLazyLoading = <T>(
  fetcher: (page: number, pageSize: number) => Promise<T[]>,
  options: LazyLoadingOptions<T> = {}
): LazyLoadingResult<T> => {
  const {
    pageSize = 20,
    threshold = 5,
    enabled = true,
    initialData = []
  } = options;

  const [items, setItems] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (!enabled || loading || !hasMore || loadingRef.current) return;

    try {
      loadingRef.current = true;
      setLoading(true);

      const newItems = await fetcher(currentPage, pageSize);
      
      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        setItems(prev => [...prev, ...newItems]);
        setCurrentPage(prev => prev + 1);
        
        // Se retornou menos itens que o pageSize, não há mais dados
        if (newItems.length < pageSize) {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error('Error loading more items:', error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [enabled, loading, hasMore, currentPage, pageSize, fetcher]);

  const reset = useCallback(() => {
    setItems(initialData);
    setCurrentPage(0);
    setHasMore(true);
    setLoading(false);
    loadingRef.current = false;
  }, [initialData]);

  // Carregar primeira página automaticamente
  useEffect(() => {
    if (enabled && items.length === 0 && !loading) {
      loadMore();
    }
  }, [enabled, items.length, loading, loadMore]);

  return {
    items,
    loading,
    hasMore,
    loadMore,
    reset,
    totalLoaded: items.length
  };
};

// ============================================================================
// HOOK DE INTERSECTION OBSERVER
// ============================================================================

export const useIntersectionObserver = (
  callback: () => void,
  options: IntersectionObserverInit = {}
) => {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callback();
        }
      },
      {
        threshold: 0.1,
        ...options
      }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [callback, options]);

  return targetRef;
};

// ============================================================================
// HOOK DE VIRTUALIZAÇÃO
// ============================================================================

export const useVirtualization = <T>(
  items: T[],
  options: VirtualizedOptions
): VirtualizedResult<T> => {
  const { itemHeight, containerHeight, overscan = 5 } = options;
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = items.length * itemHeight;
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight),
    items.length - 1
  );

  const startIndex = Math.max(0, visibleStart - overscan);
  const endIndex = Math.min(items.length - 1, visibleEnd + overscan);

  const visibleItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    visibleItems.push({
      index: i,
      item: items[i],
      style: {
        position: 'absolute' as const,
        top: i * itemHeight,
        left: 0,
        right: 0,
        height: itemHeight
      }
    });
  }

  const scrollToIndex = useCallback((index: number) => {
    const targetScrollTop = index * itemHeight;
    setScrollTop(targetScrollTop);
  }, [itemHeight]);

  return {
    visibleItems,
    totalHeight,
    scrollToIndex
  };
};

// ============================================================================
// HOOK COMBINADO PARA LAZY LOADING + VIRTUALIZAÇÃO
// ============================================================================

export const useLazyVirtualizedList = <T>(
  fetcher: (page: number, pageSize: number) => Promise<T[]>,
  virtualizationOptions: VirtualizedOptions,
  lazyOptions: LazyLoadingOptions<T> = {}
) => {
  const lazyResult = useLazyLoading(fetcher, lazyOptions);
  const virtualResult = useVirtualization(lazyResult.items, virtualizationOptions);

  // Trigger load more when scrolling near the end
  const handleScroll = useCallback((scrollTop: number) => {
    const { containerHeight, itemHeight } = virtualizationOptions;
    const totalHeight = lazyResult.items.length * itemHeight;
    const scrollPercentage = (scrollTop + containerHeight) / totalHeight;

    // Load more when 80% scrolled
    if (scrollPercentage > 0.8 && lazyResult.hasMore && !lazyResult.loading) {
      lazyResult.loadMore();
    }
  }, [lazyResult, virtualizationOptions]);

  return {
    ...lazyResult,
    ...virtualResult,
    handleScroll
  };
};

// ============================================================================
// COMPONENTE DE LAZY LOADING TRIGGER
// ============================================================================

interface LazyLoadTriggerProps {
  onLoadMore: () => void;
  loading: boolean;
  hasMore: boolean;
  threshold?: number;
}

export const LazyLoadTrigger: React.FC<LazyLoadTriggerProps> = ({
  onLoadMore,
  loading,
  hasMore,
  threshold = 200
}) => {
  const triggerRef = useIntersectionObserver(
    () => {
      if (hasMore && !loading) {
        onLoadMore();
      }
    },
    { rootMargin: `${threshold}px` }
  );

  if (!hasMore) return null;

  return (
    <div ref={triggerRef} className="flex justify-center py-4">
      {loading ? (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">Carregando mais...</span>
        </div>
      ) : (
        <button
          onClick={onLoadMore}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Carregar mais
        </button>
      )}
    </div>
  );
};

export default useLazyLoading;