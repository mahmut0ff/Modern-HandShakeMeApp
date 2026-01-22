// Upload user avatar

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { S3Service } from '@/shared/services/s3';
import { getPrismaClient } from '@/shared/db/client';
import { success } from '@/shared/utils/response';
import { validate } from '@/shared/utils/validation';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { logger } from '@/shared/utils/logger';

const uploadAvatarSchema = z.object({
  fileName: z.string(),
  fileType: z.string(),
});

async function uploadAvatarHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  logger.info('Upload avatar request', { userId });
  
  const body = JSON.parse(event.body || '{}');
  const data = validate(uploadAvatarSchema, body);
  
  const s3Service = new S3Service('avatars');
  
  // Generate presigned URL for upload
  const key = `${userId}/${Date.now()}-${data.fileName}`;
  const uploadUrl = await s3Service.getPresignedUploadUrl(key, data.fileType);
  
  // Generate public URL
  const publicUrl = s3Service.getPublicUrl(key);
  
  // Update user avatar in database
  const prisma = getPrismaClient();
  await prisma.user.update({
    where: { id: userId },
    data: { avatar: publicUrl },
  });
  
  logger.info('Avatar upload URL generated', { userId, key });
  
  return success({
    uploadUrl,
    publicUrl,
  });
}

export const handler = withErrorHandler(withAuth(uploadAvatarHandler));
