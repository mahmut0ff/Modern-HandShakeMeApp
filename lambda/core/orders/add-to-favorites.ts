// Add order to favorites Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success, notFound, conflict } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { logger } from '@/shared/utils/logger';

async function addToFavoritesHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const orderId = event.pathParameters?.id;
  
  if (!orderId) {
    return notFound('Order ID is required');
  }
  
  logger.info('Add to favorites request', { userId, orderId });
  
  const prisma = getPrismaClient();
  
  // Check if order exists
  const order = await prisma.order.findUnique({
    where: { id: parseInt(orderId) },
  });
  
  if (!order) {
    return notFound('Order not found');
  }
  
  // Check if already favorited
  const existingFavorite = await prisma.favoriteOrder.findUnique({
    where: {
      userId_orderId: {
        userId,
        orderId: parseInt(orderId),
      },
    },
  });
  
  if (existingFavorite) {
    return conflict('Order already in favorites');
  }
  
  // Add to favorites
  await prisma.favoriteOrder.create({
    data: {
      userId,
      orderId: parseInt(orderId),
    },
  });
  
  logger.info('Order added to favorites', { userId, orderId });
  
  return success({
    message: 'Order added to favorites',
  });
}

export const handler = withErrorHandler(withAuth(addToFavoritesHandler));
