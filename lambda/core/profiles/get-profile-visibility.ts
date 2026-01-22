// Get profile visibility settings Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success, forbidden } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { logger } from '@/shared/utils/logger';

async function getProfileVisibilityHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  if (event.auth.role !== 'MASTER') {
    return forbidden('Only masters can access profile visibility settings');
  }
  
  logger.info('Get profile visibility request', { userId });
  
  const prisma = getPrismaClient();
  
  // Get master profile
  const masterProfile = await prisma.masterProfile.findUnique({
    where: { userId },
    select: {
      isProfilePublic: true,
      showPhone: true,
      showEmail: true,
      showLocation: true,
      showRating: true,
      showReviews: true,
      showPortfolio: true,
      showServices: true,
    },
  });
  
  if (!masterProfile) {
    // Create default profile with default visibility settings
    const newProfile = await prisma.masterProfile.create({
      data: {
        userId,
        isProfilePublic: true,
        showPhone: true,
        showEmail: false,
        showLocation: true,
        showRating: true,
        showReviews: true,
        showPortfolio: true,
        showServices: true,
      },
      select: {
        isProfilePublic: true,
        showPhone: true,
        showEmail: true,
        showLocation: true,
        showRating: true,
        showReviews: true,
        showPortfolio: true,
        showServices: true,
      },
    });
    
    logger.info('Master profile created with default visibility', { userId });
    
    return success({
      is_profile_public: newProfile.isProfilePublic,
      show_phone: newProfile.showPhone,
      show_email: newProfile.showEmail,
      show_location: newProfile.showLocation,
      show_rating: newProfile.showRating,
      show_reviews: newProfile.showReviews,
      show_portfolio: newProfile.showPortfolio,
      show_services: newProfile.showServices,
    });
  }
  
  logger.info('Profile visibility retrieved successfully', { userId });
  
  return success({
    is_profile_public: masterProfile.isProfilePublic,
    show_phone: masterProfile.showPhone,
    show_email: masterProfile.showEmail,
    show_location: masterProfile.showLocation,
    show_rating: masterProfile.showRating,
    show_reviews: masterProfile.showReviews,
    show_portfolio: masterProfile.showPortfolio,
    show_services: masterProfile.showServices,
  });
}

export const handler = withErrorHandler(withAuth(getProfileVisibilityHandler));
