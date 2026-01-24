/**
 * Memory optimization utilities
 */

/**
 * LRU Cache implementation for memory-efficient caching
 */
export class LRUCache<K, V> {
  private maxSize: number;
  private cache: Map<K, V>;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }

    // Move to end (most recently used)
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    // Delete if exists (to reorder)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Add to end
    this.cache.set(key, value);

    // Remove oldest if over limit
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Image cache with LRU eviction
 */
export const imageCache = new LRUCache<string, string>(50);

/**
 * Data cache with LRU eviction
 */
export const dataCache = new LRUCache<string, any>(100);

/**
 * Clean up old cache entries
 */
export function cleanupCache(): void {
  imageCache.clear();
  dataCache.clear();
  
  if (__DEV__) {
    console.log('🧹 Cache cleaned up');
  }
}

/**
 * Get memory usage (if available)
 */
export function getMemoryUsage(): number | null {
  // React Native doesn't expose memory info directly
  // This is a placeholder for native module integration
  return null;
}

/**
 * Optimize large lists by limiting rendered items
 */
export function getOptimizedListConfig() {
  return {
    initialNumToRender: 10,
    maxToRenderPerBatch: 5,
    windowSize: 10,
    removeClippedSubviews: true,
    updateCellsBatchingPeriod: 50,
  };
}
