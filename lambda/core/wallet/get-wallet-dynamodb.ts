// Get wallet balance Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { TransactionRepository } from '../shared/repositories/transaction.repository';
import { success } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { withRequestTransform } from '../shared/middleware/requestTransform';
import { logger } from '../shared/utils/logger';

async function getWalletHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Get wallet request', { userId });
  
  const transactionRepo = new TransactionRepository();
  const transactions = await transactionRepo.findByUser(userId);
  
  // Calculate balance
  let balance = 0;
  let totalEarned = 0;
  let totalSpent = 0;
  let reserved = 0;
  
  for (const txn of transactions) {
    const amount = txn.amount;
    
    if (txn.status === 'COMPLETED') {
      if (txn.type === 'DEPOSIT' || txn.type === 'REFUND' || txn.type === 'PAYMENT_RECEIVED') {
        balance += amount;
        totalEarned += amount;
      } else if (txn.type === 'WITHDRAWAL' || txn.type === 'PAYMENT' || txn.type === 'COMMISSION' || txn.type === 'PAYMENT_SENT') {
        balance -= amount;
        totalSpent += amount;
      }
    } else if (txn.status === 'RESERVED') {
      reserved += amount;
    }
  }
  
  const available = Math.max(0, balance - reserved);
  
  logger.info('Wallet balance calculated', { 
    userId, 
    balance, 
    reserved, 
    available 
  });
  
  return success({
    balance: Math.round(balance * 100) / 100,
    reserved: Math.round(reserved * 100) / 100,
    available: Math.round(available * 100) / 100,
    currency: 'KGS',
    userId,
    statistics: {
      totalEarned: Math.round(totalEarned * 100) / 100,
      totalSpent: Math.round(totalSpent * 100) / 100,
    },
  });
}

export const handler = withErrorHandler(
  withRequestTransform(
    withAuth(getWalletHandler)
  )
);
