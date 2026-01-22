import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ReviewRepository } from '../shared/repositories/review.repository';
import { formatPaginatedResponse } from '../shared/utils/response-formatter';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const masterId = event.pathParameters?.masterId;

    if (!masterId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Master ID required' }) };
    }

    const reviewRepo = new ReviewRepository();
    const reviews = await reviewRepo.findByMaster(masterId);

    // Filter only visible reviews
    const visibleReviews = reviews.filter(r => r.isVisible);

    return {
      statusCode: 200,
      body: JSON.stringify(visibleReviews),
    };
  } catch (error: any) {
    console.error('List reviews error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
