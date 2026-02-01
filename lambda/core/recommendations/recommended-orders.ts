import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { success, error, unauthorized, forbidden, notFound } from '../shared/utils/response';
import { MasterProfileRepository } from '../shared/repositories/master-profile.repository';
import { OrderRepository } from '../shared/repositories/order.repository';
import { ApplicationRepository } from '../shared/repositories/application.repository';
import { CategoryRepository } from '../shared/repositories/category.repository';
import { CacheService } from '../shared/cache/client';
import { getLocationScore, getLocationReason } from '../shared/utils/location';
import { 
  calculateBudgetScore, 
  calculateUrgencyScore, 
  calculateQualityScore, 
  calculateCategoryScore,
  normalizeScore,
  shouldFilterOrder,
  DEFAULT_WEIGHTS
} from '../shared/utils/recommendation-scoring';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const cache = new CacheService();

// Query parameters validation schema
const querySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  includeReasons: z.enum(['true', 'false']).default('true')
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Get token from header
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
      return unauthorized('Authorization header required');
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return unauthorized('Invalid or expired token');
    }

    if (decoded.role !== 'MASTER') {
      return forbidden('Only masters can get order recommendations');
    }

    const queryParams = event.queryStringParameters || {};
    const validatedQuery = querySchema.parse(queryParams);

    // Check cache first
    const cacheKey = `recommended-orders:${decoded.userId}:${JSON.stringify(validatedQuery)}`;
    const cachedRecommendations = await cache.get(cacheKey);
    
    if (cachedRecommendations) {
      return success(cachedRecommendations);
    }

    // Initialize repositories
    const masterProfileRepo = new MasterProfileRepository();
    const orderRepo = new OrderRepository();
    const applicationRepo = new ApplicationRepository();
    const categoryRepo = new CategoryRepository();

    // Get master profile
    const masterProfile = await masterProfileRepo.findByUserId(decoded.userId);

    if (!masterProfile) {
      return notFound('Master profile not found');
    }

    // Get master's skills and categories
    const masterSkillIds = masterProfile.skills || [];
    const masterCategoryIds = masterProfile.categories || [];
    const masterCity = masterProfile.city;

    // Get master's applications to exclude applied orders
    const masterApplications = await applicationRepo.findByMaster(decoded.userId);
    const appliedOrderIds = masterApplications.map(app => app.orderId);

    // Get active orders
    const activeOrders = await orderRepo.findByStatus('ACTIVE', 100);
    
    // Filter out orders master has already applied to and expired orders
    const availableOrders = activeOrders.filter(order => 
      !appliedOrderIds.includes(order.id) && 
      new Date(order.expiresAt) > new Date()
    );

    // Get categories and skills for scoring
    const allCategories = await categoryRepo.listCategories({ isActive: true });
    const allSkills = await categoryRepo.listAllSkills({ isActive: true });

    // Create skill and category lookup maps
    const skillMap = new Map(allSkills.map(skill => [skill.id, skill]));
    const categoryMap = new Map(allCategories.map(cat => [cat.id, cat]));

    // Score each order based on multiple factors
    const scoredOrders = availableOrders.map(order => {
      const reasons: string[] = [];

      // 1. Category matching (40% weight)
      const categoryResult = calculateCategoryScore(masterCategoryIds, order.categoryId, DEFAULT_WEIGHTS.category);
      if (categoryResult.reason) reasons.push(categoryResult.reason);

      // 2. Skill matching (25% weight) - simplified since we don't have order skills in current schema
      const skillResult = calculateCategoryScore(masterCategoryIds, order.categoryId, DEFAULT_WEIGHTS.skills);
      if (skillResult.reason) reasons.push('Category skill match');

      // 3. Location matching (15% weight)
      const locationScore = getLocationScore(masterCity, order.city, DEFAULT_WEIGHTS.location);
      const locationReason = getLocationReason(masterCity, order.city);
      reasons.push(locationReason);

      // 4. Budget compatibility (10% weight)
      const budgetResult = calculateBudgetScore(
        order.budgetType,
        order.budgetMin,
        order.budgetMax,
        masterProfile.hourlyRate,
        DEFAULT_WEIGHTS.budget
      );
      if (budgetResult.reason) reasons.push(budgetResult.reason);

      // 5. Master quality bonus (5% weight)
      const qualityResult = calculateQualityScore(
        masterProfile.rating,
        masterProfile.completedOrders,
        DEFAULT_WEIGHTS.quality
      );
      if (qualityResult.reason) reasons.push(qualityResult.reason);

      // 6. Urgency bonus (5% weight)
      const urgencyResult = calculateUrgencyScore(order.expiresAt, DEFAULT_WEIGHTS.urgency);
      if (urgencyResult.reason) reasons.push(urgencyResult.reason);

      // Calculate final normalized score
      const finalScore = normalizeScore(
        categoryResult.score,
        skillResult.score,
        locationScore,
        budgetResult.score,
        qualityResult.score,
        urgencyResult.score,
        DEFAULT_WEIGHTS
      );

      const daysUntilExpiry = Math.ceil(
        (new Date(order.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        order,
        score: finalScore,
        reasons: validatedQuery.includeReasons === 'true' ? reasons : undefined,
        skillMatches: masterCategoryIds.includes(parseInt(order.categoryId)) ? 1 : 0,
        daysUntilExpiry
      };
    });

    // Filter orders with minimum score and sort by score
    const recommendedOrders = scoredOrders
      .filter(item => !shouldFilterOrder(item.score, masterCategoryIds, item.order.categoryId, 20))
      .sort((a, b) => b.score - a.score)
      .slice(0, validatedQuery.limit)
      .map(item => {
        const category = categoryMap.get(item.order.categoryId);
        return {
          id: item.order.id,
          title: item.order.title,
          description: item.order.description,
          category: category ? {
            id: category.id,
            name: category.name
          } : null,
          city: item.order.city,
          budgetType: item.order.budgetType,
          budgetMin: item.order.budgetMin || null,
          budgetMax: item.order.budgetMax || null,
          startDate: item.order.startDate,
          endDate: item.order.endDate,
          expiresAt: item.order.expiresAt,
          applicationsCount: item.order.applicationsCount,
          matchScore: item.score,
          reasons: item.reasons,
          skillMatches: item.skillMatches,
          totalSkills: 1, // Simplified since we don't have detailed skills per order
          daysUntilExpiry: item.daysUntilExpiry,
          createdAt: item.order.createdAt
        };
      });

    // Calculate recommendation statistics
    const stats = {
      totalRecommendations: recommendedOrders.length,
      averageScore: recommendedOrders.length > 0 ? 
        Math.round(recommendedOrders.reduce((sum, order) => sum + order.matchScore, 0) / recommendedOrders.length) : 0,
      highScoreCount: recommendedOrders.filter(order => order.matchScore >= 70).length,
      sameCategory: recommendedOrders.filter(order => 
        masterCategoryIds.includes(parseInt(order.category?.id || '0'))
      ).length,
      sameCityCount: recommendedOrders.filter(order => 
        order.city.toLowerCase() === masterCity.toLowerCase()
      ).length
    };

    const response = {
      recommendations: recommendedOrders,
      stats,
      masterProfile: {
        id: masterProfile.profileId,
        categories: masterProfile.categories,
        city: masterProfile.city,
        skillsCount: masterProfile.skills.length,
        rating: parseFloat(masterProfile.rating)
      },
      generatedAt: new Date().toISOString()
    };

    // Cache the response for 30 minutes
    await cache.set(cacheKey, response, 1800);

    return success(response);

  } catch (err) {
    console.error('Error getting recommended orders:', err);
    
    if (err instanceof z.ZodError) {
      return error('Validation error: ' + err.errors[0].message, 400);
    }

    return error('Failed to get recommended orders', 500);
  }
};