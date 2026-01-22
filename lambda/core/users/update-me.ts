// Update current user Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success, badRequest } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { logger } from '@/shared/utils/logger';
import { z } from 'zod';

const updateUserSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  twoFactorEnabled: z.boolean().optional(),
});

async function updateCurrentUserHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Update current user request', { userId });
  
  const body = JSON.parse(event.body || '{}');
  
  try {
    const data = updateUserSchema.parse(body);
    
    const prisma = getPrismaClient();
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        twoFactorEnabled: data.twoFactorEnabled,
        updatedAt: new Date(),
      },
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
    
    logger.info('User updated successfully', { userId });
    
    // Format response to match mobile app expectations
    const response = {
      id: updatedUser.id,
      phone: updatedUser.phone,
      role: updatedUser.role.toLowerCase(),
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      fullName: `${updatedUser.firstName} ${updatedUser.lastName}`,
      avatar: updatedUser.avatar,
      isPhoneVerified: updatedUser.isPhoneVerified,
      twoFactorEnabled: updatedUser.twoFactorEnabled || false,
      lastSeen: updatedUser.lastSeen?.toISOString(),
      createdAt: updatedUser.createdAt.toISOString(),
    };
    
    return success(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Validation error', { userId, errors: error.errors });
      return badRequest(error.errors[0].message);
    }
    throw error;
  }
}

export const handler = withErrorHandler(withAuth(updateCurrentUserHandler));