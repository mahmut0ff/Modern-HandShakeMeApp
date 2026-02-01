/**
 * Kyrgyzstan API Usage Examples
 * Примеры использования API для Кыргызстана
 */

// 1. CREATE KYRGYZSTAN BOOKING
// POST /kyrgyzstan/instant-booking
const createKyrgyzstanBookingExample = {
  method: 'POST',
  url: '/kyrgyzstan/instant-booking',
  headers: {
    'Authorization': 'Bearer <jwt_token>',
    'Content-Type': 'application/json'
  },
  body: {
    masterId: '123e4567-e89b-12d3-a456-426614174000',
    serviceId: '987fcdeb-51a2-43d1-9c45-123456789abc',
    datetime: '2024-02-15T14:30:00.000Z',
    duration: 90, // minutes
    
    // Локальные способы оплаты
    paymentMethod: 'cash_on_meeting', // 'optima_bank' | 'demir_bank' | 'o_money' | 'mega_pay' | 'crypto_usdt'
    
    // Гибкая система адресов
    address: {
      type: 'landmark', // 'exact' | 'landmark' | 'district'
      value: 'Рядом с ТЦ Дордой, напротив кафе "Ала-Тоо"',
      district: 'Свердловский район',
      landmark: 'ТЦ Дордой',
      phoneConfirmation: true
    },
    
    // Региональные настройки
    region: 'bishkek', // 'osh' | 'jalal_abad' | 'karakol' | 'other'
    language: 'ru', // 'ky'
    urgency: 'normal', // 'urgent' | 'asap'
    
    clientNotes: 'Нужна установка кондиционера в квартире на 5 этаже'
  }
};

// Response:
const createKyrgyzstanBookingResponse = {
  booking: {
    id: 'kg_booking_1708012800000_abc123def',
    master_id: '123e4567-e89b-12d3-a456-426614174000',
    service_id: '987fcdeb-51a2-43d1-9c45-123456789abc',
    datetime: '2024-02-15T14:30:00.000Z',
    duration: 90,
    total_price: 1140, // С учетом региональных коэффициентов
    commission: 23, // 2% для наличных
    payment_method: 'cash_on_meeting',
    payment_status: 'pending_meeting',
    address: {
      type: 'landmark',
      value: 'Рядом с ТЦ Дордой, напротив кафе "Ала-Тоо"',
      district: 'Свердловский район',
      landmark: 'ТЦ Дордой',
      phoneConfirmation: true
    },
    region: 'bishkek',
    urgency: 'normal',
    status: 'confirmed',
    created_at: '2024-02-15T12:00:00.000Z',
    confirmed_at: '2024-02-15T12:00:00.000Z',
    booking_link: 'https://handshakeme.kg/bookings/kg_booking_1708012800000_abc123def'
  },
  payment_instructions: 'Оплата наличными при встрече с мастером',
  next_steps: [
    'Мастер свяжется с вами для подтверждения адреса',
    'Подготовьте необходимые материалы',
    'Ожидайте мастера в указанное время'
  ],
  message: 'Заказ создан успешно'
};

// 2. SEND SMS NOTIFICATION
// POST /kyrgyzstan/sms/send
const sendSMSExample = {
  method: 'POST',
  url: '/kyrgyzstan/sms/send',
  headers: {
    'Authorization': 'Bearer <jwt_token>',
    'Content-Type': 'application/json'
  },
  body: {
    phoneNumber: '+996770123456',
    template: 'booking_confirmed',
    language: 'ru',
    variables: {
      masterName: 'Иван Петров',
      phone: '+996555987654',
      datetime: '15 февраля 2024 г., 14:30'
    },
    priority: 'high'
  }
};

// Response:
const sendSMSResponse = {
  success: true,
  messageId: 'sns-message-id-12345'
};

// 3. SEND BULK SMS
// POST /kyrgyzstan/sms/bulk
const sendBulkSMSExample = {
  method: 'POST',
  url: '/kyrgyzstan/sms/bulk',
  headers: {
    'Authorization': 'Bearer <jwt_token>',
    'Content-Type': 'application/json'
  },
  body: {
    messages: [
      {
        phoneNumber: '+996770123456',
        template: 'booking_reminder',
        language: 'ru',
        variables: {
          address: 'ТЦ Дордой',
          phone: '+996555987654'
        }
      },
      {
        phoneNumber: '+996555987654',
        template: 'new_booking',
        language: 'ky',
        variables: {
          clientName: 'Айгуль Токтосунова',
          datetime: '15-февраль 2024, 14:30',
          link: 'https://handshakeme.kg/bookings/123'
        }
      }
    ]
  }
};

