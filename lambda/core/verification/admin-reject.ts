// Admin: Reject verification

import type { APIGatewayProxyResult } from 'aws-lambda';
import { success, badRequest, forbidden } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { withRequestTransform } from '../shared/middleware/requestTransform';
import { logger } from '../shared/utils/logger';
import { VerificationRepository } from '../shared/repositories/verification.repository';
import { NotificationService } from '../shared/services/notification';
import { z } from 'zod';

const rejectSchema = z.object({
  verificationId: z.string(),
  rejectionReason: z.string().min(10).max(500),
  notes: z.string().max(500).optional(),
});

async function adminRejectHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const adminId = event.auth.userId;
  const userRole = event.auth.role;
  
  logger.info('Admin reject verification request', { adminId });
  
  if (userRole !== 'ADMIN') {
    return forbidden('Only admins can reject verifications');
  }
  
  const body = JSON.parse(event.body || '{}');
  const data = rejectSchema.parse(body);
  
  const verificationRepo = new VerificationRepository();
  const notificationService = new NotificationService();
  
  // Get verification
  const verification = await verificationRepo.findById(data.verificationId);
  
  if (!verification) {
    return badRequest('Verification not found');
  }
  
  if (verification.status === 'APPROVED') {
    return badRequest('Cannot reject approved verification');
  }
  
  // Reject verification
  const updatedVerification = await verificationRepo.reject(
    data.verificationId,
    adminId,
    data.rejectionReason,
    data.notes
  );
  
  // Send notification to user
  await notificationService.sendNotification({
    userId: verification.userId,
    type: 'SYSTEM',
    title: 'Verification Rejected',
    message: `Your verification was rejected. Reason: ${data.rejectionReason}. You can retry verification with new photos.`,
    data: {
      verificationId: verification.id,
      rejectionReason: data.rejectionReason,
      rejectedAt: updatedVerification.reviewedAt,
    },
  });
  
  logger.info('Verification rejected', {
    verificationId: data.verificationId,
    userId: verification.userId,
    adminId,
    reason: data.rejectionReason,
  });
  
  return success({
    message: 'Verification rejected successfully',
    verification: {
      id: updatedVerification.id,
      status: updatedVerification.status.toLowerCase(),
      rejection_reason: updatedVerification.rejectionReason,
      reviewed_by: updatedVerification.reviewedBy,
      reviewed_at: updatedVerification.reviewedAt,
    },
  });
}

export const handler = withErrorHandler(
  withRequestTransform(
    withAuth(adminRejectHandler, { roles: ['ADMIN'] })
  )
);
