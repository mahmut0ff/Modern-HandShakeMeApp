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
    const applicationId = event.pathParameters?.id;
    
    if (!applicationId) {
      return createErrorResponse(400, 'VALIDATION_ERROR', 'Application ID is required');
    }

    // Check cache first
    const cacheKey = `application:${applicationId}`;
    const cachedApplication = await cache.get(cacheKey);
    
    if (cachedApplication) {
      return createResponse(200, cachedApplication);
    }

    // Mock application details
    const mockApplication = {
      id: parseInt(applicationId),
      order: 1,
      order_title: 'Kitchen Renovation Project',
      order_budget_display: '50000-80000 KGS',
      master: {
        id: 1,
        name: 'Expert Master',
        avatar: 'https://mock-cdn.example.com/avatars/master1.jpg',
        rating: '4.8',
        phone: '+996555123456'
      },
      client: {
        id: 2,
        name: 'John Doe',
        avatar: 'https://mock-cdn.example.com/avatars/client2.jpg',
        rating: '4.2',
        phone: '+996555654321'
      },
      proposed_price: '65000',
      message: 'I have extensive experience in kitchen renovations with modern designs. I can provide high-quality materials and complete the project within the specified timeframe. My portfolio includes 50+ successful kitchen projects.',
      estimated_duration: '14 days',
      start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      status_display: 'Pending Review',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      // Additional details
      cover_letter: 'I am very interested in this project and believe I can deliver exceptional results.',
      portfolio_items: [
        {
          id: 1,
          title: 'Modern Kitchen Design',
          image_url: 'https://mock-cdn.example.com/portfolio/kitchen1.jpg'
        },
        {
          id: 2,
          title: 'Classic Kitchen Renovation',
          image_url: 'https://mock-cdn.example.com/portfolio/kitchen2.jpg'
        }
      ],
      master_stats: {
        completed_projects: 127,
        success_rate: '98%',
        avg_response_time: '2 hours',
        repeat_clients: 45
      }
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, mockApplication, 300);

    return createResponse(200, mockApplication);

  } catch (error) {
    console.error('Error getting application:', error);
    
    if (error.name === 'UnauthorizedError') {
      return createErrorResponse(401, 'UNAUTHORIZED', error.message);
    }

    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to get application');
  } finally {
    await prisma.$disconnect();
  }
};