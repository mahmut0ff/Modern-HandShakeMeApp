// Accept resolution

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DisputesRepository } from '../shared/repositories/disputes.repository';
import { withAuth } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { success, badRequest, notFound, forbidden } from '../shared/utils/response';
import { logger } from '../shared/utils/logger';

const disputesRepository = new DisputesRepository();

async function acceptResolutionHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const userId = (event.requestContext as any).authorizer?.userId;
  
  if (!userId) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const disputeId = event.pathParameters?.id;
  if (!disputeId) {
    return badRequest('Dispute ID is required');
  }

  try {
    const dispute = await disputesRepository.findDisputeById(disputeId);
    if (!dispute) {
      return notFound('Dispute not found');
    }

    if (dispute.clientId !== userId && dispute.masterId !== userId) {
      return forbidden('Access denied');
    }

    if (dispute.status !== 'IN_MEDIATION' && dispute.status !== 'RESOLVED') {
      return badRequest('No resolution to accept');
    }

    // Update dispute to resolved status
    const updatedDispute = await disputesRepository.updateDisputeStatus(
      disputeId,
      { status: 'RESOLVED' },
      userId
    );

    // Add timeline entry
    await disputesRepository.addTimelineEntry(disputeId, {
      action: 'RESOLUTION_ACCEPTED',
      description: 'Resolution accepted by user',
      userId,
    });

    logger.info('Resolution accepted successfully', { disputeId, userId });

    return success({
      id: disputeId,
      status: 'RESOLVED',
      resolvedAt: updatedDispute.resolvedAt,
      message: 'Resolution accepted successfully',
    });

  } catch (error: any) {
    logger.error('Error accepting resolution', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to accept resolution' }),
    };
  }
}

export const handler = withErrorHandler(withAuth(acceptResolutionHandler));
