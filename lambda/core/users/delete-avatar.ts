// Delete user avatar Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { success, notFound } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { withRequestTransform } from '../shared/middleware/requestTransform';
import { logger } from '../shared/utils/logger';
import { UserRepository } from '../shared/repositories/user.repository';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1'
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'handshake-uploads';

async function deleteAvatarHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Delete avatar request', { userId });
  
  const userRepository = new UserRepository();
  
  // Get current user and avatar
  const user = await userRepository.findById(userId);
  if (!user) {
    return notFound('User not found');
  }
  
  // Delete avatar from S3 if exists
  if (user.avatar) {
    try {
      // Extract S3 key from URL
      const url = new URL(user.avatar);
      const key = url.pathname.substring(1); // Remove leading slash
      
      await s3Client.send(new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      }));
      
      logger.info('Avatar deleted from S3', { userId, key });
    } catch (error: any) {
      logger.warn('Failed to delete avatar from S3', { userId, error: error.message });
      // Continue with database update even if S3 deletion fails
    }
  }
  
  // Remove avatar from database
  const updatedUser = await userRepository.update(userId, {
    avatar: null as any // Remove avatar field
  });
  
  logger.info('Avatar deleted successfully', { userId });
  
  const response = {
    message: 'Avatar deleted successfully',
    user: {
      id: updatedUser.id,
      first_name: updatedUser.firstName,
      last_name: updatedUser.lastName,
      avatar: null,
      updated_at: updatedUser.updatedAt
    }
  };
  
  return success(response);
}

export const handler = withErrorHandler(
  withRequestTransform(
    withAuth(deleteAvatarHandler)
  )
);