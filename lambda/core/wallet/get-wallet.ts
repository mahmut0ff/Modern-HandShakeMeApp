// Get wallet Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

async function getWalletHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Get wallet', { userId });
  
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
  
  logger.info('Wallet retrieved', { userId });
  
  // Format response
  const response = {
    id: wallet.id,
    user: wallet.userId,
    balance: wallet.balance.toString(),
    pendingBalance: wallet.pendingBalance.toString(),
    totalEarned: wallet.totalEarned.toString(),
    totalSpent: wallet.totalSpent.toString(),
    currency: wallet.currency,
    isActive: wallet.isActive,
    createdAt: wallet.createdAt,
    updatedAt: wallet.updatedAt
  };
  
  return success(response);
}

export const handler = withErrorHandler(withRequestTransform(withAuth(getWalletHandler)));
