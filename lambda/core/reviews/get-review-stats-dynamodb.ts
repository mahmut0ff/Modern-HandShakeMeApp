import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ReviewRepository } from '../shared/repositories/review.repository';

const reviewRepository = new ReviewRepository();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const masterId = event.pathParameters?.id;
    if (!masterId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Master ID required' })
      };
    }

    // Get all reviews for master
    const reviews = await reviewRepository.findByMaster(masterId);

    // Calculate statistics
    const totalReviews = reviews.length;
    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    };

    let totalRating = 0;

    reviews.forEach(review => {
      const rating = review.rating;
      totalRating += rating;
      ratingDistribution[rating as keyof typeof ratingDistribution]++;
    });

    const averageRating = totalReviews > 0 
      ? (totalRating / totalReviews).toFixed(1) 
      : '0';

    // Get recent reviews (last 5)
    const recentReviews = reviews
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(review => ({
        id: review.reviewId,
        rating: review.rating,
        comment: review.comment,
        client_name: review.clientName,
        created_at: review.createdAt
      }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        total_reviews: totalReviews,
        average_rating: averageRating,
        rating_distribution: ratingDistribution,
        recent_reviews: recentReviews
      })
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
