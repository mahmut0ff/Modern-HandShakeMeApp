import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { success, badRequest } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler, ValidationError } from '../shared/middleware/errorHandler';
import { OrderRepository } from '../shared/repositories/order.repository';
import { UserRepository } from '../shared/repositories/user.repository';
import { NotificationService } from '../shared/services/notification';
import { logger } from '../shared/utils/logger';

const createDirectOrderSchema = z.object({
    masterId: z.string().uuid(),
    categoryId: z.union([z.string(), z.number()]).optional(),
    category: z.union([z.string(), z.number()]).optional(),
    title: z.string().min(5).max(200),
    description: z.string().min(20).max(5000),
    city: z.string(),
    address: z.string().optional().default(''),
    budgetType: z.enum(['FIXED', 'RANGE', 'NEGOTIABLE']).optional().default('NEGOTIABLE'),
    budgetMin: z.number().optional(),
    budgetMax: z.number().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
}).refine(data => data.categoryId || data.category, {
    message: 'Either categoryId or category is required',
});

async function createDirectOrderHandler(event: AuthenticatedEvent): Promise<APIGatewayProxyResult> {
    const { userId } = event.auth;
    const body = JSON.parse(event.body || '{}');

    const validationResult = createDirectOrderSchema.safeParse(body);
    if (!validationResult.success) {
        throw new ValidationError('Validation failed', validationResult.error.errors);
    }

    const data = validationResult.data;
    const masterId = data.masterId;

    // Verify master exists and has MASTER role
    const userRepo = new UserRepository();
    const master = await userRepo.findById(masterId);
    if (!master || master.role !== 'MASTER') {
        return badRequest('Invalid master ID or user is not a master');
    }

    const orderRepo = new OrderRepository();
    const order = await orderRepo.create({
        clientId: userId,
        masterId: masterId,
        categoryId: String(data.categoryId || data.category),
        title: data.title,
        description: data.description,
        city: data.city,
        address: data.address,
        budgetType: data.budgetType as any,
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        startDate: data.startDate,
        endDate: data.endDate,
        status: 'IN_PROGRESS', // Immediately in progress as master is pre-assigned
        isPublic: false,
    });

    // Notify master
    const notificationService = new NotificationService();
    await notificationService.notifyCustom(masterId, {
        title: 'New Direct Order',
        body: `You have been assigned a new order: "${order.title}"`,
        type: 'ORDER_ASSIGNED'
    });

    logger.info('Direct order created', { userId, masterId, orderId: order.id });

    return success(order, 201);
}

export const handler = withErrorHandler(withAuth(createDirectOrderHandler, { roles: ['CLIENT', 'MASTER'] }));
