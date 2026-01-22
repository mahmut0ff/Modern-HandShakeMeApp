// Send file message in chat

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { S3Service } from '@/shared/services/s3';
import { success, forbidden, notFound, badRequest } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { logger } from '@/shared/utils/logger';

const s3Service = new S3Service();

async function sendFileHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const roomId = event.pathParameters?.id;
  
  if (!roomId) {
    return notFound('Room ID is required');
  }
  
  if (!event.body || !event.isBase64Encoded) {
    return badRequest('File data is required');
  }
  
  logger.info('Send file message request', { userId, roomId });
  
  const prisma = getPrismaClient();
  
  // Check if user is participant
  const participant = await prisma.chatRoomParticipant.findFirst({
    where: {
      roomId,
      userId,
    },
  });
  
  if (!participant) {
    return forbidden('You are not a participant in this chat room');
  }
  
  // Upload file to S3
  const fileBuffer = Buffer.from(event.body, 'base64');
  const contentType = event.headers['content-type'] || 'application/octet-stream';
  const fileName = event.headers['x-file-name'] || `file-${Date.now()}`;
  const filePath = `chat/${roomId}/${Date.now()}-${userId}-${fileName}`;
  
  const fileUrl = await s3Service.uploadFile(
    filePath,
    fileBuffer,
    contentType
  );
  
  // Create message with file
  const message = await prisma.message.create({
    data: {
      roomId,
      senderId: userId,
      content: `[File: ${fileName}]`,
      messageType: 'FILE',
      fileUrl,
      fileName,
    },
    include: {
      sender: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
    },
  });
  
  // Update room last message
  await prisma.chatRoom.update({
    where: { id: roomId },
    data: {
      lastMessageAt: new Date(),
      lastMessage: `[File: ${fileName}]`,
    },
  });
  
  return success(message, { statusCode: 201 });
}

export const handler = withErrorHandler(withAuth(sendFileHandler));
