// Send payment Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { TransactionRepository } from '../shared/repositories/transaction.repository';
import { success, badRequest } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { withRequestTransform } from '../shared/middleware/requestTransform';
import { logger } from '../shared/utils/logger';
import { z } from 'zod';

const sendPaymentSchema = z.object({
  recipient_id: z.string(),
  amount: z.number().positive(),
  description: z.string().optional(),
  order_id: z.string().optional(),
  project_id: z.string().optional(),
});

async function sendPaymentHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Send payment request', { userId });
  
  const body = JSON.parse(event.body || '{}');
  const validationResult = sendPaymentSchema.safeParse(body);
  
  if (!validationResult.success) {
    return badRequest('Invalid input data');
  }
  
  const { recipient_id, amount, description, order_id, project_id } = validationResult.data;
  
  const transactionRepo = new TransactionRepository();
  
  // Check sender balance
  const senderTransactions = await transactionRepo.findByUser(userId);
  let balance = 0;
  for (const txn of senderTransactions) {
    if (txn.status === 'COMPLETED') {
      const txAmount = txn.amount;
      if (txn.type === 'DEPOSIT' || txn.type === 'PAYMENT_RECEIVED' || txn.type === 'REFUND') {
        balance += txAmount;
      } else if (txn.type === 'WITHDRAWAL' || txn.type === 'PAYMENT_SENT' || txn.type === 'PAYMENT' || txn.type === 'COMMISSION') {
        balance -= txAmount;
      }
    }
  }
  
  if (balance < amount) {
    return badRequest('Insufficient balance');
  }
  
  // Create transaction for sender (debit)
  const senderTransaction = await transactionRepo.create({
    userId,
    type: 'PAYMENT_SENT',
    amount: amount,
    currency: 'KGS',
    status: 'COMPLETED',
    description: description || `Payment to user ${recipient_id}`,
    relatedObjectType: order_id ? 'ORDER' : project_id ? 'PROJECT' : undefined,
    relatedObjectId: order_id || project_id
  });
  
  // Create transaction for recipient (credit)
  const recipientTransaction = await transactionRepo.create({
    userId: recipient_id,
    type: 'PAYMENT_RECEIVED',
    amount: amount,
    currency: 'KGS',
    status: 'COMPLETED',
    description: description || `Payment from user ${userId}`,
    relatedObjectType: order_id ? 'ORDER' : project_id ? 'PROJECT' : undefined,
    relatedObjectId: order_id || project_id
  });
  
  logger.info('Payment sent successfully', { 
    userId, 
    recipientId: recipient_id, 
    amount 
  });
  
  return success({
    id: senderTransaction.id,
    transaction_type: 'payment',
    amount: amount,
    status: 'completed',
    recipient_id,
    created_at: senderTransaction.createdAt
  });
}

export const handler = withErrorHandler(
  withRequestTransform(
    withAuth(sendPaymentHandler)
  )
);
