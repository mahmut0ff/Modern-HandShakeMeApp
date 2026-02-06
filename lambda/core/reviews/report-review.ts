import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { success, notFound, badRequest } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler, ValidationError } from '../shared/middleware/errorHandler';
import { ReviewRepository } from '../shared/repositories/review.repository';
import { logger } from '../shared/utils/logger';

const reportSchema = z.object({
  reason: z.enum(['SPAM', 'INAPPROPRIATE', 'FAKE', 'OFFENSIVE', 'OTHER']),
  description: z.string().max(1000).optional(),
});

async function reportReviewHandler(event: AuthenticatedEvent): Promise<APIGatewayProxyResult> {
  const { userId } = event.auth;
  const reviewId = event.pathParameters?.id;
  const masterId = event.pathParameters?.masterId;
  
  if (!reviewId) {
    return badRequest('Review ID is required');
  }
  
  if (!masterId) {
    return badRequest('Master ID is required');
  }
  
  logger.info('Report review request', { userId, reviewId, masterId });
  
  const body = JSON.parse(event.body || '{}');
  const validationResult = reportSchema.safeParse(body);
  
  if (!validationResult.success) {
    throw new ValidationError('Validation failed', validationResult.error.errors);
  }
  
  const data = validationResult.data;
  
  const reviewRepo = new ReviewRepository();
  
  const existingReports = await reviewRepo.getReportsByReporter(userId);
  const alreadyReported = existingReports.some(r => r.reviewId === reviewId);
  
  if (alreadyReported) {
    return badRequest('You have already reported this review');
  }
  
  const review = await reviewRepo.findById(masterId, reviewId);
  
  if (!review) {
    return notFound('Review not found');
  }
  
  await reviewRepo.reportReview(reviewId, userId, data.reason, data.description);
  
  logger.info('Review reported', { userId, reviewId });
  
  return success({ message: 'Review reported successfully' }, 201);
}

export const handler = withErrorHandler(withAuth(reportReviewHandler));
