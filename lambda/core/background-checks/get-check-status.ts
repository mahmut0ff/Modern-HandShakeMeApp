// Get background check status and details

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { createResponse, createErrorResponse } from '../shared/utils/response';
import { validateInput, getCheckStatusSchema } from '../shared/utils/validation';
import { requireAuth } from '../shared/middleware/auth';
import { logger } from '../shared/utils/logger';
import { BackgroundCheckService } from '../shared/services/backgroundCheck';
import { BackgroundCheckRepository } from '../shared/repositories/background-check.repository';

const backgroundCheckRepo = new BackgroundCheckRepository();
const backgroundCheckService = new BackgroundCheckService();

export const handler = async (event: any): Promise<APIGatewayProxyResult> => {
  try {
    const user = await requireAuth()(event);
    
    logger.info('Get background check status request', { userId: user.userId });
    
    const queryParams = event.queryStringParameters || {};
    const data = validateInput(getCheckStatusSchema)(queryParams);
    
    let backgroundCheck;
    
    if (data.checkId) {
      // Get specific check
      backgroundCheck = await backgroundCheckRepo.getBackgroundCheck(data.checkId);
      
      if (!backgroundCheck) {
        return createErrorResponse(404, 'NOT_FOUND', 'Background check not found');
      }
      
      // Check permissions
      if (backgroundCheck.userId !== user.userId && user.role !== 'ADMIN') {
        return createErrorResponse(403, 'FORBIDDEN', 'You do not have permission to view this background check');
      }
    } else {
      // Get user's latest check
      backgroundCheck = await backgroundCheckRepo.getLatestUserBackgroundCheck(user.userId);
      
      if (!backgroundCheck) {
        return createResponse(200, {
          backgroundCheck: null,
          message: 'No background check found',
          recommendations: [
            'Consider initiating a background check to increase trust with clients',
            'Background checks help verify your identity and credentials',
            'Completed checks are displayed on your profile',
          ],
        });
      }
    }
    
    // Update status from external service if check is in progress
    if (backgroundCheck.status === 'IN_PROGRESS' && backgroundCheck.externalCheckId) {
      try {
        const externalStatus = await backgroundCheckService.getCheckStatus(
          backgroundCheck.externalCheckId
        );
        
        if (externalStatus.status !== backgroundCheck.status) {
          // Update local status
          const updatedCheck = await backgroundCheckRepo.updateBackgroundCheck(backgroundCheck.id, {
            status: externalStatus.status,
            result: externalStatus.result,
            resultDetails: externalStatus.details,
            completedAt: externalStatus.completedAt ? externalStatus.completedAt : undefined,
          });
          
          backgroundCheck = { ...backgroundCheck, ...updatedCheck };
        }
      } catch (error) {
        logger.warn('Failed to update status from external service', { 
          checkId: backgroundCheck.id, 
          error 
        });
      }
    }
    
    // Calculate progress percentage
    const progress = calculateProgress(backgroundCheck);
    
    // Get verification badges earned
    const badges = await getVerificationBadges(backgroundCheck);
    
    // Prepare response data
    const responseData = {
      id: backgroundCheck.id,
      checkType: backgroundCheck.checkType,
      status: backgroundCheck.status,
      result: backgroundCheck.result,
      progress,
      pricing: backgroundCheck.pricing,
      createdAt: backgroundCheck.createdAt,
      submittedAt: backgroundCheck.submittedAt,
      completedAt: backgroundCheck.completedAt,
      estimatedCompletionDate: backgroundCheck.estimatedCompletionDate,
      lastUpdated: backgroundCheck.lastUpdated,
      failureReason: backgroundCheck.failureReason,
      badges,
    };
    
    // Add detailed results for completed checks (filtered by user role)
    if (backgroundCheck.status === 'COMPLETED' && backgroundCheck.resultDetails) {
      if (user.role === 'ADMIN') {
        responseData.resultDetails = backgroundCheck.resultDetails;
      } else {
        // Filter sensitive information for non-admin users
        responseData.resultDetails = filterSensitiveDetails(backgroundCheck.resultDetails);
      }
    }
    
    // Add user info for admin
    if (user.role === 'ADMIN') {
      // For admin, we could fetch user info separately if needed
      responseData.user = {
        id: backgroundCheck.userId,
        // Additional user fields would need to be fetched from UserRepository
      };
    }
    
    // Add next steps based on status
    const nextSteps = getNextSteps(backgroundCheck);
    
    logger.info('Background check status retrieved', { 
      checkId: backgroundCheck.id, 
      userId: user.userId, 
      status: backgroundCheck.status 
    });
    
    return createResponse(200, {
      backgroundCheck: responseData,
      nextSteps,
      message: getStatusMessage(backgroundCheck.status, backgroundCheck.result),
    });
    
  } catch (error) {
    logger.error('Failed to get background check status', { error });
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(400, 'VALIDATION_ERROR', error.errors[0].message);
    }
    
    if (error.name === 'UnauthorizedError') {
      return createErrorResponse(401, 'UNAUTHORIZED', error.message);
    }
    
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to get background check status');
  }
};

