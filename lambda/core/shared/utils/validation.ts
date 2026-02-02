import { z } from 'zod';

export function validateInput<T>(schema: z.ZodSchema<T>) {
  return (data: any): T => {
    return schema.parse(data);
  };
}

export function validate<T>(schema: z.ZodSchema<T>, data: any): T {
  return schema.parse(data);
}

// Safe validation that returns result instead of throwing
export function validateSafe<T>(schema: z.ZodSchema<T>, data: any): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

// Common validation schemas
export const uuidSchema = z.string().uuid('Invalid UUID format');
export const phoneSchema = z.string().regex(/^\+996\d{9}$/, 'Invalid Kyrgyzstan phone number format (+996XXXXXXXXX)');
export const emailSchema = z.string().email('Invalid email format');

// User validation schemas
export const createUserSchema = z.object({
  phone: phoneSchema,
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  email: emailSchema.optional(),
  role: z.enum(['CLIENT', 'MASTER', 'ADMIN']).default('CLIENT'),
  telegramId: z.string().optional(),
  telegramUsername: z.string().optional(),
  telegramPhotoUrl: z.string().url().optional(),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  email: emailSchema.optional(),
  avatar: z.string().url().optional(),
  isPhoneVerified: z.boolean().optional(),
  isEmailVerified: z.boolean().optional(),
  twoFactorEnabled: z.boolean().optional(),
  isOnline: z.boolean().optional(),
  lastSeen: z.string().datetime().optional(),
  telegramId: z.string().optional(),
  telegramUsername: z.string().optional(),
  telegramPhotoUrl: z.string().url().optional(),
});

// Order validation schemas
export const createOrderSchema = z.object({
  clientId: uuidSchema,
  categoryId: uuidSchema,
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long'),
  city: z.string().min(1, 'City is required').max(100, 'City name too long'),
  address: z.string().min(1, 'Address is required').max(500, 'Address too long'),
  hideAddress: z.boolean().default(true),
  budgetType: z.enum(['FIXED', 'RANGE', 'NEGOTIABLE']),
  budgetMin: z.number().positive().optional(),
  budgetMax: z.number().positive().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isUrgent: z.boolean().default(false),
  expiresAt: z.string().datetime().optional(),
}).refine((data) => {
  // Validate budget configuration
  if (data.budgetType === 'FIXED' && !data.budgetMin) {
    return false;
  }
  if (data.budgetType === 'RANGE' && (!data.budgetMin || !data.budgetMax)) {
    return false;
  }
  if (data.budgetMin && data.budgetMax && data.budgetMin > data.budgetMax) {
    return false;
  }
  return true;
}, {
  message: 'Invalid budget configuration',
});

export const updateOrderSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(2000).optional(),
  city: z.string().min(1).max(100).optional(),
  address: z.string().max(500).optional(),
  hideAddress: z.boolean().optional(),
  budgetType: z.enum(['FIXED', 'RANGE', 'NEGOTIABLE']).optional(),
  budgetMin: z.number().positive().optional(),
  budgetMax: z.number().positive().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  isUrgent: z.boolean().optional(),
  expiresAt: z.string().datetime().optional(),
});

// Phone-based registration schema
export const phoneRegistrationSchema = z.object({
  phone: phoneSchema,
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  role: z.enum(['CLIENT', 'MASTER'], {
    errorMap: () => ({ message: 'Role must be either CLIENT or MASTER' })
  }),
});

// Phone-based login schema
export const phoneLoginSchema = z.object({
  phone: phoneSchema,
  code: z.string().regex(/^\d{4}$/, 'Verification code must be 4 digits').optional(),
});

// Phone verification schema
export const phoneVerificationSchema = z.object({
  phone: phoneSchema,
  code: z.string().regex(/^\d{4}$/, 'Verification code must be 4 digits'),
});

// Resend verification schema
export const resendVerificationSchema = z.object({
  phone: phoneSchema,
});

