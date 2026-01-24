import { InteractionManager } from 'react-native';

/**
 * Performance monitoring utilities
 */

export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  name: string;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();

  /**
   * Start measuring performance
   */
  start(name: string): void {
    this.metrics.set(name, {
      name,
      startTime: Date.now(),
    });
  }

  /**
   * End measuring and log results
   */
  end(name: string): number | null {
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric "${name}" not found`);
      return null;
    }

    const endTime = Date.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    if (__DEV__) {
      console.log(`⚡ Performance: ${name} took ${duration}ms`);
    }

    return duration;
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Run task after interactions complete
 */
export function runAfterInteractions(callback: () => void): void {
  InteractionManager.runAfterInteractions(() => {
    callback();
  });
}

/**
 * Measure component render time
 */
export function measureRender(componentName: string) {
  return {
    onMount: () => {
      performanceMonitor.start(`${componentName}-mount`);
    },
    onUnmount: () => {
      performanceMonitor.end(`${componentName}-mount`);
    },
  };
}

/**
 * Memoization helper for expensive calculations
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T
): (...args: Parameters<T>) => ReturnType<T> {
  const cache = new Map<string, ReturnType<T>>();

  return (...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Batch updates for better performance
 */
export function batchUpdates<T>(
  items: T[],
  batchSize: number,
  callback: (batch: T[]) => void
): void {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    runAfterInteractions(() => callback(batch));
  }
}

/**
 * Check if device is low-end
 */
export function isLowEndDevice(): boolean {
  // Simple heuristic - can be improved with actual device detection
  return false; // Placeholder
}

/**
 * Get optimized image quality based on device
 */
export function getOptimizedImageQuality(): number {
  return isLowEndDevice() ? 0.6 : 0.8;
}

/**
 * Get optimized list page size based on device
 */
export function getOptimizedPageSize(): number {
  return isLowEndDevice() ? 10 : 20;
}
