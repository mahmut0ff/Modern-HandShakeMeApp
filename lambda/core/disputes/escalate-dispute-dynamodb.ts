// @ts-nocheck
// Escalate dispute

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
const escalateDisputeSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500, 'Reason too long').optional()
});

async function escalateDisputeHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const userId = (event.requestContext as any).authorizer?.userId;
  
  if (!userId) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const disputeId = event.pathParameters?.id;
  if (!disputeId) {
    return badRequest('Dispute ID is required');
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const data = validate(escalateDisputeSchema, body);

    // Get dispute
    const dispute = await disputesRepository.findDisputeById(disputeId);
    if (!dispute) {
      return notFound('Dispute not found');
    }

    // Verify user is involved in dispute
    if (dispute.clientId !== userId && dispute.masterId !== userId) {
      return forbidden('Access denied');
    }

    // Check if dispute can be escalated
    if (dispute.status === 'ESCALATED') {
      return badRequest('Dispute is already escalated');
    }

    if (dispute.status === 'CLOSED') {
      return badRequest('Cannot escalate closed dispute');
    }

    // Update dispute status to escalated
    const updatedDispute = await disputesRepository.updateDisputeStatus(
      disputeId,
      {
        status: 'ESCALATED',
        // Set priority to urgent when escalated
      },
      userId
    );

    // Add timeline entry with reason
    await disputesRepository.addTimelineEntry(disputeId, {
      action: 'ESCALATED',
      description: data.reason || 'Dispute escalated to admin review',
      userId,
    });

    // TODO: Send notification to admin team
    // await notificationService.sendAdminNotification({...});

    logger.info('Dispute escalated successfully', { disputeId, userId });

    return success({
      id: disputeId,
      status: 'ESCALATED',
      priority: 'URGENT',
      updatedAt: updatedDispute.updatedAt,
      message: 'Dispute escalated to admin review',
    });

  } catch (error: any) {
    logger.error('Error escalating dispute', error);
    
    if (error.name === 'ZodError') {
      return badRequest(error.errors[0].message);
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to escalate dispute' }),
    };
  }
}

export const handler = withErrorHandler(withAuth(escalateDisputeHandler));
