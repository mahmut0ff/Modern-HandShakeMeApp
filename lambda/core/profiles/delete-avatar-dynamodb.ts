import { APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { success, notFound } from '../shared/utils/response';
import { logger } from '../shared/utils/logger';
import { UserRepository } from '../shared/repositories/user.repository';

const s3Client = new S3Client({});
const BUCKET_NAME = process.env.S3_BUCKET || 'handshake-uploads';
const userRepository = new UserRepository();

const deleteAvatarHandler = async (event: AuthenticatedEvent): Promise<APIGatewayProxyResult> => {
  const { userId } = event.auth;

  logger.info('Delete avatar request', { userId });

  // Get current user
  const user = await userRepository.findById(userId);
  if (!user || !user.avatar) {
    return notFound('No avatar to delete');
  }

  // Extract S3 key from URL
  const avatarUrl = user.avatar;
  const key = avatarUrl.split('.com/')[1];

  // Delete from S3
  if (key) {
    await s3Client.send(new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    }));
  }

  // Update user
  await userRepository.update(userId, {
    avatar: null
  });

  logger.info('Avatar deleted successfully', { userId });

  return success({ message: 'Avatar deleted successfully' });
};

export const handler = withErrorHandler(withAuth(deleteAvatarHandler));
