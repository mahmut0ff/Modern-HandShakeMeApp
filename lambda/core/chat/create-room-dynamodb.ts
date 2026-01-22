import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { ChatRepository } from '../shared/repositories/chat.repository';
import { verifyToken } from '../shared/services/token';

const createRoomSchema = z.object({
  participantId: z.string(),
  projectId: z.string().optional(),
});

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const token = event.headers.Authorization?.replace('Bearer ', '');
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const decoded = verifyToken(token);
    const body = JSON.parse(event.body || '{}');
    const data = createRoomSchema.parse(body);

    const chatRepo = new ChatRepository();
    const room = await chatRepo.createRoom({
      participants: [decoded.userId, data.participantId],
      projectId: data.projectId,
    });

    return {
      statusCode: 201,
      body: JSON.stringify(room),
    };
  } catch (error: any) {
    console.error('Create room error:', error);
    return {
      statusCode: error.name === 'ZodError' ? 400 : 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
