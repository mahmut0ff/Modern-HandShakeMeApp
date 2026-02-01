// Add evidence to dispute

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { DisputesRepository } from '../shared/repositories/disputes.repository';
import { withAuth } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { success, badRequest, notFound, forbidden, conflict } from '../shared/utils/response';
import { validate } from '../shared/utils/validation';
import { logger } from '../shared/utils/logger';
import { AddEvidenceRequest } from '../shared/types/disputes';

const disputesRepository = new DisputesRepository();

// Validation schema
const addEvidenceSchema = z.object({
  evidence: z.array(z.object({
    type: z.enum(['IMAGE', 'DOCUMENT', 'VIDEO', 'AUDIO']),
    url: z.string().url('Invalid evidence URL'),
    description: z.string().max(200, 'Evidence description too long').optional()
  })).min(1, 'At least one evidence item is required').max(5, 'Maximum 5 evidence items per submission')
});

async function addEvidenceHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
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
    const data = validate(addEvidenceSchema, body);

    // Check if dispute exists and user is involved
    const dispute = await disputesRepository.findDisputeById(disputeId);
    if (!dispute) {
      return notFound('Dispute not found');
    }

    // Verify user is involved in the dispute
    const isClient = dispute.clientId === userId;
    const isMaster = dispute.masterId === userId;
    const isAdmin = userRole === 'ADMIN';
    
    if (!isClient && !isMaster && !isAdmin) {
      return forbidden('You are not involved in this dispute');
    }

    // Check if dispute is still open for evidence
    if (!['OPEN', 'IN_REVIEW', 'IN_MEDIATION'].includes(dispute.status)) {
      return badRequest('Cannot add evidence to a resolved or closed dispute');
    }

    // Get current evidence count for this user
    const existingEvidence = await disputesRepository.findDisputeEvidence(disputeId);
    const userEvidenceCount = existingEvidence.filter(e => e.uploadedBy === userId).length;

    if (userEvidenceCount + data.evidence.length > 10) {
      return conflict('Maximum 10 evidence items per user per dispute');
    }

    // TODO: Validate evidence URLs with S3 service
    // for (const evidence of data.evidence) {
    //   const isValid = await s3Service.validateFileUrl(evidence.url, evidence.type);
    //   if (!isValid) {
    //     return badRequest(`Invalid ${evidence.type.toLowerCase()} URL: ${evidence.url}`);
    //   }
    // }

    // Add evidence to dispute
    const evidenceRecords = await disputesRepository.addEvidence(disputeId, data, userId);

    // TODO: Send notifications to other party and admin
    // const otherPartyId = isClient ? dispute.masterId : dispute.clientId;
    // await notificationService.sendNotification({...});

    logger.info('Evidence added to dispute successfully', { 
      disputeId, 
      evidenceCount: data.evidence.length, 
      addedBy: userId 
    });

    return success({
      disputeId,
      evidenceAdded: data.evidence.length,
      totalEvidence: userEvidenceCount + data.evidence.length,
      message: 'Evidence added successfully',
      evidence: evidenceRecords.map(record => ({
        id: record.id,
        type: record.type,
        url: record.url,
        description: record.description,
        uploadedAt: record.uploadedAt
      }))
    }, { statusCode: 201 });

  } catch (error) {
    logger.error('Error adding dispute evidence', error);
    
    if (error.name === 'ZodError') {
      return badRequest(error.errors[0].message);
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to add dispute evidence' }),
    };
  }
}

export const handler = withErrorHandler(withAuth(addEvidenceHandler));