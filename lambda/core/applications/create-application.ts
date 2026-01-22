// Create application for an order

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { publishEvent } from '@/shared/events/publisher';
import { success, forbidden, notFound } from '@/shared/utils/response';
import { applicationSchema, validate } from '@/shared/utils/validation';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler, ConflictError } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';
import { EventType } from '@/shared/types';

async function createApplicationHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  if (event.auth.role !== 'MASTER') {
    return forbidden('Only masters can create applications');
  }
  
  logger.info('Create application request', { userId });
  
  // Request is already transformed by withRequestTransform middleware
  const body = JSON.parse(event.body || '{}');
  const data = validate(applicationSchema, body);
  
  const prisma = getPrismaClient();
  
  // Get master profile
  const masterProfile = await prisma.masterProfile.findUnique({
    where: { userId },
  });
  
  if (!masterProfile) {
    return forbidden('Master profile not found');
  }
  
  // Check if order exists and is open
  const order = await prisma.order.findUnique({
    where: { id: data.order_id.toString() },
  });
  
  if (!order) {
    return notFound('Order not found');
  }
  
  if (order.status !== 'ACTIVE') {
    return forbidden('Order is not accepting applications');
  }
  
  // Check for existing application
  const existingApplication = await prisma.application.findFirst({
    where: {
      orderId: data.order_id.toString(),
      masterId: masterProfile.id,
    },
  });
  
  if (existingApplication) {
    throw new ConflictError('You have already applied to this order');
  }
  
  // Create application
  const application = await prisma.application.create({
    data: {
      orderId: data.order_id.toString(),
      masterId: masterProfile.id,
      proposal: data.proposal,
      price: data.price,
      estimatedDuration: data.estimatedDuration,
      coverLetter: data.coverLetter,
      status: 'SENT',
    },
    include: {
      order: {
        select: {
          id: true,
          title: true,
          categoryId: true,
        },
      },
      master: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      },
    },
  });
  
  // Publish application.created event
  await publishEvent(
    EventType.APPLICATION_CREATED,
    userId,
    {
      applicationId: application.id,
      orderId: data.order_id.toString(),
      masterId: masterProfile.id,
    }
  );
  
  logger.info('Application created', { userId, applicationId: application.id });
  
  // Format response
  const response = {
    id: application.id,
    orderId: application.orderId,
    orderTitle: application.order.title,
    masterId: application.masterId,
    master: {
      id: application.master.user.id,
      name: `${application.master.user.firstName} ${application.master.user.lastName}`,
      avatar: application.master.user.avatar,
    },
    proposal: application.proposal,
    price: application.price?.toString(),
    estimatedDuration: application.estimatedDuration,
    coverLetter: application.coverLetter,
    status: application.status,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
  };
  
  // Response will be automatically transformed
  return success(response, { statusCode: 201 });
}

export const handler = withErrorHandler(withRequestTransform(withAuth(createApplicationHandler)));
