// Password hashing service

import { hash, compare } from 'bcrypt';
import { logger } from '../utils/logger';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  try {
    const hashed = await hash(password, SALT_ROUNDS);
    return hashed;
  } catch (error) {
    logger.error('Password hashing failed', error);
    throw new Error('Failed to hash password');
  }
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    const isValid = await compare(password, hash);
    return isValid;
  } catch (error) {
    logger.error('Password verification failed', error);
    return false;
  }
}
