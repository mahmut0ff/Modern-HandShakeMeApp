export class CacheService {
  async get(key: string): Promise<any> {
    // Mock cache service for development
    return null;
  }
  
  async set(key: string, value: any, ttl: number = 300): Promise<void> {
    // Mock cache service for development
    console.log(`Cache SET: ${key} (TTL: ${ttl}s)`);
  }
  
  async invalidatePattern(pattern: string): Promise<void> {
    // Mock cache service for development
    console.log(`Cache INVALIDATE: ${pattern}`);
  }
}
