// Get wallet transactions Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { getPrismaClient } from '@/shared/db/client';
import { paginated } from '@/shared/utils/response';
import { paginationSchema, validateSafe } from '@/shared/utils/validation';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

const filterSchema = paginationSchema.extend({
  transactionType: z.enum(['deposit', 'withdrawal', 'payment', 'refund', 'commission', 'bonus', 'penalty']).optional(),
  status: z.enum(['pending', 'completed', 'failed', 'cancelled']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

async function getTransactionsHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Get transactions', { userId });
  
  const result = validateSafe(filterSchema, event.queryStringParameters || {});
  
  if (!result.success) {
    return paginated([], 0, 1, 20);
  }
  
  const { page, page_size, transactionType, status, dateFrom, dateTo } = result.data;
  
  const prisma = getPrismaClient();
  
  // Build where clause
  const where: any = {
    wallet: {
      userId
    }
  };
  
  if (transactionType) {
    where.transactionType = transactionType.toUpperCase();
  }
  
  if (status) {
    where.status = status.toUpperCase();
  }
  
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) {
      where.createdAt.gte = new Date(dateFrom);
    }
    if (dateTo) {
      where.createdAt.lte = new Date(dateTo);
    }
  }
  
  // Get total count
  const total = await prisma.transaction.count({ where });
  
  // Get transactions
  const transactions = await prisma.transaction.findMany({
    where,
    skip: (page - 1) * page_size,
    take: page_size,
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  logger.info('Transactions retrieved', { count: transactions.length });
  
  // Format transactions
  const formattedTransactions = transactions.map(transaction => ({
    id: transaction.id,
    wallet: transaction.walletId,
    transactionType: transaction.transactionType,
    amount: transaction.amount.toString(),
    currency: transaction.currency,
    status: transaction.status,
    description: transaction.description,
    referenceId: transaction.referenceId,
    relatedObjectType: transaction.relatedObjectType,
    relatedObjectId: transaction.relatedObjectId,
    paymentMethod: transaction.paymentMethod,
    paymentDetails: transaction.paymentDetails,
    feeAmount: transaction.feeAmount?.toString(),
    netAmount: transaction.netAmount?.toString(),
    createdAt: transaction.createdAt,
    completedAt: transaction.completedAt,
    failedAt: transaction.failedAt
  }));
  
  return paginated(formattedTransactions, total, page, page_size);
}

export const handler = withErrorHandler(withRequestTransform(withAuth(getTransactionsHandler)));
