import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PortfolioRepository } from '../shared/repositories/portfolio.repository';
import { UserService } from '../shared/services/user.service';
import { S3Service } from '../shared/services/s3';
import { CacheService } from '../shared/services/cache';
import { verifyToken } from '../shared/services/token';

const portfolioRepository = new PortfolioRepository();
const userService = new UserService();
const s3Service = new S3Service();
const cache = new CacheService();

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

    const itemId = event.pathParameters?.id;
    if (!itemId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Portfolio item ID is required' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    const userId = decoded.userId;

    // Get user information
    const user = await userService.findUserById(userId);
    if (!user) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'User not found' })
      };
    }
    
    if (user.role !== 'MASTER') {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Only masters can delete portfolio items' })
      };
    }

    // Check if portfolio item exists and belongs to the master
    const existingItem = await portfolioRepository.findItemById(itemId, userId);
    if (!existingItem) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Portfolio item not found or access denied' })
      };
    }

    // Delete associated images from S3
    if (existingItem.images && existingItem.images.length > 0) {
      try {
        await Promise.all(
          existingItem.images.map(imageUrl => s3Service.deleteImage(imageUrl))
        );
      } catch (error) {
        console.error('Error deleting images from S3:', error);
        // Continue with deletion even if S3 cleanup fails
      }
    }

    // Delete the portfolio item
    await portfolioRepository.deleteItem(itemId, userId);

    // Invalidate cache
    await cache.invalidatePattern(`portfolio:${userId}*`);
    await cache.invalidatePattern(`master:profile:${userId}*`);

    console.log(`Portfolio item deleted: ${itemId} by master ${userId}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Portfolio item deleted successfully',
        itemId: itemId
      })
    };

  } catch (error) {
    console.error('Error deleting portfolio item:', error);

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid or expired token' })
      };
    }

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to delete portfolio item' })
    };
  }
};