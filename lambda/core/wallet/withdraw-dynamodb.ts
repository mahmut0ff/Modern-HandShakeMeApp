// Withdraw from wallet Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { TransactionRepository } from '../shared/repositories/transaction.repository';
import { success, badRequest } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { withRequestTransform } from '../shared/middleware/requestTransform';
import { logger } from '../shared/utils/logger';

const withdrawSchema = z.object({
  amount: z.number().positive(),
  paymentMethod: z.string(),
});

async function withdrawHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Withdraw request', { userId });
  
  const body = JSON.parse(event.body || '{}');
  const validationResult = withdrawSchema.safeParse(body);
  
  if (!validationResult.success) {
    return badRequest('Invalid input data');
  }
  
  const data = validationResult.data;
  
  // Check balance
  const transactionRepo = new TransactionRepository();
  const transactions = await transactionRepo.findByUser(userId);
  
  let balance = 0;
  for (const txn of transactions) {
    if (txn.status === 'COMPLETED') {
      const amount = txn.amount;
      if (txn.type === 'DEPOSIT' || txn.type === 'REFUND' || txn.type === 'PAYMENT_RECEIVED') {
        balance += amount;
      } else if (txn.type === 'WITHDRAWAL' || txn.type === 'PAYMENT' || txn.type === 'COMMISSION' || txn.type === 'PAYMENT_SENT') {
        balance -= amount;
      }
    }
  }
  
  if (balance < data.amount) {
    return badRequest(`Insufficient balance. Available: ${balance} KGS`);
  }
  
  const transaction = await transactionRepo.create({
    userId,
    type: 'WITHDRAWAL',
    amount: data.amount,
    currency: 'KGS',
    status: 'PENDING',
    description: 'Вывод средств',
    paymentMethod: data.paymentMethod,
  });
  
  logger.info('Withdrawal transaction created', { 
    userId, 
    transactionId: transaction.id,
    amount: data.amount 
  });
  
  // TODO: Integrate with payment provider
  // For now, just return pending transaction
  
  return success({
    id: transaction.id,
    type: transaction.type,
    amount: transaction.amount,
    currency: transaction.currency,
    status: transaction.status,
    description: transaction.description,
    payment_method: data.paymentMethod,
    created_at: transaction.createdAt,
  });
}

export const handler = withErrorHandler(
  withRequestTransform(
    withAuth(withdrawHandler)
  )
);
