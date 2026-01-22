import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { createResponse, createErrorResponse } from '@/shared/utils/response';
import { validateInput } from '@/shared/utils/validation';
import { requireAuth } from '@/shared/middleware/auth';
import { CacheService } from '@/shared/services/cache';
import { NotificationService } from '@/shared/services/notification';

const prisma = new PrismaClient();
const cache = new CacheService();
const notificationService = new NotificationService();

// Validation schema
const bookSlotSchema = z.object({
  slotId: z.string().uuid('Invalid slot ID'),
  orderId: z.string().uuid('Invalid order ID').optional(),
  notes: z.string().max(500, 'Notes too long').optional()
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await requireAuth()(event);

    const body = JSON.parse(event.body || '{}');
    const validatedData = validateInput(bookSlotSchema)(body);

    // Check if slot exists and is available
    const slot = await prisma.availabilitySlot.findUnique({
      where: { id: validatedData.slotId },
      include: {
        master: {
          include: {
            user: {
              select: {
                id: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!slot) {
      return createErrorResponse(404, 'NOT_FOUND', 'Availability slot not found');
    }

    if (slot.isBooked) {
      return createErrorResponse(409, 'CONFLICT', 'Slot is already booked');
    }

    // Check if slot is in the past
    const slotDateTime = new Date(slot.date);
    const [hours, minutes] = slot.startTime.split(':').map(Number);
    slotDateTime.setHours(hours, minutes, 0, 0);

    if (slotDateTime < new Date()) {
      return createErrorResponse(400, 'VALIDATION_ERROR', 'Cannot book slots in the past');
    }

    // Validate order if provided
    let order = null;
    if (validatedData.orderId) {
      order = await prisma.order.findUnique({
        where: { id: validatedData.orderId },
        include: {
          client: {
            select: { userId: true }
          }
        }
      });

      if (!order) {
        return createErrorResponse(404, 'NOT_FOUND', 'Order not found');
      }

      // Check if user is involved in the order
      const isClient = order.client.userId === user.userId;
      const isMaster = order.masterId === user.userId;
      
      if (!isClient && !isMaster) {
        return createErrorResponse(403, 'FORBIDDEN', 'You are not involved in this order');
      }

      // Check order status
      if (!['ACTIVE', 'ACCEPTED', 'IN_PROGRESS'].includes(order.status)) {
        return createErrorResponse(400, 'VALIDATION_ERROR', 
          'Order must be active, accepted, or in progress to book slots');
      }
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Double-check slot availability within transaction
      const currentSlot = await tx.availabilitySlot.findUnique({
        where: { id: validatedData.slotId }
      });

      if (!currentSlot || currentSlot.isBooked) {
        throw new Error('Slot is no longer available');
      }

      // Book the slot
      const bookedSlot = await tx.availabilitySlot.update({
        where: { id: validatedData.slotId },
        data: {
          isBooked: true,
          bookedBy: user.userId,
          orderId: validatedData.orderId || null
        },
        include: {
          master: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true
                }
              }
            }
          },
          order: validatedData.orderId ? {
            select: {
              id: true,
              title: true
            }
          } : false
        }
      });

      return bookedSlot;
    });

    // Send notification to master
    await notificationService.sendNotification({
      userId: slot.master.user.id,
      type: 'SLOT_BOOKED',
      title: 'Новое бронирование',
      message: `Забронирован слот на ${slot.date.toLocaleDateString()} ${slot.startTime}-${slot.endTime}`,
      data: {
        slotId: slot.id,
        bookedBy: user.userId,
        orderId: validatedData.orderId,
        date: slot.date.toISOString(),
        startTime: slot.startTime,
        endTime: slot.endTime
      }
    });

    // Invalidate cache
    await cache.invalidatePattern(`availability:${slot.masterId}*`);
    await cache.invalidatePattern(`master:profile:${slot.masterId}*`);

    console.log(`Slot booked: ${validatedData.slotId} by user ${user.userId}`);

    return createResponse(200, {
      slotId: result.id,
      masterId: result.masterId,
      date: result.date.toISOString().split('T')[0],
      startTime: result.startTime,
      endTime: result.endTime,
      isBooked: result.isBooked,
      bookedBy: result.bookedBy,
      orderId: result.orderId,
      order: result.order,
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
  } finally {
    await prisma.$disconnect();
  }
};