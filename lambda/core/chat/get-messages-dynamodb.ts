import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ChatRepository } from '../shared/repositories/chat.repository';
import { verifyToken } from '../shared/services/token';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const token = event.headers.Authorization?.replace('Bearer ', '');
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const decoded = verifyToken(token);
    const roomId = event.pathParameters?.roomId;

    if (!roomId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Room ID required' }) };
    }

    const chatRepo = new ChatRepository();
    const room = await chatRepo.findRoomById(roomId);

    if (!room) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Room not found' }) };
    }

    if (!room.participants.includes(decoded.userId)) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) };
    }

    const messages = await chatRepo.findMessages(roomId);

    return {
      statusCode: 200,
      body: JSON.stringify(messages),
    };
  } catch (error: any) {
    console.error('Get messages error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
