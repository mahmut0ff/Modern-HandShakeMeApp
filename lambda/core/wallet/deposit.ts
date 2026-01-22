// Deposit to wallet Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { getPrismaClient } from '@/shared/db/client';
import { success, badRequest, notFound } from '@/shared/utils/response';
import { validateSafe } from '@/shared/utils/validation';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

const depositSchema = z.object({
  amount: z.number().positive().max(1000000),
  paymentMethodId: z.number().int().positive().optional(),
  paymentMethodType: z.enum(['card', 'bank_account', 'mobile_money']).optional(),
  returnUrl: z.string().url().optional()
});

async function depositHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Deposit request', { userId });
  
  const body = JSON.parse(event.body || '{}');
  const result = validateSafe(depositSchema, body);
  
  if (!result.success) {
    return badRequest('Invalid request data');
  }
  
  const data = result.data;
  
  const prisma = getPrismaClient();
  
  // Get or create wallet
  let wallet = await prisma.wallet.findUnique({
    where: { userId }
  });
  
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        userId,
        balance: 0,
        pendingBalance: 0,
        totalEarned: 0,
        totalSpent: 0,
        currency: 'KGS',
        isActive: true
      }
    });
  }
  
  // Check minimum deposit
  const minDeposit = 100;
  if (data.amount < minDeposit) {
    return badRequest(`Minimum deposit amount is ${minDeposit} KGS`);
  }
  
  // Get payment method if specified
  let paymentMethod = null;
  if (data.paymentMethodId) {
    paymentMethod = await prisma.paymentMethod.findUnique({
      where: { id: data.paymentMethodId }
    });
    
    if (!paymentMethod) {
      return notFound('Payment method not found');
    }
    
    if (paymentMethod.userId !== userId) {
      return badRequest('Payment method does not belong to you');
    }
  }
  
  // Create deposit transaction
  const transaction = await prisma.transaction.create({
    data: {
      walletId: wallet.id,
      transactionType: 'DEPOSIT',
      amount: data.amount,
      currency: wallet.currency,
      status: 'PENDING',
      description: 'Deposit to wallet',
      paymentMethod: paymentMethod?.methodType || data.paymentMethodType || 'CARD',
      paymentDetails: paymentMethod?.details || {}
    }
  });
  
  logger.info('Deposit transaction created', { transactionId: transaction.id, amount: data.amount });
  
  // In real implementation, this would integrate with payment gateway
  // For now, return mock payment URL
  const paymentUrl = `https://payment-gateway.example.com/pay/${transaction.id}`;
  
  // Format response
  const response = {
    transaction: {
      id: transaction.id,
      wallet: transaction.walletId,
      transactionType: transaction.transactionType,
      amount: transaction.amount.toString(),
      currency: transaction.currency,
      status: transaction.status,
      description: transaction.description,
      paymentMethod: transaction.paymentMethod,
      createdAt: transaction.createdAt
    },
    paymentUrl,
    paymentData: {
      transactionId: transaction.id,
      amount: data.amount,
      currency: wallet.currency,
      returnUrl: data.returnUrl
    }
  };
  
  return success(response, { statusCode: 201 });
}

export const handler = withErrorHandler(withRequestTransform(withAuth(depositHandler)));
