import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { PortfolioRepository } from '../shared/repositories/portfolio.repository';
import { CategoryService } from '../shared/services/category.service';
import { CacheService } from '../shared/services/cache';
import { verifyToken } from '../shared/services/token';

const portfolioRepository = new PortfolioRepository();
const categoryService = new CategoryService();
const cache = new CacheService();

// Query parameters validation schema
const querySchema = z.object({
  masterId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  skills: z.string().optional(), // Comma-separated skills
  isPublic: z.enum(['true', 'false']).optional(),
  includePrivate: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['recent', 'popular', 'rating']).default('recent'),
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  pageSize: z.string().regex(/^\d+$/).transform(Number).default('20')
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Authenticate user (optional for public portfolio viewing)
    let user = null;
    try {
      const authHeader = event.headers.Authorization || event.headers.authorization;
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const decoded = verifyToken(token);
        user = { userId: decoded.userId };
      }
    } catch (error) {
      // Continue without authentication for public viewing
    }
    
    // Parse and validate query parameters
    const queryParams = event.queryStringParameters || {};
    const validatedQuery = querySchema.parse(queryParams);

    // Determine which master's portfolio to fetch
    const targetMasterId = validatedQuery.masterId || user?.userId;
    
    if (!targetMasterId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Master ID is required' })
      };
    }

    // Determine visibility permissions
    const isOwnPortfolio = user?.userId === targetMasterId;
    const showPrivate = isOwnPortfolio && validatedQuery.includePrivate === 'true';

    // Check cache first
    const cacheKey = `portfolio:${targetMasterId}:${JSON.stringify(validatedQuery)}`;
    const cachedPortfolio = await cache.get(cacheKey);
    
    if (cachedPortfolio) {
      // Increment view counts for public viewing (not for owner)
      if (!isOwnPortfolio && cachedPortfolio.results) {
        // Async increment view counts without blocking response
        Promise.all(
          cachedPortfolio.results.map((item: any) =>
            portfolioRepository.incrementViewCount(item.id, targetMasterId)
              .catch(err => console.error('Error incrementing view count:', err))
          )
        );
      }
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cachedPortfolio)
      };
    }

    // Build filters
    const filters = {
      masterId: targetMasterId,
      categoryId: validatedQuery.categoryId,
      skills: validatedQuery.skills ? validatedQuery.skills.split(',').map(s => s.trim()) : undefined,
      isPublic: validatedQuery.isPublic ? validatedQuery.isPublic === 'true' : undefined,
      includePrivate: showPrivate,
      sortBy: validatedQuery.sortBy,
      page: validatedQuery.page,
      pageSize: validatedQuery.pageSize
    };

    // Fetch portfolio items from repository
    const { items: portfolioItems, total: totalCount } = await portfolioRepository.findMasterItems(
      targetMasterId,
      filters
    );

    // Increment view counts for public viewing (not for owner)
    if (!isOwnPortfolio && portfolioItems.length > 0) {
      // Async increment view counts without blocking response
      Promise.all(
        portfolioItems.map(item =>
          portfolioRepository.incrementViewCount(item.id, targetMasterId)
            .catch(err => console.error('Error incrementing view count:', err))
        )
      );
    }

    // Get category details for items that have categories
    const categoryIds = [...new Set(portfolioItems.map(item => item.categoryId).filter(Boolean))];
    const categories = await Promise.all(
      categoryIds.map(async (categoryId) => {
        const category = await categoryService.findCategoryById(categoryId!);
        return category ? { [categoryId!]: category } : {};
      })
    );
    const categoryMap = categories.reduce((acc, cat) => ({ ...acc, ...cat }), {});

    // Format response
    const formattedItems = portfolioItems.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      images: item.images,
      skills: item.skills,
      cost: item.cost,
      durationDays: item.durationDays,
      clientReview: item.clientReview,
      clientRating: item.clientRating,
      category: item.categoryId && categoryMap[item.categoryId] ? {
        id: categoryMap[item.categoryId].id,
        name: categoryMap[item.categoryId].name
      } : null,
      isPublic: item.isPublic,
      viewsCount: item.viewsCount,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));

    const response = {
      results: formattedItems,
      count: totalCount,
      next: validatedQuery.page * validatedQuery.pageSize < totalCount 
        ? `?page=${validatedQuery.page + 1}` 
        : null,
      previous: validatedQuery.page > 1 
        ? `?page=${validatedQuery.page - 1}` 
        : null
    };

    // Cache the response for 10 minutes (shorter for portfolio due to view counts)
    await cache.set(cacheKey, response, 600);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Error listing portfolio:', error);
    
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

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to fetch portfolio' })
    };
  }
};