// Get order files Lambda function

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success, notFound } from '@/shared/utils/response';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { logger } from '@/shared/utils/logger';

async function getOrderFilesHandler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const orderId = event.pathParameters?.id;
  
  if (!orderId) {
    return notFound('Order ID is required');
  }
  
  logger.info('Get order files request', { orderId });
  
  const prisma = getPrismaClient();
  
  // Check if order exists
  const order = await prisma.order.findUnique({
    where: { id: parseInt(orderId) },
  });
  
  if (!order) {
    return notFound('Order not found');
  }
  
  // Get order files
  const files = await prisma.orderFile.findMany({
    where: {
      orderId: parseInt(orderId),
    },
    orderBy: {
      order_num: 'asc',
    },
  });
  
  logger.info('Order files retrieved successfully', { 
    orderId, 
    count: files.length 
  });
  
  // Format response
  const response = files.map(file => ({
    id: file.id,
    file: file.file,
    file_url: file.file_url,
    file_type: file.file_type,
    thumbnail: file.thumbnail,
    order_num: file.order_num,
    created_at: file.createdAt.toISOString(),
  }));
  
  return success(response);
}

export const handler = withErrorHandler(getOrderFilesHandler);
