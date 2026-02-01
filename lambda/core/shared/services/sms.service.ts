import AWS from 'aws-sdk';
import { logger } from '../utils/logger';

export interface SMSNotificationPayload {
  message: string;
  type: 'notification' | 'verification' | 'alert' | 'test';
}

export class SMSService {
  private sns: AWS.SNS;

  constructor() {
    this.sns = new AWS.SNS({
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }

  /**
   * Send SMS notification
   */
  async sendNotification(
    phoneNumber: string,
    payload: SMSNotificationPayload
  ): Promise<boolean> {
    try {
      // Format phone number (ensure it starts with +)
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      // Prepare message with HandShakeMe branding
      const message = this.formatMessage(payload);

      const params = {
        PhoneNumber: formattedPhone,
        Message: message,
        MessageAttributes: {
          'AWS.SNS.SMS.SenderID': {
            DataType: 'String',
            StringValue: 'HandShakeMe',
          },
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: payload.type === 'verification' ? 'Transactional' : 'Promotional',
          },
        },
      };

      const result = await this.sns.publish(params).promise();
      
      logger.info('SMS notification sent successfully', {
        phoneNumber: this.maskPhoneNumber(formattedPhone),
        type: payload.type,
        messageId: result.MessageId,
      });

      return true;
    } catch (error) {
      logger.error('Failed to send SMS notification', {
        phoneNumber: this.maskPhoneNumber(phoneNumber),
        type: payload.type,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Send bulk SMS notifications
   */
  async sendBulkNotification(
    phoneNumbers: string[],
    payload: SMSNotificationPayload
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    const promises = phoneNumbers.map(async (phoneNumber) => {
      try {
        const result = await this.sendNotification(phoneNumber, payload);
        if (result) {
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
        logger.error('Bulk SMS notification failed', { 
          phoneNumber: this.maskPhoneNumber(phoneNumber), 
          error 
        });
      }
    });

    await Promise.all(promises);

    logger.info('Bulk SMS notification completed', {
      total: phoneNumbers.length,
      success,
      failed,
      type: payload.type,
    });

    return { success, failed };
  }

  /**
   * Send verification code via SMS
   */
  async sendVerificationCode(
    phoneNumber: string,
    code: string
  ): Promise<boolean> {
    return this.sendNotification(phoneNumber, {
      message: `Your HandShakeMe verification code is: ${code}. This code expires in 10 minutes.`,
      type: 'verification',
    });
  }

  /**
   * Format phone number to international format
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // If it starts with 996 (Kyrgyzstan), add +
    if (cleaned.startsWith('996')) {
      return `+${cleaned}`;
    }
    
    // If it starts with 0, replace with +996
    if (cleaned.startsWith('0')) {
      return `+996${cleaned.substring(1)}`;
    }
    
    // If it's a local number (7-9 digits), add +996
    if (cleaned.length >= 7 && cleaned.length <= 9) {
      return `+996${cleaned}`;
    }
    
    // If it doesn't start with +, add it
    if (!phoneNumber.startsWith('+')) {
      return `+${cleaned}`;
    }
    
    return phoneNumber;
  }

  /**
   * Format message based on type
   */
  private formatMessage(payload: SMSNotificationPayload): string {
    const maxLength = 160; // SMS character limit
    let message = payload.message;

    // Add branding for non-verification messages
    if (payload.type !== 'verification') {
      message = `HandShakeMe: ${message}`;
    }

    // Truncate if too long
    if (message.length > maxLength) {
      message = message.substring(0, maxLength - 3) + '...';
    }

    return message;
  }

  /**
   * Mask phone number for logging (privacy)
   */
  private maskPhoneNumber(phoneNumber: string): string {
    if (phoneNumber.length <= 4) {
      return phoneNumber;
    }
    
    const start = phoneNumber.substring(0, 4);
    const end = phoneNumber.substring(phoneNumber.length - 2);
    const middle = '*'.repeat(phoneNumber.length - 6);
    
    return `${start}${middle}${end}`;
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    // Basic validation for international phone numbers
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    return phoneRegex.test(`+${cleaned}`) && cleaned.length >= 7 && cleaned.length <= 15;
  }

  /**
   * Check if SMS is enabled for the region
   */
  async checkSMSSupport(phoneNumber: string): Promise<boolean> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      // Check if the phone number is supported by SNS
      const params = {
        phoneNumber: formattedPhone,
      };

      await this.sns.checkIfPhoneNumberIsOptedOut(params).promise();
      return true;
    } catch (error) {
      logger.warn('SMS not supported for phone number', {
        phoneNumber: this.maskPhoneNumber(phoneNumber),
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Get SMS delivery status (if supported)
   */
  async getDeliveryStatus(messageId: string): Promise<string | null> {
    try {
      // Note: SMS delivery status is not directly available in SNS
      // This would require additional setup with delivery status logging
      logger.info('SMS delivery status check requested', { messageId });
      return 'unknown';
    } catch (error) {
      logger.error('Failed to get SMS delivery status', { messageId, error });
      return null;
    }
  }
}