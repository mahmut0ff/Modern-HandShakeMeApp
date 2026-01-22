// Get current user Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { logger } from '@/shared/utils/logger';

async function getCurrentUserHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Get current user request', { userId });
  
  const prisma = getPrismaClient();
  
  // Get user with profile information
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      phone: true,
      role: true,
      firstName: true,
      lastName: true,
      avatar: true,
      isPhoneVerified: true,
      twoFactorEnabled: true,
      lastSeen: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  
  if (!user) {
    logger.warn('User not found', { userId });
    return success(null, 404);
  }
  
  logger.info('Current user retrieved successfully', { userId });
  
  // Format response to match mobile app expectations
  const response = {
    id: user.id,
    phone: user.phone,
    role: user.role.toLowerCase(),
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`,
    avatar: user.avatar,
    isPhoneVerified: user.isPhoneVerified,
    twoFactorEnabled: user.twoFactorEnabled || false,
    lastSeen: user.lastSeen?.toISOString(),
    createdAt: user.createdAt.toISOString(),
  };
  
  return success(response);
}

export const handler = withErrorHandler(withAuth(getCurrentUserHandler));