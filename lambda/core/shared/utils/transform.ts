/**
 * Transformation utilities for converting between camelCase and snake_case
 * Database uses camelCase, Mobile app expects snake_case
 */

/**
 * Convert camelCase to snake_case
 */
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Convert snake_case to camelCase
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Memoization cache for transformation results
 */
const transformCache = new WeakMap<object, any>();

/**
 * Recursively transform object keys from camelCase to snake_case
 * Handles Date objects, circular references, and includes performance optimizations
 */
export function transformToSnakeCase(obj: any, seen = new WeakSet()): any {
  // Preserve null and undefined
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle Date objects - convert to ISO 8601 string
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => transformToSnakeCase(item, seen));
  }

  // Handle plain objects
  if (typeof obj === 'object' && obj.constructor === Object) {
    // Check for circular references
    if (seen.has(obj)) {
      return '[Circular]';
    }
    
    // Check memoization cache
    if (transformCache.has(obj)) {
      return transformCache.get(obj);
    }
    
    seen.add(obj);
    const transformed: any = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const snakeKey = toSnakeCase(key);
        transformed[snakeKey] = transformToSnakeCase(obj[key], seen);
      }
    }
    
    // Cache the result
    transformCache.set(obj, transformed);
    
    return transformed;
  }

  // Return primitives as-is
  return obj;
}

/**
 * Recursively transform object keys from snake_case to camelCase
 * Handles Date objects, circular references, and includes performance optimizations
 */
export function transformToCamelCase(obj: any, seen = new WeakSet()): any {
  // Preserve null and undefined
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle Date objects - convert to ISO 8601 string
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => transformToCamelCase(item, seen));
  }

  // Handle plain objects
  if (typeof obj === 'object' && obj.constructor === Object) {
    // Check for circular references
    if (seen.has(obj)) {
      return '[Circular]';
    }
    
    // Check memoization cache
    if (transformCache.has(obj)) {
      return transformCache.get(obj);
    }
    
    seen.add(obj);
    const transformed: any = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const camelKey = toCamelCase(key);
        transformed[camelKey] = transformToCamelCase(obj[key], seen);
      }
    }
    
    // Cache the result
    transformCache.set(obj, transformed);
    
    return transformed;
  }

  // Return primitives as-is
  return obj;
}

/**
 * Transform Date objects in an object to ISO 8601 strings
 * Used for ensuring consistent date formatting in responses
 */
export function transformDates(obj: any, seen = new WeakSet()): any {
  // Preserve null and undefined
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle Date objects - convert to ISO 8601 string
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => transformDates(item, seen));
  }

  // Handle plain objects
  if (typeof obj === 'object' && obj.constructor === Object) {
    // Check for circular references
    if (seen.has(obj)) {
      return '[Circular]';
    }
    
    seen.add(obj);
    const transformed: any = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        transformed[key] = transformDates(obj[key], seen);
      }
    }
    
    return transformed;
  }

  // Return primitives as-is
  return obj;
}
