// @ts-nocheck
// Request mediation

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
const requestMediationSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500, 'Reason too long').optional()
});

async function requestMediationHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
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
    const data = validate(requestMediationSchema, body);

    const dispute = await disputesRepository.findDisputeById(disputeId);
    if (!dispute) {
      return notFound('Dispute not found');
    }

    if (dispute.clientId !== userId && dispute.masterId !== userId) {
      return forbidden('Access denied');
    }

    if (dispute.status === 'IN_MEDIATION') {
      return badRequest('Mediation already requested');
    }

    if (dispute.status === 'CLOSED' || dispute.status === 'RESOLVED') {
      return badRequest('Cannot request mediation for closed/resolved dispute');
    }

    // Update dispute status to in mediation
    const updatedDispute = await disputesRepository.updateDisputeStatus(
      disputeId,
      { status: 'IN_MEDIATION' },
      userId
    );

    // Add timeline entry
    await disputesRepository.addTimelineEntry(disputeId, {
      action: 'MEDIATION_REQUESTED',
      description: data.reason || 'Mediation requested',
      userId,
    });

    // TODO: Notify admin/mediator team
    // await notificationService.sendAdminNotification({...});

    logger.info('Mediation requested successfully', { disputeId, userId });

    return success({
      id: disputeId,
      status: 'IN_MEDIATION',
      priority: 'HIGH',
      updatedAt: updatedDispute.updatedAt,
      message: 'Mediation requested successfully',
    });

  } catch (error: any) {
    logger.error('Error requesting mediation', error);
    
    if (error.name === 'ZodError') {
      return badRequest(error.errors[0].message);
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to request mediation' }),
    };
  }
}

export const handler = withErrorHandler(withAuth(requestMediationHandler));
