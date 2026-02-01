// Notification Service for GDPR operations

import AWS from 'aws-sdk';
import { logger } from '../utils/logger';

export class NotificationService {
  private sns: AWS.SNS;
  private ses: AWS.SES;

  constructor() {
    this.sns = new AWS.SNS();
    this.ses = new AWS.SES();
  }

  /**
   * Send email notification
   */
  async sendEmail(
    email: string, 
    template: 'account_deleted' | 'data_export_ready', 
    data: any
  ): Promise<boolean> {
    try {
      const emailContent = this.getEmailContent(template, data);
      
      const params = {
        Source: process.env.FROM_EMAIL || 'noreply@handshakeme.com',
        Destination: {
          ToAddresses: [email]
        },
        Message: {
          Subject: {
            Data: emailContent.subject,
            Charset: 'UTF-8'
          },
          Body: {
            Html: {
              Data: emailContent.html,
              Charset: 'UTF-8'
            },
            Text: {
              Data: emailContent.text,
              Charset: 'UTF-8'
            }
          }
        }
      };

      await this.ses.sendEmail(params).promise();
      logger.info('Email sent successfully', { email, template });
      return true;
    } catch (error: any) {
      logger.error('Failed to send email', { email, template, error: error.message });
      return false;
    }
  }

  /**
   * Send push notification
   */
  async sendPushNotification(userId: string, message: any): Promise<boolean> {
    try {
      const topicArn = process.env.SNS_PUSH_TOPIC_ARN;
      if (!topicArn) {
        logger.warn('SNS_PUSH_TOPIC_ARN not configured, skipping push notification');
        return false;
      }

      await this.sns.publish({
        TopicArn: topicArn,
        Message: JSON.stringify(message),
        MessageAttributes: {
          userId: {
            DataType: 'String',
            StringValue: userId
          }
        }
      }).promise();

      logger.info('Push notification sent', { userId });
      return true;
    } catch (error: any) {
      logger.error('Failed to send push notification', { userId, error: error.message });
      return false;
    }
  }

  /**
   * Send admin alert
   */
  async sendAdminAlert(subject: string, message: string, severity: 'INFO' | 'WARNING' | 'ERROR' = 'INFO'): Promise<boolean> {
    try {
      const alertTopicArn = process.env.SNS_ADMIN_ALERT_TOPIC_ARN;
      if (!alertTopicArn) {
        logger.warn('SNS_ADMIN_ALERT_TOPIC_ARN not configured, skipping admin alert');
        return false;
      }

      await this.sns.publish({
        TopicArn: alertTopicArn,
        Subject: `[${severity}] ${subject}`,
        Message: JSON.stringify({
          severity,
          subject,
          message,
          timestamp: new Date().toISOString(),
          service: 'gdpr-service'
        })
      }).promise();

      logger.info('Admin alert sent', { subject, severity });
      return true;
    } catch (error: any) {
      logger.error('Failed to send admin alert', { subject, error: error.message });
      return false;
    }
  }

  /**
   * Get email content based on template
   */
  private getEmailContent(template: string, data: any): {
    subject: string;
    html: string;
    text: string;
  } {
    switch (template) {
      case 'account_deleted':
        return {
          subject: 'Ваш аккаунт был удален - HandShakeMe',
          html: `
            <html>
              <body>
                <h2>Подтверждение удаления аккаунта</h2>
                <p>Здравствуйте, ${data.firstName}!</p>
                <p>Ваш аккаунт в HandShakeMe был успешно удален ${new Date(data.deletedAt).toLocaleDateString('ru-RU')}.</p>
                <p>Все ваши персональные данные были анонимизированы в соответствии с требованиями GDPR.</p>
                <p>Архивные данные для юридического соответствия будут удалены через 30 дней.</p>
                <p>Если у вас есть вопросы, свяжитесь с нашей службой поддержки.</p>
                <br>
                <p>С уважением,<br>Команда HandShakeMe</p>
              </body>
            </html>
          `,
          text: `
            Подтверждение удаления аккаунта
            
            Здравствуйте, ${data.firstName}!
            
            Ваш аккаунт в HandShakeMe был успешно удален ${new Date(data.deletedAt).toLocaleDateString('ru-RU')}.
            
            Все ваши персональные данные были анонимизированы в соответствии с требованиями GDPR.
            Архивные данные для юридического соответствия будут удалены через 30 дней.
            
            Если у вас есть вопросы, свяжитесь с нашей службой поддержки.
            
            С уважением,
            Команда HandShakeMe
          `
        };

      case 'data_export_ready':
        return {
          subject: 'Экспорт ваших данных готов - HandShakeMe',
          html: `
            <html>
              <body>
                <h2>Экспорт данных готов</h2>
                <p>Здравствуйте!</p>
                <p>Ваш запрос на экспорт персональных данных был обработан.</p>
                <p>Данные включают: ${data.sections.join(', ')}</p>
                <p>Общее количество записей: ${data.totalRecords}</p>
                <p>Ссылки для скачивания действительны в течение 24 часов.</p>
                <br>
                <p>С уважением,<br>Команда HandShakeMe</p>
              </body>
            </html>
          `,
          text: `
            Экспорт данных готов
            
            Здравствуйте!
            
            Ваш запрос на экспорт персональных данных был обработан.
            Данные включают: ${data.sections.join(', ')}
            Общее количество записей: ${data.totalRecords}
            
            Ссылки для скачивания действительны в течение 24 часов.
            
            С уважением,
            Команда HandShakeMe
          `
        };

      default:
        return {
          subject: 'Уведомление от HandShakeMe',
          html: '<p>Уведомление от HandShakeMe</p>',
          text: 'Уведомление от HandShakeMe'
        };
    }
  }
}