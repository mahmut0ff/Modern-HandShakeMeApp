/**
 * Instant Booking API Usage Examples
 * Примеры использования API мгновенного бронирования
 */

// 1. CREATE INSTANT BOOKING
// POST /instant-booking
const createBookingExample = {
  method: 'POST',
  url: '/instant-booking',
  headers: {
    'Authorization': 'Bearer <jwt_token>',
    'Content-Type': 'application/json'
  },
  body: {
    masterId: '123e4567-e89b-12d3-a456-426614174000',
    serviceId: '987fcdeb-51a2-43d1-9c45-123456789abc',
    datetime: '2024-02-15T14:30:00.000Z',
    duration: 60, // minutes
    paymentMethod: 'online', // 'on_meeting' | 'direct_transfer' | 'cash' | 'card_to_master' | 'online'
    clientNotes: 'Нужна помощь с установкой',
    address: 'ул. Пушкина, д. 10, кв. 5'
  }
};

// Response:
const createBookingResponse = {
  booking: {
    id: 'booking_1708012800000_abc123def',
    masterId: '123e4567-e89b-12d3-a456-426614174000',
    serviceId: '987fcdeb-51a2-43d1-9c45-123456789abc',
    scheduledDateTime: '2024-02-15T14:30:00.000Z',
    duration: 60,
    address: 'ул. Пушкина, д. 10, кв. 5',
    notes: 'Нужна помощь с установкой',
    baseAmount: 1000,
    urgentFee: 0,
    platformFee: 50,
    totalAmount: 1000,
    status: 'CONFIRMED',
    urgentBooking: false,
    autoConfirmed: true,
    createdAt: '2024-02-15T12:00:00.000Z',
    confirmedAt: '2024-02-15T12:00:00.000Z'
  },
  message: 'Instant booking created successfully'
};

// 2. GET AVAILABLE SLOTS
// GET /instant-booking/available-slots
const getAvailableSlotsExample = {
  method: 'GET',
  url: '/instant-booking/available-slots?masterId=123e4567-e89b-12d3-a456-426614174000&serviceId=987fcdeb-51a2-43d1-9c45-123456789abc&date=2024-02-15&duration=60',
  headers: {
    'Authorization': 'Bearer <jwt_token>'
  }
};

// Response:
const getAvailableSlotsResponse = {
  date: '2024-02-15',
  masterId: '123e4567-e89b-12d3-a456-426614174000',
  serviceId: '987fcdeb-51a2-43d1-9c45-123456789abc',
  duration: 60,
  slots: [
    {
      startTime: '09:00',
      endTime: '10:00',
      available: true,
      price: 1000,
      isUrgent: false
    },
    {
      startTime: '14:30',
      endTime: '15:30',
      available: true,
      price: 1250,
      urgentFee: 250,
      isUrgent: true
    }
  ],
  masterInfo: {
    name: 'Иван Петров',
    rating: 4.8,
    responseTime: 15
  },
  serviceInfo: {
    name: 'Установка техники',
    basePrice: 1000,
    description: 'Профессиональная установка бытовой техники'
  }
};

// 3. LIST BOOKINGS
// GET /instant-booking/list
const listBookingsExample = {
  method: 'GET',
  url: '/instant-booking/list?page=1&limit=20&status=CONFIRMED&role=client&sortBy=scheduledDateTime&sortOrder=desc',
  headers: {
    'Authorization': 'Bearer <jwt_token>'
  }
};

// Response:
const listBookingsResponse = {
  bookings: [
    {
      id: 'booking_1708012800000_abc123def',
      status: 'CONFIRMED',
      scheduledDateTime: '2024-02-15T14:30:00.000Z',
      duration: 60,
      address: 'ул. Пушкина, д. 10, кв. 5',
      notes: 'Нужна помощь с установкой',
      baseAmount: 1000,
      urgentFee: 0,
      totalAmount: 1000,
      urgentBooking: false,
      createdAt: '2024-02-15T12:00:00.000Z',
      confirmedAt: '2024-02-15T12:00:00.000Z',
      client: {
        id: 'user_456',
        name: 'Анна Сидорова',
        avatar: 'https://example.com/avatar.jpg',
        phone: '+7900123456',
        rating: 4.9
      },
      master: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Иван Петров',
        avatar: 'https://example.com/master-avatar.jpg',
        phone: '+7900654321',
        rating: 4.8,
        responseTime: 15
      },
      service: {
        id: '987fcdeb-51a2-43d1-9c45-123456789abc',
        name: 'Установка техники',
        description: 'Профессиональная установка бытовой техники',
        category: 'Техника'
      },
      canCancel: true,
      canReschedule: true,
      canStart: false,
      canComplete: false
    }
  ],
  pagination: {
    page: 1,
    limit: 20,
    totalCount: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false
  },
  filters: {
    status: 'CONFIRMED',
    role: 'client'
  },
  sorting: {
    sortBy: 'scheduledDateTime',
    sortOrder: 'desc'
  }
};

