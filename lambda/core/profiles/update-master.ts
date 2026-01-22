// Update master profile Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { getPrismaClient } from '@/shared/db/client';
import { success, forbidden, notFound, badRequest } from '@/shared/utils/response';
import { validateSafe } from '@/shared/utils/validation';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

const updateMasterSchema = z.object({
  companyName: z.string().min(2).max(200).optional(),
  bio: z.string().max(2000).optional(),
  city: z.string().max(100).optional(),
  categoryId: z.number().int().positive().optional()
});

async function updateMasterHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  if (event.auth.role !== 'MASTER') {
    return forbidden('Only masters can update master profile');
  }
  
  logger.info('Update master profile', { userId });
  
  const body = JSON.parse(event.body || '{}');
  const result = validateSafe(updateMasterSchema, body);
  
  if (!result.success) {
    return badRequest('Invalid request data');
  }
  
  const data = result.data;
  
  const prisma = getPrismaClient();
  
  // Get master profile
  const masterProfile = await prisma.masterProfile.findUnique({
    where: { userId },
  });
  
  if (!masterProfile) {
    return notFound('Master profile not found');
  }
  
  // Check if category exists (if being updated)
  if (data.categoryId) {
    const category = await prisma.serviceCategory.findUnique({
      where: { id: data.categoryId }
    });
    
    if (!category) {
      return notFound('Category not found');
    }
  }
  
  // Update profile
  const updated = await prisma.masterProfile.update({
    where: { id: masterProfile.id },
    data: {
      ...(data.companyName && { companyName: data.companyName }),
      ...(data.bio !== undefined && { bio: data.bio }),
      ...(data.city && { city: data.city }),
      ...(data.categoryId && { categoryId: data.categoryId })
    },
    include: {
      category: {
        select: {
          id: true,
          name: true
        }
      },
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true
        }
      }
    },
  });
  
  logger.info('Master profile updated', { userId, profileId: masterProfile.id });
  
  // Format response
  const response = {
    id: updated.id,
    userId: updated.userId,
    user: {
      id: updated.user.id,
      firstName: updated.user.firstName,
      lastName: updated.user.lastName,
      avatar: updated.user.avatar
    },
    companyName: updated.companyName,
    bio: updated.bio,
    city: updated.city,
    rating: updated.rating?.toString(),
    reviewsCount: updated.reviewsCount,
    completedProjectsCount: updated.completedProjectsCount,
    categoryId: updated.categoryId,
    categoryName: updated.category?.name,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt
  };
  
  return success(response);
}

export const handler = withErrorHandler(withRequestTransform(withAuth(updateMasterHandler)));