// Service creation schema with mobile-compatible units
export const serviceSchema = z.object({
  name: z.string().min(3, 'Service name must be at least 3 characters').max(100, 'Service name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  categoryId: uuidSchema,
  priceFrom: z.number().positive('Price must be positive'),
  priceTo: z.number().positive('Price must be positive').optional(),
  unit: z.enum(['hour', 'sqm', 'piece', 'project', 'day'], {
    errorMap: () => ({ message: 'Invalid unit type' })
  }),
  isActive: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
}).refine((data) => {
  // Validate price range
  if (data.priceTo && data.priceTo < data.priceFrom) {
    return false;
  }
  return true;
}, {
  message: 'Price "to" must be greater than price "from"',
});

// Application creation schema
export const applicationSchema = z.object({
  orderId: uuidSchema,
  proposal: z.string().min(10, 'Proposal must be at least 10 characters').max(2000, 'Proposal too long'),
  price: z.number().positive('Price must be positive'),
  estimatedDuration: z.number().int().positive().optional(),
  coverLetter: z.string().max(1000).optional(),
});

// Project update schema
export const projectSchema = z.object({
  status: z.enum(['NEW', 'IN_PROGRESS', 'REVIEW', 'REVISION', 'COMPLETED', 'ARCHIVED']).optional(),
  progressPercentage: z.number().int().min(0).max(100).optional(),
  notes: z.string().max(1000).optional(),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().max(100).optional().default(20),
  sortBy: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Notification schemas
export const createNotificationSchema = z.object({
  userId: uuidSchema,
  type: z.enum(['ORDER', 'APPLICATION', 'PROJECT', 'REVIEW', 'CHAT', 'PAYMENT', 'SYSTEM', 'SYSTEM_TEST']),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  message: z.string().min(1, 'Message is required').max(1000, 'Message too long'),
  data: z.record(z.any()).optional(),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
});

export const updateNotificationSchema = z.object({
  isRead: z.boolean().optional(),
  title: z.string().min(1).max(200).optional(),
  message: z.string().min(1).max(1000).optional(),
  data: z.record(z.any()).optional(),
  priority: z.enum(['low', 'normal', 'high']).optional(),
});

// Availability schemas
export const workingHoursSchema = z.object({
  start: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  end: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  enabled: z.boolean()
});

export const updateAvailabilitySchema = z.object({
  workingHours: z.object({
    monday: workingHoursSchema.optional(),
    tuesday: workingHoursSchema.optional(),
    wednesday: workingHoursSchema.optional(),
    thursday: workingHoursSchema.optional(),
    friday: workingHoursSchema.optional(),
    saturday: workingHoursSchema.optional(),
    sunday: workingHoursSchema.optional()
  }).optional(),
  timezone: z.string().optional(),
  blockedDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  generateSlots: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    slotDuration: z.number().min(15).max(480).default(60) // 15 minutes to 8 hours
  }).optional()
});

export const bookSlotSchema = z.object({
  slotId: uuidSchema,
  orderId: uuidSchema.optional(),
  notes: z.string().max(500, 'Notes too long').optional()
});

// Background Check schemas
export const initiateCheckSchema = z.object({
  checkType: z.enum(['IDENTITY', 'CRIMINAL', 'EMPLOYMENT', 'EDUCATION', 'COMPREHENSIVE']),
  personalInfo: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    middleName: z.string().optional(),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    ssn: z.string().regex(/^\d{3}-\d{2}-\d{4}$/).optional(),
    nationalId: z.string().optional(),
    passportNumber: z.string().optional(),
  }),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zipCode: z.string().min(1),
    country: z.string().min(1),
  }),
  consentAgreement: z.boolean().refine(val => val === true, {
    message: 'Consent agreement must be accepted',
  }),
  consentDate: z.string().datetime(),
});

export const disputeResultsSchema = z.object({
  checkId: uuidSchema,
  disputeType: z.enum(['INCORRECT_INFORMATION', 'IDENTITY_THEFT', 'OUTDATED_RECORDS', 'PROCESSING_ERROR', 'OTHER']),
  description: z.string().min(10).max(2000),
  contactPreference: z.enum(['EMAIL', 'PHONE', 'MAIL']).default('EMAIL'),
  urgentRequest: z.boolean().default(false),
});

// Legacy schemas for backward compatibility
export const registrationSchema = phoneRegistrationSchema;
export const loginSchema = phoneLoginSchema;

// ID validation helpers
export const validateUserId = (userId: string): boolean => {
  return uuidSchema.safeParse(userId).success;
};

