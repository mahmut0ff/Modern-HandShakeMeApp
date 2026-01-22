// Create review Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { getPrismaClient } from '@/shared/db/client';
import { success, forbidden, notFound, conflict, badRequest } from '@/shared/utils/response';
import { validateSafe } from '@/shared/utils/validation';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

const createReviewSchema = z.object({
  order: z.number().int().positive(),
  project: z.number().int().positive().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
  isAnonymous: z.boolean().optional()
});

async function createReviewHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  if (event.auth.role !== 'CLIENT') {
    return forbidden('Only clients can create reviews');
  }
  
  logger.info('Create review request', { userId });
  
  const body = JSON.parse(event.body || '{}');
  const result = validateSafe(createReviewSchema, body);
  
  if (!result.success) {
    return badRequest('Invalid request data');
  }
  
  const data = result.data;
  
  const prisma = getPrismaClient();
  
  // Get client profile
  const clientProfile = await prisma.clientProfile.findUnique({
    where: { userId },
    select: { id: true }
  });
  
  if (!clientProfile) {
    return notFound('Client profile not found');
  }
  
  // Get order
  const order = await prisma.order.findUnique({
    where: { id: data.order },
    include: {
      category: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
  
  if (!order) {
    return notFound('Order not found');
  }
  
  // Verify user is order owner
  if (order.clientId !== clientProfile.id) {
    return forbidden('You can only review your own orders');
  }
  
  // Get project if specified
  let project = null;
  if (data.project) {
    project = await prisma.project.findUnique({
      where: { id: data.project },
      include: {
        master: {
          select: {
            id: true,
            userId: true
          }
        }
      }
    });
    
    if (!project) {
      return notFound('Project not found');
    }
    
    // Verify project is completed
    if (project.status !== 'COMPLETED') {
      return forbidden('Project must be completed to leave a review');
    }
  }
  
  // Check for existing review
  const existingReview = await prisma.review.findFirst({
    where: {
      orderId: data.order,
      clientId: clientProfile.id
    }
  });
  
  if (existingReview) {
    return conflict('You have already reviewed this order');
  }
  
  // Create review
  const review = await prisma.review.create({
    data: {
      orderId: data.order,
      projectId: data.project,
      masterId: project?.masterId || order.masterId,
      clientId: clientProfile.id,
      rating: data.rating,
      comment: data.comment,
      isAnonymous: data.isAnonymous || false,
      isVerified: true
    },
    include: {
      client: {
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
      },
      order: {
        select: {
          id: true,
          title: true
        }
      },
      project: {
        select: {
          id: true
        }
      }
    }
  });
  
  // Update master rating
  const masterReviews = await prisma.review.findMany({
    where: { masterId: review.masterId },
    select: { rating: true }
  });
  
  const avgRating = masterReviews.reduce((sum, r) => sum + r.rating, 0) / masterReviews.length;
  
  await prisma.masterProfile.update({
    where: { id: review.masterId },
    data: {
      rating: avgRating,
      reviewsCount: masterReviews.length
    }
  });
  
  logger.info('Review created', { userId, reviewId: review.id });
  
  // Format response
  const response = {
    id: review.id,
    client: data.isAnonymous ? null : {
      id: review.client.user.id,
      name: `${review.client.user.firstName} ${review.client.user.lastName}`,
      avatar: review.client.user.avatar
    },
    master: {
      id: review.master.user.id,
      name: `${review.master.user.firstName} ${review.master.user.lastName}`,
      avatar: review.master.user.avatar
    },
    order: {
      id: review.order.id,
      title: review.order.title
    },
    orderId: review.orderId,
    orderTitle: review.order.title,
    project: review.project ? {
      id: review.project.id
    } : null,
    projectId: review.projectId,
    rating: review.rating,
    comment: review.comment,
    response: review.response,
    isAnonymous: review.isAnonymous,
    isVerified: review.isVerified,
    helpfulCount: review.helpfulCount,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    respondedAt: review.respondedAt
  };
  
  return success(response, { statusCode: 201 });
}

export const handler = withErrorHandler(withRequestTransform(withAuth(createReviewHandler)));
