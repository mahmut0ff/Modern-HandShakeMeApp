// Remove order from favorites Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success, notFound } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { logger } from '@/shared/utils/logger';

async function removeFromFavoritesHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const orderId = event.pathParameters?.id;
  
  if (!orderId) {
    return notFound('Order ID is required');
  }
  
  logger.info('Remove from favorites request', { userId, orderId });
  
  const prisma = getPrismaClient();
  
  // Check if favorite exists
  const favorite = await prisma.favoriteOrder.findUnique({
    where: {
      userId_orderId: {
        userId,
        orderId: parseInt(orderId),
      },
    },
  });
  
  if (!favorite) {
    return notFound('Order not in favorites');
  }
  
  // Remove from favorites
  await prisma.favoriteOrder.delete({
    where: {
      userId_orderId: {
        userId,
        orderId: parseInt(orderId),
      },
    },
  });
  
  logger.info('Order removed from favorites', { userId, orderId });
  
  return success({
    message: 'Order removed from favorites',
  });
}

export const handler = withErrorHandler(withAuth(removeFromFavoritesHandler));
