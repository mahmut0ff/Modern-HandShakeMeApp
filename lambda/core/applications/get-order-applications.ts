import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PrismaClient } from '@/shared/db/mock-prisma';
import { createResponse, createErrorResponse } from '@/shared/utils/response';
import { requireAuth } from '@/shared/middleware/auth';
import { CacheService } from '@/shared/services/cache';

const prisma = new PrismaClient();
const cache = new CacheService();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await requireAuth()(event);
    const orderId = event.pathParameters?.id;
    
    if (!orderId) {
      return createErrorResponse(400, 'VALIDATION_ERROR', 'Order ID is required');
    }

    // Check cache first
    const cacheKey = `order:${orderId}:applications`;
    const cachedApplications = await cache.get(cacheKey);
    
    if (cachedApplications) {
      return createResponse(200, cachedApplications);
    }

    // Check if order exists and user is the client
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return createErrorResponse(404, 'NOT_FOUND', 'Order not found');
    }

    // Mock applications for the order
    const mockApplications = [
      {
        id: 1,
        order: parseInt(orderId),
        order_title: 'Test Order',
        order_budget_display: '1000-2000 KGS',
        master: {
          id: 1,
          name: 'Test Master',
          avatar: 'https://mock-cdn.example.com/avatars/master1.jpg',
          rating: '4.5',
          phone: '+996555123456'
        },
        client: {
          id: 1,
          name: 'Test Client',
          avatar: 'https://mock-cdn.example.com/avatars/client1.jpg',
          rating: '4.0',
          phone: '+996555654321'
        },
        proposed_price: '1500',
        message: 'I can complete this project with high quality',
        estimated_duration: '5 days',
        start_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        status_display: 'Pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // Cache for 5 minutes
    await cache.set(cacheKey, mockApplications, 300);

    return createResponse(200, mockApplications);

  } catch (error) {
    console.error('Error getting order applications:', error);
    
    if (error.name === 'UnauthorizedError') {
      return createErrorResponse(401, 'UNAUTHORIZED', error.message);
    }

    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to get order applications');
  } finally {
    await prisma.$disconnect();
  }
};