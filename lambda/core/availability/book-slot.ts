import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { z } from 'zod';
import { success, badRequest, notFound, conflict, internalServerError } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { AvailabilityRepository } from '../shared/repositories/availability.repository';
import { OrderRepository } from '../shared/repositories/order.repository';
import { MasterProfileRepository } from '../shared/repositories/master-profile.repository';
import { logger } from '../shared/utils/logger';

const availabilityRepo = new AvailabilityRepository();
const orderRepo = new OrderRepository();
const masterRepo = new MasterProfileRepository();

const bookSlotSchema = z.object({
  slotId: z.string().uuid(),
  orderId: z.string().uuid().optional(),
  notes: z.string().max(500).optional()
});

async function bookSlotHandler(
  event: AuthenticatedEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  const { userId } = event.auth;
  
  const body = JSON.parse(event.body || '{}');
  const validation = bookSlotSchema.safeParse(body);
  
  if (!validation.success) {
    return badRequest(validation.error.errors[0].message);
  }
  
  const { slotId, orderId, notes } = validation.data;

  // Get slot by ID
  const slot = await availabilityRepo.getSlotById(slotId);

  if (!slot) {
    return notFound('Availability slot not found');
  }

  if (slot.isBooked) {
    return conflict('Slot is already booked');
  }

  // Check if slot is in the past
  const slotDateTime = new Date(`${slot.date}T${slot.startTime}:00`);
  if (slotDateTime < new Date()) {
    return badRequest('Cannot book slots in the past');
  }

  // Get master profile
  const masterProfile = await masterRepo.findByUserId(slot.masterId);
  if (!masterProfile) {
    return notFound('Master not found');
  }

  // Validate order if provided
  let order = null;
  if (orderId) {
    order = await orderRepo.findById(orderId);
    if (!order) {
      return notFound('Order not found');
    }
    if (!['ACTIVE', 'IN_PROGRESS'].includes(order.status)) {
      return badRequest('Order must be active or in progress to book slots');
    }
  }

  // Book the slot
  const bookedSlot = await availabilityRepo.bookSlot(slotId, userId, orderId, notes);

  logger.info('Slot booked', { slotId, userId, orderId });

  return success({
    slotId: bookedSlot.slotId,
    masterId: bookedSlot.masterId,
    date: bookedSlot.date,
    startTime: bookedSlot.startTime,
    endTime: bookedSlot.endTime,
    isBooked: bookedSlot.isBooked,
    bookedBy: bookedSlot.bookedBy,
    orderId: bookedSlot.orderId,
    order: order ? { id: order.id, title: order.title } : null,
    message: 'Slot booked successfully'
  });
}

export const handler = withErrorHandler(withAuth(bookSlotHandler));
