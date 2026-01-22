import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { success, badRequest, notFound, forbidden } from '../shared/utils/response';
import { withAuth } from '../shared/middleware/auth';
import { withRequestTransform } from '../shared/middleware/requestTransform';
import { getPrismaClient } from '../shared/utils/prisma';
import { CacheService } from '../shared/services/cache';
import { S3Service } from '../shared/services/s3';

const cache = new CacheService();
const s3Service = new S3Service();

async function deletePortfolioItemHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const prisma = getPrismaClient();
  
  try {
    const user = (event as any).user;
    
    if (user.role !== 'MASTER') {
      return forbidden('Only masters can delete portfolio items');
    }

    const itemId = event.pathParameters?.id;
    if (!itemId) {
      return badRequest('Portfolio item ID is required');
    }

    // Check if portfolio item exists and belongs to the master
    const existingItem = await prisma.portfolioItem.findFirst({
      where: {
        id: itemId,
        masterId: user.userId
      }
    });

    if (!existingItem) {
      return notFound('Portfolio item not found or access denied');
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
    await prisma.portfolioItem.delete({
      where: { id: itemId }
    });

    // Invalidate cache
    await cache.invalidatePattern(`portfolio:${user.userId}*`);
    await cache.invalidatePattern(`master:profile:${user.userId}*`);

    console.log(`Portfolio item deleted: ${itemId} by master ${user.userId}`);

    return success({
      message: 'Portfolio item deleted successfully',
      itemId: itemId
    });

  } catch (error) {
    console.error('Error deleting portfolio item:', error);

    return badRequest('Failed to delete portfolio item');
  }
}

export const handler = withRequestTransform(withAuth(deletePortfolioItemHandler));
