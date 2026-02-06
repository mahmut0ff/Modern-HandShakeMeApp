import {
  performanceMonitor,
  debounce,
  throttle,
  memoize,
} from '../performance';

describe('Performance Utils', () => {
  describe('performanceMonitor', () => {
    it('should measure performance', () => {
      performanceMonitor.start('test');
      
      // Simulate work
      for (let i = 0; i < 1000; i++) {
        Math.sqrt(i);
      }
      
      const duration = performanceMonitor.end('test');
      expect(duration).toBeGreaterThan(0);
    });

    it('should return null for non-existent metric', () => {
      const duration = performanceMonitor.end('non-existent');
      expect(duration).toBeNull();
    });

    it('should clear metrics', () => {
      performanceMonitor.start('test');
      performanceMonitor.end('test');
      performanceMonitor.clear();
      expect(performanceMonitor.getMetrics()).toHaveLength(0);
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', () => {
      jest.useFakeTimers();
      
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced();
      debounced();
      debounced();

      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
      
      jest.useRealTimers();
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', () => {
      jest.useFakeTimers();
      
      const fn = jest.fn();
      const throttled = throttle(fn, 100);

      throttled();
      expect(fn).toHaveBeenCalledTimes(1);
      
      throttled();
      throttled();
      expect(fn).toHaveBeenCalledTimes(1); // Still 1 because throttled

      jest.advanceTimersByTime(100);

      throttled();
      expect(fn).toHaveBeenCalledTimes(2); // Now 2 after throttle period
      
      jest.useRealTimers();
    });
  });

  describe('memoize', () => {
    it('should cache function results', () => {
      const expensiveFn = jest.fn((x: number) => x * 2);
      const memoized = memoize(expensiveFn);

      const result1 = memoized(5);
      const result2 = memoized(5);

      expect(result1).toBe(10);
      expect(result2).toBe(10);
      expect(expensiveFn).toHaveBeenCalledTimes(1);
    });

    it('should call function for different arguments', () => {
      const expensiveFn = jest.fn((x: number) => x * 2);
      const memoized = memoize(expensiveFn);

      memoized(5);
      memoized(10);

      expect(expensiveFn).toHaveBeenCalledTimes(2);
    });
  });
});
