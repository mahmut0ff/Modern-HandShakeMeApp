import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { success, badRequest, forbidden } from '@/shared/utils/response';
import { validate } from '@/shared/utils/validation';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { CacheService } from '@/shared/services/cache';
import { NotificationService } from '@/shared/services/notification';

const prisma = new PrismaClient();
const cache = new CacheService();
const notificationService = new NotificationService();

// Validation schema
const createDisputeSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  reason: z.enum([
    'QUALITY_ISSUES',
    'PAYMENT_DISPUTE',
    'COMMUNICATION_PROBLEMS',
    'DEADLINE_MISSED',
    'SCOPE_DISAGREEMENT',
    'CANCELLATION_REQUEST',
    'OTHER'
  ], {
    errorMap: () => ({ message: 'Invalid dispute reason' })
  }),
  description: z.string().min(20, 'Description must be at least 20 characters').max(1000, 'Description too long'),
  evidence: z.array(z.object({
    type: z.enum(['IMAGE', 'DOCUMENT', 'VIDEO']),
    url: z.string().url('Invalid evidence URL'),
    description: z.string().max(200, 'Evidence description too long').optional()
  })).max(10, 'Maximum 10 evidence items allowed').optional()
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Authenticate user
    const user = await requireAuth()(event);

    // Parse and validate request body
    const body = JSON.parse(event.body || '{}');
    const validatedData = validateInput(createDisputeSchema)(body);

    // Check if order exists and user is involved
    const order = await prisma.order.findUnique({
      where: { id: validatedData.orderId },
      include: {
        client: {
          select: { id: true, firstName: true, lastName: true }
        },
        master: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    if (!order) {
      return createErrorResponse(404, 'NOT_FOUND', 'Order not found');
    }

    // Verify user is involved in the order
    const isClient = order.clientId === user.userId;
    const isMaster = order.masterId === user.userId;
    
    if (!isClient && !isMaster) {
      return createErrorResponse(403, 'FORBIDDEN', 'You are not involved in this order');
    }

    // Check if dispute already exists for this order
    const existingDispute = await prisma.dispute.findFirst({
      where: { orderId: validatedData.orderId }
    });

    if (existingDispute) {
      return createErrorResponse(409, 'CONFLICT', 'Dispute already exists for this order');
    }

    // Check if order is in a state that allows disputes
    const allowedStatuses = ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!allowedStatuses.includes(order.status)) {
      return createErrorResponse(400, 'VALIDATION_ERROR', 
        'Disputes can only be created for accepted, in-progress, completed, or cancelled orders');
    }

    // Create the dispute
    const dispute = await prisma.dispute.create({
      data: {
        orderId: validatedData.orderId,
        clientId: order.clientId,
        masterId: order.masterId,
        createdBy: user.userId,
        reason: validatedData.reason,
        description: validatedData.description,
        status: 'OPEN'
      }
    });

    // Add evidence if provided
    if (validatedData.evidence && validatedData.evidence.length > 0) {
      await prisma.disputeEvidence.createMany({
        data: validatedData.evidence.map(evidence => ({
          disputeId: dispute.id,
          type: evidence.type,
          url: evidence.url,
          description: evidence.description,
          uploadedBy: user.userId
        }))
      });
    }

    // Create initial timeline entry
    await prisma.disputeTimeline.create({
      data: {
        disputeId: dispute.id,
        action: 'DISPUTE_CREATED',
        description: `Dispute created by ${isClient ? 'client' : 'master'}: ${validatedData.reason}`,
        userId: user.userId
      }
    });

    // Notify the other party
    const otherPartyId = isClient ? order.masterId : order.clientId;
    const otherPartyName = isClient ? 
      `${order.master?.firstName} ${order.master?.lastName}` :
      `${order.client?.firstName} ${order.client?.lastName}`;

    await notificationService.sendNotification({
      userId: otherPartyId,
      type: 'DISPUTE_CREATED',
      title: 'Новый спор',
      message: `Создан спор по заказу "${order.title}"`,
      data: {
        disputeId: dispute.id,
        orderId: order.id,
        reason: validatedData.reason
      }
    });

    // Notify admin/support team
    await notificationService.sendAdminNotification({
      type: 'DISPUTE_CREATED',
      title: 'Новый спор требует рассмотрения',
      message: `Спор создан по заказу "${order.title}" (${dispute.id})`,
      data: {
        disputeId: dispute.id,
        orderId: order.id,
        reason: validatedData.reason,
        createdBy: user.userId
      }
    });

    // Invalidate cache
    await cache.invalidatePattern(`disputes:${user.userId}*`);
    await cache.invalidatePattern(`order:${validatedData.orderId}*`);

    // Log dispute creation
    console.log(`Dispute created: ${dispute.id} for order ${validatedData.orderId} by user ${user.userId}`);

    return createResponse(201, {
      id: dispute.id,
      orderId: dispute.orderId,
      reason: dispute.reason,
      description: dispute.description,
      status: dispute.status,
      createdBy: dispute.createdBy,
      createdAt: dispute.createdAt.toISOString(),
      evidence: validatedData.evidence || [],
      timeline: [{
        action: 'DISPUTE_CREATED',
        description: `Dispute created by ${isClient ? 'client' : 'master'}: ${validatedData.reason}`,
        userId: user.userId,
        createdAt: new Date().toISOString()
      }]
    });

  } catch (error) {
    console.error('Error creating dispute:', error);
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(400, 'VALIDATION_ERROR', error.errors[0].message);
    }
    
    if (error.name === 'UnauthorizedError') {
      return createErrorResponse(401, 'UNAUTHORIZED', error.message);
    }

    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to create dispute');
  } finally {
    await prisma.$disconnect();
  }
};