/**
 * SMS Service
 * Handles sending SMS messages for verification codes
 */

import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { logger } from '../utils/logger';

export class SMSService {
  private snsClient: SNSClient;
  private isTestMode: boolean;

  constructor() {
    this.isTestMode = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';
    
    if (!this.isTestMode) {
      this.snsClient = new SNSClient({
        region: process.env.AWS_REGION || 'us-east-1'
      });
    }
  }

  /**
   * Send SMS message
   */
  async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    try {
      // In test/dev mode, just log the message
      if (this.isTestMode) {
        logger.info('📱 SMS (Test Mode)', {
          phoneNumber,
          message
        });
        console.log(`📱 SMS to ${phoneNumber}: ${message}`);
        return true;
      }

      // In production, send via AWS SNS
      const command = new PublishCommand({
        PhoneNumber: phoneNumber,
        Message: message,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional'
          }
        }
      });

      const response = await this.snsClient.send(command);
      
      logger.info('SMS sent successfully', {
        phoneNumber,
        messageId: response.MessageId
      });

      return true;
    } catch (error) {
      logger.error('Failed to send SMS', {
        phoneNumber,
        error
      });
      
      // In test mode, don't fail
      if (this.isTestMode) {
        return true;
      }
      
      throw error;
    }
  }

  /**
   * Send verification code
   */
  async sendVerificationCode(phoneNumber: string, code: string): Promise<boolean> {
    const message = `Your verification code is: ${code}. Valid for 10 minutes.`;
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send OTP code
   */
  async sendOTP(phoneNumber: string, code: string): Promise<boolean> {
    const message = `Your OTP code is: ${code}. Do not share this code with anyone.`;
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send notification
   */
  async sendNotification(phoneNumber: string, notification: string): Promise<boolean> {
    return this.sendSMS(phoneNumber, notification);
  }

  /**
   * Generate verification code
   */
  generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    // Basic validation for international format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }
}
