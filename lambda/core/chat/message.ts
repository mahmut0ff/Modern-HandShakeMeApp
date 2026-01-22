// WebSocket message handler

import type { APIGatewayProxyWebsocketEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { z } from 'zod';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { getRedisClient } from '@/shared/cache/client';
import { getPrismaClient } from '@/shared/db/client';
import { validateSafe } from '@/shared/utils/validation';
import { logger } from '@/shared/utils/logger';

const apiGatewayClient = new ApiGatewayManagementApiClient({
  endpoint: process.env.WEBSOCKET_ENDPOINT,
});

const sendMessageSchema = z.object({
  action: z.literal('sendMessage'),
  roomId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  type: z.enum(['TEXT', 'IMAGE', 'FILE', 'VOICE']).default('TEXT'),
  replyTo: z.string().uuid().optional(),
});

const editMessageSchema = z.object({
  action: z.literal('editMessage'),
  messageId: z.string().uuid(),
  content: z.string().min(1).max(5000),
});

const deleteMessageSchema = z.object({
  action: z.literal('deleteMessage'),
  messageId: z.string().uuid(),
});

export async function handler(
  event: APIGatewayProxyWebsocketEventV2
): Promise<APIGatewayProxyResultV2> {
  const connectionId = event.requestContext.connectionId;
  const userId = event.requestContext.authorizer?.userId;
  
  if (!userId) {
    logger.error('Missing userId in authorizer context');
    return { statusCode: 401 };
  }
  
  logger.info('WebSocket message received', { connectionId, userId });
  
  try {
    const body = JSON.parse(event.body || '{}');
    const action = body.action;
    
    if (action === 'sendMessage') {
      return await handleSendMessage(body, userId, connectionId);
    } else if (action === 'editMessage') {
      return await handleEditMessage(body, userId, connectionId);
    } else if (action === 'deleteMessage') {
      return await handleDeleteMessage(body, userId, connectionId);
    }
    
    return { statusCode: 400, body: 'Invalid action' };
  } catch (error) {
    logger.error('WebSocket message handler failed', error, { connectionId, userId });
    return { statusCode: 500 };
  }
}

async function handleSendMessage(
  body: unknown,
  userId: string,
  _connectionId: string
): Promise<APIGatewayProxyResultV2> {
  const result = validateSafe(sendMessageSchema, body);
  
  if (!result.success) {
    return { statusCode: 400, body: 'Invalid message data' };
  }
  
  const { roomId, content, type, replyTo } = result.data;
  const prisma = getPrismaClient();
  
  // Verify user is participant in chat room
  const room = await prisma.chatRoom.findFirst({
    where: {
      id: roomId,
      participants: {
        some: { userId },
      },
    },
    include: {
      participants: {
        include: {
          user: true,
        },
      },
    },
  });
  
  if (!room) {
    return { statusCode: 403, body: 'Not a participant in this room' };
  }
  
  // Create message
  const message = await prisma.message.create({
    data: {
      roomId,
      senderId: userId,
      content,
      type,
      replyToId: replyTo,
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
      lastMessage: content,
    },
  });
  
  // Send message to all connected participants
  await broadcastToRoom(room.participants.map(p => p.userId), {
    type: 'message',
    data: message,
  });
  
  logger.info('Message sent', { messageId: message.id, roomId, userId });
  
  return { statusCode: 200 };
}

async function handleEditMessage(
  body: unknown,
  userId: string,
  _connectionId: string
): Promise<APIGatewayProxyResultV2> {
  const result = validateSafe(editMessageSchema, body);
  
  if (!result.success) {
    return { statusCode: 400, body: 'Invalid edit data' };
  }
  
  const { messageId, content } = result.data;
  const prisma = getPrismaClient();
  
  // Get message
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      room: {
        include: {
          participants: true,
        },
      },
    },
  });
  
  if (!message) {
    return { statusCode: 404, body: 'Message not found' };
  }
  
  // Verify user is sender
  if (message.senderId !== userId) {
    return { statusCode: 403, body: 'Not the message sender' };
  }
  
  // Check if message is within 15 minutes
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  if (message.createdAt < fifteenMinutesAgo) {
    return { statusCode: 403, body: 'Message edit window expired' };
  }
  
  // Update message
  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { 
      content,
      isEdited: true,
    },
  });
  
  // Broadcast update
  await broadcastToRoom(message.room.participants.map(p => p.userId), {
    type: 'messageEdited',
    data: updated,
  });
  
  logger.info('Message edited', { messageId, userId });
  
  return { statusCode: 200 };
}

async function handleDeleteMessage(
  body: unknown,
  userId: string,
  _connectionId: string
): Promise<APIGatewayProxyResultV2> {
  const result = validateSafe(deleteMessageSchema, body);
  
  if (!result.success) {
    return { statusCode: 400, body: 'Invalid delete data' };
  }
  
  const { messageId } = result.data;
  const prisma = getPrismaClient();
  
  // Get message
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      room: {
        include: {
          participants: true,
        },
      },
    },
  });
  
  if (!message) {
    return { statusCode: 404, body: 'Message not found' };
  }
  
  // Verify user is sender
  if (message.senderId !== userId) {
    return { statusCode: 403, body: 'Not the message sender' };
  }
  
  // Delete message
  await prisma.message.delete({
    where: { id: messageId },
  });
  
  // Broadcast deletion
  await broadcastToRoom(message.room.participants.map(p => p.userId), {
    type: 'messageDeleted',
    data: { messageId },
  });
  
  logger.info('Message deleted', { messageId, userId });
  
  return { statusCode: 200 };
}

async function broadcastToRoom(userIds: string[], message: unknown): Promise<void> {
  const redis = await getRedisClient();
  
  // Get all connection IDs for users
  const connectionIds: string[] = [];
  for (const userId of userIds) {
    const userConnections = await redis.sMembers(`ws:user:${userId}`);
    connectionIds.push(...userConnections);
  }
  
  // Send message to all connections
  const messageData = JSON.stringify(message);
  
  await Promise.allSettled(
    connectionIds.map(async (connectionId) => {
      try {
        await apiGatewayClient.send(
          new PostToConnectionCommand({
            ConnectionId: connectionId,
            Data: Buffer.from(messageData),
          })
        );
      } catch (error: any) {
        if (error.statusCode === 410) {
          // Connection is stale, remove from Redis
          logger.warn('Stale connection removed', { connectionId });
          const userId = await redis.get(`ws:connection:${connectionId}`);
          if (userId) {
            await redis.del(`ws:connection:${connectionId}`);
            await redis.sRem(`ws:user:${userId}`, connectionId);
          }
        } else {
          logger.error('Failed to send message to connection', error, { connectionId });
        }
      }
    })
  );
}
