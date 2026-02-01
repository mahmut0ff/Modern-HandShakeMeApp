/**
 * Create Instant Booking Lambda Function
 * Создание мгновенного бронирования
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { z } from 'zod';
import { InstantBookingRepository } from '../shared/repositories/instant-booking.repository';
import { InstantBookingService } from '../shared/services/instant-booking.service';
import { 
  generateBookingId, 
  calculateTotalAmount, 
  isUrgentBooking,
  calculateUrgentFee,
  calculatePlatformFee,
  validateBookingTime,
  formatBookingResponse 
} from '../shared/utils/instant-booking';
import { InstantBooking } from '../shared/types/instant-booking';

// Validation schema
const createBookingSchema = z.object({
  masterId: z.string().uuid(),
  serviceId: z.string().uuid(),
  datetime: z.string().datetime(),
  duration: z.number().min(15).max(480),
  paymentMethod: z.enum(['on_meeting', 'direct_transfer', 'cash', 'card_to_master', 'online']).default('on_meeting'),
  clientNotes: z.string().max(500).optional(),
  address: z.string().max(200).optional()
});

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserIdFromToken(event.headers.Authorization);
    const body = createBookingSchema.parse(JSON.parse(event.body || '{}'));
    
    const repository = new InstantBookingRepository();
    const bookingService = new InstantBookingService();
    
    // Validate booking time
    const timeValidation = validateBookingTime(body.datetime, body.duration);
    if (!timeValidation.isValid) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          code: 'INVALID_TIME',
          message: timeValidation.error
        })
      };
    }
    
    // Check if service exists and supports instant booking
    const service = await repository.getServiceInfo(body.serviceId, body.masterId);
    if (!service || !service.instantBookingEnabled) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          code: 'SERVICE_NOT_FOUND',
          message: 'Service not found or instant booking not available'
        })
      };
    }
    
    // Check if master exists
    const master = await repository.getMasterProfile(body.masterId);
    if (!master) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          code: 'MASTER_NOT_FOUND',
          message: 'Master not found'
        })
      };
    }
    
    // Check availability
    const isAvailable = await bookingService.checkTimeSlotAvailability(
      body.masterId, 
      new Date(body.datetime), 
      body.duration
    );
    
    if (!isAvailable) {
      return {
        statusCode: 409,
        body: JSON.stringify({
          code: 'TIME_SLOT_UNAVAILABLE',
          message: 'Selected time slot is not available'
        })
      };
    }
    
    // Create booking
    const bookingId = generateBookingId();
    const now = new Date().toISOString();
    const urgent = isUrgentBooking(body.datetime);
    const urgentFee = urgent ? calculateUrgentFee(service.basePrice) : 0;
    const totalAmount = calculateTotalAmount(service.basePrice, urgent);
    const platformFee = calculatePlatformFee(totalAmount);
    
    const booking: InstantBooking = {
      id: bookingId,
      clientId: userId,
      masterId: body.masterId,
      serviceId: body.serviceId,
      
      scheduledDateTime: body.datetime,
      duration: body.duration,
      address: body.address,
      notes: body.clientNotes,
      
      baseAmount: service.basePrice,
      urgentFee,
      platformFee,
      totalAmount,
      
      status: 'CONFIRMED', // Instant booking is auto-confirmed
      urgentBooking: urgent,
      autoConfirmed: true,
      
      paymentMethodId: body.paymentMethod === 'online' ? 'default_card' : undefined,
      
      createdAt: now,
      updatedAt: now,
      confirmedAt: now
    };
    
    // Save booking
    const createdBooking = await repository.createBooking(booking);
    
    // Process payment if online
    if (body.paymentMethod === 'online') {
      await bookingService.processBookingPayment(createdBooking);
    }
    
    // Send notifications
    await bookingService.sendBookingNotification(
      body.masterId,
      createdBooking,
      'NEW_INSTANT_BOOKING'
    );
    
    await bookingService.sendBookingNotification(
      userId,
      createdBooking,
      'BOOKING_CONFIRMED'
    );
    
    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        booking: formatBookingResponse(createdBooking),
        message: 'Instant booking created successfully'
      })
    };
    
  } catch (error) {
    console.error('Create instant booking error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          code: 'INVALID_REQUEST',
          message: 'Invalid booking data',
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

function getUserIdFromToken(authHeader?: string): string {
  // This is a simplified version - implement proper JWT verification
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }
  
  // In production, verify JWT and extract userId
  return 'user_123'; // Placeholder
}