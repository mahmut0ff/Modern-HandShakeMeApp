/**
 * Manage Instant Booking (confirm, cancel, reschedule, start, complete)
 * Управление мгновенным бронированием
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { z } from 'zod';
import { InstantBookingRepository } from '../shared/repositories/instant-booking.repository';
import { InstantBookingService } from '../shared/services/instant-booking.service';
import { 
  calculateCancellationFee, 
  isUrgentBooking, 
  calculateUrgentFee,
  validateBookingTime,
  formatBookingResponse 
} from '../shared/utils/instant-booking';
import { InstantBooking } from '../shared/types/instant-booking';

// Validation schema
const manageBookingSchema = z.object({
  bookingId: z.string().uuid(),
  action: z.enum(['confirm', 'cancel', 'reschedule', 'complete', 'start']),
  reason: z.string().optional(),
  newDateTime: z.string().datetime().optional(),
  newDuration: z.coerce.number().min(30).max(480).optional(),
});

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserIdFromToken(event.headers.Authorization);
    const userRole = getUserRoleFromToken(event.headers.Authorization);
    
    const body = JSON.parse(event.body || '{}');
    const data = manageBookingSchema.parse(body);
    
    const repository = new InstantBookingRepository();
    const bookingService = new InstantBookingService();
    
    // Get booking with full details
    const booking = await repository.getBooking(data.bookingId);
    if (!booking) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          code: 'BOOKING_NOT_FOUND',
          message: 'Booking not found'
        })
      };
    }
    
    // Check permissions
    const canManage = 
      booking.clientId === userId || 
      booking.masterId === userId ||
      userRole === 'ADMIN';
    
    if (!canManage) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You do not have permission to manage this booking'
        })
      };
    }
    
    // Handle different actions
    let result;
    switch (data.action) {
      case 'confirm':
        result = await confirmBooking(booking, userId, userRole, repository, bookingService);
        break;
        
      case 'cancel':
        result = await cancelBooking(booking, userId, userRole, data.reason, repository, bookingService);
        break;
        
      case 'reschedule':
        if (!data.newDateTime) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              code: 'INVALID_REQUEST',
              message: 'New date and time required for rescheduling'
            })
          };
        }
        result = await rescheduleBooking(
          booking, 
          userId, 
          userRole, 
          new Date(data.newDateTime), 
          data.newDuration || booking.duration,
          repository, 
          bookingService
        );
        break;
        
      case 'start':
        result = await startBooking(booking, userId, userRole, repository, bookingService);
        break;
        
      case 'complete':
        result = await completeBooking(booking, userId, userRole, repository, bookingService);
        break;
        
      default:
        return {
          statusCode: 400,
          body: JSON.stringify({
            code: 'INVALID_ACTION',
            message: 'Invalid action'
          })
        };
    }
    
    return result;
    
  } catch (error) {
    console.error('Manage booking error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          code: 'INVALID_REQUEST',
          message: 'Invalid request data',
          errors: error.errors
        })
      };
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        code: 'BOOKING_MANAGEMENT_FAILED',
        message: 'Failed to manage booking. Please try again.'
      })
    };
  }
};

async function confirmBooking(
  booking: InstantBooking,
  userId: string,
  userRole: string,
  repository: InstantBookingRepository,
  bookingService: InstantBookingService
) {
  if (booking.status !== 'PENDING') {
    return {
      statusCode: 400,
      body: JSON.stringify({
        code: 'INVALID_STATUS',
        message: 'Booking is not in pending status'
      })
    };
  }
  
  if (booking.masterId !== userId && userRole !== 'ADMIN') {
    return {
      statusCode: 403,
      body: JSON.stringify({
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Only the master can confirm this booking'
      })
    };
  }
  
  // Check if booking has expired
  if (booking.expiresAt && new Date() > new Date(booking.expiresAt)) {
    await repository.updateBooking(booking.id, { status: 'EXPIRED' });
    return {
      statusCode: 400,
      body: JSON.stringify({
        code: 'BOOKING_EXPIRED',
        message: 'Booking has expired'
      })
    };
  }
  
  // Update booking status
  const updatedBooking = await repository.updateBooking(booking.id, {
    status: 'CONFIRMED',
    confirmedAt: new Date().toISOString(),
    expiresAt: undefined,
  });
  
  // Process payment
  await bookingService.processBookingPayment(updatedBooking);
  
  // Send notifications
  await bookingService.sendBookingNotification(
    booking.clientId,
    updatedBooking,
    'BOOKING_CONFIRMED'
  );
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      booking: formatBookingResponse(updatedBooking),
      message: 'Booking confirmed successfully',
    })
  };
}

async function cancelBooking(
  booking: InstantBooking,
  userId: string,
  userRole: string,
  reason: string | undefined,
  repository: InstantBookingRepository,
  bookingService: InstantBookingService
) {
  if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        code: 'INVALID_STATUS',
        message: 'Booking cannot be cancelled in current status'
      })
    };
  }
  
  const canCancel = 
    booking.clientId === userId || 
    booking.masterId === userId ||
    userRole === 'ADMIN';
  
  if (!canCancel) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'You cannot cancel this booking'
      })
    };
  }
  
  // Calculate cancellation fee
  const { cancellationFee, refundAmount } = calculateCancellationFee(
    booking.totalAmount,
    booking.scheduledDateTime,
    booking.status
  );
  
  // Update booking
  const updatedBooking = await repository.updateBooking(booking.id, {
    status: 'CANCELLED',
    cancelledAt: new Date().toISOString(),
    cancelledBy: userId,
    cancellationReason: reason,
    cancellationFee,
    refundAmount,
  });
  
  // Process refund if applicable
  if (refundAmount > 0) {
    await bookingService.processBookingRefund(updatedBooking, refundAmount);
  }
  
  // Send notifications
  const otherPartyId = booking.clientId === userId ? booking.masterId : booking.clientId;
  await bookingService.sendBookingNotification(
    otherPartyId,
    updatedBooking,
    'BOOKING_CANCELLED'
  );
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      booking: formatBookingResponse(updatedBooking),
      cancellationFee,
      refundAmount,
      message: 'Booking cancelled successfully',
    })
  };
}

async function rescheduleBooking(
  booking: InstantBooking,
  userId: string,
  userRole: string,
  newDateTime: Date,
  newDuration: number,
  repository: InstantBookingRepository,
  bookingService: InstantBookingService
) {
  if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        code: 'INVALID_STATUS',
        message: 'Booking cannot be rescheduled in current status'
      })
    };
  }
  
  // Validate new booking time
  const timeValidation = validateBookingTime(newDateTime.toISOString(), newDuration);
  if (!timeValidation.isValid) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        code: 'INVALID_TIME',
        message: timeValidation.error
      })
    };
  }
  
  // Check if new time is available
  const isAvailable = await bookingService.checkTimeSlotAvailability(
    booking.masterId,
    newDateTime,
    newDuration,
    booking.id
  );
  
  if (!isAvailable) {
    return {
      statusCode: 409,
      body: JSON.stringify({
        code: 'TIME_SLOT_UNAVAILABLE',
        message: 'Requested time slot is not available'
      })
    };
  }
  
  // Calculate any price difference
  const newIsUrgent = isUrgentBooking(newDateTime.toISOString());
  let priceDifference = 0;
  let newUrgentFee = 0;
  
  if (newIsUrgent && !booking.urgentBooking) {
    newUrgentFee = calculateUrgentFee(booking.baseAmount);
    priceDifference = newUrgentFee;
  } else if (!newIsUrgent && booking.urgentBooking) {
    priceDifference = -booking.urgentFee;
  } else if (newIsUrgent) {
    newUrgentFee = calculateUrgentFee(booking.baseAmount);
  }
  
  // Update booking
  const updatedBooking = await repository.updateBooking(booking.id, {
    scheduledDateTime: newDateTime.toISOString(),
    duration: newDuration,
    urgentBooking: newIsUrgent,
    urgentFee: newUrgentFee,
    totalAmount: booking.totalAmount + priceDifference,
    rescheduledAt: new Date().toISOString(),
    rescheduledBy: userId,
  });
  
  // Process additional payment or refund if needed
  if (priceDifference > 0) {
    await bookingService.processAdditionalPayment(updatedBooking, priceDifference);
  } else if (priceDifference < 0) {
    await bookingService.processPartialRefund(updatedBooking, Math.abs(priceDifference));
  }
  
  // Send notifications
  const otherPartyId = booking.clientId === userId ? booking.masterId : booking.clientId;
  await bookingService.sendBookingNotification(
    otherPartyId,
    updatedBooking,
    'BOOKING_RESCHEDULED'
  );
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      booking: formatBookingResponse(updatedBooking),
      priceDifference,
      message: 'Booking rescheduled successfully',
    })
  };
}

async function startBooking(
  booking: InstantBooking,
  userId: string,
  userRole: string,
  repository: InstantBookingRepository,
  bookingService: InstantBookingService
) {
  if (booking.status !== 'CONFIRMED') {
    return {
      statusCode: 400,
      body: JSON.stringify({
        code: 'INVALID_STATUS',
        message: 'Booking must be confirmed to start'
      })
    };
  }
  
  if (booking.masterId !== userId && userRole !== 'ADMIN') {
    return {
      statusCode: 403,
      body: JSON.stringify({
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Only the master can start this booking'
      })
    };
  }
  
  // Check if it's time to start (within 15 minutes of scheduled time)
  const now = new Date();
  const scheduledTime = new Date(booking.scheduledDateTime);
  const timeDifference = Math.abs(now.getTime() - scheduledTime.getTime()) / (1000 * 60);
  
  if (timeDifference > 15) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        code: 'INVALID_TIME',
        message: 'Booking can only be started within 15 minutes of scheduled time'
      })
    };
  }
  
  const updatedBooking = await repository.updateBooking(booking.id, {
    status: 'IN_PROGRESS',
    startedAt: new Date().toISOString(),
  });
  
  // Send notification to client
  await bookingService.sendBookingNotification(
    booking.clientId,
    updatedBooking,
    'BOOKING_STARTED'
  );
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      booking: formatBookingResponse(updatedBooking),
      message: 'Booking started successfully',
    })
  };
}

async function completeBooking(
  booking: InstantBooking,
  userId: string,
  userRole: string,
  repository: InstantBookingRepository,
  bookingService: InstantBookingService
) {
  if (booking.status !== 'IN_PROGRESS') {
    return {
      statusCode: 400,
      body: JSON.stringify({
        code: 'INVALID_STATUS',
        message: 'Booking must be in progress to complete'
      })
    };
  }
  
  if (booking.masterId !== userId && userRole !== 'ADMIN') {
    return {
      statusCode: 403,
      body: JSON.stringify({
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Only the master can complete this booking'
      })
    };
  }
  
  const updatedBooking = await repository.updateBooking(booking.id, {
    status: 'COMPLETED',
    completedAt: new Date().toISOString(),
  });
  
  // Release payment to master
  await bookingService.releasePaymentToMaster(updatedBooking);
  
  // Send notification to client for review
  await bookingService.sendBookingNotification(
    booking.clientId,
    updatedBooking,
    'BOOKING_COMPLETED'
  );
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      booking: formatBookingResponse(updatedBooking),
      message: 'Booking completed successfully',
    })
  };
}

function getUserIdFromToken(authHeader?: string): string {
  // This is a simplified version - implement proper JWT verification
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }
  
  // In production, verify JWT and extract userId
  return 'user_123'; // Placeholder
}

function getUserRoleFromToken(authHeader?: string): string {
  // This is a simplified version - implement proper JWT verification
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }
  
  // In production, verify JWT and extract user role
  return 'CLIENT'; // Placeholder
}