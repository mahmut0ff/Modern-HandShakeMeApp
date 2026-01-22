// Report a review

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { getPrismaClient } from '@/shared/db/client';
import { success, notFound } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { validate } from '@/shared/utils/validation';
import { logger } from '@/shared/utils/logger';

const reportSchema = z.object({
  reason: z.enum(['SPAM', 'INAPPROPRIATE', 'FAKE', 'OTHER']),
  description: z.string().max(1000).optional(),
});

async function reportReviewHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const reviewId = event.pathParameters?.id;
  
  if (!reviewId) {
    return notFound('Review ID is required');
  }
  
  logger.info('Report review request', { userId, reviewId });
  
  const body = JSON.parse(event.body || '{}');
  const data = validate(reportSchema, body);
  
  const prisma = getPrismaClient();
  
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });
  
  if (!review) {
    return notFound('Review not found');
  }
  
  // Create report
  await prisma.reviewReport.create({
    data: {
      reviewId,
      reporterId: userId,
      reason: data.reason,
      description: data.description,
    },
  });
  
  return success({ message: 'Review reported successfully' }, { statusCode: 201 });
}

export const handler = withErrorHandler(withRequestTransform(withAuth(reportReviewHandler)));
