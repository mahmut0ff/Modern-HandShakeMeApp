// Dispute background check results

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { createResponse, createErrorResponse } from '../shared/utils/response';
import { validateInput, disputeResultsSchema } from '../shared/utils/validation';
import { requireAuth } from '../shared/middleware/auth';
import { logger } from '../shared/utils/logger';
import { NotificationService } from '../shared/services/notification';
import { BackgroundCheckService } from '../shared/services/backgroundCheck';
import { BackgroundCheckRepository } from '../shared/repositories/background-check.repository';
import { UserRepository } from '../shared/repositories/user.repository';

const backgroundCheckRepo = new BackgroundCheckRepository();
const userRepo = new UserRepository();
const notificationService = new NotificationService();
const backgroundCheckService = new BackgroundCheckService();

export const handler = async (event: any): Promise<APIGatewayProxyResult> => {
  try {
    const user = await requireAuth()(event);
    
    logger.info('Dispute background check results request', { userId: user.userId });
    
    const body = JSON.parse(event.body || '{}');
    const data = validateInput(disputeResultsSchema)(body);
    
    // Verify background check exists and belongs to user
    const backgroundCheck = await backgroundCheckRepo.getBackgroundCheck(data.checkId);
    
    if (!backgroundCheck) {
      return createErrorResponse(404, 'NOT_FOUND', 'Background check not found');
    }
    
    if (backgroundCheck.userId !== user.userId) {
      return createErrorResponse(403, 'FORBIDDEN', 'You can only dispute your own background check results');
    }
    
    if (backgroundCheck.status !== 'COMPLETED') {
      return createErrorResponse(400, 'VALIDATION_ERROR', 'You can only dispute completed background checks');
    }
    
    // Check if there's already an active dispute
    const existingDisputes = await backgroundCheckRepo.getBackgroundCheckDisputes(data.checkId);
    const activeDispute = existingDisputes.find(dispute => 
      ['PENDING', 'UNDER_REVIEW', 'INVESTIGATING'].includes(dispute.status)
    );
    
    if (activeDispute) {
      return createErrorResponse(400, 'VALIDATION_ERROR', 'There is already an active dispute for this background check');
    }
    
    // Check dispute time limit (90 days from completion)
    if (backgroundCheck.completedAt) {
      const completedAt = new Date(backgroundCheck.completedAt);
      const disputeDeadline = new Date(completedAt.getTime() + 90 * 24 * 60 * 60 * 1000);
      
      if (new Date() > disputeDeadline) {
        return createErrorResponse(400, 'VALIDATION_ERROR', 'Dispute period has expired. You can only dispute results within 90 days of completion.');
      }
    }
    
    // Get user info for external service
    const userInfo = await userRepo.findById(user.userId);
    if (!userInfo) {
      return createErrorResponse(404, 'NOT_FOUND', 'User not found');
    }
    
    // Create dispute record
    const dispute = await backgroundCheckRepo.createDispute({
      backgroundCheckId: data.checkId,
      userId: user.userId,
      disputeType: data.disputeType,
      disputedItems: data.disputedItems,
      description: data.description,
      supportingDocuments: data.supportingDocuments || [],
      contactPreference: data.contactPreference,
      urgentRequest: data.urgentRequest,
      status: 'PENDING',
      estimatedResolutionDate: new Date(Date.now() + (data.urgentRequest ? 7 : 30) * 24 * 60 * 60 * 1000).toISOString(),
    });
    
    // Submit dispute to external background check service
    try {
      const externalDisputeId = await backgroundCheckService.submitDispute({
        originalCheckId: backgroundCheck.externalCheckId || '',
        disputeId: dispute.id,
        disputeType: data.disputeType,
        disputedItems: data.disputedItems,
        description: data.description,
        supportingDocuments: data.supportingDocuments,
        userInfo: {
          firstName: userInfo.firstName || '',
          lastName: userInfo.lastName || '',
          email: userInfo.email,
          phone: userInfo.phone || '',
        },
        urgentRequest: data.urgentRequest,
      });
      
      // Update dispute with external ID
      await backgroundCheckRepo.updateDispute(dispute.id, {
        externalDisputeId,
        status: 'UNDER_REVIEW',
        submittedAt: new Date().toISOString(),
      });
      
    } catch (error) {
      logger.error('Failed to submit dispute to external service', { disputeId: dispute.id, error });
      
      // Update status to failed
      await backgroundCheckRepo.updateDispute(dispute.id, {
        status: 'FAILED',
        failureReason: 'Failed to submit dispute to background check service',
      });
      
      return createErrorResponse(400, 'VALIDATION_ERROR', 'Failed to submit dispute. Please try again.');
    }
    
    // Create dispute timeline entry
    await backgroundCheckRepo.createTimelineEntry({
      disputeId: dispute.id,
      action: 'DISPUTE_SUBMITTED',
      description: 'Dispute submitted for review',
      performedBy: user.userId,
      performedAt: new Date().toISOString(),
      details: {
        disputeType: data.disputeType,
        itemsDisputed: data.disputedItems.length,
        urgentRequest: data.urgentRequest,
      },
    });
    
    // Send notifications
    await notificationService.sendBackgroundCheckNotification(
      user.userId,
      { ...backgroundCheck, dispute },
      'DISPUTE_SUBMITTED'
    );
    
    // Send admin notification
    await notificationService.sendAdminNotification(
      'NEW_BACKGROUND_CHECK_DISPUTE',
      {
        disputeId: dispute.id,
        checkId: data.checkId,
        userId: user.userId,
        disputeType: data.disputeType,
        urgentRequest: data.urgentRequest,
      }
    );
    
    // Update background check status
    await backgroundCheckRepo.updateBackgroundCheck(data.checkId, {
      disputeStatus: 'DISPUTED',
    });
    
    logger.info('Background check dispute submitted successfully', { 
      disputeId: dispute.id, 
      checkId: data.checkId, 
      userId: user.userId 
    });
    
    return createResponse(200, {
      dispute: {
        id: dispute.id,
        status: 'UNDER_REVIEW',
        disputeType: dispute.disputeType,
        createdAt: dispute.createdAt,
        estimatedResolutionDate: dispute.estimatedResolutionDate,
        caseNumber: generateCaseNumber(dispute.id),
      },
      message: 'Dispute submitted successfully',
      nextSteps: [
        'Your dispute is now under review',
        'You will receive updates via your preferred contact method',
        `Estimated resolution: ${data.urgentRequest ? '7' : '30'} business days`,
        'You can track the progress of your dispute in your account',
        'Additional documentation may be requested during the review process',
      ],
      supportInfo: {
        caseNumber: generateCaseNumber(dispute.id),
        contactMethods: [
          'Email: disputes@handshakeme.com',
          'Phone: 1-800-DISPUTE (1-800-347-7883)',
          'Online: Track your dispute in your account dashboard',
        ],
      },
    });
    
  } catch (error) {
    logger.error('Failed to submit background check dispute', { error });
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(400, 'VALIDATION_ERROR', error.errors[0].message);
    }
    
    if (error.name === 'UnauthorizedError') {
      return createErrorResponse(401, 'UNAUTHORIZED', error.message);
    }
    
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to submit dispute');
  }
};

function generateCaseNumber(disputeId: string): string {
  // Generate a human-readable case number
  const timestamp = Date.now().toString().slice(-6);
  const prefix = 'BGD';
  const suffix = disputeId.slice(-4).toUpperCase();
  
  return `${prefix}-${timestamp}-${suffix}`;
}