// Response:
const sendBulkSMSResponse = {
  sent: 2,
  failed: 0,
  results: [
    { success: true, messageId: 'sns-message-id-12345' },
    { success: true, messageId: 'sns-message-id-12346' }
  ]
};

// 4. GET SMS STATS
// GET /kyrgyzstan/sms/stats
const getSMSStatsExample = {
  method: 'GET',
  url: '/kyrgyzstan/sms/stats?dateFrom=2024-02-01&dateTo=2024-02-15',
  headers: {
    'Authorization': 'Bearer <jwt_token>'
  }
};

// Response:
const getSMSStatsResponse = {
  success: true,
  stats: {
    totalSent: 1250,
    totalFailed: 23,
    byOperator: {
      beeline: 520,
      megacom: 430,
      o_mobile: 300,
      unknown: 23
    },
    byTemplate: {
      booking_confirmed: 450,
      new_booking: 380,
      booking_reminder: 250,
      payment_reminder: 170
    },
    byLanguage: {
      ru: 875,
      ky: 398
    }
  },
  period: {
    dateFrom: '2024-02-01',
    dateTo: '2024-02-15'
  }
};

// 5. SEND BOOKING REMINDER
// POST /kyrgyzstan/sms/reminder
const sendReminderExample = {
  method: 'POST',
  url: '/kyrgyzstan/sms/reminder',
  headers: {
    'Authorization': 'Bearer <jwt_token>',
    'Content-Type': 'application/json'
  },
  body: {
    bookingId: 'kg_booking_1708012800000_abc123def',
    type: 'reminder' // 'booking' | 'reminder' | 'payment'
  }
};

// Response:
const sendReminderResponse = {
  success: true,
  result: {
    success: true,
    messageId: 'sns-message-id-12347'
  }
};

// REGIONAL PRICING EXAMPLES
const regionalPricingExamples = {
  // Базовая услуга: 1000 сом/час, длительность: 1 час
  
  bishkek_normal: {
    region: 'bishkek',
    urgency: 'normal',
    paymentMethod: 'cash_on_meeting',
    calculation: {
      basePrice: 1000,
      regionalMultiplier: 1.0,    // Бишкек - базовая цена
      urgencyMultiplier: 1.0,     // Обычная срочность
      paymentMultiplier: 0.95,    // -5% за наличные
      total: 950,                 // 1000 * 1.0 * 1.0 * 0.95
      commission: 19              // 2% для наличных
    }
  },
  
  osh_urgent: {
    region: 'osh',
    urgency: 'urgent',
    paymentMethod: 'optima_bank',
    calculation: {
      basePrice: 1000,
      regionalMultiplier: 0.8,    // Ош - на 20% дешевле
      urgencyMultiplier: 1.2,     // +20% за срочность
      paymentMultiplier: 1.0,     // Банк без скидки
      total: 960,                 // 1000 * 0.8 * 1.2 * 1.0
      commission: 24              // 2.5% для банков
    }
  },
  
  karakol_asap_crypto: {
    region: 'karakol',
    urgency: 'asap',
    paymentMethod: 'crypto_usdt',
    calculation: {
      basePrice: 1000,
      regionalMultiplier: 0.9,    // Каракол - на 10% дешевле
      urgencyMultiplier: 1.5,     // +50% за очень срочно
      paymentMultiplier: 0.98,    // -2% за криптовалюту
      total: 1323,                // 1000 * 0.9 * 1.5 * 0.98
      commission: 20              // 1.5% для криптовалют
    }
  }
};

