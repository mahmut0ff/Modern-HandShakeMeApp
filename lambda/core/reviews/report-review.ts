import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { success, error, notFound, badRequest, unauthorized } from '../shared/utils/response';
import { ReviewRepository } from '../shared/repositories/review.repository';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const reportSchema = z.object({
  reason: z.enum(['SPAM', 'INAPPROPRIATE', 'FAKE', 'OFFENSIVE', 'OTHER']),
  description: z.string().max(1000).optional(),
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

    const reviewId = event.pathParameters?.id;
    
    if (!reviewId) {
      return badRequest('Review ID is required');
    }
    
    const body = JSON.parse(event.body || '{}');
    const data = reportSchema.parse(body);
    
    const reviewRepo = new ReviewRepository();
    
    // Check if user already reported this review
    const existingReports = await reviewRepo.getReportsByReporter(decoded.userId);
    const alreadyReported = existingReports.some(r => r.reviewId === reviewId);
    
    if (alreadyReported) {
      return badRequest('You have already reported this review');
    }
    
    // Get masterId from path parameters
    
    // Get masterId from path parameters
    const masterId = event.pathParameters?.masterId;
    
    if (!masterId) {
      return badRequest('Master ID is required');
    }
    
    const review = await reviewRepo.findById(masterId, reviewId);
    
    if (!review) {
      return notFound('Review not found');
    }
    
    // Create report
    await reviewRepo.reportReview(reviewId, decoded.userId, data.reason, data.description);
    
    console.log(`Review reported: ${reviewId} by user: ${decoded.userId}`);
    
    return success({ message: 'Review reported successfully' }, 201);
    
  } catch (err) {
    console.error('Report review error:', err);
    
    if (err instanceof z.ZodError) {
      return error('Validation error: ' + err.errors[0].message, 400);
    }
    
    return error('Failed to report review', 500);
  }
}
