// Get transactions Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { TransactionRepository } from '../shared/repositories/transaction.repository';
import { success } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { withRequestTransform } from '../shared/middleware/requestTransform';
import { logger } from '../shared/utils/logger';

async function getTransactionsHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const params = event.queryStringParameters || {};
  const { type, status, limit = '50' } = params;
  
  logger.info('Get transactions request', { userId, type, status });
  
  const transactionRepo = new TransactionRepository();
  let transactions = await transactionRepo.findByUser(userId);
  
  // Filter by type if provided
  if (type) {
    transactions = transactions.filter(t => t.type === type.toUpperCase());
  }
  
  // Filter by status if provided
  if (status) {
    transactions = transactions.filter(t => t.status === status.toUpperCase());
  }
  
  // Sort by date (newest first)
  transactions.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  // Limit results
  const limitNum = parseInt(limit);
  if (limitNum > 0) {
    transactions = transactions.slice(0, limitNum);
  }
  
  logger.info('Transactions retrieved successfully', { 
    userId, 
    count: transactions.length 
  });
  
  return success(transactions);
}

export const handler = withErrorHandler(
  withRequestTransform(
    withAuth(getTransactionsHandler)
  )
);
