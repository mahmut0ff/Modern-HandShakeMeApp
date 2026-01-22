import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { ChatRepository } from '../shared/repositories/chat.repository';
import { verifyToken } from '../shared/services/token';

const sendMessageSchema = z.object({
  roomId: z.string(),
  content: z.string().min(1).max(5000),
  type: z.enum(['TEXT', 'IMAGE', 'FILE']).optional(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
});

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const token = event.headers.Authorization?.replace('Bearer ', '');
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const decoded = verifyToken(token);
    const body = JSON.parse(event.body || '{}');
    const data = sendMessageSchema.parse(body);

    const chatRepo = new ChatRepository();
    const room = await chatRepo.findRoomById(data.roomId);

    if (!room) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Room not found' }) };
    }

    if (!room.participants.includes(decoded.userId)) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) };
    }

    const message = await chatRepo.createMessage({
      ...data,
      senderId: decoded.userId,
    });

    // Update room last message
    await chatRepo.updateRoom(data.roomId, {
      lastMessageAt: message.createdAt,
      lastMessage: data.content,
    });

    return {
      statusCode: 201,
      body: JSON.stringify(message),
    };
  } catch (error: any) {
    console.error('Send message error:', error);
    return {
      statusCode: error.name === 'ZodError' ? 400 : 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
