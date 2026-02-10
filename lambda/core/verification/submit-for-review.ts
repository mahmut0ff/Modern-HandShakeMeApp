// Submit verification for review with DynamoDB

import type { APIGatewayProxyResult } from 'aws-lambda';
import { VerificationRepository } from '../shared/repositories/verification.repository';
import { UserRepository } from '../shared/repositories/user.repository';
import { NotificationService } from '../shared/services/notification';
import { success, badRequest, forbidden } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { withRequestTransform } from '../shared/middleware/requestTransform';
import { logger } from '../shared/utils/logger';
import { z } from 'zod';

const submitVerificationSchema = z.object({
  additionalInfo: z.string().max(500).optional(),
  urgentReview: z.boolean().default(false),
});

async function submitVerificationHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const userRole = event.auth.role;
  
  logger.info('Submit verification request', { userId });
  
  if (userRole !== 'MASTER') {
    return forbidden('Only masters can submit verification');
  }
  
  const body = JSON.parse(event.body || '{}');
  const data = submitVerificationSchema.parse(body);
  
  try {
    const verificationRepo = new VerificationRepository();
    const userRepo = new UserRepository();
    const notificationService = new NotificationService();
    
    // Get existing verification
    const verification = await verificationRepo.findByUserId(userId);
    
    if (!verification) {
      return badRequest('No verification record found. Please upload documents first.');
    }
    
    // Check if has required documents
    if (!verification.documents || verification.documents.length === 0) {
      return badRequest('Please upload verification photos first');
    }
    
    // Validate document requirements (face photo and passport photo)
    const hasFacePhoto = verification.documents.some(doc => doc.type === 'FACE_PHOTO');
    const hasPassportPhoto = verification.documents.some(doc => doc.type === 'PASSPORT_PHOTO');
    
    if (!hasFacePhoto) {
      return badRequest('Face photo (selfie) is required');
    }
    
    if (!hasPassportPhoto) {
      return badRequest('Passport verification photo is required');
    }
    
    // Check current status
    if (verification.status === 'PENDING') {
      return badRequest('Verification is already submitted for review');
    }
    
    if (verification.status === 'IN_REVIEW') {
      return badRequest('Verification is already under review');
    }
    
    if (verification.status === 'APPROVED') {
      return badRequest('Verification is already approved');
    }
    
    // Determine review priority based on urgentReview flag
    const priority = data.urgentReview ? 'urgent' : 'normal';
    
    // Submit for review
    const updatedVerification = await verificationRepo.submitForReview(verification.id);
    
    // Update additional info if provided
    if (data.additionalInfo) {
      await verificationRepo.update(verification.id, {
        notes: data.additionalInfo,
      });
    }
    
    // Get user info for notifications
    const user = await userRepo.findById(userId);
    
    // Send notification to user
    await notificationService.sendNotification({
      userId,
      type: 'SYSTEM',
      title: 'Verification Submitted',
      message: 'Your verification has been submitted for review. You will be notified once the review is complete.',
      data: {
        verificationId: verification.id,
        priority,
        estimatedTime: getEstimatedReviewTime(priority),
      },
    });
    
    logger.info('Verification submitted for review', { 
      userId, 
      verificationId: verification.id,
      documentsCount: verification.documents.length,
      priority,
    });
    
    const response = {
      message: 'Verification submitted for review successfully',
      verification: {
        id: updatedVerification.id,
        status: updatedVerification.status.toLowerCase(),
        priority,
        documentsCount: verification.documents.length,
        estimatedReviewTime: getEstimatedReviewTime(priority),
      },
      nextSteps: [
        'Your documents are now being reviewed by our team',
        'You will receive a notification once the review is complete',
        `Review typically takes ${getEstimatedReviewTime(priority)}`,
        'You can check your verification status anytime',
      ],
    };
    
    return success(response);
    
  } catch (error: any) {
    logger.error('Submit verification failed', { userId, error });
    throw error;
  }
}

function getEstimatedReviewTime(priority: string): string {
  switch (priority) {
    case 'urgent':
      return '4-8 hours';
    case 'high':
      return '1-2 business days';
    case 'low':
      return '3-5 business days';
    default:
      return '2-3 business days';
  }
}

export const handler = withErrorHandler(
  withRequestTransform(
    withAuth(submitVerificationHandler)
  )
);
