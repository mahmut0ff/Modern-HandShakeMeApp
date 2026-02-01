// Rate Limiter Service for API protection

import { cache } from '../cache/client';
import { logger } from '../utils/logger';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (identifier: string) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalHits: number;
}

export class RateLimiterService {
  private defaultConfig: RateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes
    keyGenerator: (identifier: string) => `rate_limit:${identifier}`,
  };

  async checkRateLimit(
    identifier: string,
    config: Partial<RateLimitConfig> = {}
  ): Promise<RateLimitResult> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const key = finalConfig.keyGenerator!(identifier);
    
    try {
      // Get current count
      const currentCount = await cache.get<number>(key) || 0;
      const now = Date.now();
      const resetTime = now + finalConfig.windowMs;

      if (currentCount >= finalConfig.maxRequests) {
        logger.warn('Rate limit exceeded', {
          identifier,
          currentCount,
          maxRequests: finalConfig.maxRequests,
          windowMs: finalConfig.windowMs,
        });

        return {
          allowed: false,
          remaining: 0,
          resetTime,
          totalHits: currentCount,
        };
      }

      // Increment counter
      const newCount = currentCount + 1;
      await cache.set(key, newCount, Math.ceil(finalConfig.windowMs / 1000));

      return {
        allowed: true,
        remaining: finalConfig.maxRequests - newCount,
        resetTime,
        totalHits: newCount,
      };
    } catch (error) {
      logger.error('Rate limit check failed', error, { identifier });
      // On error, allow the request (fail open)
      return {
        allowed: true,
        remaining: finalConfig.maxRequests - 1,
        resetTime: Date.now() + finalConfig.windowMs,
        totalHits: 1,
      };
    }
  }

  // Predefined rate limit configurations
  static readonly configs = {
    // Authentication endpoints - stricter limits
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // 5 attempts per 15 minutes
    },
    
    // General API endpoints
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100, // 100 requests per 15 minutes
    },
    
    // File upload endpoints
    upload: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 20, // 20 uploads per hour
    },
    
    // Search endpoints
    search: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30, // 30 searches per minute
    },
    
    // Notification endpoints
    notifications: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10, // 10 notifications per minute
    },
  };

  // Check rate limit for authentication endpoints
  async checkAuthRateLimit(identifier: string): Promise<RateLimitResult> {
    return this.checkRateLimit(identifier, RateLimiterService.configs.auth);
  }

  // Check rate limit for API endpoints
  async checkApiRateLimit(identifier: string): Promise<RateLimitResult> {
    return this.checkRateLimit(identifier, RateLimiterService.configs.api);
  }

  // Check rate limit for upload endpoints
  async checkUploadRateLimit(identifier: string): Promise<RateLimitResult> {
    return this.checkRateLimit(identifier, RateLimiterService.configs.upload);
  }

  // Check rate limit for search endpoints
  async checkSearchRateLimit(identifier: string): Promise<RateLimitResult> {
    return this.checkRateLimit(identifier, RateLimiterService.configs.search);
  }

  // Reset rate limit for a specific identifier
  async resetRateLimit(identifier: string, config: Partial<RateLimitConfig> = {}): Promise<void> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const key = finalConfig.keyGenerator!(identifier);
    
    try {
      await cache.delete(key);
      logger.info('Rate limit reset', { identifier });
    } catch (error) {
      logger.error('Failed to reset rate limit', error, { identifier });
    }
  }

  // Get current rate limit status
  async getRateLimitStatus(
    identifier: string,
    config: Partial<RateLimitConfig> = {}
  ): Promise<{
    currentCount: number;
    maxRequests: number;
    remaining: number;
    resetTime: number;
  }> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const key = finalConfig.keyGenerator!(identifier);
    
    try {
      const currentCount = await cache.get<number>(key) || 0;
      const resetTime = Date.now() + finalConfig.windowMs;
      
      return {
        currentCount,
        maxRequests: finalConfig.maxRequests,
        remaining: Math.max(0, finalConfig.maxRequests - currentCount),
        resetTime,
      };
    } catch (error) {
      logger.error('Failed to get rate limit status', error, { identifier });
      return {
        currentCount: 0,
        maxRequests: finalConfig.maxRequests,
        remaining: finalConfig.maxRequests,
        resetTime: Date.now() + finalConfig.windowMs,
      };
    }
  }

  // Sliding window rate limiter (more accurate but more complex)
  async checkSlidingWindowRateLimit(
    identifier: string,
    config: Partial<RateLimitConfig> = {}
  ): Promise<RateLimitResult> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const key = `sliding_${finalConfig.keyGenerator!(identifier)}`;
    const now = Date.now();
    const windowStart = now - finalConfig.windowMs;
    
    try {
      // Get timestamps of requests in the current window
      const timestamps = await cache.get<number[]>(key) || [];
      
      // Filter out old timestamps
      const validTimestamps = timestamps.filter(ts => ts > windowStart);
      
      if (validTimestamps.length >= finalConfig.maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: validTimestamps[0] + finalConfig.windowMs,
          totalHits: validTimestamps.length,
        };
      }

      // Add current timestamp
      validTimestamps.push(now);
      
      // Store updated timestamps
      await cache.set(key, validTimestamps, Math.ceil(finalConfig.windowMs / 1000));

      return {
        allowed: true,
        remaining: finalConfig.maxRequests - validTimestamps.length,
        resetTime: now + finalConfig.windowMs,
        totalHits: validTimestamps.length,
      };
    } catch (error) {
      logger.error('Sliding window rate limit check failed', error, { identifier });
      // On error, allow the request (fail open)
      return {
        allowed: true,
        remaining: finalConfig.maxRequests - 1,
        resetTime: now + finalConfig.windowMs,
        totalHits: 1,
      };
    }
  }
}

export const rateLimiter = new RateLimiterService();