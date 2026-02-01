// Register push notification token with DynamoDB

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { NotificationRepository } from '@/shared/repositories/notification.repository';
import { success, badRequest } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { validate } from '@/shared/utils/validation';
import { logger } from '@/shared/utils/logger';
import { PushNotificationService } from '@/shared/services/push-notification';

const pushTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(['IOS', 'ANDROID', 'WEB']),
  deviceId: z.string().optional(),
  appVersion: z.string().optional(),
  osVersion: z.string().optional(),
});

const notificationRepo = new NotificationRepository();
const pushService = new PushNotificationService();

async function registerPushTokenHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Register push token request', { userId });
  
  const body = JSON.parse(event.body || '{}');
  const data = validate(pushTokenSchema, body);
  
  try {
    // Validate token format based on platform
    if (!pushService.validateTokenFormat(data.token, data.platform)) {
      return badRequest('Invalid token format for platform');
    }
    
    // Check if token is already registered for another user
    const existingToken = await notificationRepo.findPushTokenByToken(data.token);
    if (existingToken && existingToken.userId !== userId) {
      // Remove token from previous user
      await notificationRepo.deletePushToken(existingToken.userId, data.platform);
      logger.info('Moved push token to new user', { 
        oldUserId: existingToken.userId, 
        newUserId: userId,
        platform: data.platform 
      });
    }
    
    // Register/update push token
    const pushToken = await notificationRepo.upsertPushToken({
      userId,
      token: data.token,
      platform: data.platform,
      deviceId: data.deviceId,
      appVersion: data.appVersion,
      osVersion: data.osVersion,
      isActive: true,
      registeredAt: new Date().toISOString(),
    });
    
    // Test push notification to verify token works
    try {
      await pushService.sendTestNotification(data.token, data.platform, {
        title: 'HandShakeMe',
        body: 'Push notifications enabled successfully!',
        data: { type: 'test' },
      });
      
      // Mark token as verified
      await notificationRepo.updatePushToken(userId, data.platform, {
        isVerified: true,
        lastVerifiedAt: new Date().toISOString(),
      });
      
      logger.info('Push token registered and verified', { userId, platform: data.platform });
      
    } catch (testError) {
      logger.warn('Push token registered but test failed', { 
        userId, 
        platform: data.platform, 
        error: testError 
      });
      
      // Mark token as unverified but still save it
      await notificationRepo.updatePushToken(userId, data.platform, {
        isVerified: false,
        lastTestError: testError.message,
      });
    }
    
    // Update user notification settings if first time
    const userSettings = await notificationRepo.getNotificationSettings(userId);
    if (!userSettings) {
      await notificationRepo.createDefaultNotificationSettings(userId, {
        pushEnabled: true,
        platform: data.platform,
      });
    }
    
    return success({
      ...pushToken,
      message: 'Push token registered successfully',
    }, { statusCode: 201 });
    
  } catch (error) {
    logger.error('Failed to register push token', { userId, error });
    throw error;
  }
}

export const handler = withErrorHandler(withRequestTransform(withAuth(registerPushTokenHandler)));
