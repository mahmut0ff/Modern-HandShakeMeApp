// Get wallet transaction history Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { logger } from '@/shared/utils/logger';

async function getTransactionHistoryHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const params = event.queryStringParameters || {};
  const { 
    page = '1', 
    limit = '20',
    type,
    status,
  } = params;
  
  logger.info('Get transaction history request', { userId });
  
  const prisma = getPrismaClient();
  
  // Build where clause
  const where: any = {
    userId,
  };
  
  if (type) {
    where.type = type.toUpperCase();
  }
  
  if (status) {
    where.status = status.toUpperCase();
  }
  
  // Pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;
  
  // Get transactions
  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limitNum,
    }),
    prisma.transaction.count({ where }),
  ]);
  
  logger.info('Transaction history retrieved successfully', { 
    userId, 
    count: transactions.length,
    total,
  });
  
  // Format response
  const response = transactions.map(transaction => ({
    id: transaction.id,
    type: transaction.type.toLowerCase(),
    amount: transaction.amount.toString(),
    currency: transaction.currency,
    status: transaction.status.toLowerCase(),
    description: transaction.description,
    reference: transaction.reference,
    created_at: transaction.createdAt.toISOString(),
    completed_at: transaction.completedAt?.toISOString(),
  }));
  
  return success({
    results: response,
    count: total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
  });
}

export const handler = withErrorHandler(withAuth(getTransactionHistoryHandler));
