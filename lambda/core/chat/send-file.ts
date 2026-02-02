// Send file message in chat

import type { APIGatewayProxyResult } from 'aws-lambda';
import { ChatRepository } from '../shared/repositories/chat.repository';
import { S3Service } from '../shared/services/s3';
import { success, forbidden, notFound, badRequest } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { logger } from '../shared/utils/logger';

const s3Service = new S3Service();
const chatRepository = new ChatRepository();

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
  
  // Check if user is participant
  const room = await chatRepository.findRoomById(roomId);
  if (!room) {
    return notFound('Room not found');
  }
  
  if (!room.participants.includes(userId)) {
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
  const message = await chatRepository.createMessage({
    roomId,
    senderId: userId,
    content: `[File: ${fileName}]`,
    type: 'FILE',
    fileUrl,
    fileName,
    fileSize: fileBuffer.length,
  });
  
  // Update room last message
  await chatRepository.updateRoom(roomId, {
    lastMessageAt: message.createdAt,
    lastMessage: `[File: ${fileName}]`,
  });
  
  logger.info('File message sent', { messageId: message.id, roomId, fileName });
  return success(message, 201);
}

export const handler = withErrorHandler(withAuth(sendFileHandler));
