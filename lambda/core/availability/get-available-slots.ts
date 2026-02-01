import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { createResponse, createErrorResponse } from '../shared/utils/response';
import { CacheService } from '../shared/services/cache';
import { AvailabilityRepository } from '../shared/repositories/availability.repository';
import { MasterProfileRepository } from '../shared/repositories/master-profile.repository';

const availabilityRepo = new AvailabilityRepository();
const masterRepo = new MasterProfileRepository();
const cache = new CacheService();

// Query parameters validation schema
const querySchema = z.object({
  masterId: z.string().uuid('Invalid master ID'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  duration: z.string().regex(/^\d+$/).transform(Number).optional(), // Required duration in minutes
  limit: z.string().regex(/^\d+$/).transform(Number).optional()
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const queryParams = event.queryStringParameters || {};
    const validatedQuery = querySchema.parse(queryParams);

    // Check if master exists
    const master = await masterRepo.findByUserId(validatedQuery.masterId);

    if (!master) {
      return createErrorResponse(404, 'NOT_FOUND', 'Master not found');
    }

    // Set default end date if not provided (7 days from start date)
    const startDate = validatedQuery.startDate;
    const endDate = validatedQuery.endDate || 
      new Date(new Date(startDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Validate date range
    if (new Date(endDate) <= new Date(startDate)) {
      return createErrorResponse(400, 'VALIDATION_ERROR', 'End date must be after start date');
    }

    const maxDays = 90;
    const daysDiff = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > maxDays) {
      return createErrorResponse(400, 'VALIDATION_ERROR', `Date range cannot exceed ${maxDays} days`);
    }

    // Check cache first
    const cacheKey = `available-slots:${validatedQuery.masterId}:${JSON.stringify(validatedQuery)}`;
    const cachedSlots = await cache.get(cacheKey);
    
    if (cachedSlots) {
      return createResponse(200, cachedSlots);
    }

    // Get available slots
    const availableSlots = await availabilityRepo.getMasterSlots(validatedQuery.masterId, {
      startDate,
      endDate,
      includeBooked: false,
      limit: validatedQuery.limit || 100
    });

    // Filter by duration if specified
    let filteredSlots = availableSlots;
    if (validatedQuery.duration) {
      filteredSlots = availableSlots.filter(slot => {
        const startTime = new Date(`2000-01-01T${slot.startTime}:00`);
        const endTime = new Date(`2000-01-01T${slot.endTime}:00`);
        const slotDuration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
        return slotDuration >= validatedQuery.duration!;
      });
    }

    // Group slots by date for better organization
    const slotsByDate = filteredSlots.reduce((acc, slot) => {
      const dateKey = slot.date;
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push({
        id: slot.slotId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        duration: (() => {
          const startTime = new Date(`2000-01-01T${slot.startTime}:00`);
          const endTime = new Date(`2000-01-01T${slot.endTime}:00`);
          return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
        })()
      });
      return acc;
    }, {} as Record<string, any[]>);

    // Calculate availability statistics
    const totalDays = daysDiff;
    const daysWithSlots = Object.keys(slotsByDate).length;
    const totalSlots = filteredSlots.length;
    const averageSlotsPerDay = daysWithSlots > 0 ? Math.round(totalSlots / daysWithSlots) : 0;

    // Find next available slot
    const nextAvailableSlot = filteredSlots.find(slot => {
      const slotDateTime = new Date(`${slot.date}T${slot.startTime}:00`);
      return slotDateTime > new Date();
    });

    const response = {
      masterId: validatedQuery.masterId,
      dateRange: {
        startDate,
        endDate
      },
      filters: {
        ...(validatedQuery.duration && { minDuration: validatedQuery.duration })
      },
      slotsByDate,
      stats: {
        totalDays,
        daysWithSlots,
        totalSlots,
        averageSlotsPerDay,
        availabilityRate: Math.round((daysWithSlots / totalDays) * 100)
      },
      nextAvailable: nextAvailableSlot ? {
        date: nextAvailableSlot.date,
        startTime: nextAvailableSlot.startTime,
        endTime: nextAvailableSlot.endTime,
        slotId: nextAvailableSlot.slotId
      } : null
    };

    // Cache the response for 5 minutes
    await cache.set(cacheKey, response, 300);

    return createResponse(200, response);

  } catch (error) {
    console.error('Error getting available slots:', error);
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(400, 'VALIDATION_ERROR', error.errors[0].message);
    }

    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to get available slots');
  }
};