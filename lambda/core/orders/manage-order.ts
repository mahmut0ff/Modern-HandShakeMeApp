import type { APIGatewayProxyResult } from 'aws-lambda';
import { OrderRepository } from '../shared/repositories/order.repository';
import { notificationService } from '../shared/services/notification.service';
import { success, forbidden, notFound, badRequest } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { logger } from '../shared/utils/logger';

async function manageOrderHandler(
    event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
    const userId = event.auth.userId;
    const orderId = event.pathParameters?.id;
    const body = JSON.parse(event.body || '{}');
    const action = body.action;

    if (!orderId) {
        return badRequest('Order ID is required');
    }

    if (!action || !['PAUSE', 'RESUME', 'ARCHIVE'].includes(action)) {
        return badRequest('Valid action (PAUSE, RESUME, ARCHIVE) is required');
    }

    logger.info('Manage order request', { userId, orderId, action });

    const orderRepo = new OrderRepository();
    const order = await orderRepo.findById(orderId);

    if (!order) {
        return notFound('Order not found');
    }

    if (order.clientId !== userId) {
        return forbidden('You can only manage your own orders');
    }

    let updatedOrder;
    let statusChanged = false;
    let newStatus = '';
    
    switch (action) {
        case 'PAUSE':
            if (order.status !== 'ACTIVE') {
                return badRequest('Only active orders can be paused');
            }
            updatedOrder = await orderRepo.pause(orderId);
            statusChanged = true;
            newStatus = 'PAUSED';
            break;
        case 'RESUME':
            if (order.status !== 'PAUSED') {
                return badRequest('Only paused orders can be resumed');
            }
            updatedOrder = await orderRepo.resume(orderId);
            statusChanged = true;
            newStatus = 'ACTIVE';
            break;
        case 'ARCHIVE':
            updatedOrder = await orderRepo.archive(orderId);
            statusChanged = true;
            newStatus = 'ARCHIVED';
            break;
        default:
            return badRequest('Unsupported action');
    }

    // Send notifications if status changed
    if (statusChanged && order.masterId) {
        try {
            // Notify master about status change
            await notificationService.notifyOrderStatusChanged(
                orderId,
                order.masterId,
                order.title,
                newStatus
            );
        } catch (error) {
            logger.error('Failed to send order status change notification', error);
            // Don't fail the request if notification fails
        }
    }

    return success({ order: updatedOrder });
}

export const handler = withErrorHandler(withAuth(manageOrderHandler, { roles: ['CLIENT', 'MASTER'] }));
