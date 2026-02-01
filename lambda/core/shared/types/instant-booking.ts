/**
 * Instant Booking Types
 * Типы для мгновенного бронирования
 */

export interface InstantBooking {
  id: string;
  clientId: string;
  masterId: string;
  serviceId: string;
  
  scheduledDateTime: string;
  duration: number; // minutes
  address?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
  
  baseAmount: number;
  urgentFee: number;
  platformFee: number;
  totalAmount: number;
  
  status: BookingStatus;
  urgentBooking: boolean;
  autoConfirmed: boolean;
  
  paymentMethodId?: string;
  
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  cancellationFee?: number;
  refundAmount?: number;
  rescheduledAt?: string;
  rescheduledBy?: string;
  expiresAt?: string;
}

export type BookingStatus = 
  | 'PENDING' 
  | 'CONFIRMED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'EXPIRED';

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  price: number;
  urgentFee?: number;
  isUrgent: boolean;
}

export interface MasterAvailability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface BookingFilters {
  status?: BookingStatus;
  role?: 'client' | 'master';
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface BookingSort {
  sortBy: 'scheduledDateTime' | 'createdAt' | 'totalAmount';
  sortOrder: 'asc' | 'desc';
}

export interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface BookingPermissions {
  canCancel: boolean;
  canReschedule: boolean;
  canStart: boolean;
  canComplete: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  phone?: string;
  rating?: number;
  responseTime?: number;
}

export interface ServiceInfo {
  id: string;
  name: string;
  description?: string;
  category?: string;
  basePrice: number;
  instantBookingEnabled?: boolean;
}

export interface BookingTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  paymentMethodId?: string;
  relatedObjectType: 'INSTANT_BOOKING';
  relatedObjectId: string;
  description: string;
  createdAt: string;
  completedAt?: string;
}

export type TransactionType = 
  | 'INSTANT_BOOKING_PAYMENT'
  | 'REFUND'
  | 'ADDITIONAL_PAYMENT'
  | 'PARTIAL_REFUND'
  | 'BOOKING_PAYOUT';

export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: {
    bookingId: string;
    type: string;
    [key: string]: any;
  };
}

export type NotificationType = 
  | 'NEW_INSTANT_BOOKING'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_RESCHEDULED'
  | 'BOOKING_STARTED'
  | 'BOOKING_COMPLETED';