import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { createResponse, createErrorResponse } from '@/shared/utils/response';
import { requireAuth } from '@/shared/middleware/auth';
import { CacheService } from '@/shared/services/cache';

const prisma = new PrismaClient();
const cache = new CacheService();

// Query parameters validation schema
const querySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).default(10),
  includeReasons: z.enum(['true', 'false']).default('true')
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await requireAuth()(event);
    
    if (user.role !== 'MASTER') {
      return createErrorResponse(403, 'FORBIDDEN', 'Only masters can get order recommendations');
    }

    const queryParams = event.queryStringParameters || {};
    const validatedQuery = querySchema.parse(queryParams);

    // Check cache first
    const cacheKey = `recommended-orders:${user.userId}:${JSON.stringify(validatedQuery)}`;
    const cachedRecommendations = await cache.get(cacheKey);
    
    if (cachedRecommendations) {
      return createResponse(200, cachedRecommendations);
    }

    // Get master profile and skills
    const masterProfile = await prisma.masterProfile.findUnique({
      where: { userId: user.userId },
      include: {
        skills: {
          include: {
            skill: {
              select: {
                id: true,
                name: true,
                categoryId: true
              }
            }
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!masterProfile) {
      return createErrorResponse(404, 'NOT_FOUND', 'Master profile not found');
    }

    // Get master's skill IDs and category
    const masterSkillIds = masterProfile.skills.map(ms => ms.skill.id);
    const masterCategoryId = masterProfile.categoryId;
    const masterCity = masterProfile.city;

    // Get orders that master hasn't applied to yet
    const appliedOrderIds = await prisma.application.findMany({
      where: { masterId: masterProfile.id },
      select: { orderId: true }
    }).then(apps => apps.map(app => app.orderId));

    // Build recommendation query
    const activeOrders = await prisma.order.findMany({
      where: {
        status: 'ACTIVE',
        id: { notIn: appliedOrderIds },
        expiresAt: { gt: new Date() }
      },
      include: {
        requiredSkills: {
          include: {
            skill: {
              select: {
                id: true,
                name: true,
                categoryId: true
              }
            }
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        },
        subcategory: {
          select: {
            id: true,
            name: true
          }
        },
        client: {
          select: {
            user: {
              select: {
                avatar: true
              }
            },
            rating: true,
            completedProjectsCount: true
          }
        }
      },
      take: 100 // Get more orders to score and filter
    });

    // Score each order based on multiple factors
    const scoredOrders = activeOrders.map(order => {
      let score = 0;
      const reasons: string[] = [];

      // 1. Skill matching (40% weight)
      const orderSkillIds = order.requiredSkills.map(rs => rs.skill.id);
      const skillMatches = orderSkillIds.filter(skillId => masterSkillIds.includes(skillId));
      const skillMatchRatio = orderSkillIds.length > 0 ? skillMatches.length / orderSkillIds.length : 0;
      
      const skillScore = skillMatchRatio * 40;
      score += skillScore;
      
      if (skillMatchRatio > 0.7) {
        reasons.push(`${Math.round(skillMatchRatio * 100)}% skill match`);
      } else if (skillMatchRatio > 0.3) {
        reasons.push(`Partial skill match (${skillMatches.length}/${orderSkillIds.length})`);
      }

      // 2. Category matching (25% weight)
      let categoryScore = 0;
      if (order.categoryId === masterCategoryId) {
        categoryScore = 25;
        reasons.push('Same category');
      } else if (order.subcategoryId === masterCategoryId) {
        categoryScore = 20;
        reasons.push('Related category');
      } else {
        // Check if any order skills are in master's category
        const categorySkillMatch = order.requiredSkills.some(rs => 
          rs.skill.categoryId === masterCategoryId
        );
        if (categorySkillMatch) {
          categoryScore = 15;
          reasons.push('Category skill match');
        }
      }
      score += categoryScore;

      // 3. Location matching (15% weight)
      let locationScore = 0;
      if (order.city.toLowerCase() === masterCity.toLowerCase()) {
        locationScore = 15;
        reasons.push('Same city');
      } else {
        // Could add distance calculation here
        locationScore = 5;
      }
      score += locationScore;

      // 4. Budget compatibility (10% weight)
      let budgetScore = 0;
      if (order.budgetType === 'FIXED' || order.budgetType === 'RANGE') {
        const orderBudget = Number(order.budgetMax || order.budgetMin || 0);
        const masterRate = Number(masterProfile.hourlyRate || masterProfile.dailyRate || 0);
        
        if (masterRate > 0 && orderBudget > 0) {
          const budgetRatio = Math.min(orderBudget / masterRate, 2); // Cap at 2x
          budgetScore = Math.min(budgetRatio * 5, 10);
          
          if (budgetRatio >= 1.5) {
            reasons.push('Good budget match');
          }
        }
      } else {
        budgetScore = 8; // Negotiable budget
        reasons.push('Negotiable budget');
      }
      score += budgetScore;

      // 5. Client quality (5% weight)
      let clientScore = 0;
      const clientRating = Number(order.client.rating || 0);
      const clientProjects = order.client.completedProjectsCount || 0;
      
      if (clientRating >= 4.5) {
        clientScore = 5;
        reasons.push('High-rated client');
      } else if (clientRating >= 4.0) {
        clientScore = 3;
      } else if (clientProjects > 5) {
        clientScore = 2;
        reasons.push('Experienced client');
      }
      score += clientScore;

      // 6. Urgency bonus (5% weight)
      const daysUntilExpiry = Math.ceil(
        (order.expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      
      let urgencyScore = 0;
      if (daysUntilExpiry <= 2) {
        urgencyScore = 5;
        reasons.push('Urgent order');
      } else if (daysUntilExpiry <= 5) {
        urgencyScore = 3;
      }
      score += urgencyScore;

      // Normalize score to 0-100
      const normalizedScore = Math.min(Math.round(score), 100);

      return {
        order,
        score: normalizedScore,
        reasons: validatedQuery.includeReasons === 'true' ? reasons : undefined,
        skillMatches,
        daysUntilExpiry
      };
    });

    // Filter orders with minimum score and sort by score
    const recommendedOrders = scoredOrders
      .filter(item => item.score >= 20) // Minimum 20% match
      .sort((a, b) => b.score - a.score)
      .slice(0, validatedQuery.limit)
      .map(item => ({
        id: item.order.id,
        title: item.order.title,
        description: item.order.description,
        category: item.order.category,
        subcategory: item.order.subcategory,
        city: item.order.city,
        budgetType: item.order.budgetType,
        budgetMin: item.order.budgetMin ? Number(item.order.budgetMin) : null,
        budgetMax: item.order.budgetMax ? Number(item.order.budgetMax) : null,
        startDate: item.order.startDate?.toISOString(),
        endDate: item.order.endDate?.toISOString(),
        expiresAt: item.order.expiresAt.toISOString(),
        applicationsCount: item.order.applicationsCount,
        client: {
          rating: Number(item.order.client.rating),
          completedProjects: item.order.client.completedProjectsCount,
          avatar: item.order.client.user.avatar
        },
        matchScore: item.score,
        reasons: item.reasons,
        skillMatches: item.skillMatches.length,
        totalSkills: item.order.requiredSkills.length,
        daysUntilExpiry: item.daysUntilExpiry,
        createdAt: item.order.createdAt.toISOString()
      }));

    // Calculate recommendation statistics
    const stats = {
      totalRecommendations: recommendedOrders.length,
      averageScore: recommendedOrders.length > 0 ? 
        Math.round(recommendedOrders.reduce((sum, order) => sum + order.matchScore, 0) / recommendedOrders.length) : 0,
      highScoreCount: recommendedOrders.filter(order => order.matchScore >= 70).length,
      sameCategory: recommendedOrders.filter(order => order.category.id === masterCategoryId).length,
      sameCityCount: recommendedOrders.filter(order => 
        order.city.toLowerCase() === masterCity.toLowerCase()
      ).length
    };

    const response = {
      recommendations: recommendedOrders,
      stats,
      masterProfile: {
        id: masterProfile.id,
        category: masterProfile.category,
        city: masterProfile.city,
        skillsCount: masterProfile.skills.length,
        rating: Number(masterProfile.rating)
      },
      generatedAt: new Date().toISOString()
    };

    // Cache the response for 30 minutes
    await cache.set(cacheKey, response, 1800);

    return createResponse(200, response);

  } catch (error) {
    console.error('Error getting recommended orders:', error);
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(400, 'VALIDATION_ERROR', error.errors[0].message);
    }
    
    if (error.name === 'UnauthorizedError') {
      return createErrorResponse(401, 'UNAUTHORIZED', error.message);
    }

    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to get recommended orders');
  } finally {
    await prisma.$disconnect();
  }
};