// 4. MANAGE BOOKING - CANCEL
// POST /instant-booking/manage
const cancelBookingExample = {
  method: 'POST',
  url: '/instant-booking/manage',
  headers: {
    'Authorization': 'Bearer <jwt_token>',
    'Content-Type': 'application/json'
  },
  body: {
    bookingId: 'booking_1708012800000_abc123def',
    action: 'cancel',
    reason: 'Изменились планы'
  }
};

// Response:
const cancelBookingResponse = {
  booking: {
    id: 'booking_1708012800000_abc123def',
    status: 'CANCELLED',
    cancelledAt: '2024-02-15T13:00:00.000Z',
    cancelledBy: 'user_456',
    cancellationReason: 'Изменились планы'
  },
  cancellationFee: 0,
  refundAmount: 1000,
  message: 'Booking cancelled successfully'
};

// 5. MANAGE BOOKING - RESCHEDULE
const rescheduleBookingExample = {
  method: 'POST',
  url: '/instant-booking/manage',
  headers: {
    'Authorization': 'Bearer <jwt_token>',
    'Content-Type': 'application/json'
  },
  body: {
    bookingId: 'booking_1708012800000_abc123def',
    action: 'reschedule',
    newDateTime: '2024-02-15T16:00:00.000Z',
    newDuration: 90
  }
};

// Response:
const rescheduleBookingResponse = {
  booking: {
    id: 'booking_1708012800000_abc123def',
    scheduledDateTime: '2024-02-15T16:00:00.000Z',
    duration: 90,
    urgentBooking: true,
    urgentFee: 250,
    totalAmount: 1250,
    rescheduledAt: '2024-02-15T13:00:00.000Z',
    rescheduledBy: 'user_456'
  },
  priceDifference: 250,
  message: 'Booking rescheduled successfully'
};

// 6. MANAGE BOOKING - START (Master only)
const startBookingExample = {
  method: 'POST',
  url: '/instant-booking/manage',
  headers: {
    'Authorization': 'Bearer <master_jwt_token>',
    'Content-Type': 'application/json'
  },
  body: {
    bookingId: 'booking_1708012800000_abc123def',
    action: 'start'
  }
};

// Response:
const startBookingResponse = {
  booking: {
    id: 'booking_1708012800000_abc123def',
    status: 'IN_PROGRESS',
    startedAt: '2024-02-15T14:30:00.000Z'
  },
  message: 'Booking started successfully'
};

// 7. MANAGE BOOKING - COMPLETE (Master only)
const completeBookingExample = {
  method: 'POST',
  url: '/instant-booking/manage',
  headers: {
    'Authorization': 'Bearer <master_jwt_token>',
    'Content-Type': 'application/json'
  },
  body: {
    bookingId: 'booking_1708012800000_abc123def',
    action: 'complete'
  }
};

// Response:
const completeBookingResponse = {
  booking: {
    id: 'booking_1708012800000_abc123def',
    status: 'COMPLETED',
    completedAt: '2024-02-15T15:30:00.000Z'
  },
  message: 'Booking completed successfully'
};

// ERROR RESPONSES
const errorResponses = {
  // Validation Error
  validationError: {
    statusCode: 400,
    body: {
      code: 'INVALID_REQUEST',
      message: 'Invalid booking data',
      errors: [
        {
          path: ['masterId'],
          message: 'Invalid uuid'
        }
      ]
    }
  },
  
  // Service Not Found
  serviceNotFound: {
    statusCode: 404,
    body: {
      code: 'SERVICE_NOT_FOUND',
      message: 'Service not found or instant booking not available'
    }
  },
  
  // Time Slot Unavailable
  timeSlotUnavailable: {
    statusCode: 409,
    body: {
      code: 'TIME_SLOT_UNAVAILABLE',
      message: 'Selected time slot is not available'
    }
  },
  
  // Insufficient Permissions
  insufficientPermissions: {
    statusCode: 403,
    body: {
      code: 'INSUFFICIENT_PERMISSIONS',
      message: 'You do not have permission to manage this booking'
    }
  },
  
  // Invalid Time
  invalidTime: {
    statusCode: 400,
    body: {
      code: 'INVALID_TIME',
      message: 'Booking must be at least 15 minutes in advance'
    }
  }
};

export {
  createBookingExample,
  createBookingResponse,
  getAvailableSlotsExample,
  getAvailableSlotsResponse,
  listBookingsExample,
  listBookingsResponse,
  cancelBookingExample,
  cancelBookingResponse,
  rescheduleBookingExample,
  rescheduleBookingResponse,
  startBookingExample,
  startBookingResponse,
  completeBookingExample,
  completeBookingResponse,
  errorResponses
};