// Send test notification with DynamoDB

import type { APIGatewayProxyResult } from 'aws-lambda';
import { NotificationRepository } from '@/shared/repositories/notification.repository';
import { PushNotificationService } from '@/shared/services/push-notification';
import { EmailService } from '@/shared/services/email';
import { SMSService } from '@/shared/services/sms';
import { success, badRequest } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';
import { z } from 'zod';

const testNotificationSchema = z.object({
  type: z.enum(['push', 'email', 'sms', 'all']).default('push'),
  message: z.string().max(200).optional(),
});

const notificationRepo = new NotificationRepository();
const pushService = new PushNotificationService();
const emailService = new EmailService();
const smsService = new SMSService();

async function sendTestNotificationHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Send test notification request', { userId });
  
  const body = JSON.parse(event.body || '{}');
  const data = testNotificationSchema.parse(body);
  
  const testMessage = data.message || 'This is a test notification to verify your notification settings are working correctly.';
  const results = [];
  
  try {
    // Get user notification settings
    const settings = await notificationRepo.getNotificationSettings(userId);
    if (!settings) {
      return badRequest('Notification settings not found. Please enable notifications first.');
    }
    
    // Create test notification record
    const notification = await notificationRepo.create({
      userId,
      type: 'SYSTEM_TEST',
      title: 'Test Notification',
      message: testMessage,
      isRead: false,
      priority: 'normal',
      data: {
        testType: data.type,
        sentAt: new Date().toISOString(),
      },
    });
    
    // Send push notification
    if ((data.type === 'push' || data.type === 'all') && settings.pushEnabled) {
      try {
        const pushTokens = await notificationRepo.getPushTokens(userId);
        
        for (const token of pushTokens) {
          if (token.isActive) {
            await pushService.sendNotification(token.token, token.platform, {
              title: 'HandShakeMe Test',
              body: testMessage,
              data: {
                type: 'test',
                notificationId: notification.id,
              },
            });
            
            results.push({
              type: 'push',
              platform: token.platform,
              status: 'sent',
              target: `${token.platform} device`,
            });
          }
        }
      } catch (pushError) {
        logger.error('Push test notification failed', { userId, error: pushError });
        results.push({
          type: 'push',
          status: 'failed',
          error: pushError.message,
        });
      }
    }
    
    // Send email notification
    if ((data.type === 'email' || data.type === 'all') && settings.emailEnabled) {
      try {
        const user = await notificationRepo.getUserById(userId);
        if (user?.email) {
          await emailService.sendNotification(user.email, {
            subject: 'HandShakeMe Test Notification',
            template: 'test_notification',
            data: {
              firstName: user.firstName,
              message: testMessage,
              testTime: new Date().toISOString(),
            },
          });
          
          results.push({
            type: 'email',
            status: 'sent',
            target: user.email,
          });
        } else {
          results.push({
            type: 'email',
            status: 'skipped',
            reason: 'No email address',
          });
        }
      } catch (emailError) {
        logger.error('Email test notification failed', { userId, error: emailError });
        results.push({
          type: 'email',
          status: 'failed',
          error: emailError.message,
        });
      }
    }
    
    // Send SMS notification
    if ((data.type === 'sms' || data.type === 'all') && settings.smsEnabled) {
      try {
        const user = await notificationRepo.getUserById(userId);
        if (user?.phone) {
          await smsService.sendNotification(user.phone, {
            message: `HandShakeMe Test: ${testMessage}`,
            type: 'test',
          });
          
          results.push({
            type: 'sms',
            status: 'sent',
            target: user.phone,
          });
        } else {
          results.push({
            type: 'sms',
            status: 'skipped',
            reason: 'No phone number',
          });
        }
      } catch (smsError) {
        logger.error('SMS test notification failed', { userId, error: smsError });
        results.push({
          type: 'sms',
          status: 'failed',
          error: smsError.message,
        });
      }
    }
    
    // Update notification with results
    await notificationRepo.update(notification.id, {
      data: {
        ...notification.data,
        testResults: results,
        completedAt: new Date().toISOString(),
      },
    });
    
    const successCount = results.filter(r => r.status === 'sent').length;
    const failureCount = results.filter(r => r.status === 'failed').length;
    
    logger.info('Test notification completed', { 
      userId, 
      successCount, 
      failureCount, 
      totalAttempts: results.length 
    });
    
    return success({ 
      message: `Test notification completed. ${successCount} sent, ${failureCount} failed.`,
      notification: {
        id: notification.id,
        createdAt: notification.createdAt,
      },
      results,
      summary: {
        total: results.length,
        sent: successCount,
        failed: failureCount,
        skipped: results.filter(r => r.status === 'skipped').length,
      },
    }, { statusCode: 201 });
    
  } catch (error) {
    logger.error('Test notification failed', { userId, error });
    throw error;
  }
}

export const handler = withErrorHandler(withRequestTransform(withAuth(sendTestNotificationHandler)));
