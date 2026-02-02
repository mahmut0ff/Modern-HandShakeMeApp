// @ts-nocheck
// Close dispute

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { DisputesRepository } from '../shared/repositories/disputes.repository';
import { withAuth } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { success, badRequest, notFound, forbidden } from '../shared/utils/response';
import { validate } from '../shared/utils/validation';
import { logger } from '../shared/utils/logger';

const disputesRepository = new DisputesRepository();

// Validation schema
const closeDisputeSchema = z.object({
  resolution: z.string().max(1000, 'Resolution too long').optional(),
  resolutionType: z.enum(['AUTOMATIC', 'MEDIATED', 'ADMIN_DECISION', 'MUTUAL_AGREEMENT']).optional()
});

async function closeDisputeHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const userId = (event.requestContext as any).authorizer?.userId;
  const userRole = (event.requestContext as any).authorizer?.role;
  
  if (!userId) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const disputeId = event.pathParameters?.id;
  if (!disputeId) {
    return badRequest('Dispute ID is required');
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const data = validate(closeDisputeSchema, body);

    // Get dispute
    const dispute = await disputesRepository.findDisputeById(disputeId);
    if (!dispute) {
      return notFound('Dispute not found');
    }

    // Verify user has permission (admin or involved party)
    const canClose = 
      userRole === 'ADMIN' ||
      dispute.clientId === userId ||
      dispute.masterId === userId;
      
    if (!canClose) {
      return forbidden('Access denied');
    }

    // Check if dispute can be closed
    if (dispute.status === 'CLOSED') {
      return badRequest('Dispute is already closed');
    }

    // Update dispute status to closed
    const updatedDispute = await disputesRepository.updateDisputeStatus(
      disputeId,
      {
        status: 'CLOSED',
        resolution: data.resolution,
        resolutionType: data.resolutionType,
      },
      userId
    );

    // Add timeline entry
    await disputesRepository.addTimelineEntry(disputeId, {
      action: 'DISPUTE_CLOSED',
      description: data.resolution || 'Dispute closed',
      userId,
    });

    // TODO: Send notifications to involved parties
    // await notificationService.sendNotification({...});

    logger.info('Dispute closed successfully', { disputeId, userId });

    return success({
      id: disputeId,
      status: 'CLOSED',
      resolution: data.resolution,
      resolutionType: data.resolutionType,
      closedAt: updatedDispute.closedAt,
      updatedAt: updatedDispute.updatedAt,
    });

  } catch (error: any) {
    logger.error('Error closing dispute', error);
    
    if (error.name === 'ZodError') {
      return badRequest(error.errors[0].message);
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to close dispute' }),
    };
  }
}

export const handler = withErrorHandler(withAuth(closeDisputeHandler));
