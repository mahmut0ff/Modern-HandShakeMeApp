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
    const projectId = event.pathParameters?.id;
    
    if (!projectId) {
      return createErrorResponse(400, 'VALIDATION_ERROR', 'Project ID is required');
    }

    // Check cache first
    const cacheKey = `project:${projectId}:files`;
    const cachedFiles = await cache.get(cacheKey);
    
    if (cachedFiles) {
      return createResponse(200, cachedFiles);
    }

    // Mock project files
    const mockFiles = [
      {
        id: 1,
        file: 'progress-photo-1.jpg',
        file_url: `https://mock-cdn.example.com/projects/${projectId}/progress-photo-1.jpg`,
        file_type: 'photo',
        thumbnail: `https://mock-cdn.example.com/projects/${projectId}/progress-photo-1-thumb.jpg`,
        description: 'Initial demolition complete',
        uploaded_by: 'master',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        file: 'materials-receipt.pdf',
        file_url: `https://mock-cdn.example.com/projects/${projectId}/materials-receipt.pdf`,
        file_type: 'document',
        description: 'Materials purchase receipt',
        uploaded_by: 'master',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 3,
        file: 'client-requirements.jpg',
        file_url: `https://mock-cdn.example.com/projects/${projectId}/client-requirements.jpg`,
        file_type: 'photo',
        thumbnail: `https://mock-cdn.example.com/projects/${projectId}/client-requirements-thumb.jpg`,
        description: 'Client specific requirements photo',
        uploaded_by: 'client',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Cache for 10 minutes
    await cache.set(cacheKey, mockFiles, 600);

    return createResponse(200, mockFiles);

  } catch (error) {
    console.error('Error getting project files:', error);
    
    if (error.name === 'UnauthorizedError') {
      return createErrorResponse(401, 'UNAUTHORIZED', error.message);
    }

    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to get project files');
  } finally {
    await prisma.$disconnect();
  }
};