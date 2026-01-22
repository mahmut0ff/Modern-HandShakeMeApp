import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { createResponse, createErrorResponse } from '@/shared/utils/response';
import { validateInput } from '@/shared/utils/validation';
import { requireAuth } from '@/shared/middleware/auth';
import { CacheService } from '@/shared/services/cache';

const prisma = new PrismaClient();
const cache = new CacheService();

// Validation schema
const workingHoursSchema = z.object({
  start: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  end: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  enabled: z.boolean()
});

const updateAvailabilitySchema = z.object({
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
    let availability = await prisma.masterAvailability.findUnique({
      where: { masterId: user.userId }
    });

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
      availability = await prisma.masterAvailability.update({
        where: { masterId: user.userId },
        data: {
          workingHours: updatedWorkingHours,
          ...(validatedData.timezone && { timezone: validatedData.timezone })
        }
      });
    } else {
      availability = await prisma.masterAvailability.create({
        data: {
          masterId: user.userId,
          workingHours: updatedWorkingHours,
          timezone: validatedData.timezone || 'Asia/Bishkek'
        }
      });
    }

    // Block dates if provided
    if (validatedData.blockedDates && validatedData.blockedDates.length > 0) {
      // Delete existing slots for blocked dates
      await prisma.availabilitySlot.deleteMany({
        where: {
          masterId: user.userId,
          date: {
            in: validatedData.blockedDates.map(date => new Date(date))
          },
          isBooked: false // Don't delete booked slots
        }
      });
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
        const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'lowercase' });
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
                masterId: user.userId,
                date: new Date(currentDate),
                startTime: slotStart.toTimeString().slice(0, 5),
                endTime: slotEnd.toTimeString().slice(0, 5),
                isBooked: false
              });
            }

            slotStart = slotEnd;
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Delete existing unbooked slots in the range and create new ones
      await prisma.availabilitySlot.deleteMany({
        where: {
          masterId: user.userId,
          date: {
            gte: start,
            lte: end
          },
          isBooked: false
        }
      });

      if (slotsToCreate.length > 0) {
        await prisma.availabilitySlot.createMany({
          data: slotsToCreate,
          skipDuplicates: true
        });
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
  } finally {
    await prisma.$disconnect();
  }
};