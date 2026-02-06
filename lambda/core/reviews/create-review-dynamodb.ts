import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { success, error, forbidden, notFound, badRequest } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler, ValidationError } from '../shared/middleware/errorHandler';
import { ReviewRepository } from '../shared/repositories/review.repository';
import { ProjectRepository } from '../shared/repositories/project.repository';
import { MasterProfileRepository } from '../shared/repositories/master-profile.repository';
import { getCacheInvalidator } from '../shared/utils/cache-invalidation';
import { logger } from '../shared/utils/logger';

const createReviewSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  orderId: z.string().min(1, 'Order ID is required'),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(1000).trim(),
  isAnonymous: z.boolean().optional().default(false),
  tags: z.array(z.string().max(50)).max(10).optional().default([]),
  images: z.array(z.string().url()).max(5).optional().default([]),
});

async function createReviewHandler(event: AuthenticatedEvent): Promise<APIGatewayProxyResult> {
  const { userId, role } = event.auth;

  if (role !== 'CLIENT') {
    return forbidden('Only clients can create reviews');
  }

  logger.info('Create review request', { userId });

  const body = JSON.parse(event.body || '{}');
  const validationResult = createReviewSchema.safeParse(body);
  
  if (!validationResult.success) {
    throw new ValidationError('Validation failed', validationResult.error.errors);
  }
  
  const data = validationResult.data;

  const projectRepo = new ProjectRepository();
  const reviewRepo = new ReviewRepository();
  const masterProfileRepo = new MasterProfileRepository();

  // Rate limiting - max 5 reviews per hour
  const recentReviewsResult = await reviewRepo.findByClient(userId, { limit: 50 });
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const recentReviewsCount = recentReviewsResult.items.filter(r => r.createdAt > oneHourAgo).length;
  
  if (recentReviewsCount >= 5) {
    return error('Rate limit exceeded. Maximum 5 reviews per hour', 429);
  }

  const project = await projectRepo.findById(data.projectId);
  if (!project) {
    return notFound('Project not found');
  }

  if (project.clientId !== userId) {
    return forbidden('Only the project client can create a review');
  }

  if (project.status !== 'COMPLETED') {
    return badRequest('Project must be completed before creating a review');
  }

  const existingReview = await reviewRepo.findByOrder(data.orderId);
  if (existingReview) {
    return badRequest('Review already exists for this order');
  }

  const review = await reviewRepo.create({
    ...data,
    masterId: project.masterId,
    clientId: userId,
    isVerified: true,
  });

  // Recalculate master rating
  const masterReviewsResult = await reviewRepo.findByMaster(project.masterId, { limit: 1000 });
  const masterReviews = masterReviewsResult.items;
  const avgRating = masterReviews.reduce((sum, r) => sum + r.rating, 0) / masterReviews.length;
  
  await masterProfileRepo.updateRating(project.masterId, avgRating, masterReviews.length);

  const cacheInvalidator = getCacheInvalidator();
  await cacheInvalidator.invalidateReviewCache(project.masterId);

  logger.info('Review created', { userId, reviewId: review.id, masterId: project.masterId });

  return success(review, 201);
}

export const handler = withErrorHandler(withAuth(createReviewHandler, { roles: ['CLIENT'] }));
