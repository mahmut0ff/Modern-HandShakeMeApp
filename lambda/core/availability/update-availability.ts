import { APIGatewayProxyResult, Context } from 'aws-lambda';
import { z } from 'zod';
import { success, badRequest, forbidden } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { AvailabilityRepository } from '../shared/repositories/availability.repository';
import { logger } from '../shared/utils/logger';

const availabilityRepo = new AvailabilityRepository();

const workingHoursSchema = z.object({
  enabled: z.boolean(),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/)
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
  blockedDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional()
});

async function updateAvailabilityHandler(
  event: AuthenticatedEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  const { userId, role } = event.auth;
  
  if (role !== 'MASTER') {
    return forbidden('Only masters can update availability');
  }

  const body = JSON.parse(event.body || '{}');
  const validation = updateAvailabilitySchema.safeParse(body);
  
  if (!validation.success) {
    return badRequest(validation.error.errors[0].message);
  }
  
  const data = validation.data;

  // Validate working hours consistency
  if (data.workingHours) {
    for (const [day, hours] of Object.entries(data.workingHours)) {
      if (hours && hours.enabled) {
        const startTime = new Date(`2000-01-01T${hours.start}:00`);
        const endTime = new Date(`2000-01-01T${hours.end}:00`);
        
        if (endTime <= startTime) {
          return badRequest(`End time must be after start time for ${day}`);
        }
      }
    }
  }

  // Update availability
  const updated = await availabilityRepo.updateMasterAvailability(userId, data as any);

  logger.info('Availability updated', { userId });

  return success({
    message: 'Availability updated successfully',
    availability: updated
  });
}

export const handler = withErrorHandler(withAuth(updateAvailabilityHandler, { roles: ['MASTER'] }));