export const validateOrderId = (orderId: string): boolean => {
  return uuidSchema.safeParse(orderId).success;
};

export const validatePhone = (phone: string): boolean => {
  return phoneSchema.safeParse(phone).success;
};

export const validateEmail = (email: string): boolean => {
  return emailSchema.safeParse(email).success;
};

// Validation error formatter
export function formatValidationErrors(error: z.ZodError): Array<{
  field: string;
  message: string;
  code: string;
}> {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code
  }));
}


// Calendar sync schema
export const syncCalendarSchema = z.object({
  action: z.enum(['CONNECT', 'DISCONNECT', 'SYNC', 'GET_STATUS']),
  provider: z.enum(['GOOGLE', 'OUTLOOK', 'APPLE', 'CALDAV']).optional(),
  credentials: z.object({
    accessToken: z.string().optional(),
    refreshToken: z.string().optional(),
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    serverUrl: z.string().url().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
  }).optional(),
  settings: z.object({
    syncDirection: z.enum(['BIDIRECTIONAL', 'TO_EXTERNAL', 'FROM_EXTERNAL']).optional(),
    syncFrequency: z.enum(['REAL_TIME', 'HOURLY', 'DAILY']).optional(),
    syncBookings: z.boolean().optional(),
    syncAvailability: z.boolean().optional(),
    syncPersonalEvents: z.boolean().optional(),
    conflictResolution: z.enum(['MANUAL', 'EXTERNAL_WINS', 'INTERNAL_WINS']).optional(),
    timeZone: z.string().optional(),
    calendarName: z.string().optional(),
    eventPrefix: z.string().optional(),
    includeClientInfo: z.boolean().optional(),
    includeLocation: z.boolean().optional(),
    reminderMinutes: z.array(z.number()).optional(),
  }).optional(),
});

// Notification type enum for validation
export const notificationTypeSchema = z.enum([
  'ORDER', 'APPLICATION', 'PROJECT', 'REVIEW', 'CHAT', 
  'PAYMENT', 'SYSTEM', 'SYSTEM_TEST', 'LOCATION'
]);

// Get check status schema
export const getCheckStatusSchema = z.object({
  checkId: z.string().uuid().optional(),
});

// Manage availability schema
export const manageAvailabilitySchema = z.object({
  action: z.enum(['SET_WEEKLY', 'SET_SPECIFIC_DATE', 'BLOCK_TIME', 'UNBLOCK_TIME', 'SET_VACATION', 'IMPORT_FROM_CALENDAR']),
  weeklySchedule: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    timeSlots: z.array(z.object({
      startTime: z.string(),
      endTime: z.string(),
      isAvailable: z.boolean().default(true),
      serviceTypes: z.array(z.string()).optional(),
      maxBookings: z.number().optional(),
    })),
    breaks: z.array(z.object({
      startTime: z.string(),
      endTime: z.string(),
      description: z.string().optional(),
    })).optional(),
  })).optional(),
  specificDates: z.array(z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    timeSlots: z.array(z.object({
      startTime: z.string(),
      endTime: z.string(),
      isAvailable: z.boolean().default(true),
      serviceTypes: z.array(z.string()).optional(),
      maxBookings: z.number().optional(),
      specialPricing: z.number().optional(),
    })),
    reason: z.string().optional(),
  })).optional(),
  blockedPeriods: z.array(z.object({
    startDateTime: z.string().datetime(),
    endDateTime: z.string().datetime(),
    reason: z.string().optional(),
    blockType: z.enum(['PERSONAL', 'VACATION', 'MAINTENANCE', 'OTHER']).default('PERSONAL'),
    isRecurring: z.boolean().default(false),
    recurrencePattern: z.object({
      frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
      interval: z.number().default(1),
      occurrences: z.number().optional(),
      endDate: z.string().datetime().optional(),
    }).optional(),
  })).optional(),
  bufferTime: z.object({
    beforeBooking: z.number().min(0).default(0),
    afterBooking: z.number().min(0).default(0),
  }).optional(),
  timeZone: z.string().optional(),
  calendarSync: z.object({
    syncFromCalendar: z.boolean().default(false),
    calendarProvider: z.enum(['GOOGLE', 'OUTLOOK', 'APPLE', 'CALDAV']).optional(),
  }).optional(),
});
