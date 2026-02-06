import { LRUCache, imageCache, dataCache } from '../memoryOptimization';

describe('Memory Optimization', () => {
  describe('LRUCache', () => {
    it('should store and retrieve values', () => {
      const cache = new LRUCache<string, number>(3);
      
      cache.set('a', 1);
      cache.set('b', 2);
      
      expect(cache.get('a')).toBe(1);
      expect(cache.get('b')).toBe(2);
    });

    it('should evict oldest item when full', () => {
      const cache = new LRUCache<string, number>(2);
      
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3); // Should evict 'a'
      
      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('b')).toBe(2);
      expect(cache.get('c')).toBe(3);
    });

    it('should update access order on get', () => {
      const cache = new LRUCache<string, number>(2);
      
      cache.set('a', 1);
      cache.set('b', 2);
      cache.get('a'); // Access 'a', making it most recent
      cache.set('c', 3); // Should evict 'b', not 'a'
      
      expect(cache.get('a')).toBe(1);
      expect(cache.get('b')).toBeUndefined();
      expect(cache.get('c')).toBe(3);
    });

    it('should check if key exists', () => {
      const cache = new LRUCache<string, number>(2);
      
      cache.set('a', 1);
      
      expect(cache.has('a')).toBe(true);
      expect(cache.has('b')).toBe(false);
    });

    it('should clear all items', () => {
      const cache = new LRUCache<string, number>(2);
      
      cache.set('a', 1);
      cache.set('b', 2);
      cache.clear();
      
      expect(cache.size()).toBe(0);
      expect(cache.get('a')).toBeUndefined();
    });

    it('should return correct size', () => {
      const cache = new LRUCache<string, number>(3);
      
      expect(cache.size()).toBe(0);
      
      cache.set('a', 1);
      expect(cache.size()).toBe(1);
      
      cache.set('b', 2);
      expect(cache.size()).toBe(2);
    });
  });

  describe('Global caches', () => {
    it('should have imageCache available', () => {
      expect(imageCache).toBeDefined();
      expect(imageCache.size()).toBeGreaterThanOrEqual(0);
    });

    it('should have dataCache available', () => {
      expect(dataCache).toBeDefined();
      expect(dataCache.size()).toBeGreaterThanOrEqual(0);
    });
  });
});
