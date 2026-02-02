/**
 * Unified authentication utilities
 */

import jwt from 'jsonwebtoken';
import { logger } from './logger';

let cachedJwtSecret: string | null = null;

async function getJwtSecret(): Promise<string> {
  if (cachedJwtSecret) {
    return cachedJwtSecret;
  }

  // First try environment variable
  if (process.env.JWT_SECRET) {
    cachedJwtSecret = process.env.JWT_SECRET;
    return cachedJwtSecret;
  }

  // Then try Secrets Manager if ARN is provided
  if (process.env.JWT_SECRET_ARN) {
    try {
      // @ts-ignore - @aws-sdk/client-secrets-manager is an optional dependency
      const { SecretsManagerClient, GetSecretValueCommand } = await import('@aws-sdk/client-secrets-manager');
      const client = new SecretsManagerClient({
        region: process.env.AWS_REGION || 'us-east-1'
      });
      const response = await client.send(new GetSecretValueCommand({
        SecretId: process.env.JWT_SECRET_ARN
      }));
      
      const secretData = JSON.parse(response.SecretString!);
      cachedJwtSecret = secretData.JWT_SECRET;
      return cachedJwtSecret!;
    } catch (error) {
      logger.error('Failed to get JWT secret from Secrets Manager', error);
    }
  }

  // Fall back to default (not recommended for production)
  cachedJwtSecret = 'default-jwt-secret-change-in-production';
  logger.warn('Using default JWT secret - not secure for production');
  return cachedJwtSecret;
}

export async function getUserIdFromToken(authHeader?: string): Promise<string> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }
  
  const token = authHeader.substring(7);
  
  try {
    const jwtSecret = await getJwtSecret();
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    if (!decoded.userId) {
      throw new Error('Invalid token payload');
    }
    
    return decoded.userId;
  } catch (error: any) {
    logger.error('Token verification failed', error);
    throw new Error('Invalid or expired token');
  }
}

export async function verifyToken(token: string): Promise<any> {
  try {
    const jwtSecret = await getJwtSecret();
    return jwt.verify(token, jwtSecret);
  } catch (error) {
    logger.error('Token verification failed', error);
    throw new Error('Invalid or expired token');
  }
}

export async function generateToken(payload: any, expiresIn: string = '24h'): Promise<string> {
  const jwtSecret = await getJwtSecret();
  return jwt.sign(payload, jwtSecret, { expiresIn } as jwt.SignOptions);
}

export interface TokenPayload {
  userId: string;
  role: string;
  phone?: string;
  telegramId?: string;
  iat?: number;
  exp?: number;
}

export async function decodeToken(token: string): Promise<TokenPayload> {
  try {
    const jwtSecret = await getJwtSecret();
    return jwt.verify(token, jwtSecret) as TokenPayload;
  } catch (error) {
    logger.error('Token decode failed', error);
    throw new Error('Invalid token');
  }
}