import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { OrderRepository } from '../shared/repositories/order.repository';
import { OrderFileRepository } from '../shared/repositories/order-file.repository';
import { S3Service } from '../shared/services/s3';
import { CacheService } from '../shared/services/cache';
import { verifyToken } from '../shared/services/token';

const orderRepository = new OrderRepository();
const orderFileRepository = new OrderFileRepository();
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

    const fileId = event.pathParameters?.id;
    const orderId = event.pathParameters?.orderId;
    
    if (!fileId || !orderId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'File ID and Order ID are required' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    const userId = decoded.userId;

    // Verify order exists and user owns it
    const order = await orderRepository.findById(orderId);
    if (!order) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Order not found' })
      };
    }

    if (order.clientId !== userId) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'You can only delete files from your own orders' })
      };
    }

    // Find file record
    const file = await orderFileRepository.findById(fileId, orderId);
    if (!file) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'File not found' })
      };
    }

    // Delete file from S3
    try {
      await s3Service.deleteFile(file.fileName);
      
      // Delete thumbnail if exists
      if (file.thumbnail) {
        await s3Service.deleteFile(file.thumbnail);
      }
    } catch (s3Error) {
      console.error('S3 deletion error:', s3Error);
      // Continue with database deletion even if S3 fails
    }

    // Delete database record
    await orderFileRepository.delete(fileId, orderId);

    // Invalidate cache
    await cache.invalidatePattern(`order:${orderId}:files*`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'File deleted successfully'
      })
    };
  } catch (error) {
    console.error('Error deleting order file:', error);
    
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
      body: JSON.stringify({ error: 'Failed to delete order file' })
    };
  }
};