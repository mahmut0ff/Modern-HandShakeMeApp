/**
 * Consolidated Authentication Token Service
 * 
 * This is the SINGLE source of truth for all JWT token operations.
 * All other token implementations are deprecated.
 * 
 * Features:
 * - Consistent token generation and validation
 * - Token blacklist support (logout)
 * - Refresh token rotation
 * - Standardized payload structure
 */

import jwt from 'jsonwebtoken';
import { getItem, putItem } from '../db/dynamodb-client';
import { Keys } from '../db/dynamodb-keys';
import { logger } from '../utils/logger';

// Configuration
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const ACCESS_TOKEN_EXPIRY = '1h';  // Standardized: 1 hour
const REFRESH_TOKEN_EXPIRY = '7d'; // Standardized: 7 days
const TOKEN_ISSUER = 'handshakeme';
const TOKEN_AUDIENCE = 'handshakeme-api';

// Canonical token payload structure
export interface TokenPayload {
  userId: string;
  email: string;
  role: 'CLIENT' | 'MASTER' | 'ADMIN';
  phone?: string;
  isVerified: boolean;
  type: 'access' | 'refresh';
}

// Public interface for creating tokens
export interface CreateTokenInput {
  userId: string;
  email: string;
  role: 'CLIENT' | 'MASTER' | 'ADMIN';
  phone?: string;
  isVerified: boolean;
}

// Token pair response
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

/**
 * Generate access token
 */
export function generateAccessToken(input: CreateTokenInput): string {
  const payload: Omit<TokenPayload, 'type'> = {
    userId: input.userId,
    email: input.email,
    role: input.role,
    phone: input.phone,
    isVerified: input.isVerified,
  };

  return jwt.sign(
    { ...payload, type: 'access' },
    JWT_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    }
  );
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(input: CreateTokenInput): string {
  const payload: Omit<TokenPayload, 'type'> = {
    userId: input.userId,
    email: input.email,
    role: input.role,
    phone: input.phone,
    isVerified: input.isVerified,
  };

  return jwt.sign(
    { ...payload, type: 'refresh' },
    JWT_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    }
  );
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(input: CreateTokenInput): TokenPair {
  return {
    accessToken: generateAccessToken(input),
    refreshToken: generateRefreshToken(input),
    expiresIn: ACCESS_TOKEN_EXPIRY,
  };
}

/**
 * Verify and decode access token
 * Checks blacklist and validates signature
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  try {
    // Check if token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw new Error('Token has been revoked');
    }

    // Verify JWT signature and claims
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    }) as TokenPayload;

    // Validate token type
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      logger.warn('Access token expired');
      throw new Error('Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      logger.warn('Invalid access token');
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Verify and decode refresh token
 * Checks blacklist and validates signature
 */
export async function verifyRefreshToken(token: string): Promise<TokenPayload> {
  try {
    // Check if token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw new Error('Token has been revoked');
    }

    // Verify JWT signature and claims
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    }) as TokenPayload;

    // Validate token type
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      logger.warn('Refresh token expired');
      throw new Error('Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      logger.warn('Invalid refresh token');
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Verify token without checking blacklist (for middleware performance)
 * Use this for initial validation, then check blacklist separately if needed
 */
export function verifyTokenSync(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    }) as TokenPayload;

    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Blacklist a token (for logout)
 * Token will be stored in DynamoDB with TTL matching token expiration
 */
export async function blacklistToken(token: string): Promise<void> {
  try {
    // Decode token to get expiration
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      throw new Error('Invalid token structure');
    }

    // Calculate TTL (seconds until token expires)
    const currentTime = Math.floor(Date.now() / 1000);
    const ttl = decoded.exp - currentTime;

    if (ttl <= 0) {
      // Token already expired, no need to blacklist
      logger.info('Token already expired, skipping blacklist');
      return;
    }

    // Store in DynamoDB with TTL
    await putItem({
      ...Keys.tokenBlacklist(token),
      blacklistedAt: new Date().toISOString(),
      expiresAt: decoded.exp,
      ttl: decoded.exp, // DynamoDB TTL attribute
    });

    logger.info('Token blacklisted', { 
      tokenPrefix: token.substring(0, 10),
      ttl 
    });
  } catch (error) {
    logger.error('Failed to blacklist token', error);
    throw error;
  }
}

/**
 * Check if token is blacklisted
 */
export async function isTokenBlacklisted(token: string): Promise<boolean> {
  try {
    const result = await getItem(Keys.tokenBlacklist(token));
    return result !== undefined;
  } catch (error) {
    logger.error('Failed to check token blacklist', error);
    // Fail open - if DynamoDB is down, allow the request
    // This prevents complete service outage if DynamoDB has issues
    return false;
  }
}

/**
 * Decode token without verification (for debugging/logging)
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch (error) {
    logger.error('Failed to decode token', error);
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
}

/**
 * Get token expiration time
 */
export function getTokenExpiration(token: string): Date | null {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      return null;
    }

    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
}

// Export constants for reference
export const TOKEN_CONFIG = {
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
  TOKEN_ISSUER,
  TOKEN_AUDIENCE,
} as const;
