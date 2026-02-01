// GDPR account deletion with DynamoDB

import type { APIGatewayProxyResult } from 'aws-lambda';
import { GDPRRepository } from '../shared/repositories/gdpr.repository';
import { S3Service } from '../shared/services/s3.service';
import { NotificationService } from '../shared/services/notification.service';
import { GDPRUtils } from '../shared/utils/gdpr';
import { success, badRequest, forbidden } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { logger } from '../shared/utils/logger';
import { z } from 'zod';
import { DeleteAccountRequest, GDPROperationResult } from '../shared/types/gdpr';

const deleteAccountSchema = z.object({
  confirmPassword: z.string().min(1, 'Password is required'),
  reason: z.enum(['privacy_concerns', 'not_using', 'found_alternative', 'other']).optional(),
  feedback: z.string().max(1000, 'Feedback too long').optional(),
});

const gdprRepo = new GDPRRepository();
const s3Service = new S3Service();
const notificationService = new NotificationService();

async function deleteAccountHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const userRole = event.auth.role;
  const operationId = GDPRUtils.generateOperationId('DELETE_ACCOUNT', userId);
  
  logger.info('GDPR account deletion request started', { userId, operationId });
  
  try {
    // Validate request body
    const body = JSON.parse(event.body || '{}');
    const data = deleteAccountSchema.parse(body);
    
    // Get user profile
    const user = await gdprRepo.getUserProfile(userId);
    if (!user) {
      return badRequest('User not found');
    }
    
    // Verify password
    const isPasswordValid = await gdprRepo.verifyUserPassword(userId, data.confirmPassword);
    if (!isPasswordValid) {
      logger.warn('GDPR deletion: invalid password', { userId, operationId });
      return forbidden('Invalid password');
    }
    
    // Check for active orders/projects
    const hasActiveOrders = await gdprRepo.hasActiveOrders(userId, userRole as 'CLIENT' | 'MASTER');
    if (hasActiveOrders) {
      return badRequest('Cannot delete account with active orders. Please complete or cancel them first.');
    }
    
    // Check wallet balance
    const walletBalance = await gdprRepo.getWalletBalance(userId);
    if (walletBalance > 0) {
      return badRequest(`Cannot delete account with positive wallet balance (${walletBalance}). Please withdraw funds first.`);
    }
    
    // Validate deletion eligibility
    const eligibility = GDPRUtils.validateDeletionEligibility([], walletBalance);
    if (!eligibility.canDelete) {
      return badRequest(`Cannot delete account: ${eligibility.reasons.join(', ')}`);
    }
    
    // Start deletion process with transaction-like behavior
    const deletionResults = {
      reviewsAnonymized: 0,
      messagesDeleted: 0,
      notificationsDeleted: 0,
      filesDeleted: 0,
      errors: [] as string[]
    };
    
    try {
      // 1. Anonymize reviews (keep for masters' ratings but remove personal data)
      try {
        deletionResults.reviewsAnonymized = await gdprRepo.anonymizeUserReviews(userId);
      } catch (error: any) {
        deletionResults.errors.push(`Failed to anonymize reviews: ${error.message}`);
      }
      
      // 2. Delete messages
      try {
        deletionResults.messagesDeleted = await gdprRepo.deleteUserMessages(userId);
      } catch (error: any) {
        deletionResults.errors.push(`Failed to delete messages: ${error.message}`);
      }
      
      // 3. Delete notifications
      try {
        deletionResults.notificationsDeleted = await gdprRepo.deleteUserNotifications(userId);
      } catch (error: any) {
        deletionResults.errors.push(`Failed to delete notifications: ${error.message}`);
      }
      
      // 4. Delete files from S3
      try {
        // Delete files by user prefix (more efficient than individual deletions)
        const filesDeletionResult = await s3Service.deleteFilesByPrefix(`users/${userId}/`);
        deletionResults.filesDeleted = filesDeletionResult.deleted;
        
        if (filesDeletionResult.failed > 0) {
          deletionResults.errors.push(`Failed to delete ${filesDeletionResult.failed} files`);
        }
      } catch (error: any) {
        deletionResults.errors.push(`Failed to delete files: ${error.message}`);
      }
      
      // 5. Create deletion record for legal compliance (30 days retention)
      const deletionRecord = {
        userId: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        deletedAt: new Date().toISOString(),
        reason: data.reason,
        feedback: data.feedback,
        retentionUntil: GDPRUtils.calculateRetentionUntil()
      };
      
      await gdprRepo.createDeletionRecord(deletionRecord);
      
      // 6. Anonymize user account (don't delete for referential integrity)
      const anonymizedData = GDPRUtils.createAnonymizedUserData(userId);
      await gdprRepo.anonymizeUser(userId, anonymizedData);
      
      // 7. Send confirmation email (before anonymizing email)
      if (user.email && !user.email.includes('@anonymized.local')) {
        try {
          await notificationService.sendEmail(user.email, 'account_deleted', {
            firstName: user.firstName,
            deletedAt: new Date().toISOString(),
          });
        } catch (error: any) {
          deletionResults.errors.push(`Failed to send confirmation email: ${error.message}`);
        }
      }
      
      // 8. Send admin notification
      await notificationService.sendAdminAlert(
        'GDPR Account Deletion Completed',
        `User ${userId} account deleted. Reviews: ${deletionResults.reviewsAnonymized}, Messages: ${deletionResults.messagesDeleted}, Files: ${deletionResults.filesDeleted}`,
        'INFO'
      );
      
      const result: GDPROperationResult = {
        success: true,
        message: 'Account deleted successfully. Your data has been anonymized and will be permanently removed after 30 days.',
        operationId,
        timestamp: new Date().toISOString(),
        affectedRecords: deletionResults.reviewsAnonymized + deletionResults.messagesDeleted + deletionResults.notificationsDeleted,
        errors: deletionResults.errors.length > 0 ? deletionResults.errors : undefined
      };
      
      GDPRUtils.logGDPROperation('DELETE_ACCOUNT', userId, {
        operationId,
        results: deletionResults
      }, true);
      
      logger.info('GDPR account deletion completed successfully', { 
        userId, 
        operationId,
        results: deletionResults
      });
      
      return success(result);
      
    } catch (error: any) {
      // If critical operations fail, we need to alert admins
      await notificationService.sendAdminAlert(
        'GDPR Account Deletion Failed',
        `Critical failure during account deletion for user ${userId}: ${error.message}`,
        'ERROR'
      );
      
      throw error;
    }
    
  } catch (error: any) {
    const result: GDPROperationResult = {
      success: false,
      message: 'Account deletion failed. Please contact support.',
      operationId,
      timestamp: new Date().toISOString(),
      errors: [error.message]
    };
    
    GDPRUtils.logGDPROperation('DELETE_ACCOUNT', userId, {
      operationId,
      error: error.message
    }, false, error);
    
    logger.error('GDPR account deletion failed', { userId, operationId, error: error.message });
    
    if (error.name === 'ZodError') {
      return badRequest(error.errors[0].message);
    }
    
    throw error;
  }
}

export const handler = withErrorHandler(withAuth(deleteAccountHandler));
