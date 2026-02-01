import AWS from 'aws-sdk';
import { logger } from '../utils/logger';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
  priority?: 'normal' | 'high';
}

export class PushNotificationService {
  private sns: AWS.SNS;

  constructor() {
    this.sns = new AWS.SNS({
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }

  /**
   * Validate push token format based on platform
   */
  validateTokenFormat(token: string, platform: 'IOS' | 'ANDROID' | 'WEB'): boolean {
    if (!token || token.length === 0) {
      return false;
    }

    switch (platform) {
      case 'IOS':
        // iOS tokens are 64 hex characters
        return /^[a-fA-F0-9]{64}$/.test(token);
      case 'ANDROID':
        // FCM tokens are longer and contain various characters
        return token.length > 100 && /^[a-zA-Z0-9_-]+$/.test(token);
      case 'WEB':
        // Web push tokens are base64-like strings
        return token.length > 50;
      default:
        return false;
    }
  }

  /**
   * Send push notification to a specific token
   */
  async sendNotification(
    token: string,
    platform: 'IOS' | 'ANDROID' | 'WEB',
    payload: PushNotificationPayload
  ): Promise<boolean> {
    try {
      const platformApplicationArn = this.getPlatformApplicationArn(platform);
      if (!platformApplicationArn) {
        logger.warn('Platform application ARN not configured', { platform });
        return false;
      }

      // Create platform endpoint
      const endpointResult = await this.sns.createPlatformEndpoint({
        PlatformApplicationArn: platformApplicationArn,
        Token: token,
      }).promise();

      const endpointArn = endpointResult.EndpointArn;
      if (!endpointArn) {
        throw new Error('Failed to create platform endpoint');
      }

      // Prepare message based on platform
      const message = this.formatMessage(platform, payload);

      // Send notification
      await this.sns.publish({
        TargetArn: endpointArn,
        Message: JSON.stringify(message),
        MessageStructure: 'json',
      }).promise();

      logger.info('Push notification sent successfully', {
        platform,
        title: payload.title,
        endpointArn,
      });

      return true;
    } catch (error) {
      logger.error('Failed to send push notification', {
        platform,
        title: payload.title,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Send test notification to verify token
   */
  async sendTestNotification(
    token: string,
    platform: 'IOS' | 'ANDROID' | 'WEB',
    payload: PushNotificationPayload
  ): Promise<void> {
    const success = await this.sendNotification(token, platform, payload);
    if (!success) {
      throw new Error('Test notification failed');
    }
  }

  /**
   * Send notification to multiple tokens
   */
  async sendBulkNotification(
    tokens: Array<{ token: string; platform: 'IOS' | 'ANDROID' | 'WEB' }>,
    payload: PushNotificationPayload
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    const promises = tokens.map(async ({ token, platform }) => {
      try {
        const result = await this.sendNotification(token, platform, payload);
        if (result) {
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
        logger.error('Bulk notification failed for token', { platform, error });
      }
    });

    await Promise.all(promises);

    logger.info('Bulk push notification completed', {
      total: tokens.length,
      success,
      failed,
      title: payload.title,
    });

    return { success, failed };
  }

  /**
   * Get platform application ARN based on platform
   */
  private getPlatformApplicationArn(platform: 'IOS' | 'ANDROID' | 'WEB'): string | null {
    switch (platform) {
      case 'IOS':
        return process.env.SNS_PLATFORM_APPLICATION_ARN_IOS || null;
      case 'ANDROID':
        return process.env.SNS_PLATFORM_APPLICATION_ARN_ANDROID || null;
      case 'WEB':
        return process.env.SNS_PLATFORM_APPLICATION_ARN_WEB || null;
      default:
        return null;
    }
  }

  /**
   * Format message for specific platform
   */
  private formatMessage(platform: 'IOS' | 'ANDROID' | 'WEB', payload: PushNotificationPayload): any {
    const baseMessage = {
      default: payload.body,
    };

    switch (platform) {
      case 'IOS':
        return {
          ...baseMessage,
          APNS: JSON.stringify({
            aps: {
              alert: {
                title: payload.title,
                body: payload.body,
              },
              badge: payload.badge || 1,
              sound: payload.sound || 'default',
              'content-available': 1,
            },
            data: payload.data || {},
          }),
        };

      case 'ANDROID':
        return {
          ...baseMessage,
          GCM: JSON.stringify({
            notification: {
              title: payload.title,
              body: payload.body,
              sound: payload.sound || 'default',
            },
            data: {
              ...payload.data,
              title: payload.title,
              body: payload.body,
            },
            priority: payload.priority || 'high',
          }),
        };

      case 'WEB':
        return {
          ...baseMessage,
          default: JSON.stringify({
            title: payload.title,
            body: payload.body,
            data: payload.data || {},
            requireInteraction: true,
          }),
        };

      default:
        return baseMessage;
    }
  }

  /**
   * Delete platform endpoint (cleanup invalid tokens)
   */
  async deleteEndpoint(endpointArn: string): Promise<boolean> {
    try {
      await this.sns.deleteEndpoint({
        EndpointArn: endpointArn,
      }).promise();

      logger.info('Platform endpoint deleted', { endpointArn });
      return true;
    } catch (error) {
      logger.error('Failed to delete platform endpoint', {
        endpointArn,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}