// PAYMENT METHOD EXAMPLES
const paymentMethodExamples = {
  cash_on_meeting: {
    name: 'Наличные при встрече',
    name_ky: 'Усталык менен жолуккандагы накт акча төлөө',
    multiplier: 0.95,           // -5% скидка
    commission: 0.02,           // 2% комиссия
    status: 'pending_meeting',
    instructions: {
      ru: 'Оплата наличными при встрече с мастером',
      ky: 'Усталык менен жолуккандагы накт акча төлөө'
    }
  },
  
  optima_bank: {
    name: 'Оптима Банк',
    name_ky: 'Оптима Банк',
    multiplier: 1.0,
    commission: 0.025,          // 2.5% комиссия
    status: 'pending_payment',
    instructions: {
      ru: 'Перевод через Оптима Банк: *111# или мобильное приложение',
      ky: 'Оптима Банк аркылуу которуу: *111# же мобилдик тиркеме'
    }
  },
  
  o_money: {
    name: 'O!Money (Beeline)',
    name_ky: 'O!Money (Beeline)',
    multiplier: 1.02,           // +2% комиссия
    commission: 0.03,           // 3% комиссия
    status: 'pending_payment',
    instructions: {
      ru: 'O!Money (Beeline): *5005# - мобильные платежи',
      ky: 'O!Money (Beeline): *5005# - мобилдик төлөмдөр'
    }
  },
  
  crypto_usdt: {
    name: 'USDT (Криптовалюта)',
    name_ky: 'USDT (Криптовалюта)',
    multiplier: 0.98,           // -2% скидка
    commission: 0.015,          // 1.5% комиссия
    status: 'pending_crypto',
    instructions: {
      ru: 'Оплата USDT - реквизиты будут отправлены отдельно',
      ky: 'USDT төлөө - реквизиттер өзүнчө жөнөтүлөт'
    }
  }
};

// SMS TEMPLATES
const smsTemplateExamples = {
  new_booking: {
    ru: 'HandShakeMe: Новый заказ от {clientName} на {datetime}. Ответить: {link}',
    ky: 'HandShakeMe: {clientName} тарабынан жаңы заказ {datetime}. Жооп берүү: {link}',
    variables: ['clientName', 'datetime', 'link']
  },
  
  booking_confirmed: {
    ru: 'HandShakeMe: Заказ подтвержден. Мастер: {masterName}, тел: {phone}. Время: {datetime}',
    ky: 'HandShakeMe: Заказ ырасталды. Усталык: {masterName}, тел: {phone}. Убакыт: {datetime}',
    variables: ['masterName', 'phone', 'datetime']
  },
  
  booking_reminder: {
    ru: 'HandShakeMe: Напоминание о встрече через 1 час. Адрес: {address}. Тел мастера: {phone}',
    ky: 'HandShakeMe: 1 сааттан кийин жолугушуу эскертүү. Дарек: {address}. Усталыктын тел: {phone}',
    variables: ['address', 'phone']
  },
  
  payment_reminder: {
    ru: 'HandShakeMe: Не забудьте оплатить услугу. Способ: {paymentMethod}. Сумма: {amount} сом',
    ky: 'HandShakeMe: Кызматты төлөөнү унутпаңыз. Жол: {paymentMethod}. Сумма: {amount} сом',
    variables: ['paymentMethod', 'amount']
  }
};

// ERROR RESPONSES
const errorResponses = {
  // Validation Error
  validationError: {
    statusCode: 400,
    body: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      errors: [
        {
          path: ['address', 'value'],
          message: 'String must contain at least 10 character(s)'
        }
      ]
    }
  },
  
  // Service Not Found
  serviceNotFound: {
    statusCode: 404,
    body: {
      code: 'SERVICE_NOT_FOUND',
      message: 'Кызмат табылган жок' // На кыргызском если language=ky
    }
  },
  
  // Time Slot Unavailable
  slotNotAvailable: {
    statusCode: 409,
    body: {
      code: 'SLOT_NOT_AVAILABLE',
      message: 'Тандалган убакыт жеткиликсиз',
      suggestions: [
        '2024-02-15T15:30:00.000Z',
        '2024-02-15T16:30:00.000Z',
        '2024-02-15T17:30:00.000Z'
      ]
    }
  },
  
  // Outside Working Hours
  outsideWorkingHours: {
    statusCode: 409,
    body: {
      code: 'SLOT_NOT_AVAILABLE',
      message: 'Иш убактысынан тышкары',
      suggestions: [
        '2024-02-16T09:00:00.000Z',
        '2024-02-16T10:00:00.000Z',
        '2024-02-16T11:00:00.000Z'
      ]
    }
  },
  
  // Invalid Phone Number
  invalidPhone: {
    statusCode: 400,
    body: {
      success: false,
      error: 'Invalid Kyrgyzstan phone number'
    }
  }
};

export {
  createKyrgyzstanBookingExample,
  createKyrgyzstanBookingResponse,
  sendSMSExample,
  sendSMSResponse,
  sendBulkSMSExample,
  sendBulkSMSResponse,
  getSMSStatsExample,
  getSMSStatsResponse,
  sendReminderExample,
  sendReminderResponse,
  regionalPricingExamples,
  paymentMethodExamples,
  smsTemplateExamples,
  errorResponses
};