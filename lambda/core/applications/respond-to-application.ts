// Respond to application Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { getPrismaClient } from '@/shared/db/client';
import { success, notFound, forbidden, badRequest } from '@/shared/utils/response';
import { validateSafe } from '@/shared/utils/validation';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

const respondSchema = z.object({
  status: z.enum(['accepted', 'rejected']),
  message: z.string().max(500).optional()
});

async function respondToApplicationHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const userRole = event.auth.role;
  const applicationId = event.pathParameters?.id;
  
  logger.info('Respond to application request', { userId, applicationId });
  
  if (!applicationId) {
    return badRequest('Application ID is required');
  }
  
  if (userRole !== 'CLIENT') {
    return forbidden('Only clients can respond to applications');
  }
  
  const body = JSON.parse(event.body || '{}');
  const result = validateSafe(respondSchema, body);
  
  if (!result.success) {
    return badRequest('Invalid request data');
  }
  
  const { status, message } = result.data;
  
  const prisma = getPrismaClient();
  
  // Get client profile
  const clientProfile = await prisma.clientProfile.findUnique({
    where: { userId },
    select: { id: true }
  });
  
  if (!clientProfile) {
    return notFound('Client profile not found');
  }
  
  // Get application with order
  const application = await prisma.application.findUnique({
    where: { id: parseInt(applicationId) },
    include: {
      order: {
        select: {
          id: true,
          clientId: true,
          title: true,
          status: true
        }
      },
      master: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      }
    }
  });
  
  if (!application) {
    return notFound('Application not found');
  }
  
  // Check if user owns the order
  if (application.order.clientId !== clientProfile.id) {
    return forbidden('You can only respond to applications for your own orders');
  }
  
  // Check if application can be responded to
  if (application.status !== 'PENDING') {
    return badRequest('Application has already been responded to');
  }
  
  // Check if order is still open
  if (application.order.status !== 'OPEN') {
    return badRequest('Order is no longer accepting applications');
  }
  
  // Update application status
  const updatedApplication = await prisma.application.update({
    where: { id: parseInt(applicationId) },
    data: {
      status: status.toUpperCase(),
      responseMessage: message,
      respondedAt: new Date()
    },
    include: {
      order: {
        select: {
          id: true,
          title: true,
          description: true,
          budgetMin: true,
          budgetMax: true,
          budgetType: true,
          city: true,
          status: true
        }
      },
      master: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      }
    }
  });
  
  // If accepted, create project and reject other applications
  if (status === 'accepted') {
    // Create project
    await prisma.project.create({
      data: {
        orderId: application.orderId,
        masterId: application.masterId,
        clientId: clientProfile.id,
        status: 'IN_PROGRESS',
        price: application.price,
        estimatedDuration: application.estimatedDuration,
        startDate: new Date()
      }
    });
    
    // Reject other pending applications for this order
    await prisma.application.updateMany({
      where: {
        orderId: application.orderId,
        id: { not: parseInt(applicationId) },
        status: 'PENDING'
      },
      data: {
        status: 'REJECTED',
        responseMessage: 'Another application was accepted',
        respondedAt: new Date()
      }
    });
    
    // Update order status to IN_PROGRESS
    await prisma.order.update({
      where: { id: application.orderId },
      data: { status: 'IN_PROGRESS' }
    });
  }
  
  logger.info('Application responded', { 
    applicationId, 
    status, 
    userId 
  });
  
  // Format response
  const formattedApplication = {
    id: updatedApplication.id,
    orderId: updatedApplication.orderId,
    orderTitle: updatedApplication.order.title,
    orderDescription: updatedApplication.order.description,
    orderBudgetType: updatedApplication.order.budgetType,
    orderBudgetMin: updatedApplication.order.budgetMin?.toString(),
    orderBudgetMax: updatedApplication.order.budgetMax?.toString(),
    orderStatus: updatedApplication.order.status,
    orderCity: updatedApplication.order.city,
    master: {
      id: updatedApplication.master.user.id,
      name: `${updatedApplication.master.user.firstName} ${updatedApplication.master.user.lastName}`,
      avatar: updatedApplication.master.user.avatar,
      companyName: updatedApplication.master.companyName,
      rating: updatedApplication.master.rating?.toString(),
      reviewsCount: updatedApplication.master.reviewsCount
    },
    proposal: updatedApplication.proposal,
    price: updatedApplication.price?.toString(),
    estimatedDuration: updatedApplication.estimatedDuration,
    coverLetter: updatedApplication.coverLetter,
    status: updatedApplication.status,
    responseMessage: updatedApplication.responseMessage,
    createdAt: updatedApplication.createdAt,
    updatedAt: updatedApplication.updatedAt,
    respondedAt: updatedApplication.respondedAt
  };
  
  return success(formattedApplication);
}

export const handler = withErrorHandler(withRequestTransform(withAuth(respondToApplicationHandler)));
