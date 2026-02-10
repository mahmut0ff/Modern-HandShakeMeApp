// Get verification status Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { success, forbidden } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { withRequestTransform } from '../shared/middleware/requestTransform';
import { logger } from '../shared/utils/logger';
import { VerificationRepository } from '../shared/repositories/verification.repository';
import { UserRepository } from '../shared/repositories/user.repository';

async function getVerificationStatusHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Get verification status request', { userId });
  
  const userRepository = new UserRepository();
  const user = await userRepository.findById(userId);
  
  if (!user) {
    return forbidden('User not found');
  }
  
  const verificationRepository = new VerificationRepository();
  
  // Get or create verification record
  const verification = await verificationRepository.getOrCreateVerification(userId);
  
  logger.info('Verification status retrieved successfully', { 
    userId, 
    status: verification.status 
  });
  
  const response = {
    id: verification.id,
    status: verification.status.toLowerCase(),
    documents: verification.documents.map(doc => ({
      id: doc.id,
      type: doc.type.toLowerCase(),
      url: doc.url,
      file_name: doc.fileName,
      uploaded_at: doc.uploadedAt,
      status: doc.status.toLowerCase(),
      notes: doc.notes
    })),
    notes: verification.notes,
    reviewed_by: verification.reviewedBy,
    reviewed_at: verification.reviewedAt,
    verified_at: verification.verifiedAt,
    rejection_reason: verification.rejectionReason,
    created_at: verification.createdAt,
    updated_at: verification.updatedAt
  };
  
  return success(response);
}

export const handler = withErrorHandler(
  withRequestTransform(
    withAuth(getVerificationStatusHandler)
  )
);
