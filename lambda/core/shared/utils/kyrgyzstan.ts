/**
 * Kyrgyzstan Utilities
 * Утилиты для кыргызстанской локализации
 */

import { 
  KyrgyzstanRegion, 
  KyrgyzstanLanguage, 
  KyrgyzstanPaymentMethod,
  UrgencyLevel,
  RegionalSettings,
  PricingCalculation,
  LocalizedMessages
} from '../types/kyrgyzstan';

// Региональные коэффициенты и настройки
export const REGIONAL_SETTINGS: Record<KyrgyzstanRegion, RegionalSettings> = {
  bishkek: {
    multiplier: 1.0,
    workingHours: { start: 8, end: 22 },
    currency: 'KGS',
    timezone: 'Asia/Bishkek'
  },
  osh: {
    multiplier: 0.8,
    workingHours: { start: 9, end: 21 },
    currency: 'KGS',
    timezone: 'Asia/Bishkek'
  },
  jalal_abad: {
    multiplier: 0.7,
    workingHours: { start: 9, end: 20 },
    currency: 'KGS',
    timezone: 'Asia/Bishkek'
  },
  karakol: {
    multiplier: 0.9,
    workingHours: { start: 9, end: 20 },
    currency: 'KGS',
    timezone: 'Asia/Bishkek'
  },
  other: {
    multiplier: 0.6,
    workingHours: { start: 10, end: 19 },
    currency: 'KGS',
    timezone: 'Asia/Bishkek'
  }
};

// Коэффициенты срочности
export const URGENCY_MULTIPLIERS: Record<UrgencyLevel, number> = {
  normal: 1.0,
  urgent: 1.2,  // +20% за срочность
  asap: 1.5     // +50% за очень срочно
};

// Коэффициенты способов оплаты
export const PAYMENT_MULTIPLIERS: Record<KyrgyzstanPaymentMethod, number> = {
  cash_on_meeting: 0.95,  // -5% скидка за наличные
  optima_bank: 1.0,
  demir_bank: 1.0,
  o_money: 1.02,          // +2% комиссия мобильных платежей
  mega_pay: 1.02,         // +2% комиссия мобильных платежей
  crypto_usdt: 0.98       // -2% скидка за криптовалюту
};

// Комиссии платформы по способам оплаты
export const COMMISSION_RATES: Record<KyrgyzstanPaymentMethod, number> = {
  cash_on_meeting: 0.02,   // 2% для наличных
  optima_bank: 0.025,      // 2.5% для банков
  demir_bank: 0.025,       // 2.5% для банков
  o_money: 0.03,           // 3% для мобильных платежей
  mega_pay: 0.03,          // 3% для мобильных платежей
  crypto_usdt: 0.015       // 1.5% для криптовалют
};

// Локализованные сообщения
export const LOCALIZED_MESSAGES: LocalizedMessages = {
  slot_not_available: {
    ru: 'Выбранное время недоступно',
    ky: 'Тандалган убакыт жеткиликсиз'
  },
  booking_confirmed: {
    ru: 'Бронирование подтверждено',
    ky: 'Бронирование ырасталды'
  },
  master_not_found: {
    ru: 'Мастер не найден',
    ky: 'Усталык табылган жок'
  },
  service_not_found: {
    ru: 'Услуга не найдена',
    ky: 'Кызмат табылган жок'
  },
  outside_working_hours: {
    ru: 'Время вне рабочих часов',
    ky: 'Иш убактысынан тышкары'
  },
  payment_pending: {
    ru: 'Ожидается оплата',
    ky: 'Төлөм күтүлүүдө'
  },
  booking_created: {
    ru: 'Заказ создан успешно',
    ky: 'Заказ ийгиликтүү түзүлдү'
  }
};

/**
 * Получить локализованное сообщение
 */
export function getLocalizedMessage(key: string, language: KyrgyzstanLanguage): string {
  return LOCALIZED_MESSAGES[key]?.[language] || LOCALIZED_MESSAGES[key]?.ru || key;
}

/**
 * Проверить рабочие часы для региона
 */
export function isWithinWorkingHours(dateTime: Date, region: KyrgyzstanRegion): boolean {
  const settings = REGIONAL_SETTINGS[region];
  const hour = dateTime.getHours();
  return hour >= settings.workingHours.start && hour <= settings.workingHours.end;
}

/**
 * Рассчитать стоимость с учетом региональных особенностей
 */
export function calculateKyrgyzstanPricing(params: {
  basePrice: number;
  duration: number;
  region: KyrgyzstanRegion;
  paymentMethod: KyrgyzstanPaymentMethod;
  urgency: UrgencyLevel;
}): PricingCalculation {
  const { basePrice, duration, region, paymentMethod, urgency } = params;
  
  // Базовая стоимость за время
  const durationPrice = basePrice * (duration / 60);
  
  // Региональный коэффициент
  const regionalMultiplier = REGIONAL_SETTINGS[region].multiplier;
  
  // Коэффициент срочности
  const urgencyMultiplier = URGENCY_MULTIPLIERS[urgency];
  
  // Коэффициент способа оплаты
  const paymentMultiplier = PAYMENT_MULTIPLIERS[paymentMethod];
  
  // Итоговая цена
  const adjustedPrice = durationPrice * regionalMultiplier * urgencyMultiplier * paymentMultiplier;
  
  // Комиссия платформы
  const commissionRate = COMMISSION_RATES[paymentMethod];
  const commission = adjustedPrice * commissionRate;
  
  return {
    basePrice: durationPrice,
    regionalMultiplier,
    urgencyMultiplier,
    paymentMultiplier,
    commission,
    total: Math.round(adjustedPrice)
  };
}

