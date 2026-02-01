// Unified WebSocket handler for chat

import type { APIGatewayProxyWebsocketEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { ChatRepository } from '../shared/repositories/chat.repository';
import { validateSafe } from '../shared/utils/validation';
import { logger } from '../shared/utils/logger';
import { z } from 'zod';
import {
  WebSocketMessage,
  SendMessageData,
  EditMessageData,
  DeleteMessageData,
  TypingData,
  MarkReadData,
  BroadcastMessage,
} from '../shared/types/chat';

const chatRepository = new ChatRepository();

const apiGatewayClient = new ApiGatewayManagementApiClient({
  endpoint: process.env.WEBSOCKET_ENDPOINT,
});

// Validation schemas
const sendMessageSchema = z.object({
  roomId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  type: z.enum(['TEXT', 'IMAGE', 'FILE', 'VOICE']).default('TEXT'),
  replyToId: z.string().uuid().optional(),
});

const editMessageSchema = z.object({
  messageId: z.string().uuid(),
  content: z.string().min(1).max(5000),
});

const deleteMessageSchema = z.object({
  messageId: z.string().uuid(),
});

const typingSchema = z.object({
  roomId: z.string().uuid(),
  isTyping: z.boolean(),
});

const markReadSchema = z.object({
  messageId: z.string().uuid().optional(),
  roomId: z.string().uuid().optional(),
});

export async function handleConnect(
  event: APIGatewayProxyWebsocketEventV2
): Promise<APIGatewayProxyResultV2> {
  const connectionId = event.requestContext.connectionId;
  const userId = event.requestContext.authorizer?.userId;
  
  if (!userId) {
    logger.error('Missing userId in authorizer context', { connectionId });
    return { statusCode: 401 };
  }
  
  logger.info('WebSocket connection request', { connectionId, userId });
  
  try {
    // Store connection
    await chatRepository.createConnection(connectionId, userId);
    
    logger.info('WebSocket connected successfully', { connectionId, userId });
    return { statusCode: 200 };
  } catch (error) {
    logger.error('WebSocket connection failed', error, { connectionId, userId });
    return { statusCode: 500 };
  }
}

export async function handleDisconnect(
  event: APIGatewayProxyWebsocketEventV2
): Promise<APIGatewayProxyResultV2> {
  const connectionId = event.requestContext.connectionId;
  
  logger.info('WebSocket disconnect request', { connectionId });
  
  try {
    // Get connection to find user
    const connection = await chatRepository.findConnection(connectionId);
    
    if (connection) {
      // Remove connection
      await chatRepository.deleteConnection(connectionId);
      
      // Check if user has other connections
      const userConnections = await chatRepository.findUserConnections(connection.userId);
      
      // If no more connections, broadcast user offline status
      if (userConnections.length === 0) {
        await broadcastUserStatus(connection.userId, false);
      }
      
      logger.info('WebSocket disconnected successfully', { 
        connectionId, 
        userId: connection.userId 
      });
    }
    
    return { statusCode: 200 };
  } catch (error) {
    logger.error('WebSocket disconnect failed', error, { connectionId });
    return { statusCode: 500 };
  }
}

export async function handleMessage(
  event: APIGatewayProxyWebsocketEventV2
): Promise<APIGatewayProxyResultV2> {
  const connectionId = event.requestContext.connectionId;
  const userId = event.requestContext.authorizer?.userId;
  
  if (!userId) {
    logger.error('Missing userId in authorizer context', { connectionId });
    return { statusCode: 401 };
  }
  
  logger.info('WebSocket message received', { connectionId, userId });
  
  try {
    // Update connection ping
    await chatRepository.updateConnectionPing(connectionId);
    
    const body = JSON.parse(event.body || '{}') as WebSocketMessage;
    const { action, data } = body;
    
    switch (action) {
      case 'sendMessage':
        return await handleSendMessage(data, userId);
      case 'editMessage':
        return await handleEditMessage(data, userId);
      case 'deleteMessage':
        return await handleDeleteMessage(data, userId);
      case 'typing':
        return await handleTyping(data, userId);
      case 'markRead':
        return await handleMarkRead(data, userId);
      default:
        logger.warn('Unknown WebSocket action', { action, connectionId });
        return { statusCode: 400, body: 'Invalid action' };
    }
  } catch (error) {
    logger.error('WebSocket message handler failed', error, { connectionId, userId });
    return { statusCode: 500 };
  }
}

async function handleSendMessage(
  data: SendMessageData,
  userId: string
): Promise<APIGatewayProxyResultV2> {
  const result = validateSafe(sendMessageSchema, data);
  
  if (!result.success) {
    logger.warn('Invalid send message data', { errors: result.error.errors });
    return { statusCode: 400, body: 'Invalid message data' };
  }
  
  const { roomId, content, type, replyToId } = result.data;
  
  // Verify user is participant in chat room
  const room = await chatRepository.findRoomById(roomId);
  if (!room) {
    return { statusCode: 404, body: 'Room not found' };
  }
  
  if (!room.participants.includes(userId)) {
    return { statusCode: 403, body: 'Not a participant in this room' };
  }
  
  // Create message
  const message = await chatRepository.createMessage({
    roomId,
    senderId: userId,
    content,
    type,
    replyToId,
  });
  
  // Update room last message
  await chatRepository.updateRoom(roomId, {
    lastMessageAt: message.createdAt,
    lastMessage: content,
  });
  
  // Broadcast message to all participants
  await broadcastToRoom(room.participants, {
    type: 'message',
    data: {
      ...message,
      sender: {
        id: userId,
        firstName: 'User', // Will be populated by service layer
        lastName: '',
        avatar: undefined,
      },
    },
  });
  
  logger.info('Message sent successfully', { messageId: message.id, roomId, userId });
  return { statusCode: 200 };
}

async function handleEditMessage(
  data: EditMessageData,
  userId: string
): Promise<APIGatewayProxyResultV2> {
  const result = validateSafe(editMessageSchema, data);
  
  if (!result.success) {
    logger.warn('Invalid edit message data', { errors: result.error.errors });
    return { statusCode: 400, body: 'Invalid edit data' };
  }
  
  const { messageId, content } = result.data;
  
  // Find message by scanning (we need roomId for the key)
  // This is a limitation - we should store messageId -> roomId mapping
  // For now, we'll need the client to send roomId as well
  logger.warn('Edit message requires roomId - not implemented yet');
  return { statusCode: 501, body: 'Edit message not fully implemented' };
}

async function handleDeleteMessage(
  data: DeleteMessageData,
  userId: string
): Promise<APIGatewayProxyResultV2> {
  const result = validateSafe(deleteMessageSchema, data);
  
  if (!result.success) {
    logger.warn('Invalid delete message data', { errors: result.error.errors });
    return { statusCode: 400, body: 'Invalid delete data' };
  }
  
  // Same issue as edit - need roomId
  logger.warn('Delete message requires roomId - not implemented yet');
  return { statusCode: 501, body: 'Delete message not fully implemented' };
}

async function handleTyping(
  data: TypingData,
  userId: string
): Promise<APIGatewayProxyResultV2> {
  const result = validateSafe(typingSchema, data);
  
  if (!result.success) {
    logger.warn('Invalid typing data', { errors: result.error.errors });
    return { statusCode: 400, body: 'Invalid typing data' };
  }
  
  const { roomId, isTyping } = result.data;
  
  // Verify user is participant
  const room = await chatRepository.findRoomById(roomId);
  if (!room || !room.participants.includes(userId)) {
    return { statusCode: 403, body: 'Not a participant in this room' };
  }
  
  // Broadcast typing indicator to other participants
  const otherParticipants = room.participants.filter(id => id !== userId);
  await broadcastToRoom(otherParticipants, {
    type: 'typing',
    data: {
      roomId,
      userId,
      isTyping,
    },
  });
  
  logger.info('Typing indicator sent', { userId, roomId, isTyping });
  return { statusCode: 200 };
}

async function handleMarkRead(
  data: MarkReadData,
  userId: string
): Promise<APIGatewayProxyResultV2> {
  const result = validateSafe(markReadSchema, data);
  
  if (!result.success) {
    logger.warn('Invalid mark read data', { errors: result.error.errors });
    return { statusCode: 400, body: 'Invalid mark read data' };
  }
  
  const { messageId, roomId } = result.data;
  
  if (messageId && roomId) {
    // Mark specific message as read
    await chatRepository.markMessageRead(roomId, messageId, userId);
  } else if (roomId) {
    // Mark entire room as read
    await chatRepository.markRoomRead(roomId, userId);
  } else {
    return { statusCode: 400, body: 'Either messageId+roomId or roomId is required' };
  }
  
  logger.info('Messages marked as read', { userId, messageId, roomId });
  return { statusCode: 200 };
}

async function broadcastToRoom(userIds: string[], message: BroadcastMessage): Promise<void> {
  // Get all connection IDs for users
  const connectionIds: string[] = [];
  
  for (const userId of userIds) {
    const userConnections = await chatRepository.findUserConnections(userId);
    connectionIds.push(...userConnections.map(conn => conn.connectionId));
  }
  
  if (connectionIds.length === 0) {
    logger.info('No active connections to broadcast to');
    return;
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
          // Connection is stale, remove it
          logger.warn('Stale connection removed', { connectionId });
          await chatRepository.deleteConnection(connectionId);
        } else {
          logger.error('Failed to send message to connection', error, { connectionId });
        }
      }
    })
  );
}

async function broadcastUserStatus(userId: string, isOnline: boolean): Promise<void> {
  // This would broadcast to all rooms where user is a participant
  // For now, just log it
  logger.info('User status changed', { userId, isOnline });
}