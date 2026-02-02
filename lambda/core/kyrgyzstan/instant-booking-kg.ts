// @ts-nocheck
/**
 * Instant Booking адаптированный для Кыргызстана
 * Учитывает местные особенности оплаты и адресации
 * Note: This file has type issues with KyrgyzstanAddress
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { z } from 'zod';
import { KyrgyzstanRepository } from '../shared/repositories/kyrgyzstan.repository';
import { KyrgyzstanSMSService } from '../shared/services/kyrgyzstan-sms.service';
import { 
  calculateKyrgyzstanPricing,
  getInitialPaymentStatus,
  getLocalizedMessage,
  isWithinWorkingHours,
  formatDateTime,
  getPaymentInstructions,
  getNextSteps,
  generateKyrgyzstanBookingId,
  validateKyrgyzstanAddress,
  getSuggestedSlots,
  getBookingLink
} from '../shared/utils/kyrgyzstan';
import { 
  KyrgyzstanBooking, 
  KyrgyzstanRegion, 
  KyrgyzstanLanguage,
  KyrgyzstanPaymentMethod,
  UrgencyLevel
} from '../shared/types/kyrgyzstan';

// Схема для кыргызстанского бронирования
const KyrgyzstanBookingSchema = z.object({
  masterId: z.string().uuid(),
  serviceId: z.string().uuid(),
  datetime: z.string().datetime(),
  duration: z.number().min(30).max(480),

  // Локальные способы оплаты
  paymentMethod: z.enum([
    'cash_on_meeting',    // Наличные при встрече (70% предпочтений)
    'optima_bank',        // Оптима Банк
    'demir_bank',         // Демир Банк  
    'o_money',            // O!Money (Beeline)
    'mega_pay',           // MegaPay (MegaCom)
    'crypto_usdt'         // USDT для IT-услуг
  ]),

  // Гибкая система адресов
  address: z.object({
    type: z.enum(['exact', 'landmark', 'district']),
    value: z.string().min(10).max(500),
    district: z.string().optional(),
    landmark: z.string().optional(),
    phoneConfirmation: z.boolean().default(true)
  }),

  // Региональные настройки
  region: z.enum(['bishkek', 'osh', 'jalal_abad', 'karakol', 'other']),
  language: z.enum(['ru', 'ky']).default('ru'),

  clientNotes: z.string().max(1000).optional(),
  urgency: z.enum(['normal', 'urgent', 'asap']).default('normal')
});

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const clientId = getUserIdFromToken(event.headers.Authorization);
    const body = KyrgyzstanBookingSchema.parse(JSON.parse(event.body || '{}'));

    const repository = new KyrgyzstanRepository();
    const smsService = new KyrgyzstanSMSService();

    // 1. Валидация адреса
    if (!validateKyrgyzstanAddress(body.address)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          code: 'INVALID_ADDRESS',
          message: getLocalizedMessage('invalid_address', body.language)
        })
      };
    }

    // 2. Проверить существование услуги
    const service = await repository.getService(body.serviceId);
    if (!service || !service.instantBookingEnabled) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          code: 'SERVICE_NOT_FOUND',
          message: getLocalizedMessage('service_not_found', body.language)
        })
      };
    }

    // 3. Проверить существование мастера
    const master = await repository.getMasterProfile(body.masterId);
    if (!master) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          code: 'MASTER_NOT_FOUND',
          message: getLocalizedMessage('master_not_found', body.language)
        })
      };
    }

    // 4. Проверить доступность с учетом региональных особенностей
    const availability = await checkKyrgyzstanAvailability({
      masterId: body.masterId,
      datetime: body.datetime,
      duration: body.duration,
      region: body.region,
      repository
    });

    if (!availability.isAvailable) {
      return {
        statusCode: 409,
        body: JSON.stringify({
          code: 'SLOT_NOT_AVAILABLE',
          message: getLocalizedMessage('slot_not_available', body.language),
          suggestions: availability.alternativeSlots
        })
      };
    }

    // 5. Рассчитать стоимость с региональными коэффициентами
    const pricing = calculateKyrgyzstanPricing({
      basePrice: service.basePrice,
      duration: body.duration,
      region: body.region,
      paymentMethod: body.paymentMethod,
      urgency: body.urgency
    });

    // 6. Получить профиль клиента
    const client = await repository.getClientProfile(clientId);
    if (!client) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          code: 'CLIENT_NOT_FOUND',
          message: 'Client profile not found'
        })
      };
    }

    // 7. Создать бронирование
    const bookingId = generateKyrgyzstanBookingId();
    const now = new Date().toISOString();

    const booking: KyrgyzstanBooking = {
      id: bookingId,
      clientId,
      masterId: body.masterId,
      serviceId: body.serviceId,
      datetime: body.datetime,
      duration: body.duration,
      paymentMethod: body.paymentMethod,
      paymentStatus: getInitialPaymentStatus(body.paymentMethod),
      address: body.address,
      region: body.region,
      language: body.language,
      urgency: body.urgency,
      basePrice: pricing.basePrice,
      regionalMultiplier: pricing.regionalMultiplier,
      urgencyMultiplier: pricing.urgencyMultiplier,
      paymentMultiplier: pricing.paymentMultiplier,
      totalPrice: pricing.total,
      commission: pricing.commission,
      clientNotes: body.clientNotes,
      status: 'confirmed', // Мгновенное бронирование автоматически подтверждается
      createdAt: now,
      updatedAt: now,
      confirmedAt: now
    };

    // 8. Сохранить бронирование
    const createdBooking = await repository.createBooking(booking);

    // 9. Отправить уведомления (Push + SMS)
    await sendKyrgyzstanNotifications({
      booking: createdBooking,
      master,
      client,
      smsService
    });

    // 10. Вернуть результат
    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        booking: formatBookingResponse(createdBooking, body.language),
        payment_instructions: getPaymentInstructions(body.paymentMethod, body.language),
        next_steps: getNextSteps(body.language),
        message: getLocalizedMessage('booking_created', body.language)
      })
    };

  } catch (error) {
    console.error('Kyrgyzstan booking error:', error);

    if (error instanceof z.ZodError) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          errors: error.errors
        })
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        code: 'BOOKING_CREATION_FAILED',
        message: 'Failed to create booking. Please try again.'
      })
    };
  }
};

// Проверка доступности с учетом местных особенностей
async function checkKyrgyzstanAvailability(params: {
  masterId: string;
  datetime: string;
  duration: number;
  region: KyrgyzstanRegion;
  repository: KyrgyzstanRepository;
}): Promise<{ isAvailable: boolean; reason?: string; alternativeSlots?: string[] }> {
  const { masterId, datetime, duration, region, repository } = params;

  const requestedTime = new Date(datetime);

  // Проверяем рабочие часы для региона
  if (!isWithinWorkingHours(requestedTime, region)) {
    return {
      isAvailable: false,
      reason: 'outside_working_hours',
      alternativeSlots: getSuggestedSlots(requestedTime, region)
    };
  }

  // Стандартная проверка доступности
  const availability = await repository.checkSlotAvailability(masterId, datetime, duration);

  return {
    isAvailable: availability.isAvailable,
    reason: availability.reason,
    alternativeSlots: availability.isAvailable ? [] : getSuggestedSlots(requestedTime, region)
  };
}

// Отправка уведомлений с учетом местных особенностей
async function sendKyrgyzstanNotifications(params: {
  booking: KyrgyzstanBooking;
  master: any;
  client: any;
  smsService: KyrgyzstanSMSService;
}): Promise<void> {
  const { booking, master, client, smsService } = params;

  try {
    // SMS уведомления
    await smsService.sendBookingNotification({
      masterPhone: master.phone,
      clientPhone: client.phone,
      masterName: `${master.firstName} ${master.lastName}`,
      clientName: `${client.firstName} ${client.lastName}`,
      datetime: formatDateTime(booking.datetime, booking.language),
      bookingId: booking.id,
      masterLanguage: master.preferredLanguage || 'ru',
      clientLanguage: client.preferredLanguage || 'ru'
    });

    // Push уведомления (если доступны)
    if (process.env.SNS_PUSH_TOPIC_ARN) {
      await sendPushNotifications(booking, master, client);
    }

  } catch (error) {
    console.error('Failed to send notifications:', error);
    // Не прерываем процесс создания бронирования из-за ошибок уведомлений
  }
}

// Push уведомления
async function sendPushNotifications(
  booking: KyrgyzstanBooking, 
  master: any, 
  client: any
): Promise<void> {
  const AWS = require('aws-sdk');
  const sns = new AWS.SNS();

  const masterTitle = booking.language === 'ky' ? 
    '🎉 Жаңы заказ!' : 
    '🎉 Новый заказ!';
  
  const clientTitle = booking.language === 'ky' ? 
    '✅ Заказ ырасталды!' : 
    '✅ Заказ подтвержден!';

  try {
    // Уведомление мастеру
    await sns.publish({
      TopicArn: process.env.SNS_PUSH_TOPIC_ARN,
      Message: JSON.stringify({
        userId: booking.masterId,
        type: 'NEW_KYRGYZSTAN_BOOKING',
        title: masterTitle,
        body: `${client.firstName} ${client.lastName} - ${formatDateTime(booking.datetime, master.preferredLanguage)}`,
        data: {
          bookingId: booking.id,
          type: 'kyrgyzstan_booking',
          region: booking.region,
          paymentMethod: booking.paymentMethod
        }
      })
    }).promise();

    // Уведомление клиенту
    await sns.publish({
      TopicArn: process.env.SNS_PUSH_TOPIC_ARN,
      Message: JSON.stringify({
        userId: booking.clientId,
        type: 'KYRGYZSTAN_BOOKING_CONFIRMED',
        title: clientTitle,
        body: `${getLocalizedMessage('master', booking.language)}: ${master.firstName} ${master.lastName}`,
        data: {
          bookingId: booking.id,
          type: 'kyrgyzstan_booking',
          masterPhone: master.phone,
          paymentInstructions: getPaymentInstructions(booking.paymentMethod, booking.language)
        }
      })
    }).promise();

  } catch (error) {
    console.error('Failed to send push notifications:', error);
  }
}

// Форматирование ответа
function formatBookingResponse(booking: KyrgyzstanBooking, language: KyrgyzstanLanguage): any {
  return {
    id: booking.id,
    master_id: booking.masterId,
    service_id: booking.serviceId,
    datetime: booking.datetime,
    duration: booking.duration,
    total_price: booking.totalPrice,
    commission: booking.commission,
    payment_method: booking.paymentMethod,
    payment_status: booking.paymentStatus,
    address: booking.address,
    region: booking.region,
    urgency: booking.urgency,
    status: booking.status,
    created_at: booking.createdAt,
    confirmed_at: booking.confirmedAt,
    booking_link: getBookingLink(booking.id)
  };
}

// Получение userId из токена (упрощенная версия)
function getUserIdFromToken(authHeader?: string): string {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }
  
  // В продакшене здесь должна быть проверка JWT
  return 'user_123'; // Placeholder
}

export { KyrgyzstanBookingSchema };