import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { success, badRequest, forbidden, conflict } from '../shared/utils/response';
import { withAuth } from '../shared/middleware/auth';
import { withRequestTransform } from '../shared/middleware/requestTransform';
import { getPrismaClient } from '../shared/utils/prisma';
import { CacheService } from '../shared/services/cache';
import { S3Service } from '../shared/services/s3';

const cache = new CacheService();
const s3Service = new S3Service();

// Validation schema
const createPortfolioItemSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description too long'),
  images: z.array(z.string().url('Invalid image URL')).min(1, 'At least one image is required').max(10, 'Maximum 10 images allowed'),
  skills: z.array(z.string().min(1).max(50)).max(20, 'Maximum 20 skills allowed'),
  cost: z.number().positive('Cost must be positive').optional(),
  durationDays: z.number().positive('Duration must be positive').optional(),
  categoryId: z.string().uuid('Invalid category ID').optional(),
  clientReview: z.string().max(500, 'Client review too long').optional(),
  clientRating: z.number().min(1).max(5).optional(),
  isPublic: z.boolean().default(true)
});

async function createPortfolioItemHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const prisma = getPrismaClient();
  
  try {
    const user = (event as any).user;
    
    // Validate user is a master
    if (user.role !== 'MASTER') {
      return forbidden('Only masters can create portfolio items');
    }

    // Parse and validate request body
    const body = JSON.parse(event.body || '{}');
    const validatedData = createPortfolioItemSchema.parse(body);

    // Check portfolio item limit (e.g., max 50 items per master)
    const existingItemsCount = await prisma.portfolioItem.count({
      where: { masterId: user.userId }
    });

    if (existingItemsCount >= 50) {
      return conflict('Maximum portfolio items limit reached (50)');
    }

    // Validate category if provided
    if (validatedData.categoryId) {
      const category = await prisma.serviceCategory.findUnique({
        where: { id: validatedData.categoryId }
      });

      if (!category) {
        return badRequest('Service category not found');
      }
    }

    // Validate client rating consistency
    if (validatedData.clientRating && !validatedData.clientReview) {
      return badRequest('Client review is required when rating is provided');
    }

    // Process and validate images
    const processedImages: string[] = [];
    for (const imageUrl of validatedData.images) {
      try {
        // Validate image URL is accessible and is an image
        const isValidImage = await s3Service.validateImageUrl(imageUrl);
        if (!isValidImage) {
          return badRequest(`Invalid image URL: ${imageUrl}`);
        }
        processedImages.push(imageUrl);
      } catch (error) {
        console.error(`Error validating image ${imageUrl}:`, error);
        return badRequest(`Failed to validate image: ${imageUrl}`);
      }
    }

    // Create the portfolio item
    const portfolioItem = await prisma.portfolioItem.create({
      data: {
        masterId: user.userId,
        title: validatedData.title,
        description: validatedData.description,
        images: processedImages,
        skills: validatedData.skills,
        cost: validatedData.cost,
        durationDays: validatedData.durationDays,
        categoryId: validatedData.categoryId,
        clientReview: validatedData.clientReview,
        clientRating: validatedData.clientRating,
        isPublic: validatedData.isPublic,
        viewsCount: 0
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

    // Log portfolio item creation
    console.log(`Portfolio item created: ${portfolioItem.id} by master ${user.userId}`);

    return success({
      id: portfolioItem.id,
      title: portfolioItem.title,
      description: portfolioItem.description,
      images: portfolioItem.images,
      skills: portfolioItem.skills,
      cost: portfolioItem.cost ? Number(portfolioItem.cost) : null,
      durationDays: portfolioItem.durationDays,
      clientReview: portfolioItem.clientReview,
      clientRating: portfolioItem.clientRating,
      category: portfolioItem.category,
      isPublic: portfolioItem.isPublic,
      viewsCount: portfolioItem.viewsCount,
      createdAt: portfolioItem.createdAt,
      updatedAt: portfolioItem.updatedAt
    }, { statusCode: 201 });

  } catch (error) {
    console.error('Error creating portfolio item:', error);
    
    if (error instanceof z.ZodError) {
      return badRequest(error.errors[0].message);
    }

    return badRequest('Failed to create portfolio item');
  }
}

export const handler = withRequestTransform(withAuth(createPortfolioItemHandler));