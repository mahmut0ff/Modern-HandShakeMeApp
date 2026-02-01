// Send image message in chat

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ChatRepository } from '../shared/repositories/chat.repository';
import { withAuth } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { success, badRequest, notFound, forbidden } from '../shared/utils/response';
import { logger } from '../shared/utils/logger';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({});
const BUCKET_NAME = process.env.S3_BUCKET || 'handshake-uploads';
const chatRepository = new ChatRepository();

async function sendImageHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const userId = (event.requestContext as any).authorizer?.userId;
  
  if (!userId) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const roomId = event.pathParameters?.id;
  if (!roomId) {
    return badRequest('Room ID is required');
  }

  const body = event.body;
  const isBase64 = event.isBase64Encoded;
  
  if (!body) {
    return badRequest('No image provided');
  }

  try {
    // Verify user is participant
    const room = await chatRepository.findRoomById(roomId);
    if (!room) {
      return notFound('Room not found');
    }
    
    if (!room.participants.includes(userId)) {
      return forbidden('You are not a participant in this room');
    }

    // Generate unique filename
    const fileId = uuidv4();
    const fileName = `chat/${roomId}/${fileId}.jpg`;

    // Upload to S3
    const buffer = isBase64 ? Buffer.from(body, 'base64') : Buffer.from(body);
    
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: 'image/jpeg',
      ACL: 'public-read'
    }));

    const imageUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${fileName}`;

    // Create message with image
    const message = await chatRepository.createMessage({
      roomId,
      senderId: userId,
      type: 'IMAGE',
      content: imageUrl,
      fileUrl: imageUrl,
      fileName: `${fileId}.jpg`,
      fileSize: buffer.length,
    });

    // Update room last message
    await chatRepository.updateRoom(roomId, {
      lastMessageAt: message.createdAt,
      lastMessage: '[Image]',
    });

    logger.info('Image message sent', { messageId: message.id, roomId, userId });

    return success({
      id: message.id,
      room: roomId,
      sender_id: userId,
      message_type: 'image',
      image_url: imageUrl,
      created_at: message.createdAt
    });
  } catch (error) {
    logger.error('Send image error', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

export const handler = withErrorHandler(withAuth(sendImageHandler));
