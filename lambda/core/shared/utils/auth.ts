/**
 * Unified authentication utilities
 */

import jwt from 'jsonwebtoken';
import AWS from 'aws-sdk';
import { logger } from './logger';

const secretsManager = new AWS.SecretsManager({
  region: process.env.AWS_REGION || 'us-east-1'
});

let cachedJwtSecret: string | null = null;

async function getJwtSecret(): Promise<string> {
  if (cachedJwtSecret) {
    return cachedJwtSecret;
  }

  try {
    const secret = await secretsManager.getSecretValue({
      SecretId: process.env.JWT_SECRET_ARN!
    }).promise();
    
    const secretData = JSON.parse(secret.SecretString!);
    cachedJwtSecret = secretData.JWT_SECRET;
    return cachedJwtSecret;
  } catch (error) {
    logger.error('Failed to get JWT secret', error);
    throw new Error('Authentication configuration error');
  }
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
  } catch (error) {
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

export function generateToken(payload: any, expiresIn: string = '24h'): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const jwtSecret = await getJwtSecret();
      const token = jwt.sign(payload, jwtSecret, { expiresIn });
      resolve(token);
    } catch (error) {
      reject(error);
    }
  });
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