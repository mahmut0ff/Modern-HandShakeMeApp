import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { createResponse, createErrorResponse } from '@/shared/utils/response';
import { validateInput } from '@/shared/utils/validation';
import { requireAuth } from '@/shared/middleware/auth';
import { CacheService } from '@/shared/services/cache';
import { NotificationService } from '@/shared/services/notification';

const prisma = new PrismaClient();
const cache = new CacheService();
const notificationService = new NotificationService();

// Validation schema
const updateDisputeStatusSchema = z.object({
  disputeId: z.string().uuid('Invalid dispute ID'),
  status: z.enum(['IN_REVIEW', 'RESOLVED', 'CLOSED']),
  resolution: z.enum(['FULL_REFUND', 'PARTIAL_REFUND', 'PAY_MASTER', 'NO_ACTION']).optional(),
  resolutionNotes: z.string().max(1000, 'Resolution notes too long').optional(),
  refundAmount: z.number().positive('Refund amount must be positive').optional()
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await requireAuth()(event);

    // Only admins can update dispute status
    if (user.role !== 'ADMIN') {
      return createErrorResponse(403, 'FORBIDDEN', 'Only administrators can update dispute status');
    }

    const body = JSON.parse(event.body || '{}');
    const validatedData = validateInput(updateDisputeStatusSchema)(body);

    // Validate resolution data
    if (validatedData.status === 'RESOLVED') {
      if (!validatedData.resolution) {
        return createErrorResponse(400, 'VALIDATION_ERROR', 'Resolution is required when resolving a dispute');
      }
      
      if (['FULL_REFUND', 'PARTIAL_REFUND'].includes(validatedData.resolution) && !validatedData.refundAmount) {
        return createErrorResponse(400, 'VALIDATION_ERROR', 'Refund amount is required for refund resolutions');
      }
    }

    // Check if dispute exists
    const dispute = await prisma.dispute.findUnique({
      where: { id: validatedData.disputeId },
      include: {
        project: {
          include: {
            order: {
              select: {
                title: true,
                clientId: true,
                masterId: true
              }
            }
          }
        }
      }
    });

    if (!dispute) {
      return createErrorResponse(404, 'NOT_FOUND', 'Dispute not found');
    }

    // Check if status transition is valid
    const validTransitions = {
      'OPEN': ['IN_REVIEW', 'CLOSED'],
      'IN_REVIEW': ['RESOLVED', 'CLOSED'],
      'RESOLVED': ['CLOSED'],
      'CLOSED': []
    };

    if (!validTransitions[dispute.status].includes(validatedData.status)) {
      return createErrorResponse(400, 'VALIDATION_ERROR', 
        `Cannot transition from ${dispute.status} to ${validatedData.status}`);
    }

    // Update dispute
    const updatedDispute = await prisma.dispute.update({
      where: { id: validatedData.disputeId },
      data: {
        status: validatedData.status,
        resolution: validatedData.resolution,
        resolutionNotes: validatedData.resolutionNotes,
        refundAmount: validatedData.refundAmount,
        resolvedAt: validatedData.status === 'RESOLVED' ? new Date() : undefined,
        resolvedById: validatedData.status === 'RESOLVED' ? user.userId : undefined
      }
    });

    // Add timeline entry
    let timelineDescription = '';
    switch (validatedData.status) {
      case 'IN_REVIEW':
        timelineDescription = 'Dispute is now under review by administration';
        break;
      case 'RESOLVED':
        timelineDescription = `Dispute resolved: ${validatedData.resolution}`;
        if (validatedData.refundAmount) {
          timelineDescription += ` (Amount: ${validatedData.refundAmount})`;
        }
        break;
      case 'CLOSED':
        timelineDescription = 'Dispute closed';
        break;
    }

    await prisma.disputeTimeline.create({
      data: {
        disputeId: validatedData.disputeId,
        action: `STATUS_CHANGED_${validatedData.status}`,
        description: timelineDescription,
        userId: user.userId
      }
    });

    // Process resolution if dispute is resolved
    if (validatedData.status === 'RESOLVED' && validatedData.resolution) {
      await processDisputeResolution(dispute, validatedData);
    }

    // Notify involved parties
    const notifications = [];
    
    // Notify client
    notifications.push(notificationService.sendNotification({
      userId: dispute.clientId,
      type: 'DISPUTE_STATUS_UPDATED',
      title: 'Обновление статуса спора',
      message: getStatusUpdateMessage(validatedData.status, validatedData.resolution),
      data: {
        disputeId: dispute.id,
        status: validatedData.status,
        resolution: validatedData.resolution,
        refundAmount: validatedData.refundAmount
      }
    }));

    // Notify master
    notifications.push(notificationService.sendNotification({
      userId: dispute.masterId,
      type: 'DISPUTE_STATUS_UPDATED',
      title: 'Обновление статуса спора',
      message: getStatusUpdateMessage(validatedData.status, validatedData.resolution),
      data: {
        disputeId: dispute.id,
        status: validatedData.status,
        resolution: validatedData.resolution,
        refundAmount: validatedData.refundAmount
      }
    }));

    await Promise.all(notifications);

    // Invalidate cache
    await cache.invalidatePattern(`disputes:*`);
    await cache.invalidatePattern(`dispute:${validatedData.disputeId}*`);

    console.log(`Dispute status updated: ${validatedData.disputeId} to ${validatedData.status} by admin ${user.userId}`);

    return createResponse(200, {
      disputeId: updatedDispute.id,
      status: updatedDispute.status,
      resolution: updatedDispute.resolution,
      resolutionNotes: updatedDispute.resolutionNotes,
      refundAmount: updatedDispute.refundAmount ? Number(updatedDispute.refundAmount) : null,
      resolvedAt: updatedDispute.resolvedAt?.toISOString(),
      resolvedBy: updatedDispute.resolvedById,
      message: 'Dispute status updated successfully'
    });

  } catch (error) {
    console.error('Error updating dispute status:', error);
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(400, 'VALIDATION_ERROR', error.errors[0].message);
    }
    
    if (error.name === 'UnauthorizedError') {
      return createErrorResponse(401, 'UNAUTHORIZED', error.message);
    }

    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to update dispute status');
  } finally {
    await prisma.$disconnect();
  }
};

