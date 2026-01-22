// GDPR account deletion

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { logger } from '@/shared/utils/logger';

async function deleteAccountHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  logger.info('GDPR account deletion request', { userId });
  
  const prisma = getPrismaClient();
  
  // Use transaction for atomicity
  await prisma.$transaction(async (tx) => {
    // Anonymize reviews (keep for masters' ratings)
    await tx.review.updateMany({
      where: { reviewer: { userId } },
      data: {
        comment: '[Deleted User]',
      },
    });
    
    // Delete messages
    await tx.message.deleteMany({
      where: { senderId: userId },
    });
    
    // Delete notifications
    await tx.notification.deleteMany({
      where: { userId },
    });
    
    // Delete master profile if exists
    const masterProfile = await tx.masterProfile.findUnique({
      where: { userId },
    });
    
    if (masterProfile) {
      await tx.portfolioItem.deleteMany({
        where: { masterProfileId: masterProfile.id },
      });
      
      await tx.masterProfile.delete({
        where: { id: masterProfile.id },
      });
    }
    
    // Delete client profile if exists
    const clientProfile = await tx.clientProfile.findUnique({
      where: { userId },
    });
    
    if (clientProfile) {
      await tx.clientProfile.delete({
        where: { id: clientProfile.id },
      });
    }
    
    // Anonymize user data
    await tx.user.update({
      where: { id: userId },
      data: {
        email: `deleted_${userId}@deleted.com`,
        phone: null,
        firstName: 'Deleted',
        lastName: 'User',
        avatar: null,
        passwordHash: '',
        isBlocked: true,
      },
    });
  });
  
  logger.info('Account deleted', { userId });
  
  return success({ message: 'Account deleted successfully' });
}

export const handler = withErrorHandler(withAuth(deleteAccountHandler));
