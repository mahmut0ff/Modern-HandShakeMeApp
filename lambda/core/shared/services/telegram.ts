/**
 * Telegram Service
 * Handles Telegram Bot API interactions and authentication codes
 */

import crypto from 'crypto';
import { logger } from '../utils/logger';

// Singleton instance
let telegramServiceInstance: TelegramService | null = null;

// Rate limiter for Telegram API calls
class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastCallTime = 0;
  private readonly minInterval = 34; // ~30 messages per second (Telegram limit)

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;

    if (timeSinceLastCall < this.minInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minInterval - timeSinceLastCall));
    }

    const task = this.queue.shift();
    if (task) {
      this.lastCallTime = Date.now();
      await task();
    }

    // Continue processing
    setImmediate(() => this.processQueue());
  }
}

export class TelegramService {
  private botToken: string;
  private isTestMode: boolean;
  private rateLimiter: RateLimiter;
  private botInfoCache: TelegramBotInfo | null = null;
  private botInfoCacheTime = 0;
  private readonly CACHE_TTL = 3600000; // 1 hour

  constructor() {
    this.isTestMode = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.rateLimiter = new RateLimiter();

    if (!this.botToken && !this.isTestMode) {
      logger.warn('TELEGRAM_BOT_TOKEN not configured');
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(): TelegramService {
    if (!telegramServiceInstance) {
      telegramServiceInstance = new TelegramService();
    }
    return telegramServiceInstance;
  }

  /**
   * Verify Telegram Login Widget data
   * https://core.telegram.org/widgets/login#checking-authorization
   */
  verifyLoginData(data: TelegramLoginData): boolean {
    const { hash, ...userData } = data;

    if (!hash) {
      logger.warn('Telegram login: missing hash');
      return false;
    }

    // In test mode, skip verification
    if (this.isTestMode) {
      logger.info('Telegram login verification skipped (test mode)');
      return true;
    }

    if (!this.botToken) {
      logger.warn('Telegram bot token not configured');
      return false;
    }

    // Create data check string
    const dataCheckString = Object.keys(userData)
      .sort()
      .map(key => `${key}=${userData[key as keyof typeof userData]}`)
      .join('\n');

    // Calculate secret key
    const secretKey = crypto
      .createHash('sha256')
      .update(this.botToken)
      .digest();

    // Calculate hash
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Use constant-time comparison
    const isValid = crypto.timingSafeEqual(
      Buffer.from(calculatedHash, 'hex'),
      Buffer.from(hash, 'hex')
    );

    if (!isValid) {
      logger.warn('Telegram login: invalid hash');
    }

    return isValid;
  }

  /**
   * Check if auth data is not expired (24 hours)
   */
  isAuthDataFresh(authDate: number): boolean {
    const now = Math.floor(Date.now() / 1000);
    const maxAge = 86400; // 24 hours

    const age = now - authDate;
    const isFresh = age <= maxAge;

    if (!isFresh) {
      logger.warn('Telegram login: auth data expired', { 
        age, 
        maxAge 
      });
    }

    return isFresh;
  }

  /**
   * Send message via Telegram Bot API with rate limiting and retry
   */
  async sendMessage(
    chatId: string, 
    text: string, 
    options: SendMessageOptions = {}
  ): Promise<boolean> {
    return this.rateLimiter.execute(async () => {
      const maxRetries = 3;
      let lastError: any;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          if (this.isTestMode) {
            logger.info('📱 Telegram message (Test Mode)', { chatId, text: text.substring(0, 50) });
            return true;
          }

          if (!this.botToken) {
            throw new Error('Telegram bot token not configured');
          }

          const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;

          const payload = {
            chat_id: chatId,
            text: text,
            parse_mode: options.parseMode || 'Markdown',
            disable_web_page_preview: options.disableWebPagePreview ?? true,
            disable_notification: options.disableNotification ?? false,
            reply_markup: options.replyMarkup,
          };

          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            const error = await response.json() as { description?: string };
            
            // Don't retry on client errors (4xx)
            if (response.status >= 400 && response.status < 500) {
              throw new Error(`Telegram API error: ${error.description || response.statusText}`);
            }
            
            // Retry on server errors (5xx)
            lastError = new Error(`Telegram API error: ${error.description || response.statusText}`);
            logger.warn(`Telegram API error, attempt ${attempt}/${maxRetries}`, { error: lastError });
            
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
              continue;
            }
            
            throw lastError;
          }

          const result = await response.json() as { result: { message_id: number } };
          
          logger.info('Telegram message sent successfully', {
            chatId,
            messageId: result.result.message_id
          });

          return true;
        } catch (error) {
          lastError = error;
          
          if (attempt === maxRetries) {
            logger.error('Failed to send Telegram message after retries', { 
              chatId, 
              attempts: maxRetries,
              error 
            });
            
            if (this.isTestMode) {
              return true;
            }
            
            throw error;
          }
        }
      }

      throw lastError;
    });
  }

  /**
   * Send authentication code confirmation
   */
  async sendAuthConfirmation(chatId: string, code: string): Promise<boolean> {
    const message = `✅ *Код подтвержден:* \`${code}\`\n\nВы успешно вошли в HandShakeMe!`;
    return this.sendMessage(chatId, message);
  }

  /**
   * Send invalid code message
   */
  async sendInvalidCodeMessage(chatId: string, code: string): Promise<boolean> {
    const message = `❌ *Неверный код:* \`${code}\`\n\nПроверьте код в приложении и попробуйте снова.\n\nКод должен быть 4-значным числом и действителен 10 минут.`;
    return this.sendMessage(chatId, message);
  }

  /**
   * Send welcome message
   */
  async sendWelcomeMessage(chatId: string, firstName: string): Promise<boolean> {
    const message = `👋 Добро пожаловать в HandShakeMe, ${firstName}!\n\nВаш аккаунт успешно создан и привязан к Telegram.\n\nТеперь вы можете использовать приложение для поиска заказов или мастеров.`;
    return this.sendMessage(chatId, message);
  }

  /**
   * Send typing action
   */
  async sendTypingAction(chatId: string): Promise<boolean> {
    try {
      if (this.isTestMode) {
        return true;
      }

      if (!this.botToken) {
        return false;
      }

      const url = `https://api.telegram.org/bot${this.botToken}/sendChatAction`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          action: 'typing'
        })
      });

      return response.ok;
    } catch (error) {
      logger.error('Failed to send typing action', { chatId, error });
      return false;
    }
  }

  /**
   * Get bot information with caching
   */
  async getBotInfo(): Promise<TelegramBotInfo | null> {
    try {
      // Return cached info if still valid
      const now = Date.now();
      if (this.botInfoCache && (now - this.botInfoCacheTime) < this.CACHE_TTL) {
        return this.botInfoCache;
      }

      if (this.isTestMode) {
        this.botInfoCache = {
          id: 123456789,
          is_bot: true,
          first_name: 'HandShakeMe Bot (Test)',
          username: 'handshakeme_test_bot',
          can_join_groups: true,
          can_read_all_group_messages: false,
          supports_inline_queries: false,
        };
        this.botInfoCacheTime = now;
        return this.botInfoCache;
      }

      if (!this.botToken) {
        return null;
      }

      const url = `https://api.telegram.org/bot${this.botToken}/getMe`;
      const response = await fetch(url);

      if (!response.ok) {
        return null;
      }

      const result = await response.json() as { result: any };
      this.botInfoCache = result.result;
      this.botInfoCacheTime = now;
      
      return this.botInfoCache;
    } catch (error) {
      logger.error('Failed to get bot info', error);
      return null;
    }
  }

  /**
   * Validate webhook secret token
   */
  validateWebhookSecret(secretToken: string): boolean {
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    
    if (!expectedSecret) {
      logger.warn('TELEGRAM_WEBHOOK_SECRET not configured');
      return this.isTestMode; // Allow in test mode
    }

    // Use constant-time comparison
    try {
      return crypto.timingSafeEqual(
        Buffer.from(secretToken, 'utf8'),
        Buffer.from(expectedSecret, 'utf8')
      );
    } catch {
      return false;
    }
  }
}

export interface TelegramLoginData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export interface SendMessageOptions {
  parseMode?: 'Markdown' | 'HTML';
  disableWebPagePreview?: boolean;
  disableNotification?: boolean;
  replyMarkup?: InlineKeyboardMarkup | ReplyKeyboardMarkup;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export interface ReplyKeyboardMarkup {
  keyboard: KeyboardButton[][];
  resize_keyboard?: boolean;
  one_time_keyboard?: boolean;
}

export interface InlineKeyboardButton {
  text: string;
  url?: string;
  callback_data?: string;
}

export interface KeyboardButton {
  text: string;
  request_contact?: boolean;
  request_location?: boolean;
}

export interface TelegramBotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username?: string;
  last_name?: string;
  can_join_groups?: boolean;
  can_read_all_group_messages?: boolean;
  supports_inline_queries?: boolean;
}
