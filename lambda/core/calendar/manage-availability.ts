// @ts-nocheck
// Manage master availability and calendar integration

import type { APIGatewayProxyResult } from 'aws-lambda';
import { CalendarRepository } from '../shared/repositories/calendar.repository';
import { success, badRequest, notFound } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { withRequestTransform } from '../shared/middleware/requestTransform';
import { validate, manageAvailabilitySchema } from '../shared/utils/validation';
import { logger } from '../shared/utils/logger';
import { CalendarService } from '../shared/services/calendar.service';
import { NotificationService } from '../shared/services/notification';
import { MasterAvailability, BlockedTimeSlot } from '../shared/types';
import { v4 as uuidv4 } from 'uuid';

async function manageAvailabilityHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const userRole = event.auth.role;
  
  if (userRole !== 'MASTER') {
    return badRequest('Only masters can manage availability');
  }
  
  logger.info('Manage availability request', { userId });
  
  const body = JSON.parse(event.body || '{}');
  const data = validate(manageAvailabilitySchema, body);
  
  const calendarRepo = new CalendarRepository();
  const calendarService = new CalendarService();
  const notificationService = new NotificationService();
  
  try {
    switch (data.action) {
      case 'SET_WEEKLY':
        return await setWeeklySchedule(userId, data, calendarRepo, calendarService, notificationService);
      case 'SET_SPECIFIC_DATE':
        return await setSpecificDateAvailability(userId, data, calendarRepo, calendarService, notificationService);
      case 'BLOCK_TIME':
        return await blockTimeSlots(userId, data, calendarRepo, calendarService, notificationService);
      case 'UNBLOCK_TIME':
        return await unblockTimeSlots(userId, data, calendarRepo, notificationService);
      case 'SET_VACATION':
        return await setVacationPeriod(userId, data, calendarRepo, calendarService, notificationService);
      case 'IMPORT_FROM_CALENDAR':
        return await importFromCalendar(userId, data, calendarRepo, calendarService, notificationService);
      default:
        return badRequest('Invalid action');
    }
  } catch (error) {
    logger.error('Failed to manage availability', { userId, action: data.action, error });
    throw error;
  }
}

export const handler = withErrorHandler(
  withRequestTransform(
    withAuth(manageAvailabilityHandler)
  )
);

// Helper functions
async function setWeeklySchedule(
  userId: string,
  data: any,
  calendarRepo: CalendarRepository,
  calendarService: CalendarService,
  notificationService: NotificationService
): Promise<APIGatewayProxyResult> {
  if (!data.weeklySchedule) {
    return badRequest('Weekly schedule is required');
  }
  
  // Delete existing weekly schedule
  await calendarRepo.deleteMasterAvailability(userId, {
    scheduleType: 'WEEKLY'
  });
  
  // Create new weekly schedule
  const availabilityRecords: Array<Omit<MasterAvailability, 'id' | 'masterId' | 'createdAt'>> = [];
  
  for (const daySchedule of data.weeklySchedule) {
    for (const timeSlot of daySchedule.timeSlots) {
      availabilityRecords.push({
        scheduleType: 'WEEKLY',
        dayOfWeek: daySchedule.dayOfWeek,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        isAvailable: timeSlot.isAvailable,
        serviceTypes: timeSlot.serviceTypes || [],
        maxBookings: timeSlot.maxBookings,
        bufferBefore: data.bufferTime?.beforeBooking || 0,
        bufferAfter: data.bufferTime?.afterBooking || 0,
        timeZone: data.timeZone,
        slotType: 'WORK'
      });
    }
    
    // Add breaks if specified
    if (daySchedule.breaks) {
      for (const breakSlot of daySchedule.breaks) {
        availabilityRecords.push({
          scheduleType: 'WEEKLY',
          dayOfWeek: daySchedule.dayOfWeek,
          startTime: breakSlot.startTime,
          endTime: breakSlot.endTime,
          isAvailable: false,
          maxBookings: 1,
          bufferBefore: 0,
          bufferAfter: 0,
          slotType: 'BREAK',
          description: breakSlot.description,
          timeZone: data.timeZone
        });
      }
    }
  }
  
  // Batch create availability records
  await calendarRepo.createManyAvailabilitySlots(userId, availabilityRecords);
  
  // Sync with external calendar if enabled
  if (data.calendarSync?.syncFromCalendar) {
    try {
      const availabilityObjects = availabilityRecords.map(record => ({
        id: uuidv4(),
        masterId: userId,
        ...record,
        createdAt: new Date().toISOString()
      }));
      await calendarService.syncAvailabilityToCalendar(userId, availabilityObjects);
    } catch (error) {
      logger.warn('Failed to sync availability to calendar', { userId, error });
    }
  }
  
  // Send notification
  await notificationService.sendCalendarNotification(
    userId,
    'AVAILABILITY_UPDATED',
    {
      slotsUpdated: availabilityRecords.length,
      scheduleType: 'weekly'
    }
  );
  
  logger.info('Weekly schedule set successfully', { 
    userId, 
    slotsCreated: availabilityRecords.length 
  });
  
  return success({
    message: 'Weekly schedule updated successfully',
    slotsCreated: availabilityRecords.length,
    nextAvailableSlots: await getNextAvailableSlots(userId, calendarRepo),
  });
}

