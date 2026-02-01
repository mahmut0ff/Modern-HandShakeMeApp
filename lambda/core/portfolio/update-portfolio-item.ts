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

    const itemId = event.pathParameters?.id;
    if (!itemId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Portfolio item ID is required' })
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
    
    if (user.role !== 'MASTER') {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Only masters can update portfolio items' })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const validatedData = updatePortfolioItemSchema.parse(body);

    // Check if portfolio item exists and belongs to the master
    const existingItem = await portfolioRepository.findItemById(itemId, userId);
    if (!existingItem) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Portfolio item not found or access denied' })
      };
    }

    // Validate category if provided
    if (validatedData.categoryId) {
      const isValidCategory = await categoryService.validateCategory(validatedData.categoryId);
      if (!isValidCategory) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Category not found or inactive' })
        };
      }
    }

    // Validate client rating consistency
    if (validatedData.clientRating && !validatedData.clientReview && !existingItem.clientReview) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Client review is required when rating is provided' })
      };
    }

    // Process and validate images if provided
    let processedImages: string[] | undefined;
    if (validatedData.images) {
      processedImages = [];
      for (const imageUrl of validatedData.images) {
        const isValidImage = await s3Service.validateImageUrl(imageUrl);
        if (!isValidImage) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: `Invalid image URL: ${imageUrl}` })
          };
        }
        processedImages.push(imageUrl);
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (processedImages !== undefined) updateData.images = processedImages;
    if (validatedData.skills !== undefined) updateData.skills = validatedData.skills;
    if (validatedData.cost !== undefined) updateData.cost = validatedData.cost;
    if (validatedData.durationDays !== undefined) updateData.durationDays = validatedData.durationDays;
    if (validatedData.categoryId !== undefined) updateData.categoryId = validatedData.categoryId;
    if (validatedData.clientReview !== undefined) updateData.clientReview = validatedData.clientReview;
    if (validatedData.clientRating !== undefined) updateData.clientRating = validatedData.clientRating;
    if (validatedData.isPublic !== undefined) updateData.isPublic = validatedData.isPublic;

    // Update the portfolio item
    const updatedItem = await portfolioRepository.updateItem(itemId, userId, updateData);

    // Get category details if available
    let category = null;
    if (updatedItem.categoryId) {
      category = await categoryService.findCategoryById(updatedItem.categoryId);
    }

    // Invalidate cache
    await cache.invalidatePattern(`portfolio:${userId}*`);
    await cache.invalidatePattern(`master:profile:${userId}*`);

    console.log(`Portfolio item updated: ${itemId} by master ${userId}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: updatedItem.id,
        title: updatedItem.title,
        description: updatedItem.description,
        images: updatedItem.images,
        skills: updatedItem.skills,
        cost: updatedItem.cost,
        durationDays: updatedItem.durationDays,
        clientReview: updatedItem.clientReview,
        clientRating: updatedItem.clientRating,
        category: category ? {
          id: category.id,
          name: category.name
        } : null,
        isPublic: updatedItem.isPublic,
        viewsCount: updatedItem.viewsCount,
        createdAt: updatedItem.createdAt,
        updatedAt: updatedItem.updatedAt
      })
    };

  } catch (error) {
    console.error('Error updating portfolio item:', error);
    
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
      body: JSON.stringify({ error: 'Failed to update portfolio item' })
    };
  }
};