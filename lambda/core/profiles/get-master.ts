// Get master profile by ID Lambda function

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success, notFound, badRequest } from '@/shared/utils/response';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

async function getMasterHandler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const masterId = event.pathParameters?.id;
  
  if (!masterId) {
    return badRequest('Master ID is required');
  }
  
  logger.info('Get master profile', { masterId });
  
  const prisma = getPrismaClient();
  
  const master = await prisma.masterProfile.findUnique({
    where: { userId: masterId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          phone: true,
          createdAt: true
        },
      },
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  
  if (!master) {
    return notFound('Master not found');
  }
  
  logger.info('Master profile retrieved', { masterId });
  
  // Format response
  const response = {
    id: master.id,
    userId: master.userId,
    user: {
      id: master.user.id,
      firstName: master.user.firstName,
      lastName: master.user.lastName,
      avatar: master.user.avatar,
      phone: master.user.phone,
      createdAt: master.user.createdAt
    },
    companyName: master.companyName,
    bio: master.bio,
    city: master.city,
    rating: master.rating?.toString(),
    reviewsCount: master.reviewsCount,
    completedProjectsCount: master.completedProjectsCount,
    categoryId: master.categoryId,
    categoryName: master.category?.name,
    createdAt: master.createdAt,
    updatedAt: master.updatedAt
  };
  
  return success(response);
}

export const handler = withErrorHandler(withRequestTransform(getMasterHandler));
