// @ts-nocheck
// Update dispute status

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { DisputesRepository } from '../shared/repositories/disputes.repository';
import { withAuth } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { success, badRequest, notFound, forbidden } from '../shared/utils/response';
import { validate } from '../shared/utils/validation';
import { logger } from '../shared/utils/logger';
import { UpdateDisputeStatusRequest } from '../shared/types/disputes';

const disputesRepository = new DisputesRepository();

// Validation schema
const updateDisputeStatusSchema = z.object({
  status: z.enum(['IN_REVIEW', 'IN_MEDIATION', 'ESCALATED', 'RESOLVED', 'CLOSED']),
  resolution: z.enum(['FULL_REFUND', 'PARTIAL_REFUND', 'PAY_MASTER', 'NO_ACTION', 'CUSTOM']).optional(),
  resolutionType: z.enum(['AUTOMATIC', 'MEDIATED', 'ADMIN_DECISION', 'MUTUAL_AGREEMENT']).optional(),
  resolutionNotes: z.string().max(1000, 'Resolution notes too long').optional(),
  amountResolved: z.number().positive('Amount must be positive').optional()
});

async function updateDisputeStatusHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
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
    const data = validate(updateDisputeStatusSchema, body);

    // Only admins can update dispute status to certain states
    const adminOnlyStatuses = ['IN_REVIEW', 'RESOLVED', 'CLOSED'];
    if (adminOnlyStatuses.includes(data.status) && userRole !== 'ADMIN') {
      return forbidden('Only administrators can update dispute to this status');
    }

    // Validate resolution data
    if (data.status === 'RESOLVED') {
      if (!data.resolution) {
        return badRequest('Resolution is required when resolving a dispute');
      }
      
      if (['FULL_REFUND', 'PARTIAL_REFUND'].includes(data.resolution) && !data.amountResolved) {
        return badRequest('Amount is required for refund resolutions');
      }
    }

    // Check if dispute exists
    const dispute = await disputesRepository.findDisputeById(disputeId);
    if (!dispute) {
      return notFound('Dispute not found');
    }

    // Verify user has permission to update this dispute
    const canUpdate = 
      userRole === 'ADMIN' || 
      dispute.clientId === userId || 
      dispute.masterId === userId;
      
    if (!canUpdate) {
      return forbidden('You do not have permission to update this dispute');
    }

    // Check if status transition is valid
    const validTransitions: Record<string, string[]> = {
      'OPEN': ['IN_REVIEW', 'IN_MEDIATION', 'ESCALATED', 'CLOSED'],
      'IN_REVIEW': ['IN_MEDIATION', 'ESCALATED', 'RESOLVED', 'CLOSED'],
      'IN_MEDIATION': ['ESCALATED', 'RESOLVED', 'CLOSED'],
      'ESCALATED': ['RESOLVED', 'CLOSED'],
      'RESOLVED': ['CLOSED'],
      'CLOSED': []
    };

    if (!validTransitions[dispute.status]?.includes(data.status)) {
      return badRequest(`Cannot transition from ${dispute.status} to ${data.status}`);
    }

    // Update dispute
    const updatedDispute = await disputesRepository.updateDisputeStatus(
      disputeId,
      data,
      userId
    );

    // TODO: Process resolution if dispute is resolved
    // if (data.status === 'RESOLVED' && data.resolution) {
    //   await processDisputeResolution(dispute, data);
    // }

    // TODO: Send notifications to involved parties
    // await notificationService.sendNotification({...});

    logger.info('Dispute status updated successfully', { 
      disputeId, 
      status: data.status, 
      updatedBy: userId 
    });

    return success({
      disputeId: updatedDispute.id,
      status: updatedDispute.status,
      resolution: updatedDispute.resolution,
      resolutionType: updatedDispute.resolutionType,
      resolutionNotes: updatedDispute.resolutionNotes,
      amountResolved: updatedDispute.amountResolved,
      resolvedAt: updatedDispute.resolvedAt,
      closedAt: updatedDispute.closedAt,
      updatedAt: updatedDispute.updatedAt,
      message: 'Dispute status updated successfully'
    });

  } catch (error) {
    logger.error('Error updating dispute status', error);
    
    if (error.name === 'ZodError') {
      return badRequest(error.errors[0].message);
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to update dispute status' }),
    };
  }
}

export const handler = withErrorHandler(withAuth(updateDisputeStatusHandler));