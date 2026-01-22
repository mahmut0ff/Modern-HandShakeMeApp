import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { ReviewRepository } from '../shared/repositories/review.repository';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const reviewRepository = new ReviewRepository();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Authorization required' })
      };
    }

    const reviewId = event.pathParameters?.id;
    if (!reviewId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Review ID required' })
      };
    }

    const body = JSON.parse(event.body || '{}');

    const updatedReview = await reviewRepository.update(reviewId, {
      rating: body.rating,
      comment: body.comment,
      isAnonymous: body.is_anonymous
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedReview)
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
