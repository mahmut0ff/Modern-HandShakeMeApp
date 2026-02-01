import { APIGatewayProxyResult } from 'aws-lambda';
import { ApplicationRepository } from '../shared/repositories/application.repository';
import { OrderRepository } from '../shared/repositories/order.repository';
import { UserRepository } from '../shared/repositories/user.repository';
import { success, badRequest, notFound, forbidden } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { logger } from '../shared/utils/logger';

async function getApplicationHandler(event: AuthenticatedEvent): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const applicationId = event.pathParameters?.id;
  const orderId = event.queryStringParameters?.orderId;
  
  if (!applicationId) {
    return badRequest('Application ID is required');
  }
  
  if (!orderId) {
    return badRequest('Order ID is required as query parameter');
  }
  
  logger.info('Get application request', { userId, applicationId, orderId });
  
  const applicationRepo = new ApplicationRepository();
  const orderRepo = new OrderRepository();
  const userRepo = new UserRepository();
  
  // Get application
  const application = await applicationRepo.findById(orderId, applicationId);
  if (!application) {
    return notFound('Application not found');
  }
  
  // Get order
  const order = await orderRepo.findById(orderId);
  if (!order) {
    return notFound('Order not found');
  }
  
  // Check permissions - only order owner or application creator can view
  const canView = (
    (event.auth.role === 'CLIENT' && order.clientId === userId) ||
    (event.auth.role === 'MASTER' && application.masterId === userId) ||
    event.auth.role === 'ADMIN'
  );
  
  if (!canView) {
    return forbidden('You do not have permission to view this application');
  }
  
  // Get master details
  const master = await userRepo.findById(application.masterId);
  
  // Build response
  const response = {
    id: application.id,
    orderId: application.orderId,
    coverLetter: application.coverLetter,
    proposedPrice: application.proposedPrice,
    proposedDurationDays: application.proposedDurationDays,
    status: application.status,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
    viewedAt: application.viewedAt,
    order: {
      id: order.id,
      title: order.title,
      budget: order.budget,
      deadline: order.deadline,
    },
    master: master ? {
      id: master.id,
      name: master.name,
      rating: master.rating || 0,
      completedProjects: master.completedProjects || 0,
    } : null,
  };
  
  logger.info('Application retrieved successfully', {
    userId,
    applicationId,
    orderId,
  });
  
  return success(response);
}

export const handler = withErrorHandler(withAuth(getApplicationHandler));