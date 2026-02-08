import { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { ApplicationRepository } from '../shared/repositories/application.repository';
import { OrderRepository } from '../shared/repositories/order.repository';
import { ChatRepository } from '../shared/repositories/chat.repository';
import { UserRepository } from '../shared/repositories/user.repository';
import { NotificationService } from '../shared/services/notification';
import { success, badRequest, notFound, forbidden } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler, ValidationError } from '../shared/middleware/errorHandler';
import { logger } from '../shared/utils/logger';

const respondSchema = z.object({
  action: z.enum(['ACCEPT', 'REJECT', 'LIKE'], {
    errorMap: () => ({ message: 'Action must be either ACCEPT, REJECT or LIKE' })
  }),
  rejectionReason: z.string().optional(),
});

async function respondToApplicationHandler(event: AuthenticatedEvent): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const { orderId, applicationId } = event.pathParameters || {};

  if (!orderId || !applicationId) {
    return badRequest('Order ID and Application ID are required');
  }

  if (event.auth.role !== 'CLIENT') {
    return forbidden('Only clients can respond to applications');
  }

  logger.info('Respond to application request', { userId, orderId, applicationId });

  const body = JSON.parse(event.body || '{}');

  // Validate input
  let validatedData;
  try {
    validatedData = respondSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Validation failed', error.errors);
    }
    throw error;
  }

  const orderRepo = new OrderRepository();
  const applicationRepo = new ApplicationRepository();
  const chatRepo = new ChatRepository();
  const userRepo = new UserRepository();
  const notificationService = new NotificationService();

  // Get order to verify ownership
  const order = await orderRepo.findById(orderId);
  if (!order) {
    return notFound('Order not found');
  }

  if (order.clientId !== userId) {
    return forbidden('You can only respond to applications for your own orders');
  }

  // Get application
  const application = await applicationRepo.findById(orderId, applicationId);
  if (!application) {
    return notFound('Application not found');
  }

  if (application.status !== 'PENDING' && validatedData.action !== 'LIKE') {
    return badRequest('Application is not pending');
  }

  const { action, rejectionReason } = validatedData;

  if (action === 'ACCEPT') {
    // Accept the application
    const acceptedApp = await applicationRepo.updateStatus(orderId, applicationId, 'ACCEPTED');

    // Get all other pending applications for rejection notifications
    const allApplications = await applicationRepo.findByOrder(orderId);
    const otherPendingApplications = allApplications.filter(
      app => app.id !== applicationId && app.status === 'PENDING'
    );

    // Reject all other applications for this order
    await applicationRepo.rejectAllOtherApplications(orderId, applicationId);

    // Update order status and assign master
    await orderRepo.update(orderId, {
      status: 'IN_PROGRESS',
      masterId: application.masterId,
      acceptedApplicationId: applicationId,
    });

    // Create chat room between client and master
    const chatRoom = await chatRepo.createRoom({
      participants: [userId, application.masterId],
      orderId: orderId,
    });

    // Send notifications
    try {
      const [master, client] = await Promise.all([
        userRepo.findById(application.masterId),
        userRepo.findById(userId),
      ]);

      // Notify accepted master
      await notificationService.notifyApplicationAccepted(application.masterId, {
        applicationId,
        orderId,
        orderTitle: order.title,
        clientName: client?.name || `${client?.firstName} ${client?.lastName}`.trim(),
      });

      // Notify rejected masters
      if (otherPendingApplications.length > 0) {
        const rejectedMasterIds = otherPendingApplications.map(app => app.masterId);
        await notificationService.notifyMultipleApplicationsRejected(rejectedMasterIds, {
          applicationId: '', // Not relevant for rejected applications
          orderId,
          orderTitle: order.title,
        });
      }
    } catch (error) {
      logger.error('Failed to send application response notifications', error);
      // Don't fail the request if notifications fail
    }

    logger.info('Application accepted and chat created', {
      userId,
      applicationId,
      orderId,
      chatRoomId: chatRoom.id,
    });

    return success({
      application: acceptedApp,
      chatRoom: chatRoom,
    });
  } else if (action === 'REJECT') {
    // Reject the application
    const rejectedApp = await applicationRepo.update(orderId, applicationId, {
      status: 'REJECTED',
      rejectionReason: rejectionReason
    });

    // Send notification to master
    try {
      await notificationService.notifyApplicationRejected(application.masterId, {
        applicationId,
        orderId,
        orderTitle: order.title,
        reason: rejectionReason
      });
    } catch (error) {
      logger.error('Failed to send application rejection notification', error);
      // Don't fail the request if notification fails
    }

    logger.info('Application rejected', {
      userId,
      applicationId,
      orderId,
    });

    return success({
      application: rejectedApp
    });
  } else if (action === 'LIKE') {
    // Toggle favorite/liked
    const likedApp = await applicationRepo.update(orderId, applicationId, {
      isFavorite: !application.isFavorite
    });

    return success({
      application: likedApp
    });
  }

  return badRequest('Invalid action');
}

export const handler = withErrorHandler(withAuth(respondToApplicationHandler, { roles: ['CLIENT'] }));
