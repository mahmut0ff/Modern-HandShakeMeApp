import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { success, error, forbidden, notFound, badRequest, unauthorized } from '../shared/utils/response';
import { ReviewRepository } from '../shared/repositories/review.repository';
import { ProjectRepository } from '../shared/repositories/project.repository';
import { MasterProfileRepository } from '../shared/repositories/master-profile.repository';
import { getCacheInvalidator } from '../shared/utils/cache-invalidation';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const createReviewSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  orderId: z.string().min(1, 'Order ID is required'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().min(10, 'Comment must be at least 10 characters').max(1000, 'Comment must be at most 1000 characters').trim(),
  isAnonymous: z.boolean().optional().default(false),
  tags: z.array(z.string().max(50)).max(10, 'Maximum 10 tags allowed').optional().default([]),
  images: z.array(z.string().url('Invalid image URL')).max(5, 'Maximum 5 images allowed').optional().default([]),
});

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Get token from header
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
      return unauthorized('Authorization header required');
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return unauthorized('Invalid or expired token');
    }

    if (decoded.role !== 'CLIENT') {
      return forbidden('Only clients can create reviews');
    }

    const body = JSON.parse(event.body || '{}');
    const data = createReviewSchema.parse(body);

    const projectRepo = new ProjectRepository();
    const reviewRepo = new ReviewRepository();
    const masterProfileRepo = new MasterProfileRepository();

    // Check rate limiting - max 5 reviews per hour per client
    const recentReviewsResult = await reviewRepo.findByClient(decoded.userId, { limit: 50 });
    const recentReviews = recentReviewsResult.items;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recentReviewsCount = recentReviews.filter(r => r.createdAt > oneHourAgo).length;
    
    if (recentReviewsCount >= 5) {
      return error('Rate limit exceeded. Maximum 5 reviews per hour', 429);
    }

    // Check if project exists
    const project = await projectRepo.findById(data.projectId);

    if (!project) {
      return notFound('Project not found');
    }

    if (project.clientId !== decoded.userId) {
      return forbidden('Only the project client can create a review');
    }

    if (project.status !== 'COMPLETED') {
      return badRequest('Project must be completed before creating a review');
    }

    // Check if review already exists for this order
    const existingReview = await reviewRepo.findByOrder(data.orderId);
    if (existingReview) {
      return badRequest('Review already exists for this order');
    }

    // Create review
    const review = await reviewRepo.create({
      ...data,
      masterId: project.masterId,
      clientId: decoded.userId,
      isVerified: true, // Verified because it's from a completed project
    });

    // Recalculate master rating
    const masterReviewsResult = await reviewRepo.findByMaster(project.masterId, { limit: 1000 });
    const masterReviews = masterReviewsResult.items;
    const avgRating = masterReviews.reduce((sum, r) => sum + r.rating, 0) / masterReviews.length;
    
    await masterProfileRepo.updateRating(project.masterId, avgRating, masterReviews.length);

    // Invalidate cache
    const cacheInvalidator = getCacheInvalidator();
    await cacheInvalidator.invalidateReviewCache(project.masterId);

    console.log(`Review created successfully: ${review.id} for master: ${project.masterId}`);

    return success(review, 201);
    
  } catch (err) {
    console.error('Create review error:', err);
    
    if (err instanceof z.ZodError) {
      return error('Validation error: ' + err.errors[0].message, 400);
    }
    
    return error('Failed to create review', 500);
  }
}
