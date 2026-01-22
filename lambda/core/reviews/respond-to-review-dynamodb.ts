import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { ReviewRepository } from '../shared/repositories/review.repository';
import { verifyToken } from '../shared/services/token';

const respondSchema = z.object({
  response: z.string().min(10).max(1000),
});

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const token = event.headers.Authorization?.replace('Bearer ', '');
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const decoded = verifyToken(token);
    const reviewId = event.pathParameters?.id;

    if (!reviewId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Review ID required' }) };
    }

    const reviewRepo = new ReviewRepository();
    const review = await reviewRepo.findById(decoded.userId, reviewId);

    if (!review) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Review not found' }) };
    }

    const body = JSON.parse(event.body || '{}');
    const { response } = respondSchema.parse(body);

    const updated = await reviewRepo.update(decoded.userId, reviewId, {
      response,
      respondedAt: new Date().toISOString(),
    });

    return {
      statusCode: 200,
      body: JSON.stringify(updated),
    };
  } catch (error: any) {
    console.error('Respond to review error:', error);
    return {
      statusCode: error.name === 'ZodError' ? 400 : 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
