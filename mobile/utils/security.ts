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