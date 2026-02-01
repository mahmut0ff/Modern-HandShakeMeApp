/**
 * Get Available Time Slots for Instant Booking
 * Получение доступных временных слотов для мгновенного бронирования
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { z } from 'zod';
import { InstantBookingRepository } from '../shared/repositories/instant-booking.repository';
import { generateTimeSlots, validateBookingTime } from '../shared/utils/instant-booking';
import { TimeSlot } from '../shared/types/instant-booking';

// Validation schema
const availableSlotsSchema = z.object({
  masterId: z.string().uuid(),
  serviceId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  duration: z.coerce.number().min(30).max(480).default(60),
});

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserIdFromToken(event.headers.Authorization);
    const queryParams = event.queryStringParameters || {};
    const data = availableSlotsSchema.parse(queryParams);
    
    const repository = new InstantBookingRepository();
    
    // Verify service exists and supports instant booking
    const service = await repository.getServiceInfo(data.serviceId, data.masterId);
    if (!service || !service.instantBookingEnabled) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          code: 'SERVICE_NOT_FOUND',
          message: 'Service not found or instant booking not available'
        })
      };
    }
    
    // Get master profile
    const master = await repository.getMasterProfile(data.masterId);
    if (!master) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          code: 'MASTER_NOT_FOUND',
          message: 'Master not found'
        })
      };
    }
    
    const requestedDate = new Date(data.date);
    const dayOfWeek = requestedDate.getDay();
    
    // Get master's availability for the day
    const masterAvailability = await repository.getMasterAvailability(data.masterId, dayOfWeek);
    
    if (masterAvailability.length === 0) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          date: data.date,
          masterId: data.masterId,
          serviceId: data.serviceId,
          duration: data.duration,
          slots: [],
          message: 'Master is not available on this day',
          masterInfo: {
            name: master.name,
            rating: master.rating,
            responseTime: master.responseTime,
          },
          serviceInfo: {
            name: service.name,
            basePrice: service.basePrice,
            description: service.description,
          }
        })
      };
    }
    
    // Get existing bookings for the day
    const startOfDay = new Date(requestedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const existingBookings = await repository.getMasterBookings(
      data.masterId,
      startOfDay,
      endOfDay
    );
    
    // Generate available time slots
    const slots: TimeSlot[] = [];
    const now = new Date();
    const minBookingTime = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes from now
    
    for (const availability of masterAvailability) {
      const availableSlots = generateTimeSlots(
        requestedDate,
        availability.startTime,
        availability.endTime,
        data.duration,
        existingBookings,
        minBookingTime,
        service.basePrice
      );
      
      slots.push(...availableSlots);
    }
    
    // Sort slots by time
    slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        date: data.date,
        masterId: data.masterId,
        serviceId: data.serviceId,
        duration: data.duration,
        slots,
        masterInfo: {
          name: master.name,
          rating: master.rating,
          responseTime: master.responseTime,
        },
        serviceInfo: {
          name: service.name,
          basePrice: service.basePrice,
          description: service.description,
        },
      })
    };
    
  } catch (error) {
    console.error('Get available slots error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          code: 'INVALID_REQUEST',
          message: 'Invalid request parameters',
          errors: error.errors
        })
      };
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        code: 'SLOTS_RETRIEVAL_FAILED',
        message: 'Failed to retrieve available slots. Please try again.'
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