/**
 * Получить статус оплаты по способу оплаты
 */
export function getInitialPaymentStatus(paymentMethod: KyrgyzstanPaymentMethod): string {
  switch (paymentMethod) {
    case 'cash_on_meeting':
      return 'pending_meeting';
    case 'crypto_usdt':
      return 'pending_crypto';
    default:
      return 'pending_payment';
  }
}

/**
 * Форматировать дату и время для локали
 */
export function formatDateTime(dateTime: string, language: KyrgyzstanLanguage): string {
  const date = new Date(dateTime);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Bishkek'
  };
  
  const locale = language === 'ky' ? 'ky-KG' : 'ru-RU';
  return date.toLocaleDateString(locale, options);
}

/**
 * Получить инструкции по оплате
 */
export function getPaymentInstructions(
  paymentMethod: KyrgyzstanPaymentMethod, 
  language: KyrgyzstanLanguage
): string {
  const instructions = {
    cash_on_meeting: {
      ru: 'Оплата наличными при встрече с мастером',
      ky: 'Усталык менен жолуккандагы накт акча төлөө'
    },
    optima_bank: {
      ru: 'Перевод через Оптима Банк: *111# или мобильное приложение',
      ky: 'Оптима Банк аркылуу которуу: *111# же мобилдик тиркеме'
    },
    demir_bank: {
      ru: 'Перевод через Демир Банк: *880# или банкомат',
      ky: 'Демир Банк аркылуу которуу: *880# же банкомат'
    },
    o_money: {
      ru: 'O!Money (Beeline): *5005# - мобильные платежи',
      ky: 'O!Money (Beeline): *5005# - мобилдик төлөмдөр'
    },
    mega_pay: {
      ru: 'MegaPay (MegaCom): *1415# - быстрые переводы',
      ky: 'MegaPay (MegaCom): *1415# - тез которуулар'
    },
    crypto_usdt: {
      ru: 'Оплата USDT - реквизиты будут отправлены отдельно',
      ky: 'USDT төлөө - реквизиттер өзүнчө жөнөтүлөт'
    }
  };
  
  return instructions[paymentMethod]?.[language] || instructions[paymentMethod]?.ru || '';
}

/**
 * Получить следующие шаги для клиента
 */
export function getNextSteps(language: KyrgyzstanLanguage): string[] {
  const steps = {
    ru: [
      'Мастер свяжется с вами для подтверждения адреса',
      'Подготовьте необходимые материалы',
      'Ожидайте мастера в указанное время'
    ],
    ky: [
      'Усталык даректи ырастоо үчүн сиз менен байланышат',
      'Керектүү материалдарды даярдаңыз',
      'Белгиленген убакытта усталыкты күтүңүз'
    ]
  };
  
  return steps[language];
}

/**
 * Генерировать ID для бронирования
 */
export function generateKyrgyzstanBookingId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `kg_booking_${timestamp}_${random}`;
}

/**
 * Проверить валидность номера телефона КР
 */
export function isValidKyrgyzstanPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Кыргызстанские номера начинаются с +996
  if (cleanPhone.startsWith('996')) {
    return cleanPhone.length === 12; // +996XXXXXXXXX
  }
  
  // Или без кода страны
  if (cleanPhone.length === 9) {
    const validPrefixes = ['770', '775', '776', '777', '555', '556', '557', '558', '500', '501', '502', '503'];
    return validPrefixes.some(prefix => cleanPhone.startsWith(prefix));
  }
  
  return false;
}

/**
 * Нормализовать номер телефона КР
 */
export function normalizeKyrgyzstanPhone(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.startsWith('996')) {
    return '+' + cleanPhone;
  }
  
  if (cleanPhone.length === 9) {
    return '+996' + cleanPhone;
  }
  
  return phone; // Возвращаем как есть если не можем нормализовать
}

/**
 * Получить предложенные временные слоты
 */
export function getSuggestedSlots(
  requestedTime: Date, 
  region: KyrgyzstanRegion, 
  count: number = 3
): string[] {
  const settings = REGIONAL_SETTINGS[region];
  const suggestions: string[] = [];
  
  for (let i = 1; i <= count; i++) {
    const suggestedTime = new Date(requestedTime);
    suggestedTime.setHours(suggestedTime.getHours() + i);
    
    if (suggestedTime.getHours() <= settings.workingHours.end) {
      suggestions.push(suggestedTime.toISOString());
    } else {
      // Переносим на следующий день
      const nextDay = new Date(requestedTime);
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(settings.workingHours.start + i - 1);
      suggestions.push(nextDay.toISOString());
    }
  }
  
  return suggestions;
}

/**
 * Валидация адреса для Кыргызстана
 */
export function validateKyrgyzstanAddress(address: any): boolean {
  if (!address || typeof address !== 'object') {
    return false;
  }
  
  const { type, value } = address;
  
  if (!type || !['exact', 'landmark', 'district'].includes(type)) {
    return false;
  }
  
  if (!value || typeof value !== 'string' || value.length < 10) {
    return false;
  }
  
  return true;
}

/**
 * Получить ссылку на бронирование
 */
export function getBookingLink(bookingId: string): string {
  const baseUrl = process.env.FRONTEND_URL || 'https://handshakeme.kg';
  return `${baseUrl}/bookings/${bookingId}`;
}