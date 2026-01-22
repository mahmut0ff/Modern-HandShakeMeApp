// List chat rooms Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

async function listRoomsHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('List chat rooms', { userId });
  
  const prisma = getPrismaClient();
  
  const rooms = await prisma.chatRoom.findMany({
    where: {
      participants: {
        some: { userId }
      }
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              role: true
            }
          }
        }
      },
      order: {
        select: {
          id: true,
          title: true
        }
      },
      project: {
        select: {
          id: true
        }
      },
      lastMessage: {
        select: {
          id: true,
          content: true,
          messageType: true,
          senderId: true,
          isRead: true,
          createdAt: true
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });
  
  logger.info('Chat rooms retrieved', { count: rooms.length });
  
  // Format rooms
  const formattedRooms = rooms.map(room => {
    // Get unread count for this user
    const unreadCount = room.participants.find(p => p.userId === userId)?.unreadCount || 0;
    
    return {
      id: room.id,
      participants: room.participants.map(p => ({
        id: p.id,
        user: {
          id: p.user.id,
          firstName: p.user.firstName,
          lastName: p.user.lastName,
          fullName: `${p.user.firstName} ${p.user.lastName}`,
          avatar: p.user.avatar,
          role: p.user.role
        },
        userId: p.userId,
        userFirstName: p.user.firstName,
        userLastName: p.user.lastName,
        userFullName: `${p.user.firstName} ${p.user.lastName}`,
        userAvatar: p.user.avatar,
        userRole: p.user.role,
        isOnline: p.isOnline,
        lastSeen: p.lastSeen,
        joinedAt: p.joinedAt
      })),
      order: room.order ? {
        id: room.order.id,
        title: room.order.title
      } : null,
      orderId: room.orderId,
      orderTitle: room.order?.title,
      project: room.project ? {
        id: room.project.id
      } : null,
      projectId: room.projectId,
      lastMessage: room.lastMessage ? {
        id: room.lastMessage.id,
        content: room.lastMessage.content,
        messageType: room.lastMessage.messageType,
        senderId: room.lastMessage.senderId,
        isRead: room.lastMessage.isRead,
        createdAt: room.lastMessage.createdAt
      } : null,
      unreadCount,
      isActive: room.isActive,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt
    };
  });
  
  return success({ results: formattedRooms });
}

export const handler = withErrorHandler(withRequestTransform(withAuth(listRoomsHandler)));
