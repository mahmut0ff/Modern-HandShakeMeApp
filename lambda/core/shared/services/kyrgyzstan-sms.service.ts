/**
 * Kyrgyzstan SMS Service
 * Сервис SMS уведомлений для Кыргызстана
 */

import AWS from 'aws-sdk';
import { 
  KyrgyzstanOperator, 
  SMSParams, 
  SMSResult, 
  KyrgyzstanLanguage,
  LocalizedMessages
} from '../types/kyrgyzstan';
import { normalizeKyrgyzstanPhone, isValidKyrgyzstanPhone } from '../utils/kyrgyzstan';

const sns = new AWS.SNS();
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Конфигурация операторов КР
export const KG_OPERATORS: Record<string, KyrgyzstanOperator> = {
  beeline: {
    name: 'Beeline KG',
    prefixes: ['+996770', '+996775', '+996776', '+996777'],
    gateway: 'beeline_kg_gateway',
    encoding: 'UTF-8',
    maxLength: 160
  },
  
  megacom: {
    name: 'MegaCom',
    prefixes: ['+996555', '+996556', '+996557', '+996558'],
    gateway: 'megacom_gateway', 
    encoding: 'UTF-8',
    maxLength: 160
  },
  
  o_mobile: {
    name: 'O! (Kcell)',
    prefixes: ['+996500', '+996501', '+996502', '+996503'],
    gateway: 'o_mobile_gateway',
    encoding: 'UTF-8', 
    maxLength: 160
  }
};

// SMS шаблоны на двух языках
export const SMS_TEMPLATES: LocalizedMessages = {
  new_booking: {
    ru: 'HandShakeMe: Новый заказ от {clientName} на {datetime}. Ответить: {link}',
    ky: 'HandShakeMe: {clientName} тарабынан жаңы заказ {datetime}. Жооп берүү: {link}'
  },
  
  booking_confirmed: {
    ru: 'HandShakeMe: Заказ подтвержден. Мастер: {masterName}, тел: {phone}. Время: {datetime}',
    ky: 'HandShakeMe: Заказ ырасталды. Усталык: {masterName}, тел: {phone}. Убакыт: {datetime}'
  },
  
  booking_reminder: {
    ru: 'HandShakeMe: Напоминание о встрече через 1 час. Адрес: {address}. Тел мастера: {phone}',
    ky: 'HandShakeMe: 1 сааттан кийин жолугушуу эскертүү. Дарек: {address}. Усталыктын тел: {phone}'
  },
  
  payment_reminder: {
    ru: 'HandShakeMe: Не забудьте оплатить услугу. Способ: {paymentMethod}. Сумма: {amount} сом',
    ky: 'HandShakeMe: Кызматты төлөөнү унутпаңыз. Жол: {paymentMethod}. Сумма: {amount} сом'
  },
  
  address_confirmation: {
    ru: 'HandShakeMe: Мастер {masterName} свяжется с вами для уточнения адреса. Тел: {phone}',
    ky: 'HandShakeMe: Усталык {masterName} даректи так билүү үчүн байланышат. Тел: {phone}'
  },
  
  booking_cancelled: {
    ru: 'HandShakeMe: Заказ отменен. Причина: {reason}. Возврат: {refund} сом',
    ky: 'HandShakeMe: Заказ жокко чыгарылды. Себеби: {reason}. Кайтаруу: {refund} сом'
  },
  
  booking_completed: {
    ru: 'HandShakeMe: Работа завершена. Оцените мастера в приложении. Спасибо!',
    ky: 'HandShakeMe: Иш аяктады. Усталыкты колдонмодо баалаңыз. Рахмат!'
  }
};

export class KyrgyzstanSMSService {
  
  /**
   * Определение оператора по номеру телефона
   */
  private detectOperator(phoneNumber: string): string {
    const normalizedPhone = normalizeKyrgyzstanPhone(phoneNumber);
    
    for (const [operator, config] of Object.entries(KG_OPERATORS)) {
      for (const prefix of config.prefixes) {
        if (normalizedPhone.startsWith(prefix)) {
          return operator;
        }
      }
    }
    
    return 'unknown';
  }
  
