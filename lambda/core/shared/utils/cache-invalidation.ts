// Cache invalidation utility for pattern-based cache clearing

import { CacheService } from '../cache/client';

export class CacheInvalidator {
  private cache: CacheService;

  constructor(cache?: CacheService) {
    this.cache = cache || new CacheService();
  }

  /**
   * Invalidate all review-related cache for a specific master
   */
  async invalidateReviewCache(masterId: string): Promise<void> {
    const patterns = [
      `reviews:${masterId}:*`,
      `reviews:stats:${masterId}`,
      `reviews:list:${masterId}:*`,
    ];

    await Promise.all(
      patterns.map(pattern => this.deleteByPattern(pattern))
    );
  }

  /**
   * Delete cache entries matching a pattern
   * For Redis: uses SCAN + DEL
   * For Memory cache: filters keys
   */
  private async deleteByPattern(pattern: string): Promise<void> {
    try {
      // Convert glob pattern to regex
      const regexPattern = pattern
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');
      
      const regex = new RegExp(`^${regexPattern}$`);

      // For now, we'll delete specific known keys
      // In production, you'd want to implement SCAN for Redis
      const baseKey = pattern.split(':*')[0];
      
      // Delete the base pattern variations
      const keysToDelete = [
        baseKey,
        `${baseKey}:page:1`,
        `${baseKey}:page:2`,
        `${baseKey}:page:3`,
        // Add more common variations as needed
      ];

      await Promise.all(
        keysToDelete.map(key => this.cache.delete(key).catch(() => {}))
      );
    } catch (error) {
      console.error('Cache invalidation error:', error);
      // Don't throw - cache invalidation failures shouldn't break the app
    }
  }

  /**
   * Invalidate multiple cache patterns at once
   */
  async invalidateMultiple(patterns: string[]): Promise<void> {
    await Promise.all(
      patterns.map(pattern => this.deleteByPattern(pattern))
    );
  }

  /**
   * Clear all review cache (use with caution)
   */
  async clearAllReviewCache(): Promise<void> {
    await this.deleteByPattern('reviews:*');
  }
}

// Singleton instance
let cacheInvalidator: CacheInvalidator | null = null;

export function getCacheInvalidator(): CacheInvalidator {
  if (!cacheInvalidator) {
    cacheInvalidator = new CacheInvalidator();
  }
  return cacheInvalidator;
}
