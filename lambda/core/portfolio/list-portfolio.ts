import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { success, badRequest, unauthorized, paginated } from '../shared/utils/response';
import { withAuth } from '../shared/middleware/auth';
import { withRequestTransform } from '../shared/middleware/requestTransform';
import { getPrismaClient } from '../shared/utils/prisma';
import { CacheService } from '../shared/services/cache';

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

async function listPortfolioHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const prisma = getPrismaClient();
  
  try {
    // Authenticate user (optional for public portfolio viewing)
    const user = (event as any).user;
    
    // Parse and validate query parameters
    const queryParams = event.queryStringParameters || {};
    const validatedQuery = querySchema.parse(queryParams);

    // Determine which master's portfolio to fetch
    const targetMasterId = validatedQuery.masterId || user?.userId;
    
    if (!targetMasterId) {
      return badRequest('Master ID is required');
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
            prisma.portfolioItem.update({
              where: { id: item.id },
              data: { viewsCount: { increment: 1 } }
            }).catch(err => console.error('Error incrementing view count:', err))
          )
        );
      }
      
      return success(cachedPortfolio);
    }

    // Build where clause
    const whereClause: any = {
      masterId: targetMasterId
    };

    if (validatedQuery.categoryId) {
      whereClause.categoryId = validatedQuery.categoryId;
    }

    if (validatedQuery.isPublic) {
      whereClause.isPublic = validatedQuery.isPublic === 'true';
    } else if (!showPrivate) {
      whereClause.isPublic = true;
    }

    // Handle skills filtering
    if (validatedQuery.skills) {
      const skillsArray = validatedQuery.skills.split(',').map(s => s.trim());
      whereClause.skills = {
        hasSome: skillsArray
      };
    }

    // Determine sorting
    let orderBy: any = { createdAt: 'desc' }; // default: recent
    
    switch (validatedQuery.sortBy) {
      case 'popular':
        orderBy = { viewsCount: 'desc' };
        break;
      case 'rating':
        orderBy = { clientRating: 'desc' };
        break;
    }

    // Calculate pagination
    const page = validatedQuery.page;
    const pageSize = validatedQuery.pageSize;
    const skip = (page - 1) * pageSize;

    // Fetch portfolio items from database
    const [portfolioItems, totalCount] = await Promise.all([
      prisma.portfolioItem.findMany({
        where: whereClause,
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy,
        take: pageSize,
        skip
      }),
      prisma.portfolioItem.count({
        where: whereClause
      })
    ]);

    // Increment view counts for public viewing (not for owner)
    if (!isOwnPortfolio && portfolioItems.length > 0) {
      // Async increment view counts without blocking response
      Promise.all(
        portfolioItems.map(item =>
          prisma.portfolioItem.update({
            where: { id: item.id },
            data: { viewsCount: { increment: 1 } }
          }).catch(err => console.error('Error incrementing view count:', err))
        )
      );
    }

    // Format response
    const formattedItems = portfolioItems.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      images: item.images,
      skills: item.skills,
      cost: item.cost ? Number(item.cost) : null,
      durationDays: item.durationDays,
      clientReview: item.clientReview,
      clientRating: item.clientRating,
      category: item.category,
      isPublic: item.isPublic,
      viewsCount: item.viewsCount,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));

    // Cache the response for 10 minutes (shorter for portfolio due to view counts)
    await cache.set(cacheKey, { results: formattedItems, count: totalCount }, 600);

    return paginated(formattedItems, totalCount, page, pageSize);

  } catch (error) {
    console.error('Error listing portfolio:', error);
    
    if (error instanceof z.ZodError) {
      return badRequest(error.errors[0].message);
    }

    return badRequest('Failed to fetch portfolio');
  }
}

export const handler = withRequestTransform(withAuth(listPortfolioHandler, { optional: true }));
