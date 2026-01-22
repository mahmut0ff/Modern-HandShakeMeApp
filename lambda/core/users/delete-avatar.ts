// Delete user avatar Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { S3Service } from '@/shared/services/s3';
import { success } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { logger } from '@/shared/utils/logger';

const s3Service = new S3Service();

async function deleteAvatarHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Delete avatar request', { userId });
  
  const prisma = getPrismaClient();
  
  // Get current avatar
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatar: true },
  });
  
  if (user?.avatar) {
    try {
      await s3Service.deleteFile(user.avatar);
    } catch (error) {
      logger.warn('Failed to delete avatar from S3', { userId, error });
    }
  }
  
  // Remove avatar from database
  await prisma.user.update({
    where: { id: userId },
    data: { 
      avatar: null,
      updated_at: new Date(),
    },
  });
  
  logger.info('Avatar deleted successfully', { userId });
  
  return success({
    message: 'Avatar deleted successfully',
  });
}

export const handler = withErrorHandler(withAuth(deleteAvatarHandler));
