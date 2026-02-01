// Telegram Webhook Security Middleware

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import crypto from 'crypto';
import { unauthorized } from '../utils/response';
import { logger } from '../utils/logger';

export type TelegramWebhookHandler = (
  event: APIGatewayProxyEvent
) => Promise<APIGatewayProxyResult>;

/**
 * Constant-time string comparison to prevent timing attacks
 */
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(
    Buffer.from(a, 'utf8'),
    Buffer.from(b, 'utf8')
  );
}

/**
 * Middleware to verify Telegram webhook requests
 * Validates the X-Telegram-Bot-Api-Secret-Token header
 */
export function withTelegramWebhookSecurity(
  handler: TelegramWebhookHandler
): TelegramWebhookHandler {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      // Get secret token from headers
      const secretToken = event.headers['X-Telegram-Bot-Api-Secret-Token'] || 
                         event.headers['x-telegram-bot-api-secret-token'];
      
      // Get expected secret from environment
      const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
      
      // Skip validation in test mode
      const isTestMode = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';
      
      if (!isTestMode) {
        if (!expectedSecret) {
          logger.error('TELEGRAM_WEBHOOK_SECRET environment variable not set');
          return unauthorized('Webhook secret not configured');
        }
        
        if (!secretToken) {
          logger.warn('Missing Telegram webhook secret token');
          return unauthorized('Missing secret token');
        }
        
        // Use constant-time comparison to prevent timing attacks
        if (!secureCompare(secretToken, expectedSecret)) {
          logger.warn('Invalid Telegram webhook secret token');
          return unauthorized('Invalid secret token');
        }
      }
      
      // Validate request body exists
      if (!event.body) {
        logger.warn('Empty webhook request body');
        return unauthorized('Empty request body');
      }
      
      // Additional validation: check if body is valid JSON
      try {
        JSON.parse(event.body);
      } catch (error) {
        logger.warn('Invalid JSON in webhook request body');
        return unauthorized('Invalid JSON body');
      }
      
      logger.info('Telegram webhook security validation passed');
      
      return handler(event);
    } catch (error) {
      logger.error('Telegram webhook security validation failed', error);
      return unauthorized('Security validation failed');
    }
  };
}

/**
 * Alternative validation using HMAC-SHA256 (if using bot token as secret)
 * This is more secure but requires additional setup
 */
export function withTelegramWebhookHMAC(
  handler: TelegramWebhookHandler
): TelegramWebhookHandler {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const isTestMode = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';
      
      if (!isTestMode && botToken) {
        // Get signature from headers
        const signature = event.headers['X-Telegram-Signature'] || 
                         event.headers['x-telegram-signature'];
        
        if (!signature) {
          logger.warn('Missing Telegram webhook signature');
          return unauthorized('Missing signature');
        }
        
        if (!event.body) {
          logger.warn('Empty webhook request body');
          return unauthorized('Empty request body');
        }
        
        // Calculate expected signature
        const expectedSignature = crypto
          .createHmac('sha256', botToken)
          .update(event.body)
          .digest('hex');
        
        // Use constant-time comparison
        if (!secureCompare(signature, expectedSignature)) {
          logger.warn('Invalid Telegram webhook signature');
          return unauthorized('Invalid signature');
        }
      }
      
      logger.info('Telegram webhook HMAC validation passed');
      
      return handler(event);
    } catch (error) {
      logger.error('Telegram webhook HMAC validation failed', error);
      return unauthorized('HMAC validation failed');
    }
  };
}