// Redis client singleton for Lambda functions
// Falls back to in-memory cache for local development

import { logger } from '../utils/logger';

// Try to import redis, but make it optional for local dev
let createClient: any;

async function loadRedis() {
  try {
    const redis = await import('redis');
    createClient = redis.createClient;
  } catch {
    logger.info('Redis not available, using in-memory cache');
  }
}

// Initialize redis import
const redisPromise = loadRedis();

let redis: any = null;

// In-memory fallback for local development with TTL cleanup
class MemoryCache {
  private cache = new Map<string, { value: string; expiry: number }>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly maxSize = 1000; // Prevent memory leaks

  constructor() {
    // Start cleanup interval
    this.startCleanup();
  }

  private startCleanup(): void {
    // Clean up expired items every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      logger.debug(`Memory cache cleanup: removed ${removedCount} expired items`);
    }

    // If cache is too large, remove oldest items
    if (this.cache.size > this.maxSize) {
      const entries = Array.from(this.cache.entries());
      const toRemove = this.cache.size - this.maxSize;
      
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(entries[i][0]);
      }
      
      logger.warn(`Memory cache size limit exceeded, removed ${toRemove} oldest items`);
    }
  }

  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  async setEx(key: string, ttl: number, value: string): Promise<void> {
    this.cache.set(key, { 
      value, 
      expiry: Date.now() + ttl * 1000 
    });
  }

  async del(keys: string | string[]): Promise<void> {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    keyArray.forEach(k => this.cache.delete(k));
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.cache.keys()).filter(k => regex.test(k));
  }

  async quit(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

const memoryCache = new MemoryCache();

export async function getRedisClient(): Promise<any> {
  // Wait for redis to load
  await redisPromise;
  
  // If Redis is not installed or not configured, return the memory cache client
  if (!createClient || !process.env.REDIS_HOST) {
    return memoryCache;
  }

  if (!redis) {
    logger.info('Creating new Redis client');
    
    try {
      redis = createClient({
        url: `rediss://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
        password: process.env.REDIS_AUTH_TOKEN,
        socket: {
          tls: true,
          rejectUnauthorized: true,
          connectTimeout: 10000,
          lazyConnect: true,
        },
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
      });

      redis.on('error', (err: any) => {
        logger.error('Redis client error', err);
        // Fallback to memory cache on Redis errors
        redis = null;
      });

      redis.on('connect', () => {
        logger.info('Redis client connected');
      });

      redis.on('reconnecting', () => {
        logger.info('Redis client reconnecting');
      });

      redis.on('ready', () => {
        logger.info('Redis client ready');
      });

      await redis.connect();

      // Handle Lambda shutdown
      process.on('beforeExit', async () => {
        logger.info('Disconnecting Redis client');
        try {
          await redis?.quit();
        } catch (error) {
          logger.warn('Error disconnecting Redis client', error as any);
        }
      });

    } catch (error) {
      logger.error('Failed to create Redis client, falling back to memory cache', error);
      redis = null;
      return memoryCache;
    }
  }

  return redis;
}

// Cache operations with error handling
export class CacheService {
  private ttl: number;
  private keyPrefix: string;

  constructor(ttl = 3600, keyPrefix = 'handshake:') {
    this.ttl = ttl;
    this.keyPrefix = keyPrefix;
  }

  private getKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const client = await getRedisClient();
      const value = await client.get(this.getKey(key));
      
      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Cache get failed', error, { key });
      return null;
    }
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    try {
      const client = await getRedisClient();
      const serialized = JSON.stringify(value);
      await client.setEx(this.getKey(key), ttl || this.ttl, serialized);
    } catch (error) {
      logger.error('Cache set failed', error, { key });
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const client = await getRedisClient();
      await client.del(this.getKey(key));
    } catch (error) {
      logger.error('Cache delete failed', error, { key });
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    try {
      const client = await getRedisClient();
      const keys = await client.keys(this.getKey(pattern));
      
      if (keys.length > 0) {
        await client.del(keys);
      }
    } catch (error) {
      logger.error('Cache delete pattern failed', error, { pattern });
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const client = await getRedisClient();
      const result = await client.get(this.getKey(key));
      return result !== null;
    } catch (error) {
      logger.error('Cache exists check failed', error, { key });
      return false;
    }
  }

  async increment(key: string, amount = 1): Promise<number> {
    try {
      const client = await getRedisClient();
      // For memory cache, we need to implement this manually
      if (client === memoryCache) {
        const current = await this.get<number>(key) || 0;
        const newValue = current + amount;
        await this.set(key, newValue);
        return newValue;
      }
      
      return await client.incrBy(this.getKey(key), amount);
    } catch (error) {
      logger.error('Cache increment failed', error, { key, amount });
      return 0;
    }
  }

  async expire(key: string, ttl: number): Promise<void> {
    try {
      const client = await getRedisClient();
      
      // For memory cache, we need to re-set with new TTL
      if (client === memoryCache) {
        const value = await this.get(key);
        if (value !== null) {
          await this.set(key, value, ttl);
        }
        return;
      }
      
      await client.expire(this.getKey(key), ttl);
    } catch (error) {
      logger.error('Cache expire failed', error, { key, ttl });
    }
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      // Generate new value
      const value = await factory();
      
      // Store in cache
      await this.set(key, value, ttl);
      
      return value;
    } catch (error) {
      logger.error('Cache getOrSet failed', error, { key });
      // If cache fails, still return the generated value
      return await factory();
    }
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const client = await getRedisClient();
      
      // For memory cache, get each key individually
      if (client === memoryCache) {
        const results = await Promise.all(
          keys.map(key => this.get<T>(key))
        );
        return results;
      }
      
      const prefixedKeys = keys.map(key => this.getKey(key));
      const values = await client.mGet(prefixedKeys);
      
      return values.map((value: string | null) => {
        if (value === null) return null;
        try {
          return JSON.parse(value) as T;
        } catch {
          return null;
        }
      });
    } catch (error) {
      logger.error('Cache mget failed', error, { keyCount: keys.length });
      return keys.map(() => null);
    }
  }

  async mset(keyValuePairs: Array<{ key: string; value: unknown; ttl?: number }>): Promise<void> {
    try {
      // Set each key-value pair individually to handle TTL
      await Promise.all(
        keyValuePairs.map(({ key, value, ttl }) => 
          this.set(key, value, ttl)
        )
      );
    } catch (error) {
      logger.error('Cache mset failed', error, { pairCount: keyValuePairs.length });
    }
  }

  // Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: {
      type: 'redis' | 'memory';
      connected: boolean;
      cacheSize?: number;
      testPassed: boolean;
    };
  }> {
    try {
      const testKey = 'health-check';
      const testValue = { timestamp: Date.now() };
      
      await this.set(testKey, testValue, 60);
      const retrieved = await this.get(testKey);
      await this.delete(testKey);

      const testPassed = !!(retrieved && 
        typeof retrieved === 'object' && 
        'timestamp' in retrieved);

      const client = await getRedisClient();
      const isMemoryCache = client === memoryCache;

      return {
        status: testPassed ? 'healthy' : 'unhealthy',
        details: {
          type: isMemoryCache ? 'memory' : 'redis',
          connected: !isMemoryCache,
          cacheSize: isMemoryCache ? memoryCache.size() : undefined,
          testPassed,
        },
      };
    } catch (error) {
      logger.error('Cache health check failed', error as any);
      return {
        status: 'unhealthy',
        details: {
          type: 'memory',
          connected: false,
          testPassed: false,
        },
      };
    }
  }
}

export const cache = new CacheService();
