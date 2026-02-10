import type { APIGatewayProxyResult } from 'aws-lambda';
import { OrderRepository } from '../shared/repositories/order.repository';
import { ReviewRepository } from '../shared/repositories/review.repository';
import { UserRepository } from '../shared/repositories/user.repository';
import { notificationService } from '../shared/services/notification.service';
import { success, forbidden, notFound, badRequest } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { logger } from '../shared/utils/logger';

async function completeOrderHandler(
    event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
    const userId = event.auth.userId;
    const orderId = event.pathParameters?.id;
    const body = JSON.parse(event.body || '{}');
    const action = body.action;

    if (!orderId) {
        return badRequest('Order ID is required');
    }

    const orderRepo = new OrderRepository();
    const order = await orderRepo.findById(orderId);

    if (!order) {
        return notFound('Order not found');
    }

    const userRepo = new UserRepository();

    if (action === 'COMPLETE_WORK') {
        // Master marks work as done
        if (order.masterId !== userId) {
            return forbidden('You are not the assigned master for this order');
        }
        if (order.status !== 'IN_PROGRESS') {
            return badRequest('Order must be in progress to mark as complete');
        }

        const updatedOrder = await orderRepo.updateStatus(orderId, 'READY_TO_CONFIRM');

        // Notify client
        try {
            await notificationService.notifyOrderStatusChanged(
                orderId,
                order.clientId,
                order.title,
                'READY_TO_CONFIRM'
            );
        } catch (error) {
            logger.error('Failed to send order completion notification', error);
        }

        return success({ order: updatedOrder });
    }

    if (action === 'CONFIRM_COMPLETION') {
        // Client confirms completion and leaves review
        if (order.clientId !== userId) {
            return forbidden('You are not the owner of this order');
        }
        if (order.status !== 'IN_PROGRESS' && order.status !== 'READY_TO_CONFIRM') {
            return badRequest('Order cannot be confirmed in current status');
        }

        const { rating, comment, isAnonymous } = body;
        if (!rating || rating < 1 || rating > 5) {
            return badRequest('Valid rating (1-5) is required');
        }

        const updatedOrder = await orderRepo.updateStatus(orderId, 'COMPLETED');

        // Create review
        const reviewRepo = new ReviewRepository();
        const review = await reviewRepo.create({
            orderId,
            clientId: userId,
            masterId: order.masterId,
            rating,
            comment: comment || '',
            isAnonymous: isAnonymous || false,
        });

        // Update master stats (rating and completed projects)
        if (order.masterId) {
            try {
                const stats = await reviewRepo.getReviewStats(order.masterId);
                await userRepo.update(order.masterId, {
                    rating: stats.averageRating,
                    completedProjects: stats.totalReviews // Or track separately if needed
                });
            } catch (err) {
                logger.error('Failed to update master stats', err);
            }
        }

        // Notify master about completion and review
        try {
            if (order.masterId) {
                await notificationService.notifyOrderCompleted(
                    orderId,
                    order.masterId,
                    order.title
                );
                
                // Also notify about the review
                const client = await userRepo.findById(userId);
                const clientName = client?.firstName && client?.lastName 
                    ? `${client.firstName} ${client.lastName}` 
                    : 'Клиент';
                
                await notificationService.notifyReviewReceived(
                    review.id,
                    order.masterId,
                    clientName,
                    rating
                );
            }
        } catch (error) {
            logger.error('Failed to send order confirmation notifications', error);
        }

        return success({ order: updatedOrder, review });
    }

    return badRequest('Valid action (COMPLETE_WORK, CONFIRM_COMPLETION) is required');
}

export const handler = withErrorHandler(withAuth(completeOrderHandler));
