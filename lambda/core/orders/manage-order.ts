import type { APIGatewayProxyResult } from 'aws-lambda';
import { OrderRepository } from '../shared/repositories/order.repository';
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
    switch (action) {
        case 'PAUSE':
            if (order.status !== 'ACTIVE') {
                return badRequest('Only active orders can be paused');
            }
            updatedOrder = await orderRepo.pause(orderId);
            break;
        case 'RESUME':
            if (order.status !== 'PAUSED') {
                return badRequest('Only paused orders can be resumed');
            }
            updatedOrder = await orderRepo.resume(orderId);
            break;
        case 'ARCHIVE':
            updatedOrder = await orderRepo.archive(orderId);
            break;
        default:
            return badRequest('Unsupported action');
    }

    return success({ order: updatedOrder });
}

export const handler = withErrorHandler(withAuth(manageOrderHandler, { roles: ['CLIENT', 'MASTER'] }));
