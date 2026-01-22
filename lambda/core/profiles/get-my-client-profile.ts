// Get current user's client profile

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success, forbidden } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

async function getMyClientProfileHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  if (event.auth.role !== 'CLIENT') {
    return forbidden('Only clients can access this endpoint');
  }
  
  logger.info('Get my client profile request', { userId });
  
  const prisma = getPrismaClient();
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      clientProfile: true,
    },
  });
  
  if (!user) {
    return forbidden('User not found');
  }
  
  const clientData = {
    id: user.id,
    phone: user.phone,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`,
    avatar: user.avatar,
    isPhoneVerified: user.isPhoneVerified,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
    profile: user.clientProfile,
  };
  
  return success(clientData);
}

export const handler = withErrorHandler(withRequestTransform(withAuth(getMyClientProfileHandler)));
