// Get dispute details

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DisputesRepository } from '../shared/repositories/disputes.repository';
import { withAuth } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { success, notFound, forbidden } from '../shared/utils/response';
import { logger } from '../shared/utils/logger';

const disputesRepository = new DisputesRepository();

async function getDisputeHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const userId = (event.requestContext as any).authorizer?.userId;
  const userRole = (event.requestContext as any).authorizer?.role;
  
  if (!userId) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const disputeId = event.pathParameters?.id;
  if (!disputeId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Dispute ID is required' }) };
  }

  try {
    // Get dispute details
    const dispute = await disputesRepository.findDisputeById(disputeId);
    
    if (!dispute) {
      return notFound('Dispute not found');
    }

    // Verify user has access to this dispute
    if (
      dispute.clientId !== userId &&
      dispute.masterId !== userId &&
      userRole !== 'ADMIN'
    ) {
      return forbidden('Access denied');
    }

    // Get evidence and stats
    const [evidence, stats] = await Promise.all([
      disputesRepository.findDisputeEvidence(disputeId),
      disputesRepository.getDisputeStats(disputeId)
    ]);

    // Format response
    const response = {
      id: dispute.id,
      order: {
        id: dispute.orderId,
        title: 'Order Title', // TODO: Get from order service
      },
      project: dispute.projectId ? {
        id: dispute.projectId,
        title: 'Project Title', // TODO: Get from project service
      } : undefined,
      client: {
        id: dispute.clientId,
        firstName: 'Client', // TODO: Get from user service
        lastName: 'Name',
        avatar: undefined,
        role: 'CLIENT',
      },
      master: {
        id: dispute.masterId,
        firstName: 'Master', // TODO: Get from user service
        lastName: 'Name',
        avatar: undefined,
        role: 'MASTER',
      },
      reason: dispute.reason,
      description: dispute.description,
      status: dispute.status,
      priority: dispute.priority,
      resolution: dispute.resolution,
      resolutionType: dispute.resolutionType,
      resolutionNotes: dispute.resolutionNotes,
      amountDisputed: dispute.amountDisputed,
      amountResolved: dispute.amountResolved,
      evidenceFiles: evidence.map(e => ({
        id: e.id,
        type: e.type,
        url: e.url,
        fileName: e.fileName,
        fileSize: e.fileSize,
        description: e.description,
        uploadedBy: e.uploadedBy,
        uploadedAt: e.uploadedAt,
      })),
      evidenceCount: stats.evidenceCount,
      messageCount: stats.messageCount,
      createdAt: dispute.createdAt,
      updatedAt: dispute.updatedAt,
      resolvedAt: dispute.resolvedAt,
      closedAt: dispute.closedAt,
      mediator: dispute.mediatorId ? {
        id: dispute.mediatorId,
        firstName: 'Mediator', // TODO: Get from user service
        lastName: 'Name',
      } : undefined,
    };

    logger.info('Dispute retrieved successfully', { disputeId, userId });
    return success(response);

  } catch (error: any) {
    logger.error('Error fetching dispute', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch dispute' }),
    };
  }
}

export const handler = withErrorHandler(withAuth(getDisputeHandler));
