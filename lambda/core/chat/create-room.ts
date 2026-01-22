// Create chat room Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { getPrismaClient } from '@/shared/db/client';
import { success, badRequest, notFound, conflict } from '@/shared/utils/response';
import { validateSafe } from '@/shared/utils/validation';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

const createRoomSchema = z.object({
  participants: z.array(z.string()).min(1).max(10),
  order: z.number().int().positive().optional(),
  project: z.number().int().positive().optional()
});

async function createRoomHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Create chat room', { userId });
  
  const body = JSON.parse(event.body || '{}');
  const result = validateSafe(createRoomSchema, body);
  
  if (!result.success) {
    return badRequest('Invalid request data');
  }
  
  const data = result.data;
  
  // Add current user to participants if not included
  const participantIds = [...new Set([userId, ...data.participants])];
  
  if (participantIds.length < 2) {
    return badRequest('At least 2 participants required');
  }
  
  const prisma = getPrismaClient();
  
  // Check if room already exists with same participants
  if (participantIds.length === 2) {
    const existingRoom = await prisma.chatRoom.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: participantIds[0] } } },
          { participants: { some: { userId: participantIds[1] } } },
          { participants: { none: { userId: { notIn: participantIds } } } }
        ]
      }
    });
    
    if (existingRoom) {
      return conflict('Chat room already exists');
    }
  }
  
  // Verify all participants exist
  const users = await prisma.user.findMany({
    where: { id: { in: participantIds } },
    select: { id: true, firstName: true, lastName: true, avatar: true, role: true }
  });
  
  if (users.length !== participantIds.length) {
    return notFound('One or more participants not found');
  }
  
  // Verify order/project if specified
  if (data.order) {
    const order = await prisma.order.findUnique({
      where: { id: data.order }
    });
    
    if (!order) {
      return notFound('Order not found');
    }
  }
  
  if (data.project) {
    const project = await prisma.project.findUnique({
      where: { id: data.project }
    });
    
    if (!project) {
      return notFound('Project not found');
    }
  }
  
  // Create room
  const room = await prisma.chatRoom.create({
    data: {
      orderId: data.order,
      projectId: data.project,
      isActive: true,
      participants: {
        create: participantIds.map(id => ({
          userId: id,
          isOnline: false,
          unreadCount: 0
        }))
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
      }
    }
  });
  
  logger.info('Chat room created', { roomId: room.id });
  
  // Format response
  const response = {
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
      isOnline: p.isOnline,
      lastSeen: p.lastSeen,
      joinedAt: p.joinedAt
    })),
    order: room.order ? {
      id: room.order.id,
      title: room.order.title
    } : null,
    project: room.project ? {
      id: room.project.id
    } : null,
    isActive: room.isActive,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt
  };
  
  return success(response, { statusCode: 201 });
}

export const handler = withErrorHandler(withRequestTransform(withAuth(createRoomHandler)));
