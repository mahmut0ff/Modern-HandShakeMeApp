/**
 * SMS уведомления для Кыргызстана
 * Интеграция с местными операторами связи
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { KyrgyzstanSMSService } from '../shared/services/kyrgyzstan-sms.service';
import { KyrgyzstanRepository } from '../shared/repositories/kyrgyzstan.repository';
import { formatDateTime } from '../shared/utils/kyrgyzstan';
import { KyrgyzstanLanguage } from '../shared/types/kyrgyzstan';

// Экспортируем основные компоненты из сервиса
export { KG_OPERATORS, SMS_TEMPLATES } from '../shared/services/kyrgyzstan-sms.service';
export { KyrgyzstanSMSService } from '../shared/services/kyrgyzstan-sms.service';

// Lambda handler для отправки SMS
export const sendSMSHandler: APIGatewayProxyHandler = async (event) => {
  try {
    const smsService = new KyrgyzstanSMSService();
    const body = JSON.parse(event.body || '{}');
    
    const result = await smsService.sendSMS({
      phoneNumber: body.phoneNumber,
      template: body.template,
      language: body.language || 'ru',
      variables: body.variables || {},
      priority: body.priority || 'normal'
    });
    
    return {
      statusCode: result.success ? 200 : 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result)
    };
    
  } catch (error) {
    console.error('SMS handler error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to send SMS'
      })
    };
  }
};

// Lambda handler для массовой отправки SMS
export const sendBulkSMSHandler: APIGatewayProxyHandler = async (event) => {
  try {
    const smsService = new KyrgyzstanSMSService();
    const body = JSON.parse(event.body || '{}');
    
    if (!Array.isArray(body.messages)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Messages array is required'
        })
      };
    }
    
    const result = await smsService.sendBulkSMS(body.messages);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result)
    };
    
  } catch (error) {
    console.error('Bulk SMS handler error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to send bulk SMS'
      })
    };
  }
};

// Lambda handler для получения статистики SMS
export const getSMSStatsHandler: APIGatewayProxyHandler = async (event) => {
  try {
    const smsService = new KyrgyzstanSMSService();
    const queryParams = event.queryStringParameters || {};
    
    const dateFrom = queryParams.dateFrom || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dateTo = queryParams.dateTo || new Date().toISOString().split('T')[0];
    
    const stats = await smsService.getSMSStats(dateFrom, dateTo);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        stats,
        period: { dateFrom, dateTo }
      })
    };
    
  } catch (error) {
    console.error('SMS stats handler error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to get SMS stats'
      })
    };
  }
};

// Функция для отправки уведомлений о бронировании
export async function sendBookingNotificationSMS(bookingId: string): Promise<{
  masterSMS: any;
  clientSMS: any;
}> {
  const smsService = new KyrgyzstanSMSService();
  const repository = new KyrgyzstanRepository();
  
  try {
    // Получаем данные бронирования
    const booking = await repository.getBooking(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    // Получаем профили мастера и клиента
    const [master, client] = await Promise.all([
      repository.getMasterProfile(booking.masterId),
      repository.getClientProfile(booking.clientId)
    ]);
    
    if (!master || !client) {
      throw new Error('Master or client profile not found');
    }
    
    // Отправляем SMS уведомления
    const result = await smsService.sendBookingNotification({
      masterPhone: master.phone,
      clientPhone: client.phone,
      masterName: `${master.firstName} ${master.lastName}`,
      clientName: `${client.firstName} ${client.lastName}`,
      datetime: formatDateTime(booking.datetime, booking.language),
      bookingId: booking.id,
      masterLanguage: master.preferredLanguage,
      clientLanguage: client.preferredLanguage
    });
    
    return result;
    
  } catch (error) {
    console.error('Failed to send booking notification SMS:', error);
    throw error;
  }
}

// Функция для напоминаний о встрече
export async function sendBookingReminderSMS(bookingId: string): Promise<any> {
  const smsService = new KyrgyzstanSMSService();
  const repository = new KyrgyzstanRepository();
  
  try {
    // Получаем данные бронирования
    const booking = await repository.getBooking(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    // Получаем профили мастера и клиента
    const [master, client] = await Promise.all([
      repository.getMasterProfile(booking.masterId),
      repository.getClientProfile(booking.clientId)
    ]);
    
    if (!master || !client) {
      throw new Error('Master or client profile not found');
    }
    
    // Отправляем напоминание клиенту за час до встречи
    const result = await smsService.sendBookingReminder({
      clientPhone: client.phone,
      masterPhone: master.phone,
      address: booking.address.value,
      language: client.preferredLanguage
    });
    
    return result;
    
  } catch (error) {
    console.error('Failed to send booking reminder SMS:', error);
    throw error;
  }
}

// Функция для напоминания об оплате
export async function sendPaymentReminderSMS(bookingId: string): Promise<any> {
  const smsService = new KyrgyzstanSMSService();
  const repository = new KyrgyzstanRepository();
  
  try {
    // Получаем данные бронирования
    const booking = await repository.getBooking(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    // Получаем профиль клиента
    const client = await repository.getClientProfile(booking.clientId);
    if (!client) {
      throw new Error('Client profile not found');
    }
    
    // Отправляем напоминание об оплате
    const result = await smsService.sendPaymentReminder({
      clientPhone: client.phone,
      paymentMethod: booking.paymentMethod,
      amount: booking.totalPrice,
      language: client.preferredLanguage
    });
    
    return result;
    
  } catch (error) {
    console.error('Failed to send payment reminder SMS:', error);
    throw error;
  }
}

// Lambda handler для отправки напоминаний
export const sendReminderHandler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { bookingId, type } = body;
    
    if (!bookingId || !type) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'bookingId and type are required'
        })
      };
    }
    
    let result;
    
    switch (type) {
      case 'booking':
        result = await sendBookingNotificationSMS(bookingId);
        break;
      case 'reminder':
        result = await sendBookingReminderSMS(bookingId);
        break;
      case 'payment':
        result = await sendPaymentReminderSMS(bookingId);
        break;
      default:
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            success: false,
            error: 'Invalid reminder type'
          })
        };
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        result
      })
    };
    
  } catch (error) {
    console.error('Reminder handler error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};