function calculateProgress(backgroundCheck: any): number {
  switch (backgroundCheck.status) {
    case 'PENDING':
      return 10;
    case 'IN_PROGRESS':
      // Calculate based on time elapsed
      const now = new Date();
      const created = new Date(backgroundCheck.createdAt);
      const estimated = new Date(backgroundCheck.estimatedCompletionDate);
      
      const totalTime = estimated.getTime() - created.getTime();
      const elapsedTime = now.getTime() - created.getTime();
      
      const timeProgress = Math.min((elapsedTime / totalTime) * 80, 80); // Max 80% for in-progress
      return Math.max(20, timeProgress); // Min 20% for in-progress
    case 'COMPLETED':
      return 100;
    case 'FAILED':
    case 'CANCELLED':
      return 0;
    default:
      return 0;
  }
}

async function getVerificationBadges(backgroundCheck: any) {
  if (backgroundCheck.status !== 'COMPLETED' || backgroundCheck.result !== 'PASSED') {
    return [];
  }
  
  const badges = [];
  
  // Get user's verification badges
  const userBadges = await backgroundCheckRepo.getUserVerificationBadges(backgroundCheck.userId);
  
  // Map background check types to badges
  const badgeMapping = {
    IDENTITY: 'IDENTITY_VERIFIED',
    CRIMINAL: 'CRIMINAL_BACKGROUND_CLEAR',
    EMPLOYMENT: 'EMPLOYMENT_VERIFIED',
    EDUCATION: 'EDUCATION_VERIFIED',
    COMPREHENSIVE: 'COMPREHENSIVE_VERIFIED',
  };
  
  const expectedBadge = badgeMapping[backgroundCheck.checkType as keyof typeof badgeMapping];
  const hasBadge = userBadges.some(badge => badge.badgeType === expectedBadge);
  
  if (hasBadge) {
    badges.push({
      type: expectedBadge,
      earnedAt: backgroundCheck.completedAt,
      expiresAt: backgroundCheck.completedAt ? 
        new Date(new Date(backgroundCheck.completedAt).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString() : // 1 year
        undefined,
    });
  }
  
  return badges;
}

function filterSensitiveDetails(resultDetails: any) {
  // Remove sensitive information for non-admin users
  const filtered = { ...resultDetails };
  
  // Remove SSN, full addresses, etc.
  if (filtered.personalInfo) {
    delete filtered.personalInfo.ssn;
    delete filtered.personalInfo.nationalId;
  }
  
  if (filtered.criminalHistory) {
    // Only show summary, not detailed records
    filtered.criminalHistory = {
      hasCriminalRecord: filtered.criminalHistory.hasCriminalRecord,
      recordCount: filtered.criminalHistory.records?.length || 0,
      lastCheckedDate: filtered.criminalHistory.lastCheckedDate,
    };
  }
  
  return filtered;
}

function getNextSteps(backgroundCheck: any): string[] {
  switch (backgroundCheck.status) {
    case 'PENDING':
      return [
        'Complete payment to begin processing',
        'Ensure all submitted information is accurate',
        'You will receive notifications as the check progresses',
      ];
    case 'IN_PROGRESS':
      return [
        'Your background check is being processed',
        'No action required from you at this time',
        `Estimated completion: ${new Date(backgroundCheck.estimatedCompletionDate).toLocaleDateString()}`,
        'You will be notified when results are available',
      ];
    case 'COMPLETED':
      if (backgroundCheck.result === 'PASSED') {
        return [
          'Congratulations! Your background check passed',
          'Your verification badge has been added to your profile',
          'Clients can now see your verified status',
          'Consider sharing your verified status in your service descriptions',
        ];
      } else {
        return [
          'Your background check did not pass all requirements',
          'Review the detailed results for more information',
          'You may dispute incorrect information',
          'Contact support if you believe there was an error',
        ];
      }
    case 'FAILED':
      return [
        'Your background check could not be completed',
        'This may be due to insufficient information or technical issues',
        'You can initiate a new background check',
        'Contact support if you need assistance',
      ];
    case 'CANCELLED':
      return [
        'Your background check was cancelled',
        'You can initiate a new background check at any time',
        'Any payments made will be refunded',
      ];
    default:
      return [];
  }
}

function getStatusMessage(status: string, result?: string): string {
  switch (status) {
    case 'PENDING':
      return 'Your background check is pending payment and processing';
    case 'IN_PROGRESS':
      return 'Your background check is currently being processed';
    case 'COMPLETED':
      return result === 'PASSED' 
        ? 'Your background check has been completed successfully'
        : 'Your background check has been completed with some issues';
    case 'FAILED':
      return 'Your background check could not be completed';
    case 'CANCELLED':
      return 'Your background check was cancelled';
    default:
      return 'Background check status unknown';
  }
}