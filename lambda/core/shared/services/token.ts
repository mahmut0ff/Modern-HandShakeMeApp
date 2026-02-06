// JWT token service

import * as jwt from 'jsonwebtoken';
const { sign, verify } = jwt;
import { getRedisClient } from '../cache/client';
import { logger } from '../utils/logger';
import type { AuthContext } from '../types';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export async function issueAccessToken(payload: TokenPayload): Promise<string> {
  return sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'handshakeme',
    audience: 'handshakeme-api',
  });
}

export async function issueRefreshToken(payload: TokenPayload): Promise<string> {
  const token = sign(payload, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    issuer: 'handshakeme',
    audience: 'handshakeme-refresh',
  });
  
  return token;
}

export async function verifyAccessToken(token: string): Promise<AuthContext> {
  try {
    // Check if token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw new Error('Token has been revoked');
    }
    
    const decoded = verify(token, JWT_SECRET, {
      issuer: 'handshakeme',
      audience: 'handshakeme-api',
    }) as AuthContext;
    
    return decoded;
  } catch (error) {
    logger.error('Token verification failed', error);
    throw error;
  }
}

export async function verifyRefreshToken(token: string): Promise<AuthContext> {
  try {
    // Check if token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw new Error('Token has been revoked');
    }
    
    const decoded = verify(token, JWT_SECRET, {
      issuer: 'handshakeme',
      audience: 'handshakeme-refresh',
    }) as AuthContext;
    
    return decoded;
  } catch (error) {
    logger.error('Refresh token verification failed', error);
    throw error;
  }
}

export async function blacklistToken(token: string, expiresIn: number): Promise<void> {
  try {
    const redis = await getRedisClient();
    const key = `blacklist:${token}`;
    await redis.setEx(key, expiresIn, '1');
    logger.info('Token blacklisted', { key });
  } catch (error) {
    logger.error('Failed to blacklist token', error);
    throw error;
  }
}

export async function isTokenBlacklisted(token: string): Promise<boolean> {
  try {
    const redis = await getRedisClient();
    const key = `blacklist:${token}`;
    const result = await redis.get(key);
    return result !== null;
  } catch (error) {
    logger.error('Failed to check token blacklist', error);
    // Fail open - if Redis is down, allow the request
    return false;
  }
}

// Simple verify function for DynamoDB endpoints (without Redis dependency)
export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = verify(token, JWT_SECRET, {
      issuer: 'handshakeme',
      audience: 'handshakeme-api',
    }) as TokenPayload;
    
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
}
