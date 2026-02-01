import AWS from 'aws-sdk';
import { logger } from '../utils/logger';

export interface EmailNotificationPayload {
  subject: string;
  template: string;
  data: Record<string, any>;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class EmailService {
  private ses: AWS.SES;

  constructor() {
    this.ses = new AWS.SES({
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }

  /**
   * Send email notification
   */
  async sendNotification(
    email: string,
    payload: EmailNotificationPayload
  ): Promise<boolean> {
    try {
      const template = this.getEmailTemplate(payload.template, payload.data);
      
      const params = {
        Source: process.env.SES_FROM_EMAIL || 'noreply@handshakeme.com',
        Destination: {
          ToAddresses: [email],
        },
        Message: {
          Subject: {
            Data: payload.subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: template.html,
              Charset: 'UTF-8',
            },
            Text: {
              Data: template.text,
              Charset: 'UTF-8',
            },
          },
        },
      };

      const result = await this.ses.sendEmail(params).promise();
      
      logger.info('Email notification sent successfully', {
        email,
        template: payload.template,
        messageId: result.MessageId,
      });

      return true;
    } catch (error) {
      logger.error('Failed to send email notification', {
        email,
        template: payload.template,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Send bulk email notifications
   */
  async sendBulkNotification(
    emails: string[],
    payload: EmailNotificationPayload
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    const promises = emails.map(async (email) => {
      try {
        const result = await this.sendNotification(email, payload);
        if (result) {
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
        logger.error('Bulk email notification failed', { email, error });
      }
    });

    await Promise.all(promises);

    logger.info('Bulk email notification completed', {
      total: emails.length,
      success,
      failed,
      template: payload.template,
    });

    return { success, failed };
  }

  /**
   * Get email template based on template name and data
   */
  private getEmailTemplate(templateName: string, data: any): EmailTemplate {
    switch (templateName) {
      case 'test_notification':
        return {
          subject: 'HandShakeMe Test Notification',
          html: `
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #2c3e50;">Test Notification</h2>
                  <p>Hello ${data.firstName || 'User'}!</p>
                  <p>${data.message}</p>
                  <p><strong>Test Time:</strong> ${new Date(data.testTime).toLocaleString()}</p>
                  <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>This is a test notification to verify your email settings are working correctly.</strong></p>
                  </div>
                  <p>If you received this email, your notification settings are configured properly!</p>
                  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                  <p style="font-size: 12px; color: #666;">
                    Best regards,<br>
                    HandShakeMe Team
                  </p>
                </div>
              </body>
            </html>
          `,
          text: `
            Test Notification
            
            Hello ${data.firstName || 'User'}!
            
            ${data.message}
            
            Test Time: ${new Date(data.testTime).toLocaleString()}
            
            This is a test notification to verify your email settings are working correctly.
            
            If you received this email, your notification settings are configured properly!
            
            Best regards,
            HandShakeMe Team
          `,
        };

      case 'new_order_notification':
        return {
          subject: `New Order: ${data.orderTitle}`,
          html: `
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #2c3e50;">New Order Available</h2>
                  <p>Hello ${data.firstName || 'Master'}!</p>
                  <p>A new order has been posted that matches your skills:</p>
                  <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">${data.orderTitle}</h3>
                    <p><strong>Budget:</strong> ${data.budget} KGS</p>
                    <p><strong>Location:</strong> ${data.location}</p>
                    <p><strong>Description:</strong> ${data.description}</p>
                  </div>
                  <p>Don't miss this opportunity! Apply now to get selected.</p>
                  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                  <p style="font-size: 12px; color: #666;">
                    Best regards,<br>
                    HandShakeMe Team
                  </p>
                </div>
              </body>
            </html>
          `,
          text: `
            New Order Available
            
            Hello ${data.firstName || 'Master'}!
            
            A new order has been posted that matches your skills:
            
            ${data.orderTitle}
            Budget: ${data.budget} KGS
            Location: ${data.location}
            Description: ${data.description}
            
            Don't miss this opportunity! Apply now to get selected.
            
            Best regards,
            HandShakeMe Team
          `,
        };

      case 'application_accepted':
        return {
          subject: 'Your Application Was Accepted! 🎉',
          html: `
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #27ae60;">Congratulations! Your Application Was Accepted</h2>
                  <p>Hello ${data.firstName || 'Master'}!</p>
                  <p>Great news! Your application for the following order has been accepted:</p>
                  <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">${data.orderTitle}</h3>
                    <p><strong>Client:</strong> ${data.clientName}</p>
                    <p><strong>Project Value:</strong> ${data.projectValue} KGS</p>
                  </div>
                  <p>The project has been created and you can now start working. Please coordinate with the client for next steps.</p>
                  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                  <p style="font-size: 12px; color: #666;">
                    Best regards,<br>
                    HandShakeMe Team
                  </p>
                </div>
              </body>
            </html>
          `,
          text: `
            Congratulations! Your Application Was Accepted
            
            Hello ${data.firstName || 'Master'}!
            
            Great news! Your application for the following order has been accepted:
            
            ${data.orderTitle}
            Client: ${data.clientName}
            Project Value: ${data.projectValue} KGS
            
            The project has been created and you can now start working. Please coordinate with the client for next steps.
            
            Best regards,
            HandShakeMe Team
          `,
        };

      case 'new_message':
        return {
          subject: `New Message from ${data.senderName}`,
          html: `
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #2c3e50;">New Message</h2>
                  <p>Hello ${data.firstName || 'User'}!</p>
                  <p>You have received a new message from <strong>${data.senderName}</strong>:</p>
                  <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 0;">${data.messagePreview}</p>
                  </div>
                  <p>Open the app to read the full message and reply.</p>
                  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                  <p style="font-size: 12px; color: #666;">
                    Best regards,<br>
                    HandShakeMe Team
                  </p>
                </div>
              </body>
            </html>
          `,
          text: `
            New Message
            
            Hello ${data.firstName || 'User'}!
            
            You have received a new message from ${data.senderName}:
            
            ${data.messagePreview}
            
            Open the app to read the full message and reply.
            
            Best regards,
            HandShakeMe Team
          `,
        };

      default:
        return {
          subject: 'HandShakeMe Notification',
          html: `
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #2c3e50;">HandShakeMe Notification</h2>
                  <p>Hello!</p>
                  <p>You have a new notification from HandShakeMe.</p>
                  <p>Please open the app to view details.</p>
                  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                  <p style="font-size: 12px; color: #666;">
                    Best regards,<br>
                    HandShakeMe Team
                  </p>
                </div>
              </body>
            </html>
          `,
          text: `
            HandShakeMe Notification
            
            Hello!
            
            You have a new notification from HandShakeMe.
            Please open the app to view details.
            
            Best regards,
            HandShakeMe Team
          `,
        };
    }
  }

  /**
   * Verify email address with SES
   */
  async verifyEmailAddress(email: string): Promise<boolean> {
    try {
      await this.ses.verifyEmailIdentity({
        EmailAddress: email,
      }).promise();

      logger.info('Email address verification initiated', { email });
      return true;
    } catch (error) {
      logger.error('Failed to verify email address', { email, error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }
}