import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { success, badRequest, notFound, forbidden } from '../shared/utils/response';
import { withAuth } from '../shared/middleware/auth';
import { withRequestTransform } from '../shared/middleware/requestTransform';
import { getPrismaClient } from '../shared/utils/prisma';
import { CacheService } from '../shared/services/cache';
import { S3Service } from '../shared/services/s3';

const cache = new CacheService();
const s3Service = new S3Service();

// Validation schema for updates
const updatePortfolioItemSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(1000).optional(),
  images: z.array(z.string().url()).min(1).max(10).optional(),
  skills: z.array(z.string().min(1).max(50)).max(20).optional(),
  cost: z.number().positive().optional(),
  durationDays: z.number().positive().optional(),
  categoryId: z.string().uuid().optional(),
  clientReview: z.string().max(500).optional(),
  clientRating: z.number().min(1).max(5).optional(),
  isPublic: z.boolean().optional()
});

async function updatePortfolioItemHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const prisma = getPrismaClient();
  
  try {
    const user = (event as any).user;
    
    if (user.role !== 'MASTER') {
      return forbidden('Only masters can update portfolio items');
    }

    const itemId = event.pathParameters?.id;
    if (!itemId) {
      return badRequest('Portfolio item ID is required');
    }

    const body = JSON.parse(event.body || '{}');
    const validatedData = updatePortfolioItemSchema.parse(body);

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

    // Validate category if provided
    if (validatedData.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: validatedData.categoryId }
      });

      if (!category) {
        return badRequest('Category not found');
      }
    }

    // Validate client rating consistency
    if (validatedData.clientRating && !validatedData.clientReview && !existingItem.clientReview) {
      return badRequest('Client review is required when rating is provided');
    }

    // Process and validate images if provided
    let processedImages: string[] | undefined;
    if (validatedData.images) {
      processedImages = [];
      for (const imageUrl of validatedData.images) {
        const isValidImage = await s3Service.validateImageUrl(imageUrl);
        if (!isValidImage) {
          return badRequest(`Invalid image URL: ${imageUrl}`);
        }
        processedImages.push(imageUrl);
      }
    }

    // Update the portfolio item
    const updatedItem = await prisma.portfolioItem.update({
      where: { id: itemId },
      data: {
        ...(validatedData.title && { title: validatedData.title }),
        ...(validatedData.description && { description: validatedData.description }),
        ...(processedImages && { images: processedImages }),
        ...(validatedData.skills && { skills: validatedData.skills }),
        ...(validatedData.cost !== undefined && { cost: validatedData.cost }),
        ...(validatedData.durationDays !== undefined && { durationDays: validatedData.durationDays }),
        ...(validatedData.categoryId && { categoryId: validatedData.categoryId }),
        ...(validatedData.clientReview !== undefined && { clientReview: validatedData.clientReview }),
        ...(validatedData.clientRating !== undefined && { clientRating: validatedData.clientRating }),
        ...(validatedData.isPublic !== undefined && { isPublic: validatedData.isPublic })
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Invalidate cache
    await cache.invalidatePattern(`portfolio:${user.userId}*`);
    await cache.invalidatePattern(`master:profile:${user.userId}*`);

    console.log(`Portfolio item updated: ${itemId} by master ${user.userId}`);

    return success({
      id: updatedItem.id,
      title: updatedItem.title,
      description: updatedItem.description,
      images: updatedItem.images,
      skills: updatedItem.skills,
      cost: updatedItem.cost ? Number(updatedItem.cost) : null,
      durationDays: updatedItem.durationDays,
      clientReview: updatedItem.clientReview,
      clientRating: updatedItem.clientRating,
      category: updatedItem.category,
      isPublic: updatedItem.isPublic,
      viewsCount: updatedItem.viewsCount,
      createdAt: updatedItem.createdAt,
      updatedAt: updatedItem.updatedAt
    });

  } catch (error) {
    console.error('Error updating portfolio item:', error);
    
    if (error instanceof z.ZodError) {
      return badRequest(error.errors[0].message);
    }

    return badRequest('Failed to update portfolio item');
  }
}

export const handler = withRequestTransform(withAuth(updatePortfolioItemHandler));