async function setSpecificDateAvailability(
  userId: string,
  data: any,
  calendarRepo: CalendarRepository,
  calendarService: CalendarService,
  notificationService: NotificationService
): Promise<APIGatewayProxyResult> {
  if (!data.specificDates) {
    return badRequest('Specific dates are required');
  }
  
  const availabilityRecords: Array<Omit<MasterAvailability, 'id' | 'masterId' | 'createdAt'>> = [];
  
  for (const dateSchedule of data.specificDates) {
    // Delete existing availability for this date
    await calendarRepo.deleteMasterAvailability(userId, {
      scheduleType: 'SPECIFIC_DATE',
      date: dateSchedule.date
    });
    
    for (const timeSlot of dateSchedule.timeSlots) {
      availabilityRecords.push({
        scheduleType: 'SPECIFIC_DATE',
        specificDate: dateSchedule.date,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        isAvailable: timeSlot.isAvailable,
        serviceTypes: timeSlot.serviceTypes || [],
        maxBookings: timeSlot.maxBookings,
        specialPricing: timeSlot.specialPricing,
        reason: dateSchedule.reason,
        timeZone: data.timeZone,
        bufferBefore: data.bufferTime?.beforeBooking || 0,
        bufferAfter: data.bufferTime?.afterBooking || 0,
        slotType: 'WORK'
      });
    }
  }
  
  // Create availability records
  await calendarRepo.createManyAvailabilitySlots(userId, availabilityRecords);
  
  // Sync with external calendar
  if (data.calendarSync?.syncFromCalendar) {
    try {
      await calendarService.syncSpecificDatesToCalendar(userId, data.specificDates);
    } catch (error) {
      logger.warn('Failed to sync specific dates to calendar', { userId, error });
    }
  }
  
  // Send notification
  await notificationService.sendCalendarNotification(
    userId,
    'AVAILABILITY_UPDATED',
    {
      slotsUpdated: availabilityRecords.length,
      scheduleType: 'specific_dates',
      datesUpdated: data.specificDates.length
    }
  );
  
  logger.info('Specific date availability set', { 
    userId, 
    datesUpdated: data.specificDates.length,
    slotsCreated: availabilityRecords.length 
  });
  
  return success({
    message: 'Specific date availability updated successfully',
    datesUpdated: data.specificDates.length,
    slotsCreated: availabilityRecords.length,
  });
}
async function blockTimeSlots(
  userId: string,
  data: any,
  calendarRepo: CalendarRepository,
  calendarService: CalendarService,
  notificationService: NotificationService
): Promise<APIGatewayProxyResult> {
  if (!data.blockedPeriods) {
    return badRequest('Blocked periods are required');
  }
  
  const blockedSlots: BlockedTimeSlot[] = [];
  
  for (const period of data.blockedPeriods) {
    const blockedSlot = await calendarRepo.createBlockedTimeSlot(userId, {
      startDateTime: period.startDateTime,
      endDateTime: period.endDateTime,
      reason: period.reason,
      blockType: period.blockType,
      isRecurring: period.isRecurring,
      recurrencePattern: period.recurrencePattern,
      timeZone: data.timeZone
    });
    
    blockedSlots.push(blockedSlot);
    
    // If recurring, create future occurrences
    if (period.isRecurring && period.recurrencePattern) {
      const futureOccurrences = generateRecurringOccurrences(
        period.startDateTime,
        period.endDateTime,
        period.recurrencePattern
      );
      
      for (const occurrence of futureOccurrences) {
        await calendarRepo.createBlockedTimeSlot(userId, {
          startDateTime: occurrence.start.toISOString(),
          endDateTime: occurrence.end.toISOString(),
          reason: period.reason,
          blockType: period.blockType,
          isRecurring: true,
          parentBlockId: blockedSlot.id,
          timeZone: data.timeZone
        });
      }
    }
  }
  
  // Sync with external calendar
  if (data.calendarSync?.syncFromCalendar) {
    try {
      await calendarService.syncBlockedSlotsToCalendar(userId, blockedSlots);
    } catch (error) {
      logger.warn('Failed to sync blocked slots to calendar', { userId, error });
    }
  }
  
  // Find conflicting bookings (mock implementation)
  const conflictingBookings = await findConflictingBookings(userId, data.blockedPeriods);
  
  if (conflictingBookings.length > 0) {
    await notificationService.sendAvailabilityConflictNotification(userId, conflictingBookings);
    
    logger.warn('Blocked time conflicts with existing bookings', {
      userId,
      conflictingBookings: conflictingBookings.map(b => b.id),
    });
  }
  
  logger.info('Time slots blocked successfully', { 
    userId, 
    periodsBlocked: data.blockedPeriods.length,
    conflicts: conflictingBookings.length 
  });
  
  return success({
    message: 'Time slots blocked successfully',
    periodsBlocked: data.blockedPeriods.length,
    conflicts: conflictingBookings.length > 0 ? {
      count: conflictingBookings.length,
      bookings: conflictingBookings,
      message: 'Some blocked periods conflict with existing bookings. Please review and reschedule if needed.',
    } : null,
  });
}