async function processDisputeResolution(dispute: any, resolutionData: any) {
  // Process financial resolution
  switch (resolutionData.resolution) {
    case 'FULL_REFUND':
    case 'PARTIAL_REFUND':
      // Create refund transaction
      await prisma.transaction.create({
        data: {
          projectId: dispute.projectId,
          userId: dispute.clientId,
          transactionType: 'REFUND',
          status: 'PENDING',
          amount: resolutionData.refundAmount
        }
      });
      break;
      
    case 'PAY_MASTER':
      // Release payment to master
      await prisma.transaction.create({
        data: {
          projectId: dispute.projectId,
          userId: dispute.masterId,
          transactionType: 'PAYMENT',
          status: 'PENDING',
          amount: resolutionData.refundAmount || 0
        }
      });
      break;
  }
}

function getStatusUpdateMessage(status: string, resolution?: string): string {
  switch (status) {
    case 'IN_REVIEW':
      return 'Ваш спор принят к рассмотрению администрацией';
    case 'RESOLVED':
      switch (resolution) {
        case 'FULL_REFUND':
          return 'Спор решен в вашу пользу. Полный возврат средств';
        case 'PARTIAL_REFUND':
          return 'Спор решен. Частичный возврат средств';
        case 'PAY_MASTER':
          return 'Спор решен в пользу мастера. Оплата переведена мастеру';
        case 'NO_ACTION':
          return 'Спор решен. Никаких действий не требуется';
        default:
          return 'Спор решен администрацией';
      }
    case 'CLOSED':
      return 'Спор закрыт';
    default:
      return 'Статус спора обновлен';
  }
}