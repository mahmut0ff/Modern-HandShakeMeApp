// Update user profile Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success, badRequest } from '@/shared/utils/response';
import { userUpdateSchema, validateSafe } from '@/shared/utils/validation';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

async function updateUserHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Update user profile', { userId });
  
  const body = JSON.parse(event.body || '{}');
  const result = validateSafe(userUpdateSchema, body);
  
  if (!result.success) {
    return badRequest('Invalid request data');
  }
  
  const data = result.data;
  
  const prisma = getPrismaClient();
  
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.firstName && { firstName: data.firstName }),
      ...(data.lastName && { lastName: data.lastName }),
      ...(data.phone && { phone: data.phone }),
      ...(data.avatar && { avatar: data.avatar })
    },
    select: {
      id: true,
      email: true,
      phone: true,
      role: true,
      firstName: true,
      lastName: true,
      avatar: true,
      isVerified: true,
      createdAt: true
    },
  });
  
  logger.info('User profile updated', { userId });
  
  return success(user);
}

export const handler = withErrorHandler(withRequestTransform(withAuth(updateUserHandler)));
