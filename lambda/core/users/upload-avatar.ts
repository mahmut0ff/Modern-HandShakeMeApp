// Upload user avatar Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { success, badRequest, notFound } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { withRequestTransform } from '../shared/middleware/requestTransform';
import { logger } from '../shared/utils/logger';
import { UserRepository } from '../shared/repositories/user.repository';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1'
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'handshake-uploads';

async function uploadAvatarHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Upload avatar request', { userId });
  
  // Parse base64 encoded body
  if (!event.body) {
    return badRequest('No file provided');
  }
  
  let fileBuffer: Buffer;
  try {
    fileBuffer = event.isBase64Encoded 
      ? Buffer.from(event.body, 'base64')
      : Buffer.from(event.body, 'utf-8');
  } catch (error) {
    logger.error('Failed to parse file data', error);
    return badRequest('Invalid file data');
  }
  
  if (fileBuffer.length === 0) {
    return badRequest('Empty file provided');
  }
  
  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (fileBuffer.length > maxSize) {
    return badRequest('File size too large. Maximum 5MB allowed.');
  }
  
  // Validate file type (basic check)
  const contentType = event.headers['content-type'] || event.headers['Content-Type'] || 'image/jpeg';
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (!allowedTypes.some(type => contentType.includes(type))) {
    return badRequest('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
  }
  
  const userRepository = new UserRepository();
  
  // Get current user to check for existing avatar
  const user = await userRepository.findById(userId);
  if (!user) {
    return notFound('User not found');
  }
  
  // Delete old avatar if exists
  if (user.avatar) {
    try {
      // Extract S3 key from URL
      const url = new URL(user.avatar);
      const key = url.pathname.substring(1); // Remove leading slash
      
      await s3Client.send(new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      }));
      
      logger.info('Old avatar deleted', { userId, key });
    } catch (error: any) {
      logger.warn('Failed to delete old avatar', { userId, error: error.message });
      // Continue with upload even if deletion fails
    }
  }
  
  // Upload new avatar to S3
  const timestamp = Date.now();
  const extension = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
  const fileName = `${timestamp}.${extension}`;
  const key = `avatars/${userId}/${fileName}`;
  
  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      ACL: 'public-read',
      Metadata: {
        userId,
        uploadedAt: new Date().toISOString()
      }
    }));
    
    const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
    
    // Update user avatar in database
    const updatedUser = await userRepository.update(userId, {
      avatar: fileUrl
    });
    
    logger.info('Avatar uploaded successfully', { userId, fileUrl });
    
    const response = {
      message: 'Avatar uploaded successfully',
      avatar: fileUrl,
      user: {
        id: updatedUser.id,
        first_name: updatedUser.firstName,
        last_name: updatedUser.lastName,
        avatar: updatedUser.avatar,
        updated_at: updatedUser.updatedAt
      }
    };
    
    return success(response);
  } catch (error) {
    logger.error('Avatar upload failed', error);
    return badRequest('Failed to upload avatar to S3');
  }
}

export const handler = withErrorHandler(
  withRequestTransform(
    withAuth(uploadAvatarHandler)
  )
);