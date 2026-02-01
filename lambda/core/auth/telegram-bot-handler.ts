// Telegram Bot Handler for authentication codes

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { TelegramAuthSessionRepository } from '../shared/repositories/telegram-auth-session.repository';
import { UserRepository } from '../shared/repositories/user.repository';
import { TelegramService } from '../shared/services/telegram';
import { success, badRequest } from '../shared/utils/response';
import { withErrorHandler, ValidationError } from '../shared/middleware/errorHandler';
import { withTelegramWebhookSecurity } from '../shared/middleware/telegram-webhook';
import { logger } from '../shared/utils/logger';

// Telegram webhook update schema
const telegramUpdateSchema = z.object({
  update_id: z.number(),
  message: z.object({
    message_id: z.number(),
    from: z.object({
      id: z.number(),
      is_bot: z.boolean(),
      first_name: z.string(),
      last_name: z.string().optional(),
      username: z.string().optional(),
      language_code: z.string().optional(),
    }),
    chat: z.object({
      id: z.number(),
      first_name: z.string(),
      last_name: z.string().optional(),
      username: z.string().optional(),
      type: z.string(),
    }),
    date: z.number(),
    text: z.string(),
  }).optional(),
});

async function telegramBotHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  logger.info('Telegram bot webhook received');
  
  const body = JSON.parse(event.body || '{}');
  
  // Validate Telegram update
  let update;
  try {
    update = telegramUpdateSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Invalid Telegram update format', { error: error.errors });
      return success({ ok: true }); // Return OK to avoid retries
    }
    throw error;
  }
  
  // Only process text messages
  if (!update.message || !update.message.text) {
    logger.info('Ignoring non-text message');
    return success({ ok: true });
  }
  
  const message = update.message;
  const chatId = message.chat.id.toString();
  const text = message.text.trim();
  
  logger.info('Processing Telegram message', {
    chatId,
    userId: message.from.id,
    text: text.substring(0, 20), // Log first 20 chars only
  });
  
  const sessionRepo = new TelegramAuthSessionRepository();
  const userRepo = new UserRepository();
  const telegramService = TelegramService.getInstance();
  
  // Send typing indicator
  await telegramService.sendTypingAction(chatId);
  
  // Handle /start command
  if (text === '/start') {
    await telegramService.sendMessage(
      chatId,
      '👋 *Добро пожаловать в HandShakeMe!*\n\n' +
      '🔐 Для входа в приложение:\n' +
      '1. Откройте приложение HandShakeMe\n' +
      '2. Нажмите "Войти через Telegram"\n' +
      '3. Скопируйте 4-значный код\n' +
      '4. Отправьте код мне в этот чат\n\n' +
      '⏰ Код действителен 10 минут\n' +
      '❓ Используйте /help для получения помощи'
    );
    return success({ ok: true });
  }
  
  // Handle help command
  if (text === '/help') {
    await telegramService.sendMessage(
      chatId,
      '🆘 *Помощь по использованию бота*\n\n' +
      '🔐 *Вход в приложение:*\n' +
      '1. Откройте приложение HandShakeMe\n' +
      '2. Нажмите "Войти через Telegram"\n' +
      '3. Скопируйте 4-значный код\n' +
      '4. Отправьте код мне в этот чат\n\n' +
      '⏰ Код действителен 10 минут\n' +
      '📱 Пример кода: `1234`\n\n' +
      '❓ *Проблемы?*\n' +
      '• Убедитесь, что код 4-значный\n' +
      '• Проверьте, что код не истек\n' +
      '• Попробуйте получить новый код\n\n' +
      '📞 Поддержка: @handshakeme\\_support'
    );
    return success({ ok: true });
  }
  
  // Check if message is a 4-digit code
  const codeMatch = text.match(/^\d{4}$/);
  if (!codeMatch) {
    await telegramService.sendMessage(
      chatId,
      '❌ *Неверный формат кода*\n\n' +
      '📱 Отправьте 4-значный код из приложения\n' +
      '✅ Пример: `1234`\n\n' +
      '❓ Нужна помощь? Используйте /help'
    );
    return success({ ok: true });
  }
  
  const code = codeMatch[0];
  
  // Find session by code
  const session = await sessionRepo.findByCode(code);
  
  if (!session) {
    logger.warn('Invalid or expired auth code', {
      code,
      telegramUserId: message.from.id,
    });
    
    await telegramService.sendMessage(
      chatId,
      `❌ *Код ${code} недействителен*\n\n` +
      '🔍 Возможные причины:\n' +
      '• Код истек (действует 10 минут)\n' +
      '• Код уже был использован\n' +
      '• Код введен неверно\n\n' +
      '🔄 Получите новый код в приложении\n' +
      '❓ Нужна помощь? Используйте /help'
    );
    return success({ ok: true });
  }
  
  // Find or create user
  let user = await userRepo.findByTelegramId(message.from.id.toString());
  
  if (!user) {
    // Create new user
    user = await userRepo.create({
      firstName: message.from.first_name,
      lastName: message.from.last_name || '',
      telegramId: message.from.id.toString(),
      telegramUsername: message.from.username,
      role: 'CLIENT', // Default role
      phone: '',
      email: undefined,
      isPhoneVerified: true, // Telegram users are considered verified
    });
    
    logger.info('New user created via Telegram bot', {
      userId: user.id,
      telegramUserId: message.from.id,
    });
    
    await telegramService.sendMessage(
      chatId,
      `🎉 *Добро пожаловать в HandShakeMe, ${user.firstName}!*\n\n` +
      '✅ Ваш аккаунт успешно создан\n' +
      '🔗 Аккаунт привязан к Telegram\n' +
      '📱 Теперь вы можете использовать приложение\n\n' +
      '🔍 *Что дальше?*\n' +
      '• Ищите заказы или мастеров\n' +
      '• Создавайте свои заказы\n' +
      '• Общайтесь с другими пользователями\n\n' +
      '🚀 Удачи в работе!'
    );
  } else {
    // Update existing user data
    await userRepo.update(user.id, {
      telegramUsername: message.from.username,
      firstName: message.from.first_name,
      lastName: message.from.last_name || user.lastName,
      lastLoginAt: new Date().toISOString(),
    });
    
    logger.info('Existing user updated via Telegram bot', {
      userId: user.id,
      telegramUserId: message.from.id,
    });
    
    await telegramService.sendMessage(
      chatId,
      `✅ *Код ${code} подтвержден!*\n\n` +
      `👋 С возвращением, ${user.firstName}!\n` +
      '🔓 Вы успешно вошли в HandShakeMe\n\n' +
      '📱 Можете продолжить работу в приложении'
    );
  }
  
  // Associate user with session
  await sessionRepo.markAsUsed(session.id, user.id);
  
  logger.info('Telegram authentication code processed successfully', {
    userId: user.id,
    sessionId: session.id,
    code,
  });
  
  return success({ ok: true });
}

export const handler = withErrorHandler(withTelegramWebhookSecurity(telegramBotHandler));