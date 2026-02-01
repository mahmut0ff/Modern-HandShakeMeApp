// Get wallet statistics Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { TransactionRepository } from '../shared/repositories/transaction.repository';
import { success } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { withRequestTransform } from '../shared/middleware/requestTransform';
import { logger } from '../shared/utils/logger';

async function getWalletStatsHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const params = event.queryStringParameters || {};
  const { period = 'month' } = params;
  
  logger.info('Get wallet stats request', { userId, period });
  
  const transactionRepo = new TransactionRepository();
  const transactions = await transactionRepo.findByUser(userId);
  
  // Calculate date range
  const now = new Date();
  let startDate: Date;
  
  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  
  // Calculate statistics
  let totalEarned = 0;
  let totalSpent = 0;
  let pendingEarnings = 0;
  let thisMonthEarnings = 0;
  let thisMonthSpending = 0;
  
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  transactions.forEach(t => {
    const amount = t.amount;
    const txDate = new Date(t.createdAt);
    
    if (t.type === 'DEPOSIT' || t.type === 'PAYMENT_RECEIVED' || t.type === 'REFUND') {
      if (t.status === 'COMPLETED') {
        totalEarned += amount;
        if (txDate >= monthStart) {
          thisMonthEarnings += amount;
        }
      } else if (t.status === 'PENDING') {
        pendingEarnings += amount;
      }
    } else if (t.type === 'WITHDRAWAL' || t.type === 'PAYMENT_SENT' || t.type === 'PAYMENT' || t.type === 'COMMISSION') {
      if (t.status === 'COMPLETED') {
        totalSpent += amount;
        if (txDate >= monthStart) {
          thisMonthSpending += amount;
        }
      }
    }
  });
  
  logger.info('Wallet stats calculated', { 
    userId, 
    totalEarned, 
    totalSpent 
  });
  
  return success({
    total_earned: Math.round(totalEarned * 100) / 100,
    total_spent: Math.round(totalSpent * 100) / 100,
    pending_earnings: Math.round(pendingEarnings * 100) / 100,
    this_month_earnings: Math.round(thisMonthEarnings * 100) / 100,
    this_month_spending: Math.round(thisMonthSpending * 100) / 100,
    transactions_count: transactions.length,
    period,
  });
}

export const handler = withErrorHandler(
  withRequestTransform(
    withAuth(getWalletStatsHandler)
  )
);
