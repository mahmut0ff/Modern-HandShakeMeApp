// Admin: Approve verification

import type { APIGatewayProxyResult } from 'aws-lambda';
import { success, badRequest, forbidden } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { withRequestTransform } from '../shared/middleware/requestTransform';
import { logger } from '../shared/utils/logger';
import { VerificationRepository } from '../shared/repositories/verification.repository';
import { UserRepository } from '../shared/repositories/user.repository';
import { NotificationService } from '../shared/services/notification';
import { z } from 'zod';

const approveSchema = z.object({
  verificationId: z.string(),
  notes: z.string().max(500).optional(),
});

async function adminApproveHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const adminId = event.auth.userId;
  const userRole = event.auth.role;
  
  logger.info('Admin approve verification request', { adminId });
  
  if (userRole !== 'ADMIN') {
    return forbidden('Only admins can approve verifications');
  }
  
  const body = JSON.parse(event.body || '{}');
  const data = approveSchema.parse(body);
  
  const verificationRepo = new VerificationRepository();
  const userRepo = new UserRepository();
  const notificationService = new NotificationService();
  
  // Get verification
  const verification = await verificationRepo.findById(data.verificationId);
  
  if (!verification) {
    return badRequest('Verification not found');
  }
  
  if (verification.status === 'APPROVED') {
    return badRequest('Verification already approved');
  }
  
  // Approve verification
  const updatedVerification = await verificationRepo.approve(
    data.verificationId,
    adminId,
    data.notes
  );
  
  // Update user's isVerified flag
  await userRepo.update(verification.userId, {
    isVerified: true,
    isIdentityVerified: true,
    identityVerifiedAt: updatedVerification.verifiedAt,
  });
  
  // Send notification to user
  await notificationService.sendNotification({
    userId: verification.userId,
    type: 'SYSTEM',
    title: 'Verification Approved',
    message: 'Congratulations! Your identity verification has been approved. You now have a verified badge on your profile.',
    data: {
      verificationId: verification.id,
      approvedAt: updatedVerification.verifiedAt,
    },
  });
  
  logger.info('Verification approved', {
    verificationId: data.verificationId,
    userId: verification.userId,
    adminId,
  });
  
  return success({
    message: 'Verification approved successfully',
    verification: {
      id: updatedVerification.id,
      status: updatedVerification.status.toLowerCase(),
      verified_at: updatedVerification.verifiedAt,
      reviewed_by: updatedVerification.reviewedBy,
    },
  });
}

export const handler = withErrorHandler(
  withRequestTransform(
    withAuth(adminApproveHandler, { roles: ['ADMIN'] })
  )
);
