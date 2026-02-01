// Deposit to wallet Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { TransactionRepository } from '../shared/repositories/transaction.repository';
import { success, badRequest } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { withRequestTransform } from '../shared/middleware/requestTransform';
import { logger } from '../shared/utils/logger';

const depositSchema = z.object({
  amount: z.number().positive(),
  paymentMethod: z.string(),
});

async function depositHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Deposit request', { userId });
  
  const body = JSON.parse(event.body || '{}');
  const validationResult = depositSchema.safeParse(body);
  
  if (!validationResult.success) {
    return badRequest('Invalid input data');
  }
  
  const data = validationResult.data;
  
  const transactionRepo = new TransactionRepository();
  const transaction = await transactionRepo.create({
    userId,
    type: 'DEPOSIT',
    amount: data.amount,
    currency: 'KGS',
    status: 'PENDING',
    description: 'Пополнение кошелька',
    paymentMethod: data.paymentMethod,
  });
  
  logger.info('Deposit transaction created', { userId, transactionId: transaction.id });
  
  // TODO: Integrate with payment provider (Kaspi, CloudPayments, etc.)
  // For now, just return pending transaction
  
  return success({
    id: transaction.id,
    type: transaction.type,
    amount: transaction.amount,
    currency: transaction.currency,
    status: transaction.status,
    description: transaction.description,
    created_at: transaction.createdAt,
  });
}

export const handler = withErrorHandler(
  withRequestTransform(
    withAuth(depositHandler)
  )
);
