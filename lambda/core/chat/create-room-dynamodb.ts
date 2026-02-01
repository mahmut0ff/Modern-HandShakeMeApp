// Create chat room

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { ChatRepository } from '../shared/repositories/chat.repository';
import { withAuth } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { success, badRequest } from '../shared/utils/response';
import { logger } from '../shared/utils/logger';

const createRoomSchema = z.object({
  participantId: z.string().uuid(),
  projectId: z.string().uuid().optional(),
});

async function createRoomHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const userId = (event.requestContext as any).authorizer?.userId;
  
  if (!userId) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const data = createRoomSchema.parse(body);

    const chatRepo = new ChatRepository();
    
    // Check if room already exists between these participants
    const existingRooms = await chatRepo.findRoomsByUser(userId);
    const existingRoom = existingRooms.find(room => 
      room.participants.includes(data.participantId) && 
      room.participants.length === 2
    );
    
    if (existingRoom) {
      logger.info('Returning existing room', { roomId: existingRoom.id, userId });
      return success(existingRoom);
    }

    const room = await chatRepo.createRoom({
      participants: [userId, data.participantId],
      projectId: data.projectId,
    });

    logger.info('Chat room created', { roomId: room.id, userId });
    return success(room, { statusCode: 201 });
  } catch (error: any) {
    logger.error('Create room error', error);
    
    if (error.name === 'ZodError') {
      return badRequest('Invalid request data');
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

export const handler = withErrorHandler(withAuth(createRoomHandler));
