// Get client profile by ID

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success, notFound } from '@/shared/utils/response';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

async function getClientHandler(
  event: any
): Promise<APIGatewayProxyResult> {
  const clientId = event.pathParameters?.id;
  
  if (!clientId) {
    return notFound('Client ID is required');
  }
  
  logger.info('Get client profile request', { clientId });
  
  const prisma = getPrismaClient();
  
  const user = await prisma.user.findUnique({
    where: { id: clientId },
    include: {
      clientProfile: true,
    },
  });
  
  if (!user || user.role !== 'CLIENT') {
    return notFound('Client not found');
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

export const handler = withErrorHandler(withRequestTransform(getClientHandler));
