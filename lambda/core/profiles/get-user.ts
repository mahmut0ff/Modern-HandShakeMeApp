// Get current user profile Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success, notFound } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

async function getUserHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Get user profile', { userId });
  
  const prisma = getPrismaClient();
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      phone: true,
      role: true,
      firstName: true,
      lastName: true,
      avatar: true,
      isVerified: true,
      createdAt: true,
      masterProfile: {
        select: {
          id: true,
          companyName: true,
          bio: true,
          city: true,
          rating: true,
          reviewsCount: true,
          completedProjectsCount: true,
          categoryId: true,
          category: {
            select: {
              id: true,
              name: true
            }
          }
        },
      },
      clientProfile: {
        select: {
          id: true,
          companyName: true,
          city: true
        },
      },
    },
  });
  
  if (!user) {
    return notFound('User not found');
  }
  
  logger.info('User profile retrieved', { userId });
  
  // Format response
  const response: any = {
    id: user.id,
    email: user.email,
    phone: user.phone,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    avatar: user.avatar,
    isVerified: user.isVerified,
    createdAt: user.createdAt
  };
  
  if (user.masterProfile) {
    response.masterProfile = {
      id: user.masterProfile.id,
      companyName: user.masterProfile.companyName,
      bio: user.masterProfile.bio,
      city: user.masterProfile.city,
      rating: user.masterProfile.rating?.toString(),
      reviewsCount: user.masterProfile.reviewsCount,
      completedProjectsCount: user.masterProfile.completedProjectsCount,
      categoryId: user.masterProfile.categoryId,
      categoryName: user.masterProfile.category?.name
    };
  }
  
  if (user.clientProfile) {
    response.clientProfile = {
      id: user.clientProfile.id,
      companyName: user.clientProfile.companyName,
      city: user.clientProfile.city
    };
  }
  
  return success(response);
}

export const handler = withErrorHandler(withRequestTransform(withAuth(getUserHandler)));
