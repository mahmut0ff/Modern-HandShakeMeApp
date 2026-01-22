// Accept application and create project

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { publishEvent } from '@/shared/events/publisher';
import { success, forbidden, notFound } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { logger } from '@/shared/utils/logger';
import { EventType } from '@/shared/types';

async function acceptApplicationHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const applicationId = event.pathParameters?.id;
  
  if (!applicationId) {
    return notFound('Application ID is required');
  }
  
  if (event.auth.role !== 'CLIENT') {
    return forbidden('Only clients can accept applications');
  }
  
  logger.info('Accept application request', { userId, applicationId });
  
  const prisma = getPrismaClient();
  
  // Get application with order
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      order: {
        include: {
          client: true,
        },
      },
      master: true,
    },
  });
  
  if (!application) {
    return notFound('Application not found');
  }
  
  // Verify user owns the order
  if (application.order.client.userId !== userId) {
    return forbidden('You can only accept applications for your own orders');
  }
  
  if (application.status !== 'PENDING') {
    return forbidden('Application is not pending');
  }
  
  // Use transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Accept the application
    const acceptedApp = await tx.application.update({
      where: { id: applicationId },
      data: { status: 'ACCEPTED' },
    });
    
    // Reject all other applications for this order
    await tx.application.updateMany({
      where: {
        orderId: application.orderId,
        id: { not: applicationId },
        status: 'PENDING',
      },
      data: { status: 'REJECTED' },
    });
    
    // Update order status
    await tx.order.update({
      where: { id: application.orderId },
      data: { status: 'IN_PROGRESS' },
    });
    
    // Create project
    const project = await tx.project.create({
      data: {
        orderId: application.orderId,
        masterId: application.masterId,
        clientId: application.order.clientId,
        status: 'IN_PROGRESS',
        budget: application.price,
        deadline: application.order.deadline,
      },
    });
    
    return { application: acceptedApp, project };
  });
  
  // Publish events
  await publishEvent(
    EventType.APPLICATION_ACCEPTED,
    userId,
    {
      applicationId,
      orderId: application.orderId,
      masterId: application.masterId,
    }
  );
  
  await publishEvent(
    EventType.PROJECT_CREATED,
    userId,
    {
      projectId: result.project.id,
      orderId: application.orderId,
      masterId: application.masterId,
      clientId: application.order.clientId,
    }
  );
  
  logger.info('Application accepted and project created', {
    userId,
    applicationId,
    projectId: result.project.id,
  });
  
  return success(result);
}

export const handler = withErrorHandler(withAuth(acceptApplicationHandler));
