// Withdraw from wallet Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { getPrismaClient } from '@/shared/db/client';
import { success, badRequest, notFound, forbidden } from '@/shared/utils/response';
import { validateSafe } from '@/shared/utils/validation';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

const withdrawSchema = z.object({
  amount: z.number().positive().max(100000),
  paymentMethodId: z.number().int().positive(),
  description: z.string().max(500).optional()
});

async function withdrawHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Withdraw request', { userId });
  
  const body = JSON.parse(event.body || '{}');
  const result = validateSafe(withdrawSchema, body);
  
  if (!result.success) {
    return badRequest('Invalid request data');
  }
  
  const data = result.data;
  
  const prisma = getPrismaClient();
  
  // Get wallet
  const wallet = await prisma.wallet.findUnique({
    where: { userId }
  });
  
  if (!wallet) {
    return notFound('Wallet not found');
  }
  
  // Check minimum withdrawal
  const minWithdrawal = 100;
  if (data.amount < minWithdrawal) {
    return badRequest(`Minimum withdrawal amount is ${minWithdrawal} KGS`);
  }
  
  // Calculate fee
  const feePercentage = 0.02; // 2%
  const minFee = 10;
  const maxFee = 500;
  const fee = Math.max(minFee, Math.min(maxFee, data.amount * feePercentage));
  const totalDeduction = data.amount + fee;
  
  // Check balance
  const availableBalance = parseFloat(wallet.balance.toString()) - parseFloat(wallet.pendingBalance.toString());
  
  if (availableBalance < totalDeduction) {
    return badRequest(`Insufficient balance. Available: ${availableBalance} KGS, Required: ${totalDeduction} KGS`);
  }
  
  // Get payment method
  const paymentMethod = await prisma.paymentMethod.findUnique({
    where: { id: data.paymentMethodId }
  });
  
  if (!paymentMethod) {
    return notFound('Payment method not found');
  }
  
  // Verify payment method belongs to user
  if (paymentMethod.userId !== userId) {
    return forbidden('Payment method does not belong to you');
  }
  
  // Create withdrawal transaction
  const transaction = await prisma.transaction.create({
    data: {
      walletId: wallet.id,
      transactionType: 'WITHDRAWAL',
      amount: data.amount,
      currency: wallet.currency,
      status: 'PENDING',
      description: data.description || 'Withdrawal request',
      paymentMethod: paymentMethod.methodType,
      paymentDetails: paymentMethod.details,
      feeAmount: fee,
      netAmount: data.amount
    }
  });
  
  // Update wallet pending balance
  await prisma.wallet.update({
    where: { id: wallet.id },
    data: {
      pendingBalance: {
        increment: totalDeduction
      }
    }
  });
  
  logger.info('Withdrawal created', { transactionId: transaction.id, amount: data.amount });
  
  // Format response
  const response = {
    id: transaction.id,
    wallet: transaction.walletId,
    transactionType: transaction.transactionType,
    amount: transaction.amount.toString(),
    currency: transaction.currency,
    status: transaction.status,
    description: transaction.description,
    paymentMethod: transaction.paymentMethod,
    feeAmount: transaction.feeAmount?.toString(),
    netAmount: transaction.netAmount?.toString(),
    createdAt: transaction.createdAt
  };
  
  return success(response, { statusCode: 201 });
}

export const handler = withErrorHandler(withRequestTransform(withAuth(withdrawHandler)));
