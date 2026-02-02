// @ts-nocheck
// Initiate background check

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { createResponse, createErrorResponse } from '../shared/utils/response';
import { validateInput, initiateCheckSchema } from '../shared/utils/validation';
import { requireAuth } from '../shared/middleware/auth';
import { logger } from '../shared/utils/logger';
import { NotificationService } from '../shared/services/notification';
import { BackgroundCheckService } from '../shared/services/backgroundCheck';
import { BackgroundCheckRepository } from '../shared/repositories/background-check.repository';
import { TransactionRepository } from '../shared/repositories/transaction.repository';

const backgroundCheckRepo = new BackgroundCheckRepository();
const transactionRepo = new TransactionRepository();
const notificationService = new NotificationService();
const backgroundCheckService = new BackgroundCheckService();

export const handler = async (event: any): Promise<APIGatewayProxyResult> => {
  try {
    const user = await requireAuth()(event);
    
    if (user.role !== 'MASTER') {
      return createErrorResponse(403, 'FORBIDDEN', 'Only masters can initiate background checks');
    }
    
    logger.info('Initiate background check request', { userId: user.userId });
    
    const body = JSON.parse(event.body || '{}');
    const data = validateInput(initiateCheckSchema)(body);
    
    // Check if user already has a pending or recent check
    const existingChecks = await backgroundCheckRepo.getUserBackgroundChecks(user.userId, {
      status: 'PENDING'
    });
    
    const inProgressChecks = await backgroundCheckRepo.getUserBackgroundChecks(user.userId, {
      status: 'IN_PROGRESS'
    });
    
    if (existingChecks.length > 0 || inProgressChecks.length > 0) {
      return createErrorResponse(409, 'CONFLICT', 'You already have a pending background check');
    }
    
    // Check if user has a recent successful check (within 1 year)
    const allChecks = await backgroundCheckRepo.getUserBackgroundChecks(user.userId);
    const recentCheck = allChecks.find(check => {
      if (check.status === 'COMPLETED' && check.result === 'PASSED' && check.completedAt) {
        const completedDate = new Date(check.completedAt);
        const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        return completedDate > oneYearAgo;
      }
      return false;
    });
    
    if (recentCheck && data.checkType !== 'COMPREHENSIVE') {
      return createErrorResponse(409, 'CONFLICT', 'You have a recent successful background check. Comprehensive check required for renewal.');
    }
    
    // Calculate pricing based on check type
    const pricing = calculateBackgroundCheckPricing(data.checkType);
    
    // Create background check record
    const backgroundCheck = await backgroundCheckRepo.createBackgroundCheck(user.userId, {
      checkType: data.checkType,
      status: 'PENDING',
      personalInfo: data.personalInfo,
      address: data.address,
      previousAddresses: data.previousAddresses || [],
      employmentHistory: data.employmentHistory || [],
      educationHistory: data.educationHistory || [],
      references: data.references || [],
      consentAgreement: data.consentAgreement,
      consentDate: data.consentDate,
      pricing,
      estimatedCompletionDate: new Date(Date.now() + getEstimatedCompletionTime(data.checkType)).toISOString(),
    });
    
    // Create payment requirement
    await transactionRepo.create({
      userId: user.userId,
      type: 'BACKGROUND_CHECK_PAYMENT',
      amount: pricing.total,
      currency: 'USD',
      status: 'PENDING',
      relatedObjectType: 'BACKGROUND_CHECK',
      relatedObjectId: backgroundCheck.id,
      description: `Payment for ${data.checkType.toLowerCase()} background check`,
    });
    
    // Submit to background check service
    try {
      const externalCheckId = await backgroundCheckService.submitCheck({
        checkId: backgroundCheck.id,
        checkType: data.checkType,
        personalInfo: data.personalInfo,
        address: data.address,
        previousAddresses: data.previousAddresses,
        employmentHistory: data.employmentHistory,
        educationHistory: data.educationHistory,
        references: data.references,
      });
      
      // Update with external check ID
      await backgroundCheckRepo.updateBackgroundCheck(backgroundCheck.id, {
        externalCheckId,
        status: 'IN_PROGRESS',
        submittedAt: new Date().toISOString(),
      });
      
    } catch (error) {
      logger.error('Failed to submit to external background check service', { checkId: backgroundCheck.id, error });
      
      // Update status to failed
      await backgroundCheckRepo.updateBackgroundCheck(backgroundCheck.id, {
        status: 'FAILED',
        failureReason: 'Failed to submit to background check service',
        completedAt: new Date().toISOString(),
      });
      
      return createErrorResponse(400, 'VALIDATION_ERROR', 'Failed to submit background check. Please try again.');
    }
    
    // Send notification
    await notificationService.sendBackgroundCheckNotification(
      user.userId,
      backgroundCheck,
      'CHECK_INITIATED'
    );
    
    // Send admin notification for manual review if needed
    if (data.checkType === 'COMPREHENSIVE') {
      await notificationService.sendAdminNotification(
        'NEW_COMPREHENSIVE_BACKGROUND_CHECK',
        {
          checkId: backgroundCheck.id,
          userId: user.userId,
          checkType: data.checkType,
        }
      );
    }
    
    logger.info('Background check initiated successfully', { 
      checkId: backgroundCheck.id, 
      userId: user.userId, 
      checkType: data.checkType 
    });
    
    return createResponse(200, {
      backgroundCheck: {
        id: backgroundCheck.id,
        checkType: backgroundCheck.checkType,
        status: backgroundCheck.status,
        pricing: backgroundCheck.pricing,
        estimatedCompletionDate: backgroundCheck.estimatedCompletionDate,
        createdAt: backgroundCheck.createdAt,
      },
      message: 'Background check initiated successfully',
      nextSteps: [
        'Complete payment to begin processing',
        'You will receive updates via notifications',
        `Estimated completion: ${getEstimatedCompletionTime(data.checkType) / (24 * 60 * 60 * 1000)} business days`,
      ],
    });
    
  } catch (error) {
    logger.error('Failed to initiate background check', { error });
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(400, 'VALIDATION_ERROR', error.errors[0].message);
    }
    
    if (error.name === 'UnauthorizedError') {
      return createErrorResponse(401, 'UNAUTHORIZED', error.message);
    }
    
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to initiate background check');
  }
};

function calculateBackgroundCheckPricing(checkType: string) {
  const basePrices = {
    IDENTITY: 25.00,
    CRIMINAL: 35.00,
    EMPLOYMENT: 45.00,
    EDUCATION: 30.00,
    COMPREHENSIVE: 120.00,
  };
  
  const baseAmount = basePrices[checkType as keyof typeof basePrices];
  const processingFee = baseAmount * 0.1; // 10% processing fee
  const total = baseAmount + processingFee;
  
  return {
    baseAmount,
    processingFee,
    total,
  };
}

function getEstimatedCompletionTime(checkType: string): number {
  // Return time in milliseconds
  const completionTimes = {
    IDENTITY: 1 * 24 * 60 * 60 * 1000, // 1 day
    CRIMINAL: 3 * 24 * 60 * 60 * 1000, // 3 days
    EMPLOYMENT: 5 * 24 * 60 * 60 * 1000, // 5 days
    EDUCATION: 3 * 24 * 60 * 60 * 1000, // 3 days
    COMPREHENSIVE: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  
  return completionTimes[checkType as keyof typeof completionTimes] || 5 * 24 * 60 * 60 * 1000;
}