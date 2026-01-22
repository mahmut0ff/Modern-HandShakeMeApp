// Redis client singleton for Lambda functions

import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

let redis: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
  if (!redis) {
    logger.info('Creating new Redis client');
    
    redis = createClient({
      url: `rediss://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
      password: process.env.REDIS_AUTH_TOKEN,
      socket: {
        tls: true,
        rejectUnauthorized: true,
      },
    });

    redis.on('error', (err) => {
      logger.error('Redis client error', err);
    });

    redis.on('connect', () => {
      logger.info('Redis client connected');
    });

    await redis.connect();

    // Handle Lambda shutdown
    process.on('beforeExit', async () => {
      logger.info('Disconnecting Redis client');
      await redis?.quit();
    });
  }

  return redis;
}

// Cache operations
export class CacheService {
  private ttl: number;

  constructor(ttl = 3600) {
    this.ttl = ttl;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const client = await getRedisClient();
      const value = await client.get(key);
      
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
      await client.setEx(key, ttl || this.ttl, serialized);
    } catch (error) {
      logger.error('Cache set failed', error, { key });
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const client = await getRedisClient();
      await client.del(key);
    } catch (error) {
      logger.error('Cache delete failed', error, { key });
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    try {
      const client = await getRedisClient();
      const keys = await client.keys(pattern);
      
      if (keys.length > 0) {
        await client.del(keys);
      }
    } catch (error) {
      logger.error('Cache delete pattern failed', error, { pattern });
    }
  }
}

export const cache = new CacheService();
