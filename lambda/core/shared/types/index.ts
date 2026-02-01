// Common types used across Lambda functions

export interface User {
  id: string;
  phone: string;
  email?: string;
  role: 'CLIENT' | 'MASTER' | 'ADMIN';
  firstName: string;
  lastName: string;
  name?: string; // Computed field for backward compatibility
  avatar?: string;
  rating?: number; // For masters
  completedProjects?: number; // For masters
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  verificationCode?: string;
  verificationCodeExpiry?: string;
  twoFactorEnabled: boolean;
  lastLoginAt?: string;
  isOnline: boolean;
  lastSeen?: string;
  telegramId?: string;
  telegramUsername?: string;
  telegramPhotoUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthContext {
  userId: string;
  role: 'CLIENT' | 'MASTER' | 'ADMIN';
  email: string;
  phone?: string;
  isVerified: boolean;
}

// Application types
export interface Application {
  id: string;
  orderId: string;
  masterId: string;
  coverLetter: string;
  proposedPrice: number;
  proposedDurationDays: number;
  status: 'PENDING' | 'VIEWED' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  viewedAt?: string;
}

export interface CreateApplicationRequest {
  orderId: string;
  coverLetter: string;
  proposedPrice: number;
  proposedDurationDays: number;
}

export interface UpdateApplicationRequest {
  coverLetter?: string;
  proposedPrice?: number;
  proposedDurationDays?: number;
}

export interface ApplicationResponse {
  application: Application;
  order?: {
    id: string;
    title: string;
    budget: number;
    deadline?: string;
  };
  master?: {
    id: string;
    name: string;
    rating: number;
  };
}

export interface APIGatewayAuthorizerContext {
  principalId: string;
  userId: string;
  role: string;
  email: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface SuccessResponse<T = unknown> {
  data: T;
  message?: string;
}

// Event types for EventBridge
export enum EventType {
  ORDER_CREATED = 'order.created',
  ORDER_UPDATED = 'order.updated',
  ORDER_DELETED = 'order.deleted',
  APPLICATION_CREATED = 'application.created',
  APPLICATION_ACCEPTED = 'application.accepted',
  APPLICATION_REJECTED = 'application.rejected',
  PROJECT_CREATED = 'project.created',
  PROJECT_STATUS_CHANGED = 'project.status_changed',
  PROJECT_COMPLETED = 'project.completed',
  REVIEW_SUBMITTED = 'review.submitted',
  PAYMENT_RESERVED = 'payment.reserved',
  PAYMENT_RELEASED = 'payment.released',
  MESSAGE_SENT = 'message.sent',
  USER_REGISTERED = 'user.registered',
  USER_VERIFIED = 'user.verified',
  USER_DEACTIVATED = 'user.deactivated',
}

export interface DomainEvent<T = unknown> {
  type: EventType;
  timestamp: string;
  userId: string;
  data: T;
  metadata?: Record<string, unknown>;
}

// Availability types
export interface WorkingHours {
  start: string; // HH:MM format
  end: string;   // HH:MM format
  enabled: boolean;
}

export interface WeeklyWorkingHours {
  monday: WorkingHours;
  tuesday: WorkingHours;
  wednesday: WorkingHours;
  thursday: WorkingHours;
  friday: WorkingHours;
  saturday: WorkingHours;
  sunday: WorkingHours;
}

export interface MasterAvailability {
  id: string;
  masterId: string;
  workingHours: WeeklyWorkingHours;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AvailabilitySlot {
  id: string;
  masterId: string;
  date: Date;
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  isBooked: boolean;
  bookedBy?: string;
  orderId?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface BookSlotRequest {
  slotId: string;
  orderId?: string;
  notes?: string;
}

export interface UpdateAvailabilityRequest {
  workingHours?: Partial<WeeklyWorkingHours>;
  timezone?: string;
  blockedDates?: string[]; // YYYY-MM-DD format
  generateSlots?: {
    startDate: string; // YYYY-MM-DD format
    endDate: string;   // YYYY-MM-DD format
    slotDuration: number; // minutes
  };
}

export interface AvailabilityStats {
  totalSlots: number;
  availableSlots: number;
  bookedSlots: number;
  availabilityRate: number; // percentage
}

// Background Check types
export interface BackgroundCheck {
  id: string;
  userId: string;
  checkType: 'IDENTITY' | 'CRIMINAL' | 'EMPLOYMENT' | 'EDUCATION' | 'COMPREHENSIVE';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  result?: 'PASSED' | 'FAILED' | 'CONDITIONAL';
  personalInfo: {
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth: string;
    ssn?: string;
    nationalId?: string;
    passportNumber?: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  previousAddresses?: Array<{
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    fromDate: string;
    toDate: string;
  }>;
  employmentHistory?: Array<{
    employer: string;
    position: string;
    startDate: string;
    endDate?: string;
    contactInfo?: {
      phone?: string;
      email?: string;
      address?: string;
    };
  }>;
  educationHistory?: Array<{
    institution: string;
    degree: string;
    fieldOfStudy: string;
    graduationDate: string;
    gpa?: number;
  }>;
  references?: Array<{
    name: string;
    relationship: string;
    phone: string;
    email?: string;
    yearsKnown: number;
  }>;
  consentAgreement: boolean;
  consentDate: string;
  pricing: {
    baseAmount: number;
    processingFee: number;
    total: number;
  };
  externalCheckId?: string;
  resultDetails?: any;
  disputeStatus?: 'NONE' | 'DISPUTED' | 'RESOLVED';
  failureReason?: string;
  createdAt: string;
  submittedAt?: string;
  completedAt?: string;
  estimatedCompletionDate: string;
  lastUpdated: string;
}

export interface BackgroundCheckDispute {
  id: string;
  backgroundCheckId: string;
  userId: string;
  disputeType: 'INCORRECT_INFORMATION' | 'IDENTITY_THEFT' | 'OUTDATED_RECORDS' | 'PROCESSING_ERROR' | 'OTHER';
  disputedItems: Array<{
    category: 'PERSONAL_INFO' | 'CRIMINAL_HISTORY' | 'EMPLOYMENT' | 'EDUCATION' | 'REFERENCES';
    field: string;
    currentValue: string;
    correctValue: string;
    explanation: string;
  }>;
  description: string;
  supportingDocuments?: Array<{
    fileName: string;
    fileUrl: string;
    fileType: 'PDF' | 'IMAGE' | 'DOCUMENT';
    description?: string;
  }>;
  contactPreference: 'EMAIL' | 'PHONE' | 'MAIL';
  urgentRequest: boolean;
  status: 'PENDING' | 'UNDER_REVIEW' | 'INVESTIGATING' | 'RESOLVED' | 'REJECTED' | 'FAILED';
  externalDisputeId?: string;
  failureReason?: string;
  resolution?: string;
  createdAt: string;
  submittedAt?: string;
  resolvedAt?: string;
  estimatedResolutionDate: string;
}

export interface DisputeTimeline {
  id: string;
  disputeId: string;
  action: string;
  description: string;
  performedBy: string;
  performedAt: string;
  details?: any;
}

export interface VerificationBadge {
  id: string;
  userId: string;
  badgeType: 'IDENTITY_VERIFIED' | 'CRIMINAL_BACKGROUND_CLEAR' | 'EMPLOYMENT_VERIFIED' | 'EDUCATION_VERIFIED' | 'COMPREHENSIVE_VERIFIED';
  earnedAt: string;
  expiresAt?: string;
  isActive: boolean;
  backgroundCheckId: string;
}

// Category and Skill types
export interface Category {
  id: string;
  name: string;
  icon: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Skill {
  id: string;
  name: string;
  categoryId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Calendar and Availability types
export interface CalendarIntegration {
  id: string;
  userId: string;
  provider: 'GOOGLE' | 'OUTLOOK' | 'APPLE' | 'CALDAV';
  calendarId: string;
  calendarName: string;
  credentials: {
    accessToken?: string;
    refreshToken?: string;
    clientId?: string;
    clientSecret?: string;
    serverUrl?: string;
    username?: string;
    password?: string;
  };
  settings: CalendarSettings;
  isActive: boolean;
  lastSyncAt?: string;
  lastError?: string;
  syncStats?: CalendarSyncStats;
  createdAt: string;
  updatedAt?: string;
  disconnectedAt?: string;
}

export interface CalendarSettings {
  syncDirection: 'BIDIRECTIONAL' | 'TO_EXTERNAL' | 'FROM_EXTERNAL';
  syncFrequency: 'REAL_TIME' | 'HOURLY' | 'DAILY';
  syncBookings: boolean;
  syncAvailability: boolean;
  syncPersonalEvents: boolean;
  conflictResolution: 'MANUAL' | 'EXTERNAL_WINS' | 'INTERNAL_WINS';
  timeZone: string;
  calendarName?: string;
  eventPrefix: string;
  includeClientInfo: boolean;
  includeLocation: boolean;
  reminderMinutes: number[];
}

export interface CalendarSyncStats {
  eventsImported: number;
  eventsExported: number;
  eventsUpdated: number;
  eventsDeleted: number;
  conflicts: number;
  lastSyncDuration: number;
}

export interface CalendarSyncLog {
  id: string;
  integrationId: string;
  syncType: 'MANUAL' | 'AUTOMATIC' | 'INITIAL';
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  stats?: CalendarSyncStats;
  conflicts?: CalendarConflict[];
  error?: string;
  createdAt: string;
}

export interface CalendarConflict {
  type: 'BOOKING_OVERLAP' | 'AVAILABILITY_MISMATCH' | 'EVENT_DELETED';
  internalEventId: string;
  externalEventId: string;
  description: string;
  suggestedResolution: string;
}

export interface MasterAvailability {
  id: string;
  masterId: string;
  scheduleType: 'WEEKLY' | 'SPECIFIC_DATE';
  dayOfWeek?: number; // 0-6, Sunday = 0
  specificDate?: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  isAvailable: boolean;
  serviceTypes?: string[];
  maxBookings: number;
  bufferBefore: number; // minutes
  bufferAfter: number; // minutes
  specialPricing?: {
    multiplier?: number;
    fixedAmount?: number;
  };
  slotType?: 'WORK' | 'BREAK' | 'BLOCKED';
  description?: string;
  reason?: string;
  timeZone: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BlockedTimeSlot {
  id: string;
  masterId: string;
  startDateTime: string;
  endDateTime: string;
  reason: string;
  blockType: 'VACATION' | 'SICK_LEAVE' | 'PERSONAL' | 'MAINTENANCE' | 'OTHER';
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
  parentBlockId?: string;
  timeZone: string;
  createdAt: string;
}

export interface RecurrencePattern {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval: number;
  endDate?: string;
  occurrences?: number;
}

export interface CalendarEvent {
  id: string;
  integrationId: string;
  externalEventId: string;
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  location?: string;
  attendees?: string[];
  isAllDay: boolean;
  status: 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED';
  createdAt: string;
  updatedAt?: string;
}

export interface AvailabilitySettings {
  timeZone: string;
  bufferTime?: {
    beforeBooking: number;
    afterBooking: number;
  };
  advanceBooking?: {
    minHours: number;
    maxDays: number;
  };
  calendarSync?: CalendarSettings;
}
