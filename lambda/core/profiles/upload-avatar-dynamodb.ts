import { APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { success, badRequest } from '../shared/utils/response';
import { logger } from '../shared/utils/logger';
import { UserRepository } from '../shared/repositories/user.repository';

const s3Client = new S3Client({});
const BUCKET_NAME = process.env.S3_BUCKET || 'handshake-uploads';
const userRepository = new UserRepository();

const uploadAvatarHandler = async (event: AuthenticatedEvent): Promise<APIGatewayProxyResult> => {
  const { userId } = event.auth;

  // Parse multipart form data (simplified - in production use multipart parser)
  const body = event.body;
  const isBase64 = event.isBase64Encoded;
  
  if (!body) {
    return badRequest('No file provided');
  }

  logger.info('Upload avatar request', { userId });

  // Generate unique filename
  const fileId = uuidv4();
  const fileName = `avatars/${userId}/${fileId}.jpg`;

  // Upload to S3
  const buffer = isBase64 ? Buffer.from(body, 'base64') : Buffer.from(body);
  
  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: buffer,
    ContentType: 'image/jpeg',
    ACL: 'public-read'
  }));

  const avatarUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${fileName}`;

  // Update user avatar
  await userRepository.update(userId, {
    avatar: avatarUrl
  });

  logger.info('Avatar uploaded successfully', { userId, avatarUrl });

  return success({
    message: 'Avatar uploaded successfully',
    avatar: avatarUrl
  });
};

export const handler = withErrorHandler(withAuth(uploadAvatarHandler));
