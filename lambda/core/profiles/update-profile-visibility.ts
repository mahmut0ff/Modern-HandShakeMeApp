// Update profile visibility settings Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success, badRequest, forbidden } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { logger } from '@/shared/utils/logger';
import { z } from 'zod';

const visibilitySchema = z.object({
  is_profile_public: z.boolean().optional(),
  show_phone: z.boolean().optional(),
  show_email: z.boolean().optional(),
  show_location: z.boolean().optional(),
  show_rating: z.boolean().optional(),
  show_reviews: z.boolean().optional(),
  show_portfolio: z.boolean().optional(),
  show_services: z.boolean().optional(),
});

async function updateProfileVisibilityHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  if (event.auth.role !== 'MASTER') {
    return forbidden('Only masters can update profile visibility settings');
  }
  
  logger.info('Update profile visibility request', { userId });
  
  const body = JSON.parse(event.body || '{}');
  
  try {
    const data = visibilitySchema.parse(body);
    
    const prisma = getPrismaClient();
    
    // Get or create master profile
    let masterProfile = await prisma.masterProfile.findUnique({
      where: { userId },
    });
    
    if (!masterProfile) {
      masterProfile = await prisma.masterProfile.create({
        data: { userId },
      });
    }
    
    // Update visibility settings
    const updatedProfile = await prisma.masterProfile.update({
      where: { userId },
      data: {
        isProfilePublic: data.is_profile_public,
        showPhone: data.show_phone,
        showEmail: data.show_email,
        showLocation: data.show_location,
        showRating: data.show_rating,
        showReviews: data.show_reviews,
        showPortfolio: data.show_portfolio,
        showServices: data.show_services,
        updatedAt: new Date(),
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
    
    logger.info('Profile visibility updated successfully', { userId });
    
    return success({
      is_profile_public: updatedProfile.isProfilePublic,
      show_phone: updatedProfile.showPhone,
      show_email: updatedProfile.showEmail,
      show_location: updatedProfile.showLocation,
      show_rating: updatedProfile.showRating,
      show_reviews: updatedProfile.showReviews,
      show_portfolio: updatedProfile.showPortfolio,
      show_services: updatedProfile.showServices,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest(error.errors[0].message);
    }
    throw error;
  }
}

export const handler = withErrorHandler(withAuth(updateProfileVisibilityHandler));
