// WebSocket message handler

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { getPrismaClient } from '@/shared/db/client';
import { success } from '@/shared/utils/response';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { logger } from '@/shared/utils/logger';

async function websocketMessageHandler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const connectionId = event.requestContext.connectionId;
  const domainName = event.requestContext.domainName;
  const stage = event.requestContext.stage;
  
  if (!connectionId) {
    logger.error('No connection ID provided');
    return { statusCode: 400, body: 'Bad Request' };
  }
  
  logger.info('WebSocket message received', { connectionId });
  
  const prisma = getPrismaClient();
  
  try {
    // Parse message
    const body = JSON.parse(event.body || '{}');
    const { action, data } = body;
    
    // Get sender connection
    const senderConnection = await prisma.webSocketConnection.findUnique({
      where: { connectionId },
    });
    
    if (!senderConnection) {
      logger.warn('Connection not found', { connectionId });
      return { statusCode: 404, body: 'Connection not found' };
    }
    
    const senderId = senderConnection.userId;
    
    // Handle different message actions
    switch (action) {
      case 'sendMessage':
        await handleSendMessage(senderId, data, domainName, stage, prisma);
        break;
        
      case 'typing':
        await handleTyping(senderId, data, domainName, stage, prisma);
        break;
        
      case 'readMessage':
        await handleReadMessage(senderId, data, prisma);
        break;
        
      default:
        logger.warn('Unknown action', { action });
        return { statusCode: 400, body: 'Unknown action' };
    }
    
    return success({ message: 'Message processed' });
  } catch (error) {
    logger.error('WebSocket message handling failed', { connectionId, error });
    return { statusCode: 500, body: 'Internal Server Error' };
  }
}

async function handleSendMessage(
  senderId: string,
  data: any,
  domainName: string,
  stage: string,
  prisma: any
) {
  const { roomId, content, type = 'TEXT', replyTo } = data;
  
  // Create message
  const message = await prisma.message.create({
    data: {
      roomId,
      senderId,
      content,
      type,
      replyTo,
    },
    include: {
      sender: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          avatar: true,
        },
      },
    },
  });
  
  // Get room participants
  const room = await prisma.chatRoom.findUnique({
    where: { id: roomId },
    include: {
      participants: true,
    },
  });
  
  if (!room) {
    logger.warn('Room not found', { roomId });
    return;
  }
  
  // Send message to all participants
  const apiGateway = new ApiGatewayManagementApiClient({
    endpoint: `https://${domainName}/${stage}`,
  });
  
  const messageData = {
    action: 'newMessage',
    data: {
      id: message.id,
      room_id: message.roomId,
      sender: {
        id: message.sender.id,
        name: `${message.sender.first_name} ${message.sender.last_name}`,
        avatar: message.sender.avatar,
      },
      content: message.content,
      type: message.type,
      reply_to: message.replyTo,
      created_at: message.createdAt.toISOString(),
    },
  };
  
  for (const participant of room.participants) {
    if (participant.userId === senderId) continue;
    
    // Get participant connections
    const connections = await prisma.webSocketConnection.findMany({
      where: { userId: participant.userId },
    });
    
    for (const conn of connections) {
      try {
        await apiGateway.send(
          new PostToConnectionCommand({
            ConnectionId: conn.connectionId,
            Data: Buffer.from(JSON.stringify(messageData)),
          })
        );
      } catch (error) {
        logger.error('Failed to send message to connection', { 
          connectionId: conn.connectionId, 
          error 
        });
        
        // Remove stale connection
        await prisma.webSocketConnection.delete({
          where: { connectionId: conn.connectionId },
        });
      }
    }
  }
  
  logger.info('Message sent successfully', { messageId: message.id, roomId });
}

async function handleTyping(
  senderId: string,
  data: any,
  domainName: string,
  stage: string,
  prisma: any
) {
  const { roomId, isTyping } = data;
  
  // Get room participants
  const room = await prisma.chatRoom.findUnique({
    where: { id: roomId },
    include: {
      participants: true,
    },
  });
  
  if (!room) {
    logger.warn('Room not found', { roomId });
    return;
  }
  
  // Send typing indicator to all participants
  const apiGateway = new ApiGatewayManagementApiClient({
    endpoint: `https://${domainName}/${stage}`,
  });
  
  const typingData = {
    action: 'typing',
    data: {
      room_id: roomId,
      user_id: senderId,
      is_typing: isTyping,
    },
  };
  
  for (const participant of room.participants) {
    if (participant.userId === senderId) continue;
    
    const connections = await prisma.webSocketConnection.findMany({
      where: { userId: participant.userId },
    });
    
    for (const conn of connections) {
      try {
        await apiGateway.send(
          new PostToConnectionCommand({
            ConnectionId: conn.connectionId,
            Data: Buffer.from(JSON.stringify(typingData)),
          })
        );
      } catch (error) {
        logger.error('Failed to send typing indicator', { 
          connectionId: conn.connectionId, 
          error 
        });
      }
    }
  }
  
  logger.info('Typing indicator sent', { senderId, roomId, isTyping });
}

async function handleReadMessage(
  userId: string,
  data: any,
  prisma: any
) {
  const { messageId } = data;
  
  // Mark message as read
  await prisma.messageRead.upsert({
    where: {
      messageId_userId: {
        messageId,
        userId,
      },
    },
    create: {
      messageId,
      userId,
      readAt: new Date(),
    },
    update: {
      readAt: new Date(),
    },
  });
  
  logger.info('Message marked as read', { messageId, userId });
}

export const handler = withErrorHandler(websocketMessageHandler);