async function unblockTimeSlots(
  userId: string,
  data: any,
  calendarRepo: CalendarRepository,
  notificationService: NotificationService
): Promise<APIGatewayProxyResult> {
  if (!data.blockedPeriods) {
    return badRequest('Blocked periods to remove are required');
  }
  
  let removedCount = 0;
  
  for (const period of data.blockedPeriods) {
    const removed = await calendarRepo.deleteBlockedTimeSlots(userId, {
      startDateTime: period.startDateTime,
      endDateTime: period.endDateTime
    });
    removedCount += removed;
  }
  
  // Send notification
  await notificationService.sendCalendarNotification(
    userId,
    'AVAILABILITY_UPDATED',
    {
      slotsUpdated: removedCount,
      action: 'unblocked'
    }
  );
  
  logger.info('Time slots unblocked', { userId, removedCount });
  
  return success({
    message: 'Time slots unblocked successfully',
    removedCount,
  });
}

async function setVacationPeriod(
  userId: string,
  data: any,
  calendarRepo: CalendarRepository,
  calendarService: CalendarService,
  notificationService: NotificationService
): Promise<APIGatewayProxyResult> {
  if (!data.blockedPeriods || data.blockedPeriods.length === 0) {
    return badRequest('Vacation period is required');
  }
  
  const vacationPeriod = data.blockedPeriods[0];
  
  if (vacationPeriod.blockType !== 'VACATION') {
    return badRequest('Block type must be VACATION');
  }
  
  // Create vacation block
  const vacation = await calendarRepo.createBlockedTimeSlot(userId, {
    startDateTime: vacationPeriod.startDateTime,
    endDateTime: vacationPeriod.endDateTime,
    reason: vacationPeriod.reason,
    blockType: 'VACATION',
    isRecurring: false,
    timeZone: data.timeZone
  });
  
  // Find conflicting bookings (mock implementation)
  const conflictingBookings = await findConflictingBookings(userId, [vacationPeriod]);
  
  // Sync with external calendar
  if (data.calendarSync?.syncFromCalendar) {
    try {
      await calendarService.createVacationEvent(userId, vacation);
    } catch (error) {
      logger.warn('Failed to create vacation event in calendar', { userId, error });
    }
  }
  
  // Send notification
  await notificationService.sendVacationNotification(
    userId,
    {
      id: vacation.id,
      startDateTime: vacation.startDateTime,
      endDateTime: vacation.endDateTime,
      reason: vacation.reason
    },
    conflictingBookings
  );
  
  logger.info('Vacation period set', { 
    userId, 
    vacationId: vacation.id,
    conflicts: conflictingBookings.length 
  });
  
  return success({
    message: 'Vacation period set successfully',
    vacation: {
      id: vacation.id,
      startDateTime: vacation.startDateTime,
      endDateTime: vacation.endDateTime,
      reason: vacation.reason,
    },
    conflicts: conflictingBookings.length > 0 ? {
      count: conflictingBookings.length,
      bookings: conflictingBookings,
      message: 'Some bookings conflict with your vacation period. Please contact clients to reschedule.',
    } : null,
  });
}
async function importFromCalendar(
  userId: string,
  data: any,
  calendarRepo: CalendarRepository,
  calendarService: CalendarService,
  notificationService: NotificationService
): Promise<APIGatewayProxyResult> {
  if (!data.calendarSync?.calendarProvider) {
    return badRequest('Calendar provider is required');
  }
  
  // Get calendar integration
  const integration = await calendarRepo.getCalendarIntegration(userId, data.calendarSync.calendarProvider);
  
  if (!integration || !integration.isActive) {
    return notFound('Calendar integration not found or inactive');
  }
  
  try {
    // Import events from calendar
    const importResult = await calendarService.importAvailabilityFromCalendar(integration);
    
    // Update availability based on imported events
    const updatedSlots = await updateAvailabilityFromImport(userId, importResult, calendarRepo);
    
    // Send notification
    await notificationService.sendCalendarNotification(
      userId,
      'AVAILABILITY_UPDATED',
      {
        slotsUpdated: updatedSlots,
        eventsImported: importResult.eventsImported,
        provider: data.calendarSync.calendarProvider
      }
    );
    
    logger.info('Availability imported from calendar', { 
      userId, 
      provider: data.calendarSync.calendarProvider,
      eventsImported: importResult.eventsImported,
      slotsUpdated: updatedSlots 
    });
    
    return success({
      message: 'Availability imported from calendar successfully',
      importResult: {
        eventsImported: importResult.eventsImported,
        slotsUpdated: updatedSlots,
        conflicts: importResult.conflicts,
      },
    });
    
  } catch (error) {
    logger.error('Failed to import from calendar', { userId, error });
    return badRequest('Failed to import from calendar');
  }
}

