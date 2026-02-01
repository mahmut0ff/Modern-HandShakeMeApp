// Telegram Bot Commands Handler

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { UserRepository } from '../shared/repositories/user.repository';
import { TelegramService } from '../shared/services/telegram';
import { success, badRequest } from '../shared/utils/response';
import { withErrorHandler, ValidationError } from '../shared/middleware/errorHandler';
import { logger } from '../shared/utils/logger';

// Schema for sending messages to users
const sendMessageSchema = z.object({
  chatId: z.string().min(1, 'Chat ID is required'),
  message: z.string().min(1, 'Message is required').max(4096, 'Message too long'),
  parseMode: z.enum(['Markdown', 'HTML']).optional(),
});

// Schema for broadcasting messages
const broadcastSchema = z.object({
  message: z.string().min(1, 'Message is required').max(4096, 'Message too long'),
  parseMode: z.enum(['Markdown', 'HTML']).optional(),
  userRole: z.enum(['CLIENT', 'MASTER', 'ALL']).optional().default('ALL'),
});

async function telegramBotCommandsHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  logger.info('Telegram bot commands request');
  
  const action = event.pathParameters?.action;
  
  if (!action) {
    return badRequest('Action is required');
  }
  
  const telegramService = TelegramService.getInstance();
  const userRepo = new UserRepository();
  
  try {
    switch (action) {
      case 'send-message': {
        const body = JSON.parse(event.body || '{}');
        
        let validatedData;
        try {
          validatedData = sendMessageSchema.parse(body);
        } catch (error) {
          if (error instanceof z.ZodError) {
            throw new ValidationError('Validation failed', error.errors);
          }
          throw error;
        }
        
        const sent = await telegramService.sendMessage(
          validatedData.chatId,
          validatedData.message,
          { parseMode: validatedData.parseMode }
        );
        
        if (!sent) {
          throw new Error('Failed to send message');
        }
        
        logger.info('Message sent successfully', {
          chatId: validatedData.chatId,
        });
        
        return success({
          message: 'Message sent successfully',
          chatId: validatedData.chatId,
        });
      }
      
      case 'broadcast': {
        const body = JSON.parse(event.body || '{}');
        
        let validatedData;
        try {
          validatedData = broadcastSchema.parse(body);
        } catch (error) {
          if (error instanceof z.ZodError) {
            throw new ValidationError('Validation failed', error.errors);
          }
          throw error;
        }
        
        // Get users with Telegram IDs
        const users = await userRepo.findUsersWithTelegram(validatedData.userRole);
        
        if (users.length === 0) {
          return success({
            message: 'No users found with Telegram accounts',
            sent: 0,
            failed: 0,
          });
        }
        
        let sent = 0;
        let failed = 0;
        
        // Send messages in batches to avoid rate limits
        const batchSize = 30; // Telegram allows 30 messages per second
        
        for (let i = 0; i < users.length; i += batchSize) {
          const batch = users.slice(i, i + batchSize);
          
          const promises = batch.map(async (user) => {
            try {
              if (user.telegramId) {
                await telegramService.sendMessage(
                  user.telegramId,
                  validatedData.message,
                  { parseMode: validatedData.parseMode }
                );
                sent++;
              }
            } catch (error) {
              logger.error('Failed to send broadcast message', {
                userId: user.id,
                telegramId: user.telegramId,
                error,
              });
              failed++;
            }
          });
          
          await Promise.all(promises);
          
          // Wait 1 second between batches to respect rate limits
          if (i + batchSize < users.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        logger.info('Broadcast completed', {
          totalUsers: users.length,
          sent,
          failed,
          userRole: validatedData.userRole,
        });
        
        return success({
          message: 'Broadcast completed',
          totalUsers: users.length,
          sent,
          failed,
          userRole: validatedData.userRole,
        });
      }
      
      case 'bot-info': {
        const botInfo = await telegramService.getBotInfo();
        
        if (!botInfo) {
          throw new Error('Failed to get bot information');
        }
        
        return success({
          bot: botInfo,
        });
      }
      
      case 'user-stats': {
        const stats = await userRepo.getTelegramUserStats();
        
        return success({
          stats,
        });
      }
      
      default:
        return badRequest(`Unknown action: ${action}`);
    }
    
  } catch (error) {
    logger.error('Telegram bot command failed', { action, error });
    throw error;
  }
}

export const handler = withErrorHandler(telegramBotCommandsHandler);