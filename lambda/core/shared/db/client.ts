// Prisma client singleton for Lambda functions

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Global variable to cache the Prisma client across Lambda invocations
let prisma: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    logger.info('Creating new Prisma client');
    
    prisma = new PrismaClient({
      log: process.env.LOG_LEVEL === 'debug' ? ['query', 'error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    // Handle Lambda shutdown
    process.on('beforeExit', async () => {
      logger.info('Disconnecting Prisma client');
      await prisma?.$disconnect();
    });
  }

  return prisma;
}

// Helper to execute queries with connection management
export async function withDatabase<T>(
  fn: (client: PrismaClient) => Promise<T>
): Promise<T> {
  const client = getPrismaClient();
  
  try {
    return await fn(client);
  } catch (error) {
    logger.error('Database operation failed', error);
    throw error;
  }
}