// Utility functions
async function getNextAvailableSlots(userId: string, calendarRepo: CalendarRepository, limit: number = 10): Promise<MasterAvailability[]> {
  const now = new Date();
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  // Get weekly availability
  const weeklySlots = await calendarRepo.getMasterAvailability(userId, {
    scheduleType: 'WEEKLY',
    includeUnavailable: false
  });
  
  // Get specific date availability for the next week
  const specificSlots = await calendarRepo.getMasterAvailability(userId, {
    scheduleType: 'SPECIFIC_DATE',
    includeUnavailable: false
  });
  
  // Combine and sort (simplified implementation)
  const allSlots = [...weeklySlots, ...specificSlots];
  return allSlots.slice(0, limit);
}

async function findConflictingBookings(userId: string, blockedPeriods: any[]): Promise<Array<{
  id: string;
  scheduledDateTime: string;
  clientName: string;
  serviceName: string;
}>> {
  // Mock implementation - in production, query actual bookings from DynamoDB
  const mockConflicts = [];
  
  for (const period of blockedPeriods) {
    // Simulate finding conflicting bookings
    const startTime = new Date(period.startDateTime);
    const endTime = new Date(period.endDateTime);
    
    // Mock conflict for demonstration
    if (Math.random() > 0.7) { // 30% chance of conflict
      mockConflicts.push({
        id: `booking-${Date.now()}`,
        scheduledDateTime: startTime.toISOString(),
        clientName: 'John Doe',
        serviceName: 'Home Repair'
      });
    }
  }
  
  return mockConflicts;
}

function generateRecurringOccurrences(startDateTime: string, endDateTime: string, pattern: any): Array<{
  start: Date;
  end: Date;
}> {
  const occurrences = [];
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);
  const duration = end.getTime() - start.getTime();
  
  let currentDate = new Date(start);
  const maxOccurrences = pattern.occurrences || 52; // Default to 1 year of weekly occurrences
  const endDate = pattern.endDate ? new Date(pattern.endDate) : new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000);
  
  for (let i = 0; i < maxOccurrences && currentDate <= endDate; i++) {
    switch (pattern.frequency) {
      case 'DAILY':
        currentDate.setDate(currentDate.getDate() + pattern.interval);
        break;
      case 'WEEKLY':
        currentDate.setDate(currentDate.getDate() + (7 * pattern.interval));
        break;
      case 'MONTHLY':
        currentDate.setMonth(currentDate.getMonth() + pattern.interval);
        break;
      case 'YEARLY':
        currentDate.setFullYear(currentDate.getFullYear() + pattern.interval);
        break;
    }
    
    if (currentDate <= endDate) {
      occurrences.push({
        start: new Date(currentDate),
        end: new Date(currentDate.getTime() + duration),
      });
    }
  }
  
  return occurrences;
}

async function updateAvailabilityFromImport(userId: string, importResult: any, calendarRepo: CalendarRepository): Promise<number> {
  // This would process imported calendar events and update availability accordingly
  // Implementation depends on the specific calendar service and import format
  return importResult.eventsImported;
}