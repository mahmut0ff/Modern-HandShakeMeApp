import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PrismaClient } from '@/shared/db/mock-prisma';
import { createResponse, createErrorResponse } from '@/shared/utils/response';
import { requireAuth } from '@/shared/middleware/auth';
import { S3Service } from '@/shared/services/s3';

const prisma = new PrismaClient();
const s3Service = new S3Service();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await requireAuth()(event);

    // Mock avatar deletion logic
    // In real implementation, this would:
    // 1. Get current avatar URL from database
    // 2. Delete file from S3
    // 3. Update user avatar to null

    // Update user avatar to null
    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: { avatar: null }
    });

    console.log(`Avatar deleted for user ${user.userId}`);

    return createResponse(200, {
      message: 'Avatar deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting avatar:', error);
    
    if (error.name === 'UnauthorizedError') {
      return createErrorResponse(401, 'UNAUTHORIZED', error.message);
    }

    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to delete avatar');
  } finally {
    await prisma.$disconnect();
  }
};