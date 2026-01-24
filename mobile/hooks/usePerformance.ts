import { useEffect, useRef, useCallback } from 'react';
import { performanceMonitor } from '../utils/performance';

/**
 * Hook to measure component performance
 */
export const usePerformance = (componentName: string) => {
  const mountTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const mountTime = Date.now() - mountTimeRef.current;
    
    if (__DEV__) {
      console.log(`⚡ ${componentName} mounted in ${mountTime}ms`);
    }

    return () => {
      const unmountTime = Date.now();
      if (__DEV__) {
        console.log(`⚡ ${componentName} unmounted after ${unmountTime - mountTimeRef.current}ms`);
      }
    };
  }, [componentName]);

  const measureAction = useCallback((actionName: string, action: () => void) => {
    const start = Date.now();
    action();
    const duration = Date.now() - start;
    
    if (__DEV__) {
      console.log(`⚡ ${componentName}.${actionName} took ${duration}ms`);
    }
  }, [componentName]);

  return { measureAction };
};

/**
 * Hook to track render count
 */
export const useRenderCount = (componentName: string) => {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    
    if (__DEV__) {
      console.log(`🔄 ${componentName} rendered ${renderCount.current} times`);
    }
  });

  return renderCount.current;
};

/**
 * Hook to measure async operations
 */
export const useAsyncPerformance = () => {
  const measureAsync = useCallback(async <T,>(
    name: string,
    asyncFn: () => Promise<T>
  ): Promise<T> => {
    performanceMonitor.start(name);
    try {
      const result = await asyncFn();
      return result;
    } finally {
      performanceMonitor.end(name);
    }
  }, []);

  return { measureAsync };
};
