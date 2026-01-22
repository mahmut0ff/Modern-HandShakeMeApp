// Upload user avatar Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { S3Service } from '@/shared/services/s3';
import { success, badRequest } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { logger } from '@/shared/utils/logger';

const s3Service = new S3Service();

async function uploadAvatarHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Upload avatar request', { userId });
  
  try {
    // Parse multipart form data
    const contentType = event.headers['content-type'] || event.headers['Content-Type'];
    
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return badRequest('Content-Type must be multipart/form-data');
    }
    
    // Extract file from body (base64 encoded)
    const body = event.isBase64Encoded 
      ? Buffer.from(event.body || '', 'base64')
      : event.body;
    
    if (!body) {
      return badRequest('No file provided');
    }
    
    // Upload to S3
    const fileName = `avatars/${userId}/${Date.now()}.jpg`;
    const fileUrl = await s3Service.uploadFile(fileName, body, 'image/jpeg');
    
    const prisma = getPrismaClient();
    
    // Delete old avatar if exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });
    
    if (user?.avatar) {
      try {
        await s3Service.deleteFile(user.avatar);
      } catch (error) {
        logger.warn('Failed to delete old avatar', { userId, error });
      }
    }
    
    // Update user avatar
    await prisma.user.update({
      where: { id: userId },
      data: { 
        avatar: fileUrl,
        updated_at: new Date(),
      },
    });
    
    logger.info('Avatar uploaded successfully', { userId, fileUrl });
    
    return success({
      message: 'Avatar uploaded successfully',
      avatar: fileUrl,
    });
  } catch (error) {
    logger.error('Avatar upload failed', { userId, error });
    return badRequest('Failed to upload avatar');
  }
}

export const handler = withErrorHandler(withAuth(uploadAvatarHandler));
