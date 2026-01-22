// Send image message in chat

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { S3Service } from '@/shared/services/s3';
import { success, forbidden, notFound, badRequest } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { logger } from '@/shared/utils/logger';

const s3Service = new S3Service();

async function sendImageHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const roomId = event.pathParameters?.id;
  
  if (!roomId) {
    return notFound('Room ID is required');
  }
  
  if (!event.body || !event.isBase64Encoded) {
    return badRequest('Image data is required');
  }
  
  logger.info('Send image message request', { userId, roomId });
  
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
  
  // Upload image to S3
  const imageBuffer = Buffer.from(event.body, 'base64');
  const contentType = event.headers['content-type'] || 'image/jpeg';
  const fileExtension = contentType.split('/')[1] || 'jpg';
  const fileName = `chat/${roomId}/${Date.now()}-${userId}.${fileExtension}`;
  
  const imageUrl = await s3Service.uploadFile(
    fileName,
    imageBuffer,
    contentType
  );
  
  // Create message with image
  const message = await prisma.message.create({
    data: {
      roomId,
      senderId: userId,
      content: '[Image]',
      messageType: 'IMAGE',
      imageUrl,
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
      lastMessage: '[Image]',
    },
  });
  
  return success(message, { statusCode: 201 });
}

export const handler = withErrorHandler(withAuth(sendImageHandler));
