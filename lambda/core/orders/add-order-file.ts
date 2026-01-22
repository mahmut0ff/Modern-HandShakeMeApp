// Add order file Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { S3Service } from '@/shared/services/s3';
import { success, notFound, badRequest, forbidden } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { logger } from '@/shared/utils/logger';

const s3Service = new S3Service();

async function addOrderFileHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const orderId = event.pathParameters?.id;
  
  if (!orderId) {
    return notFound('Order ID is required');
  }
  
  logger.info('Add order file request', { userId, orderId });
  
  const prisma = getPrismaClient();
  
  // Get order and verify ownership
  const order = await prisma.order.findUnique({
    where: { id: parseInt(orderId) },
    include: {
      client: {
        select: {
          userId: true,
        },
      },
    },
  });
  
  if (!order) {
    return notFound('Order not found');
  }
  
  if (order.client.userId !== userId) {
    return forbidden('You can only add files to your own orders');
  }
  
  try {
    // Parse multipart form data
    const contentType = event.headers['content-type'] || event.headers['Content-Type'];
    
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return badRequest('Content-Type must be multipart/form-data');
    }
    
    // Extract file from body
    const body = event.isBase64Encoded 
      ? Buffer.from(event.body || '', 'base64')
      : event.body;
    
    if (!body) {
      return badRequest('No file provided');
    }
    
    // Determine file type
    const fileType = contentType.includes('image') ? 'photo' : 
                     contentType.includes('video') ? 'video' : 'document';
    
    // Upload to S3
    const fileName = `orders/${orderId}/${Date.now()}.${fileType === 'photo' ? 'jpg' : 'mp4'}`;
    const fileUrl = await s3Service.uploadFile(fileName, body, contentType);
    
    // Get next order number
    const maxOrderNum = await prisma.orderFile.findFirst({
      where: { orderId: parseInt(orderId) },
      orderBy: { order_num: 'desc' },
      select: { order_num: true },
    });
    
    const nextOrderNum = (maxOrderNum?.order_num || 0) + 1;
    
    // Create file record
    const file = await prisma.orderFile.create({
      data: {
        orderId: parseInt(orderId),
        file: fileName,
        file_url: fileUrl,
        file_type: fileType,
        order_num: nextOrderNum,
      },
    });
    
    logger.info('Order file added successfully', { userId, orderId, fileId: file.id });
    
    return success({
      id: file.id,
      file: file.file,
      file_url: file.file_url,
      file_type: file.file_type,
      thumbnail: file.thumbnail,
      order_num: file.order_num,
      created_at: file.createdAt.toISOString(),
    }, 201);
  } catch (error) {
    logger.error('Order file upload failed', { userId, orderId, error });
    return badRequest('Failed to upload file');
  }
}

export const handler = withErrorHandler(withAuth(addOrderFileHandler));
