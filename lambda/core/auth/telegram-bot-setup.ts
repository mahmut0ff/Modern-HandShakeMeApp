// Telegram Bot Setup - Set webhook and commands

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { TelegramService } from '../shared/services/telegram';
import { success, badRequest } from '../shared/utils/response';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { logger } from '../shared/utils/logger';

interface TelegramBotCommand {
  command: string;
  description: string;
}

async function telegramBotSetupHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  logger.info('Telegram bot setup request');
  
  const webhookUrl = event.queryStringParameters?.webhookUrl;
  const action = event.queryStringParameters?.action || 'setup';
  
  if (!webhookUrl && action === 'setup') {
    return badRequest('webhookUrl is required for setup');
  }
  
  const telegramService = TelegramService.getInstance();
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!botToken) {
    return badRequest('TELEGRAM_BOT_TOKEN environment variable is required');
  }
  
  try {
    if (action === 'setup') {
      // Set webhook
      const webhookResponse = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['message'],
          drop_pending_updates: true,
        }),
      });
      
      if (!webhookResponse.ok) {
        const error: any = await webhookResponse.json();
        throw new Error(`Failed to set webhook: ${error.description}`);
      }
      
      const webhookResult = await webhookResponse.json();
      logger.info('Webhook set successfully', { webhookUrl, result: webhookResult });
      
      // Set bot commands
      const commands: TelegramBotCommand[] = [
        {
          command: 'start',
          description: 'Начать работу с ботом',
        },
        {
          command: 'help',
          description: 'Получить помощь по использованию бота',
        },
      ];
      
      const commandsResponse = await fetch(`https://api.telegram.org/bot${botToken}/setMyCommands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commands }),
      });
      
      if (!commandsResponse.ok) {
        const error: any = await commandsResponse.json();
        throw new Error(`Failed to set commands: ${error.description}`);
      }
      
      const commandsResult = await commandsResponse.json();
      logger.info('Bot commands set successfully', { commands, result: commandsResult });
      
      return success({
        message: 'Telegram bot setup completed successfully',
        webhook: webhookResult,
        commands: commandsResult,
      });
      
    } else if (action === 'info') {
      // Get bot info
      const infoResponse = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
      
      if (!infoResponse.ok) {
        const error: any = await infoResponse.json();
        throw new Error(`Failed to get bot info: ${error.description}`);
      }
      
      const botInfo: any = await infoResponse.json();
      
      // Get webhook info
      const webhookInfoResponse = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
      const webhookInfo: any = webhookInfoResponse.ok ? await webhookInfoResponse.json() : null;
      
      logger.info('Bot info retrieved', { botInfo: botInfo.result });
      
      return success({
        bot: botInfo.result,
        webhook: webhookInfo?.result || null,
      });
      
    } else if (action === 'delete') {
      // Delete webhook
      const deleteResponse = await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drop_pending_updates: true,
        }),
      });
      
      if (!deleteResponse.ok) {
        const error: any = await deleteResponse.json();
        throw new Error(`Failed to delete webhook: ${error.description}`);
      }
      
      const deleteResult = await deleteResponse.json();
      logger.info('Webhook deleted successfully', { result: deleteResult });
      
      return success({
        message: 'Webhook deleted successfully',
        result: deleteResult,
      });
      
    } else {
      return badRequest('Invalid action. Use: setup, info, or delete');
    }
    
  } catch (error) {
    logger.error('Telegram bot setup failed', error);
    throw error;
  }
}

export const handler = withErrorHandler(telegramBotSetupHandler);