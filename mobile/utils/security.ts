import * as SecureStore from 'expo-secure-store';

// Secure Storage
export const secureStore = async (key: string, value: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error(`Secure store error for key ${key}:`, error);
  }
};

export const secureRetrieve = async (key: string): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error(`Secure retrieve error for key ${key}:`, error);
    return null;
  }
};

export const secureDelete = async (key: string): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error(`Secure delete error for key ${key}:`, error);
  }
};

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation for Kyrgyzstan
export const validatePhone = (phone: string): boolean => {
  // Kyrgyzstan phone formats: +996XXXXXXXXX or 0XXXXXXXXX
  const phoneRegex = /^(\+996|0)[0-9]{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Password validation
export const validatePassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Input sanitization
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/\.\.\//g, '')
    .replace(/SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER/gi, '');
};

// Generate secure password
export const generateSecurePassword = (length: number = 12): string => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';

  const allChars = lowercase + uppercase + numbers + symbols;
  let password = '';

  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Hash password (simple implementation for client-side)
export const hashPassword = (password: string): string => {
  // This is a simple hash for demo purposes
  // In production, use proper hashing on the server
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
};

// Password strength validation
export const validatePasswordStrength = (password: string): {
  level: 'very-weak' | 'weak' | 'medium' | 'strong' | 'very-strong';
  score: number;
  suggestions: string[];
} => {
  let score = 0;
  const suggestions: string[] = [];

  // Length check
  if (password.length >= 8) score += 20;
  else suggestions.push('Use at least 8 characters');

  if (password.length >= 12) score += 10;

  // Character variety
  if (/[a-z]/.test(password)) score += 15;
  else suggestions.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score += 15;
  else suggestions.push('Add uppercase letters');

  if (/[0-9]/.test(password)) score += 15;
  else suggestions.push('Add numbers');

  if (/[^A-Za-z0-9]/.test(password)) score += 25;
  else suggestions.push('Add special characters');

  // Determine level
  let level: 'very-weak' | 'weak' | 'medium' | 'strong' | 'very-strong';
  if (score < 30) level = 'very-weak';
  else if (score < 50) level = 'weak';
  else if (score < 70) level = 'medium';
  else if (score < 90) level = 'strong';
  else level = 'very-strong';

  return { level, score, suggestions };
};

// HTML sanitization
export const sanitizeHtml = (html: string): string => {
  // Remove dangerous tags
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
};

// URL validation
export const validateUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

// Phone number validation (alias for consistency)
export const isValidPhoneNumber = validatePhone;

// Security audit logger
export class SecurityAuditLogger {
  private static instance: SecurityAuditLogger;
  private failedAttempts: Map<string, { count: number; lastAttempt: Date }> = new Map();

  constructor() {
    if (SecurityAuditLogger.instance) {
      return SecurityAuditLogger.instance;
    }
    SecurityAuditLogger.instance = this;
  }

  logSecurityEvent(event: string, data: Record<string, any>) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      ...data
    };

    console.warn('SECURITY_EVENT', logEntry);

    // In production, send to monitoring service
    if (!__DEV__) {
      // Send to Sentry or other monitoring service
    }
  }

  logFailedAttempt(userId: string, action: string) {
    const key = `${userId}:${action}`;
    const current = this.failedAttempts.get(key) || { count: 0, lastAttempt: new Date() };

    current.count++;
    current.lastAttempt = new Date();

    this.failedAttempts.set(key, current);

    this.logSecurityEvent('FAILED_ATTEMPT', {
      userId,
      action,
      count: current.count
    });
  }

  getFailedAttempts(userId: string, action: string): number {
    const key = `${userId}:${action}`;
    return this.failedAttempts.get(key)?.count || 0;
  }

  isSuspiciousActivity(userId: string, action: string, threshold: number = 5): boolean {
    return this.getFailedAttempts(userId, action) >= threshold;
  }

  clearFailedAttempts(userId: string, action: string) {
    const key = `${userId}:${action}`;
    this.failedAttempts.delete(key);
  }
}


// ============================================================================
// Aliases for test compatibility
// ============================================================================

// Email validation alias
export const isValidEmail = validateEmail;

// Phone validation alias
export const isValidPhone = validatePhone;

// Password strength check alias
export const checkPasswordStrength = validatePasswordStrength;

// ============================================================================
// Additional security utilities
// ============================================================================

/**
 * Mask sensitive data for logging/display
 */
export const maskSensitiveData = (data: string, visibleChars: number = 4): string => {
  if (!data || data.length <= visibleChars) {
    return '*'.repeat(data?.length || 0);
  }
  const masked = '*'.repeat(data.length - visibleChars);
  return masked + data.slice(-visibleChars);
};

/**
 * Validate file type against allowed types
 */
export const isValidFileType = (
  mimeType: string,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
): boolean => {
  return allowedTypes.includes(mimeType.toLowerCase());
};

/**
 * Validate file size
 */
export const isValidFileSize = (
  sizeInBytes: number,
  maxSizeInMB: number = 10
): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return sizeInBytes <= maxSizeInBytes;
};

/**
 * Check if URL is safe (not pointing to internal/dangerous resources)
 */
export const isSafeURL = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    
    // Block dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    if (dangerousProtocols.includes(urlObj.protocol)) {
      return false;
    }
    
    // Block internal IPs
    const hostname = urlObj.hostname;
    const internalPatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^0\.0\.0\.0$/,
    ];
    
    for (const pattern of internalPatterns) {
      if (pattern.test(hostname)) {
        return false;
      }
    }
    
    return true;
  } catch {
    return false;
  }
};

/**
 * Rate limiter for preventing abuse
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    
    // Remove old timestamps
    const validTimestamps = timestamps.filter(t => now - t < this.windowMs);
    
    if (validTimestamps.length >= this.maxRequests) {
      return false;
    }
    
    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
    return true;
  }

  reset(key: string): void {
    this.requests.delete(key);
  }

  resetAll(): void {
    this.requests.clear();
  }
}

/**
 * Content Security Policy helper
 */
export class CSP {
  private directives: Map<string, string[]> = new Map();

  constructor() {
    // Default secure policy
    this.directives.set('default-src', ["'self'"]);
    this.directives.set('script-src', ["'self'"]);
    this.directives.set('style-src', ["'self'", "'unsafe-inline'"]);
    this.directives.set('img-src', ["'self'", 'data:', 'https:']);
    this.directives.set('connect-src', ["'self'"]);
    this.directives.set('font-src', ["'self'"]);
    this.directives.set('object-src', ["'none'"]);
    this.directives.set('frame-ancestors', ["'none'"]);
  }

  addDirective(directive: string, values: string[]): void {
    const existing = this.directives.get(directive) || [];
    this.directives.set(directive, [...existing, ...values]);
  }

  setDirective(directive: string, values: string[]): void {
    this.directives.set(directive, values);
  }

  removeDirective(directive: string): void {
    this.directives.delete(directive);
  }

  toString(): string {
    const parts: string[] = [];
    this.directives.forEach((values, directive) => {
      parts.push(`${directive} ${values.join(' ')}`);
    });
    return parts.join('; ');
  }

  toHeader(): { 'Content-Security-Policy': string } {
    return { 'Content-Security-Policy': this.toString() };
  }
}
