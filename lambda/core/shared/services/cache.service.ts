/**
 * Cache Service
 * Сервис для кэширования с поддержкой Redis и DynamoDB fallback
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  DeleteCommand
} from '@aws-sdk/lib-dynamodb';

export interface CacheItem {
  key: string;
  value: any;
  expiresAt: number;
  createdAt: number;
}

export class CacheService {
  private client: DynamoDBDocumentClient;
  private cacheTable: string;
  private memoryCache: Map<string, CacheItem>;
  private maxMemoryItems: number;

  constructor() {
    const dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    
    this.client = DynamoDBDocumentClient.from(dynamoClient);
    this.cacheTable = process.env.CACHE_TABLE || 'cache';
    this.memoryCache = new Map();
    this.maxMemoryItems = 1000; // Limit memory cache size
  }

  async get(key: string): Promise<any> {
    try {
      // Check memory cache first
      const memoryItem = this.memoryCache.get(key);
      if (memoryItem) {
        if (Date.now() < memoryItem.expiresAt) {
          return memoryItem.value;
        } else {
          // Expired, remove from memory
          this.memoryCache.delete(key);
        }
      }

      // Check DynamoDB cache
      const response = await this.client.send(new GetCommand({
        TableName: this.cacheTable,
        Key: { pk: `CACHE#${key}` }
      }));

      if (!response.Item) return null;

      const item = response.Item;
      const now = Date.now();

      // Check if expired
      if (now >= item.expiresAt) {
        // Clean up expired item
        await this.delete(key);
        return null;
      }

      // Store in memory cache for faster access
      this.setMemoryCache(key, {
        key,
        value: item.value,
        expiresAt: item.expiresAt,
        createdAt: item.createdAt
      });

      return item.value;
    } catch (error) {
      console.error('Error getting cache item:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    try {
      const now = Date.now();
      const expiresAt = now + (ttlSeconds * 1000);

      const cacheItem: CacheItem = {
        key,
        value,
        expiresAt,
        createdAt: now
      };

      // Store in DynamoDB
      await this.client.send(new PutCommand({
        TableName: this.cacheTable,
        Item: {
          pk: `CACHE#${key}`,
          key,
          value,
          expiresAt,
          createdAt: now,
          ttl: Math.floor(expiresAt / 1000) // DynamoDB TTL in seconds
        }
      }));

      // Store in memory cache
      this.setMemoryCache(key, cacheItem);
    } catch (error) {
      console.error('Error setting cache item:', error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      // Remove from memory cache
      this.memoryCache.delete(key);

      // Remove from DynamoDB
      await this.client.send(new DeleteCommand({
        TableName: this.cacheTable,
        Key: { pk: `CACHE#${key}` }
      }));
    } catch (error) {
      console.error('Error deleting cache item:', error);
    }
  }

  async clear(pattern?: string): Promise<void> {
    try {
      if (pattern) {
        // Clear items matching pattern from memory cache
        for (const key of this.memoryCache.keys()) {
          if (key.includes(pattern)) {
            this.memoryCache.delete(key);
          }
        }
        // Note: DynamoDB doesn't support pattern-based deletion efficiently
        // Consider using a separate cleanup process for this
      } else {
        // Clear all memory cache
        this.memoryCache.clear();
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  async getOrSet<T>(
    key: string, 
    factory: () => Promise<T>, 
    ttlSeconds: number = 3600
  ): Promise<T> {
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  private setMemoryCache(key: string, item: CacheItem): void {
    // Implement LRU eviction if memory cache is full
    if (this.memoryCache.size >= this.maxMemoryItems) {
      // Remove oldest item
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) {
        this.memoryCache.delete(firstKey);
      }
    }

    this.memoryCache.set(key, item);
  }

  // Utility methods for common cache patterns
  async cacheFunction<T>(
    key: string,
    fn: () => Promise<T>,
    ttlSeconds: number = 3600
  ): Promise<T> {
    return this.getOrSet(key, fn, ttlSeconds);
  }

  createKey(...parts: (string | number)[]): string {
    return parts.map(part => String(part)).join(':');
  }

  // Health check method
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      const testKey = 'health-check';
      const testValue = { timestamp: Date.now() };
      
      await this.set(testKey, testValue, 60);
      const retrieved = await this.get(testKey);
      await this.delete(testKey);

      const isHealthy = retrieved && retrieved.timestamp === testValue.timestamp;

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        details: {
          memoryCache: {
            size: this.memoryCache.size,
            maxSize: this.maxMemoryItems
          },
          dynamodb: {
            table: this.cacheTable,
            testPassed: isHealthy
          }
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          memoryCache: {
            size: this.memoryCache.size,
            maxSize: this.maxMemoryItems
          }
        }
      };
    }
  }
}