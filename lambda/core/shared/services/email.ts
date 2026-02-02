// Email Service - Stub implementation

import { logger } from '../utils/logger';

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

export class EmailService {
  async send(payload: EmailPayload): Promise<boolean> {
    logger.info('Email (stub)', { to: payload.to, subject: payload.subject });
    // TODO: Implement actual email sending via SES
    return true;
  }

  async sendNotification(to: string, subject: string, body: string): Promise<boolean> {
    return this.send({ to, subject, body });
  }

  async sendTemplate(to: string, templateName: string, data: Record<string, any>): Promise<boolean> {
    logger.info('Email template (stub)', { to, templateName, data });
    // TODO: Implement template-based email sending
    return true;
  }
}
