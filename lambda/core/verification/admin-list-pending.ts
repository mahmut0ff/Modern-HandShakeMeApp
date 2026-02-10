// Admin: List pending verification requests

import type { APIGatewayProxyResult } from 'aws-lambda';
import { success, forbidden } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { withRequestTransform } from '../shared/middleware/requestTransform';
import { logger } from '../shared/utils/logger';
import { VerificationRepository } from '../shared/repositories/verification.repository';
import { UserRepository } from '../shared/repositories/user.repository';

async function adminListPendingHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const userRole = event.auth.role;
  
  logger.info('Admin list pending verifications request', { userId });
  
  // Check if user is admin
  if (userRole !== 'ADMIN') {
    return forbidden('Only admins can access verification requests');
  }
  
  const verificationRepo = new VerificationRepository();
  const userRepo = new UserRepository();
  
  // Get pending and in_review verifications
  const pendingVerifications = await verificationRepo.findByStatus('PENDING');
  const inReviewVerifications = await verificationRepo.findByStatus('IN_REVIEW');
  
  const allVerifications = [...pendingVerifications, ...inReviewVerifications];
  
  // Enrich with user data
  const enrichedVerifications = await Promise.all(
    allVerifications.map(async (verification) => {
      const user = await userRepo.findById(verification.userId);
      
      return {
        id: verification.id,
        user: {
          id: user?.id,
          first_name: user?.firstName,
          last_name: user?.lastName,
          email: user?.email,
          phone: user?.phone,
          city: user?.city,
        },
        status: verification.status.toLowerCase(),
        documents: verification.documents.map(doc => ({
          id: doc.id,
          type: doc.type.toLowerCase(),
          url: doc.url,
          file_name: doc.fileName,
          uploaded_at: doc.uploadedAt,
          status: doc.status.toLowerCase(),
        })),
        notes: verification.notes,
        created_at: verification.createdAt,
        updated_at: verification.updatedAt,
      };
    })
  );
  
  logger.info('Pending verifications retrieved', { count: enrichedVerifications.length });
  
  return success({
    results: enrichedVerifications,
    count: enrichedVerifications.length,
  });
}

export const handler = withErrorHandler(
  withRequestTransform(
    withAuth(adminListPendingHandler, { roles: ['ADMIN'] })
  )
);
