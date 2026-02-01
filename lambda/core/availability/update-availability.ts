import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { createResponse, createErrorResponse } from '../shared/utils/response';
import { validateInput, updateAvailabilitySchema } from '../shared/utils/validation';
import { requireAuth } from '../shared/middleware/auth';
import { CacheService } from '../shared/services/cache';
import { AvailabilityRepository } from '../shared/repositories/availability.repository';

const availabilityRepo = new AvailabilityRepository();
const cache = new CacheService();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await requireAuth()(event);
    
    if (user.role !== 'MASTER') {
      return createErrorResponse(403, 'FORBIDDEN', 'Only masters can update availability');
    }

    const body = JSON.parse(event.body || '{}');
    const validatedData = validateInput(updateAvailabilitySchema)(body);

    // Validate working hours consistency
    if (validatedData.workingHours) {
      for (const [day, hours] of Object.entries(validatedData.workingHours)) {
        if (hours && hours.enabled) {
          const startTime = new Date(`2000-01-01T${hours.start}:00`);
          const endTime = new Date(`2000-01-01T${hours.end}:00`);
          
          if (endTime <= startTime) {
            return createErrorResponse(400, 'VALIDATION_ERROR', 
              `End time must be after start time for ${day}`);
          }
        }
      }
    }

    // Get or create master availability
    let availability = await availabilityRepo.getMasterAvailability(user.userId);

    const currentWorkingHours = availability?.workingHours || {
      monday: { start: '09:00', end: '18:00', enabled: true },
      tuesday: { start: '09:00', end: '18:00', enabled: true },
      wednesday: { start: '09:00', end: '18:00', enabled: true },
      thursday: { start: '09:00', end: '18:00', enabled: true },
      friday: { start: '09:00', end: '18:00', enabled: true },
      saturday: { start: '10:00', end: '16:00', enabled: false },
      sunday: { start: '10:00', end: '16:00', enabled: false }
    };

    // Merge working hours
    const updatedWorkingHours = {
      ...currentWorkingHours,
      ...validatedData.workingHours
    };

    // Update or create availability
    if (availability) {
      availability = await availabilityRepo.updateMasterAvailability(user.userId, {
        workingHours: updatedWorkingHours,
        ...(validatedData.timezone && { timezone: validatedData.timezone })
      });
    } else {
      availability = await availabilityRepo.createMasterAvailability(user.userId, {
        workingHours: updatedWorkingHours,
        timezone: validatedData.timezone || 'Asia/Bishkek'
      });
    }

    // Block dates if provided
    if (validatedData.blockedDates && validatedData.blockedDates.length > 0) {
      // Delete existing slots for blocked dates
      for (const date of validatedData.blockedDates) {
        await availabilityRepo.deleteSlots(user.userId, {
          startDate: date,
          endDate: date,
          onlyUnbooked: true // Don't delete booked slots
        });
      }
    }

    // Generate new slots if requested
    if (validatedData.generateSlots) {
      const { startDate, endDate, slotDuration } = validatedData.generateSlots;
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (end <= start) {
        return createErrorResponse(400, 'VALIDATION_ERROR', 'End date must be after start date');
      }

      // Generate slots for the date range
      const slotsToCreate = [];
      const currentDate = new Date(start);

      while (currentDate <= end) {
        const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'lowercase' }) as keyof typeof updatedWorkingHours;
        const dayHours = updatedWorkingHours[dayName];

        if (dayHours && dayHours.enabled) {
          // Skip blocked dates
          const dateString = currentDate.toISOString().split('T')[0];
          if (validatedData.blockedDates?.includes(dateString)) {
            currentDate.setDate(currentDate.getDate() + 1);
            continue;
          }

          // Generate slots for this day
          const startHour = parseInt(dayHours.start.split(':')[0]);
          const startMinute = parseInt(dayHours.start.split(':')[1]);
          const endHour = parseInt(dayHours.end.split(':')[0]);
          const endMinute = parseInt(dayHours.end.split(':')[1]);

          let slotStart = new Date(currentDate);
          slotStart.setHours(startHour, startMinute, 0, 0);

          const dayEnd = new Date(currentDate);
          dayEnd.setHours(endHour, endMinute, 0, 0);

          while (slotStart < dayEnd) {
            const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);
            
            if (slotEnd <= dayEnd) {
              slotsToCreate.push({
                date: currentDate.toISOString().split('T')[0],
                startTime: slotStart.toTimeString().slice(0, 5),
                endTime: slotEnd.toTimeString().slice(0, 5)
              });
            }

            slotStart = slotEnd;
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Delete existing unbooked slots in the range and create new ones
      await availabilityRepo.deleteSlots(user.userId, {
        startDate,
        endDate,
        onlyUnbooked: true
      });

      if (slotsToCreate.length > 0) {
        await availabilityRepo.createManySlots(user.userId, slotsToCreate);
      }
    }

    // Invalidate cache
    await cache.invalidatePattern(`availability:${user.userId}*`);
    await cache.invalidatePattern(`master:profile:${user.userId}*`);

    console.log(`Availability updated for master ${user.userId}`);

    return createResponse(200, {
      masterId: user.userId,
      workingHours: availability.workingHours,
      timezone: availability.timezone,
      message: 'Availability updated successfully',
      ...(validatedData.generateSlots && {
        slotsGenerated: validatedData.generateSlots
      })
    });

  } catch (error) {
    console.error('Error updating availability:', error);
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(400, 'VALIDATION_ERROR', error.errors[0].message);
    }
    
    if (error.name === 'UnauthorizedError') {
      return createErrorResponse(401, 'UNAUTHORIZED', error.message);
    }

    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to update availability');
  }
};