  /**
   * Отправка SMS с учетом оператора
   */
  async sendSMS(params: SMSParams): Promise<SMSResult> {
    try {
      const { phoneNumber, template, language, variables, priority = 'normal' } = params;
      
      // Валидация номера телефона
      if (!isValidKyrgyzstanPhone(phoneNumber)) {
        throw new Error('Invalid Kyrgyzstan phone number');
      }
      
      const normalizedPhone = normalizeKyrgyzstanPhone(phoneNumber);
      
      // Получаем шаблон сообщения
      const messageTemplate = SMS_TEMPLATES[template]?.[language];
      if (!messageTemplate) {
        throw new Error(`Template ${template} not found for language ${language}`);
      }
      
      // Подставляем переменные
      let message = messageTemplate;
      for (const [key, value] of Object.entries(variables)) {
        message = message.replace(new RegExp(`{${key}}`, 'g'), value);
      }
      
      // Определяем оператора
      const operator = this.detectOperator(normalizedPhone);
      const operatorConfig = KG_OPERATORS[operator];
      
      if (!operatorConfig) {
        console.warn(`Unknown operator for phone ${normalizedPhone}, using default gateway`);
      }
      
      // Обрезаем сообщение если нужно
      const maxLength = operatorConfig?.maxLength || 160;
      if (message.length > maxLength) {
        message = message.substring(0, maxLength - 3) + '...';
      }
      
      // Отправляем через AWS SNS
      const snsParams = {
        PhoneNumber: normalizedPhone,
        Message: message,
        MessageAttributes: {
          'AWS.SNS.SMS.SenderID': {
            DataType: 'String',
            StringValue: 'HandShake'
          },
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: priority === 'high' ? 'Transactional' : 'Promotional'
          },
          'operator': {
            DataType: 'String',
            StringValue: operator
          },
          'template': {
            DataType: 'String',
            StringValue: template
          },
          'language': {
            DataType: 'String',
            StringValue: language
          }
        }
      };
      
      const result = await sns.publish(snsParams).promise();
      
      // Логируем для аналитики
      await this.logSMSDelivery({
        phoneNumber: normalizedPhone,
        operator,
        template,
        language,
        messageId: result.MessageId,
        success: true,
        messageLength: message.length
      });
      
      return {
        success: true,
        messageId: result.MessageId
      };
      
    } catch (error) {
      console.error('SMS sending failed:', error);
      
      // Логируем ошибку
      await this.logSMSDelivery({
        phoneNumber: params.phoneNumber,
        operator: this.detectOperator(params.phoneNumber),
        template: params.template,
        language: params.language,
        error: error.message,
        success: false
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Массовая отправка SMS
   */
  async sendBulkSMS(messages: SMSParams[]): Promise<{
    sent: number;
    failed: number;
    results: SMSResult[];
  }> {
    const results: SMSResult[] = [];
    let sent = 0;
    let failed = 0;
    
    // Отправляем пачками по 10 сообщений
    const batchSize = 10;
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (message) => {
        const result = await this.sendSMS(message);
        if (result.success) {
          sent++;
        } else {
          failed++;
        }
        return result;
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Пауза между пачками чтобы не превысить лимиты
      if (i + batchSize < messages.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return { sent, failed, results };
  }
  
  /**
   * Отправка уведомления о новом бронировании
   */
  async sendBookingNotification(params: {
    masterPhone: string;
    clientPhone: string;
    masterName: string;
    clientName: string;
    datetime: string;
    bookingId: string;
    masterLanguage: KyrgyzstanLanguage;
    clientLanguage: KyrgyzstanLanguage;
  }): Promise<{ masterSMS: SMSResult; clientSMS: SMSResult }> {
    
    const bookingLink = `${process.env.FRONTEND_URL || 'https://handshakeme.kg'}/bookings/${params.bookingId}`;
    
    // SMS мастеру
    const masterSMS = await this.sendSMS({
      phoneNumber: params.masterPhone,
      template: 'new_booking',
      language: params.masterLanguage,
      variables: {
        clientName: params.clientName,
        datetime: params.datetime,
        link: bookingLink
      },
      priority: 'high'
    });
    
    // SMS клиенту
    const clientSMS = await this.sendSMS({
      phoneNumber: params.clientPhone,
      template: 'booking_confirmed',
      language: params.clientLanguage,
      variables: {
        masterName: params.masterName,
        phone: params.masterPhone,
        datetime: params.datetime
      },
      priority: 'high'
    });
    
    return { masterSMS, clientSMS };
  }
  
  /**
   * Отправка напоминания о встрече
   */
  async sendBookingReminder(params: {
    clientPhone: string;
    masterPhone: string;
    address: string;
    language: KyrgyzstanLanguage;
  }): Promise<SMSResult> {
    
    return await this.sendSMS({
      phoneNumber: params.clientPhone,
      template: 'booking_reminder',
      language: params.language,
      variables: {
        address: params.address,
        phone: params.masterPhone
      },
      priority: 'high'
    });
  }
  
  /**
   * Отправка напоминания об оплате
   */
  async sendPaymentReminder(params: {
    clientPhone: string;
    paymentMethod: string;
    amount: number;
    language: KyrgyzstanLanguage;
  }): Promise<SMSResult> {
    
    return await this.sendSMS({
      phoneNumber: params.clientPhone,
      template: 'payment_reminder',
      language: params.language,
      variables: {
        paymentMethod: params.paymentMethod,
        amount: params.amount.toString()
      },
      priority: 'high'
    });
  }
  
  /**
   * Логирование доставки SMS для аналитики
   */
  private async logSMSDelivery(params: {
    phoneNumber: string;
    operator: string;
    template: string;
    language: string;
    messageId?: string;
    error?: string;
    success: boolean;
    messageLength?: number;
  }): Promise<void> {
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      phoneNumber: params.phoneNumber.replace(/\d{4}$/, '****'), // Маскируем номер
      operator: params.operator,
      template: params.template,
      language: params.language,
      messageId: params.messageId,
      success: params.success,
      error: params.error,
      messageLength: params.messageLength
    };
    
    // Сохраняем в CloudWatch Logs
    console.log('KG_SMS_DELIVERY_LOG:', JSON.stringify(logEntry));
    
    // Сохраняем в DynamoDB для аналитики
    try {
      await dynamodb.put({
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Item: {
          PK: `SMS_LOG#${new Date().toISOString().split('T')[0]}`, // Группируем по дням
          SK: `LOG#${Date.now()}#${Math.random().toString(36).substr(2, 9)}`,
          ...logEntry,
          entityType: 'SMS_LOG',
          ttl: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // TTL 30 дней
        }
      }).promise();
    } catch (error) {
      console.error('Failed to save SMS log to DynamoDB:', error);
    }
  }
  
  /**
   * Получение статистики SMS за период
   */
  async getSMSStats(dateFrom: string, dateTo: string): Promise<{
    totalSent: number;
    totalFailed: number;
    byOperator: Record<string, number>;
    byTemplate: Record<string, number>;
    byLanguage: Record<string, number>;
  }> {
    
    const stats = {
      totalSent: 0,
      totalFailed: 0,
      byOperator: {} as Record<string, number>,
      byTemplate: {} as Record<string, number>,
      byLanguage: {} as Record<string, number>
    };
    
    try {
      // Получаем логи за период
      const startDate = new Date(dateFrom);
      const endDate = new Date(dateTo);
      const dates: string[] = [];
      
      // Генерируем список дат для запроса
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split('T')[0]);
      }
      
      // Запрашиваем логи для каждой даты
      for (const date of dates) {
        const result = await dynamodb.query({
          TableName: process.env.DYNAMODB_TABLE_NAME!,
          KeyConditionExpression: 'PK = :pk',
          ExpressionAttributeValues: {
            ':pk': `SMS_LOG#${date}`
          }
        }).promise();
        
        // Обрабатываем результаты
        for (const item of result.Items || []) {
          if (item.success) {
            stats.totalSent++;
          } else {
            stats.totalFailed++;
          }
          
          // Статистика по операторам
          stats.byOperator[item.operator] = (stats.byOperator[item.operator] || 0) + 1;
          
          // Статистика по шаблонам
          stats.byTemplate[item.template] = (stats.byTemplate[item.template] || 0) + 1;
          
          // Статистика по языкам
          stats.byLanguage[item.language] = (stats.byLanguage[item.language] || 0) + 1;
        }
      }
      
    } catch (error) {
      console.error('Failed to get SMS stats:', error);
    }
    
    return stats;
  }
}