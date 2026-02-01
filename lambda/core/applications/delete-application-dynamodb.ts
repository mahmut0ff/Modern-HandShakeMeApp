import { APIGatewayProxyResult } from 'aws-lambda';
import { ApplicationRepository } from '../shared/repositories/application.repository';
import { success, badRequest, notFound, forbidden } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { logger } from '../shared/utils/logger';

async function deleteApplicationHandler(event: AuthenticatedEvent): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const applicationId = event.pathParameters?.id;
  const orderId = event.queryStringParameters?.orderId;
  
  if (!applicationId) {
    return badRequest('Application ID is required');
  }
  
  if (!orderId) {
    return badRequest('Order ID is required as query parameter');
  }
  
  if (event.auth.role !== 'MASTER') {
    return forbidden('Only masters can delete their applications');
  }
  
  logger.info('Delete application request', { userId, applicationId, orderId });
  
  const applicationRepo = new ApplicationRepository();
  
  // Get application to verify ownership
  const application = await applicationRepo.findById(orderId, applicationId);
  if (!application) {
    return notFound('Application not found');
  }
  
  // Verify user owns the application
  if (application.masterId !== userId) {
    return forbidden('You can only delete your own applications');
  }
  
  // Only allow deletion of pending applications
  if (application.status !== 'PENDING') {
    return badRequest('Can only delete pending applications');
  }
  
  // Delete application
  await applicationRepo.delete(orderId, applicationId);
  
  logger.info('Application deleted successfully', {
    userId,
    applicationId,
    orderId,
  });
  
  return success({ message: 'Application deleted successfully' }, { statusCode: 204 });
}

export const handler = withErrorHandler(withAuth(deleteApplicationHandler, { roles: ['MASTER'] }));
