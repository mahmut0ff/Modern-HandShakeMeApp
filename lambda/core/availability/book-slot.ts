import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { createResponse, createErrorResponse } from '../shared/utils/response';
import { validateInput, bookSlotSchema } from '../shared/utils/validation';
import { requireAuth } from '../shared/middleware/auth';
import { CacheService } from '../shared/services/cache';
import { NotificationService } from '../shared/services/notification';
import { AvailabilityRepository } from '../shared/repositories/availability.repository';
import { OrderRepository } from '../shared/repositories/order.repository';
import { MasterProfileRepository } from '../shared/repositories/master-profile.repository';

const availabilityRepo = new AvailabilityRepository();
const orderRepo = new OrderRepository();
const masterRepo = new MasterProfileRepository();
const cache = new CacheService();
const notificationService = new NotificationService();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await requireAuth()(event);

    const body = JSON.parse(event.body || '{}');
    const validatedData = validateInput(bookSlotSchema)(body);

    // Get slot by ID
    const slot = await availabilityRepo.getSlotById(validatedData.slotId);

    if (!slot) {
      return createErrorResponse(404, 'NOT_FOUND', 'Availability slot not found');
    }

    if (slot.isBooked) {
      return createErrorResponse(409, 'CONFLICT', 'Slot is already booked');
    }

    // Check if slot is in the past
    const slotDateTime = new Date(`${slot.date}T${slot.startTime}:00`);
    if (slotDateTime < new Date()) {
      return createErrorResponse(400, 'VALIDATION_ERROR', 'Cannot book slots in the past');
    }

    // Get master profile for notifications
    const masterProfile = await masterRepo.findByUserId(slot.masterId);
    if (!masterProfile) {
      return createErrorResponse(404, 'NOT_FOUND', 'Master not found');
    }

    // Validate order if provided
    let order = null;
    if (validatedData.orderId) {
      order = await orderRepo.findById(validatedData.orderId);

      if (!order) {
        return createErrorResponse(404, 'NOT_FOUND', 'Order not found');
      }

      // Check if user is involved in the order
      const isClient = order.clientId === user.userId;
      // Note: Order doesn't have masterId field in current schema
      // This would need to be checked through applications or projects
      
      // Check order status
      if (!['ACTIVE', 'IN_PROGRESS'].includes(order.status)) {
        return createErrorResponse(400, 'VALIDATION_ERROR', 
          'Order must be active or in progress to book slots');
      }
    }

    // Book the slot
    const bookedSlot = await availabilityRepo.bookSlot(
      validatedData.slotId,
      user.userId,
      validatedData.orderId,
      validatedData.notes
    );

    // Send notification to master
    await notificationService.sendNotification({
      userId: slot.masterId,
      type: 'SYSTEM',
      title: 'Новое бронирование',
      message: `Забронирован слот на ${slot.date} ${slot.startTime}-${slot.endTime}`,
      data: {
        slotId: slot.slotId,
        bookedBy: user.userId,
        orderId: validatedData.orderId,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime
      }
    });

    // Invalidate cache
    await cache.invalidatePattern(`availability:${slot.masterId}*`);
    await cache.invalidatePattern(`master:profile:${slot.masterId}*`);

    console.log(`Slot booked: ${validatedData.slotId} by user ${user.userId}`);

    return createResponse(200, {
      slotId: bookedSlot.slotId,
      masterId: bookedSlot.masterId,
      date: bookedSlot.date,
      startTime: bookedSlot.startTime,
      endTime: bookedSlot.endTime,
      isBooked: bookedSlot.isBooked,
      bookedBy: bookedSlot.bookedBy,
      orderId: bookedSlot.orderId,
      order: order ? {
        id: order.id,
        title: order.title
      } : null,
      message: 'Slot booked successfully'
    });

  } catch (error) {
    console.error('Error booking slot:', error);
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(400, 'VALIDATION_ERROR', error.errors[0].message);
    }
    
    if (error.name === 'UnauthorizedError') {
      return createErrorResponse(401, 'UNAUTHORIZED', error.message);
    }

    if (error.message === 'Slot is no longer available') {
      return createErrorResponse(409, 'CONFLICT', 'Slot is no longer available');
    }

    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to book slot');
  }
};