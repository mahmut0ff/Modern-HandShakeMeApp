import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { PortfolioRepository } from '../shared/repositories/portfolio.repository';
import { CategoryService } from '../shared/services/category.service';
import { UserService } from '../shared/services/user.service';
import { S3Service } from '../shared/services/s3';
import { CacheService } from '../shared/services/cache';
import { verifyToken } from '../shared/services/token';

const portfolioRepository = new PortfolioRepository();
const categoryService = new CategoryService();
const userService = new UserService();
const s3Service = new S3Service();
const cache = new CacheService();

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

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    const userId = decoded.userId;

    // Get user information
    const user = await userService.findUserById(userId);
    if (!user) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'User not found' })
      };
    }
    
    // Validate user is a master
    if (user.role !== 'MASTER') {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Only masters can create portfolio items' })
      };
    }

    // Parse and validate request body
    const body = JSON.parse(event.body || '{}');
    const validatedData = createPortfolioItemSchema.parse(body);

    // Check portfolio item limit (e.g., max 50 items per master)
    const existingItemsCount = await portfolioRepository.countMasterItems(userId);
    if (existingItemsCount >= 50) {
      return {
        statusCode: 409,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Maximum portfolio items limit reached (50)' })
      };
    }

    // Validate category if provided
    if (validatedData.categoryId) {
      const isValidCategory = await categoryService.validateCategory(validatedData.categoryId);
      if (!isValidCategory) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Service category not found or inactive' })
        };
      }
    }

    // Validate client rating consistency
    if (validatedData.clientRating && !validatedData.clientReview) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Client review is required when rating is provided' })
      };
    }

    // Process and validate images
    const processedImages: string[] = [];
    for (const imageUrl of validatedData.images) {
      try {
        // Validate image URL is accessible and is an image
        const isValidImage = await s3Service.validateImageUrl(imageUrl);
        if (!isValidImage) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: `Invalid image URL: ${imageUrl}` })
          };
        }
        processedImages.push(imageUrl);
      } catch (error) {
        console.error(`Error validating image ${imageUrl}:`, error);
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: `Failed to validate image: ${imageUrl}` })
        };
      }
    }

    // Create the portfolio item
    const portfolioItem = await portfolioRepository.createItem({
      masterId: userId,
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
    });

    // Get category details if available
    let category = null;
    if (portfolioItem.categoryId) {
      category = await categoryService.findCategoryById(portfolioItem.categoryId);
    }

    // Invalidate cache
    await cache.invalidatePattern(`portfolio:${userId}*`);
    await cache.invalidatePattern(`master:profile:${userId}*`);

    // Log portfolio item creation
    console.log(`Portfolio item created: ${portfolioItem.id} by master ${userId}`);

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: portfolioItem.id,
        title: portfolioItem.title,
        description: portfolioItem.description,
        images: portfolioItem.images,
        skills: portfolioItem.skills,
        cost: portfolioItem.cost,
        durationDays: portfolioItem.durationDays,
        clientReview: portfolioItem.clientReview,
        clientRating: portfolioItem.clientRating,
        category: category ? {
          id: category.id,
          name: category.name
        } : null,
        isPublic: portfolioItem.isPublic,
        viewsCount: portfolioItem.viewsCount,
        createdAt: portfolioItem.createdAt,
        updatedAt: portfolioItem.updatedAt
      })
    };

  } catch (error) {
    console.error('Error creating portfolio item:', error);
    
    if (error instanceof z.ZodError) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Validation error',
          details: error.errors 
        })
      };
    }

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
      body: JSON.stringify({ error: 'Failed to create portfolio item' })
    };
  }
};