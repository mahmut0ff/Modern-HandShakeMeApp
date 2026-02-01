import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { createResponse, createErrorResponse } from '../shared/utils/response';
import { requireAuth } from '../shared/middleware/auth';
import { CacheService } from '../shared/services/cache';
import { AvailabilityRepository } from '../shared/repositories/availability.repository';
import { MasterProfileRepository } from '../shared/repositories/master-profile.repository';

const availabilityRepo = new AvailabilityRepository();
const masterRepo = new MasterProfileRepository();
const cache = new CacheService();

// Query parameters validation schema
const querySchema = z.object({
  masterId: z.string().uuid().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  includeBooked: z.enum(['true', 'false']).optional()
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Authenticate user (optional for public availability viewing)
    let user = null;
    try {
      user = await requireAuth()(event);
    } catch (error) {
      // Allow unauthenticated access for public availability viewing
      if (!event.queryStringParameters?.masterId) {
        return createErrorResponse(401, 'UNAUTHORIZED', 'Authentication required');
      }
    }

    const queryParams = event.queryStringParameters || {};
    const validatedQuery = querySchema.parse(queryParams);

    // Determine which master's availability to fetch
    const targetMasterId = validatedQuery.masterId || user?.userId;
    
    if (!targetMasterId) {
      return createErrorResponse(400, 'VALIDATION_ERROR', 'Master ID is required');
    }

    // Check if master exists
    const master = await masterRepo.findByUserId(targetMasterId);

    if (!master) {
      return createErrorResponse(404, 'NOT_FOUND', 'Master not found');
    }

    const isOwnAvailability = user?.userId === targetMasterId;
    const includeBooked = isOwnAvailability && validatedQuery.includeBooked === 'true';

    // Check cache first
    const cacheKey = `availability:${targetMasterId}:${JSON.stringify(validatedQuery)}`;
    const cachedAvailability = await cache.get(cacheKey);
    
    if (cachedAvailability) {
      return createResponse(200, cachedAvailability);
    }

    // Get master availability settings
    const availability = await availabilityRepo.getMasterAvailability(targetMasterId);

    // Default working hours if not set
    const defaultWorkingHours = {
      monday: { start: '09:00', end: '18:00', enabled: true },
      tuesday: { start: '09:00', end: '18:00', enabled: true },
      wednesday: { start: '09:00', end: '18:00', enabled: true },
      thursday: { start: '09:00', end: '18:00', enabled: true },
      friday: { start: '09:00', end: '18:00', enabled: true },
      saturday: { start: '10:00', end: '16:00', enabled: false },
      sunday: { start: '10:00', end: '16:00', enabled: false }
    };

    const workingHours = availability?.workingHours || defaultWorkingHours;
    const timezone = availability?.timezone || 'Asia/Bishkek';

    // Build date range for slots query
    const startDate = validatedQuery.startDate || new Date().toISOString().split('T')[0];
    const endDate = validatedQuery.endDate || 
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days from now

    // Get availability slots
    const slots = await availabilityRepo.getMasterSlots(targetMasterId, {
      startDate,
      endDate,
      includeBooked
    });

    // Format slots
    const formattedSlots = slots.map(slot => ({
      id: slot.slotId,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isBooked: slot.isBooked,
      ...(includeBooked && slot.isBooked && {
        bookedBy: slot.bookedBy,
        orderId: slot.orderId
      })
    }));

    // Calculate availability statistics
    const totalSlots = slots.length;
    const bookedSlots = slots.filter(slot => slot.isBooked).length;
    const availableSlots = totalSlots - bookedSlots;

    const response = {
      masterId: targetMasterId,
      workingHours,
      timezone,
      slots: formattedSlots,
      dateRange: {
        startDate,
        endDate
      },
      stats: {
        totalSlots,
        availableSlots,
        bookedSlots,
        availabilityRate: totalSlots > 0 ? Math.round((availableSlots / totalSlots) * 100) : 0
      }
    };

    // Cache the response for 15 minutes
    await cache.set(cacheKey, response, 900);

    return createResponse(200, response);

  } catch (error) {
    console.error('Error getting availability:', error);
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(400, 'VALIDATION_ERROR', error.errors[0].message);
    }
    
    if (error.name === 'UnauthorizedError') {
      return createErrorResponse(401, 'UNAUTHORIZED', error.message);
    }

    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to get availability');
  }
};