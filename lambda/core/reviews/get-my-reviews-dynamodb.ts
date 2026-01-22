import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ReviewRepository } from '../shared/repositories/review.repository';
import { verifyToken } from '../shared/services/token';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const token = event.headers.Authorization?.replace('Bearer ', '');
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const decoded = verifyToken(token);
    const reviewRepo = new ReviewRepository();
    const reviews = await reviewRepo.findByMaster(decoded.userId);

    return {
      statusCode: 200,
      body: JSON.stringify(reviews),
    };
  } catch (error: any) {
    console.error('Get my reviews error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
