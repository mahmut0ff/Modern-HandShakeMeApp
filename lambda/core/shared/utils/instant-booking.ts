/**
 * Instant Booking Utilities
 * Утилиты для мгновенного бронирования
 */

import { InstantBooking, BookingStatus, TimeSlot, BookingPermissions } from '../types/instant-booking';

/**
 * Generate unique booking ID
 */
export function generateBookingId(): string {
  return `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate unique transaction ID
 */
export function generateTransactionId(): string {
  return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if booking is urgent (less than 2 hours)
 */
export function isUrgentBooking(scheduledDateTime: string): boolean {
  const now = new Date();
  const bookingTime = new Date(scheduledDateTime);
  const hoursUntilBooking = (bookingTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursUntilBooking < 2;
}

/**
 * Calculate urgent fee
 */
export function calculateUrgentFee(baseAmount: number): number {
  return baseAmount * 0.25; // 25% urgent fee
}

/**
 * Calculate platform fee
 */
export function calculatePlatformFee(amount: number): number {
  return amount * 0.05; // 5% platform fee
}

/**
 * Calculate total amount including fees
 */
export function calculateTotalAmount(baseAmount: number, isUrgent: boolean): number {
  let total = baseAmount;
  
  if (isUrgent) {
    total += calculateUrgentFee(baseAmount);
  }
  
  return total;
}

/**
 * Calculate cancellation fee based on timing
 */
export function calculateCancellationFee(
  totalAmount: number, 
  scheduledDateTime: string,
  status: BookingStatus
): { cancellationFee: number; refundAmount: number } {
  if (status !== 'CONFIRMED') {
    return { cancellationFee: 0, refundAmount: totalAmount };
  }

  const now = new Date();
  const bookingTime = new Date(scheduledDateTime);
  const hoursUntilBooking = (bookingTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  let cancellationFee = 0;
  
  if (hoursUntilBooking < 2) {
    cancellationFee = totalAmount * 0.5; // 50% fee for last-minute cancellation
  } else if (hoursUntilBooking < 24) {
    cancellationFee = totalAmount * 0.25; // 25% fee for same-day cancellation
  }
  
  const refundAmount = totalAmount - cancellationFee;
  
  return { cancellationFee, refundAmount };
}

/**
 * Check if time slots conflict
 */
export function hasTimeConflict(
  startTime1: Date,
  endTime1: Date,
  startTime2: Date,
  endTime2: Date
): boolean {
  return (
    (startTime1 >= startTime2 && startTime1 < endTime2) ||
    (endTime1 > startTime2 && endTime1 <= endTime2) ||
    (startTime1 <= startTime2 && endTime1 >= endTime2)
  );
}

/**
 * Generate time slots for a day
 */
export function generateTimeSlots(
  date: Date,
  startTime: string,
  endTime: string,
  duration: number,
  existingBookings: any[],
  minBookingTime: Date,
  basePrice: number
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  
  // Parse start and end times
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startDateTime = new Date(date);
  startDateTime.setHours(startHour, startMinute, 0, 0);
  
  const endDateTime = new Date(date);
  endDateTime.setHours(endHour, endMinute, 0, 0);
  
  // Generate slots every 30 minutes
  const slotInterval = 30; // minutes
  let currentTime = new Date(startDateTime);
  
  while (currentTime.getTime() + duration * 60 * 1000 <= endDateTime.getTime()) {
    const slotEndTime = new Date(currentTime.getTime() + duration * 60 * 1000);
    
    // Check if slot is in the future
    if (currentTime >= minBookingTime) {
      // Check if slot conflicts with existing bookings
      const hasConflict = existingBookings.some(booking => {
        const bookingStart = new Date(booking.scheduledDateTime);
        const bookingEnd = new Date(bookingStart.getTime() + booking.duration * 60 * 1000);
        
        return hasTimeConflict(currentTime, slotEndTime, bookingStart, bookingEnd);
      });
      
      if (!hasConflict) {
        const now = new Date();
        const hoursUntilSlot = (currentTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        const isUrgent = hoursUntilSlot < 2;
        
        let price = basePrice;
        let urgentFee = 0;
        
        if (isUrgent) {
          urgentFee = calculateUrgentFee(basePrice);
          price += urgentFee;
        }
        
        slots.push({
          startTime: currentTime.toTimeString().slice(0, 5),
          endTime: slotEndTime.toTimeString().slice(0, 5),
          available: true,
          price,
          urgentFee: urgentFee > 0 ? urgentFee : undefined,
          isUrgent,
        });
      }
    }
    
    // Move to next slot
    currentTime = new Date(currentTime.getTime() + slotInterval * 60 * 1000);
  }
  
  return slots;
}

/**
 * Check user permissions for booking actions
 */
export function getBookingPermissions(
  booking: InstantBooking,
  userId: string,
  userRole?: string
): BookingPermissions {
  const now = new Date();
  const scheduledTime = new Date(booking.scheduledDateTime);
  const hoursUntilBooking = (scheduledTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  const timeDifference = Math.abs(now.getTime() - scheduledTime.getTime()) / (1000 * 60);
  
  const isOwner = booking.clientId === userId || booking.masterId === userId;
  const isAdmin = userRole === 'ADMIN';
  const isMaster = booking.masterId === userId;
  
  return {
    canCancel: (isOwner || isAdmin) && 
               ['PENDING', 'CONFIRMED'].includes(booking.status) && 
               hoursUntilBooking > 0,
               
    canReschedule: (isOwner || isAdmin) && 
                   ['PENDING', 'CONFIRMED'].includes(booking.status) && 
                   hoursUntilBooking > 2,
                   
    canStart: (isMaster || isAdmin) && 
              booking.status === 'CONFIRMED' && 
              timeDifference <= 15,
              
    canComplete: (isMaster || isAdmin) && 
                 booking.status === 'IN_PROGRESS'
  };
}

/**
 * Format booking for API response
 */
export function formatBookingResponse(booking: InstantBooking): any {
  return {
    id: booking.id,
    masterId: booking.masterId,
    serviceId: booking.serviceId,
    scheduledDateTime: booking.scheduledDateTime,
    duration: booking.duration,
    address: booking.address,
    coordinates: booking.coordinates,
    notes: booking.notes,
    baseAmount: booking.baseAmount,
    urgentFee: booking.urgentFee,
    platformFee: booking.platformFee,
    totalAmount: booking.totalAmount,
    status: booking.status,
    urgentBooking: booking.urgentBooking,
    autoConfirmed: booking.autoConfirmed,
    createdAt: booking.createdAt,
    confirmedAt: booking.confirmedAt,
    startedAt: booking.startedAt,
    completedAt: booking.completedAt,
    cancelledAt: booking.cancelledAt,
    cancelledBy: booking.cancelledBy,
    cancellationReason: booking.cancellationReason,
    cancellationFee: booking.cancellationFee,
    refundAmount: booking.refundAmount,
    rescheduledAt: booking.rescheduledAt,
    rescheduledBy: booking.rescheduledBy
  };
}

/**
 * Validate booking time constraints
 */
export function validateBookingTime(scheduledDateTime: string, duration: number): {
  isValid: boolean;
  error?: string;
} {
  const now = new Date();
  const bookingTime = new Date(scheduledDateTime);
  const endTime = new Date(bookingTime.getTime() + duration * 60 * 1000);
  
  // Check if booking is in the past
  if (bookingTime <= now) {
    return { isValid: false, error: 'Booking time must be in the future' };
  }
  
  // Check minimum advance booking (15 minutes)
  const minBookingTime = new Date(now.getTime() + 15 * 60 * 1000);
  if (bookingTime < minBookingTime) {
    return { isValid: false, error: 'Booking must be at least 15 minutes in advance' };
  }
  
  // Check maximum advance booking (30 days)
  const maxBookingTime = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  if (bookingTime > maxBookingTime) {
    return { isValid: false, error: 'Booking cannot be more than 30 days in advance' };
  }
  
  // Check business hours (6 AM to 11 PM)
  const hour = bookingTime.getHours();
  const endHour = endTime.getHours();
  if (hour < 6 || hour >= 23 || endHour > 23) {
    return { isValid: false, error: 'Booking must be within business hours (6 AM - 11 PM)' };
  }
  
  return { isValid: true };
}

/**
 * Get localized date string
 */
export function formatBookingDate(dateTime: string, locale: string = 'ru'): string {
  const date = new Date(dateTime);
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}