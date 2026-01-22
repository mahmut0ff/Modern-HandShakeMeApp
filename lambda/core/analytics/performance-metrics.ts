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
  period: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await requireAuth()(event);
    
    if (user.role !== 'MASTER') {
      return createErrorResponse(403, 'FORBIDDEN', 'Only masters can view performance metrics');
    }

    const queryParams = event.queryStringParameters || {};
    const validatedQuery = querySchema.parse(queryParams);

    // Check cache first
    const cacheKey = `performance:${user.userId}:${JSON.stringify(validatedQuery)}`;
    const cachedMetrics = await cache.get(cacheKey);
    
    if (cachedMetrics) {
      return createResponse(200, cachedMetrics);
    }

    // Calculate date range
    let startDate: Date;
    let endDate: Date;

    if (validatedQuery.startDate && validatedQuery.endDate) {
      startDate = new Date(validatedQuery.startDate);
      endDate = new Date(validatedQuery.endDate);
    } else {
      endDate = new Date();
      
      switch (validatedQuery.period) {
        case 'week':
          startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
          break;
        case 'quarter':
          const quarterStart = Math.floor(endDate.getMonth() / 3) * 3;
          startDate = new Date(endDate.getFullYear(), quarterStart, 1);
          break;
        case 'year':
          startDate = new Date(endDate.getFullYear(), 0, 1);
          break;
      }
    }

    // Get master profile
    const masterProfile = await prisma.masterProfile.findUnique({
      where: { userId: user.userId },
      select: { 
        id: true, 
        rating: true, 
        completedProjectsCount: true,
        onTimeRate: true
      }
    });

    if (!masterProfile) {
      return createErrorResponse(404, 'NOT_FOUND', 'Master profile not found');
    }

    // Get projects in the period
    const projects = await prisma.project.findMany({
      where: {
        masterId: masterProfile.id,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        order: {
          select: {
            title: true,
            category: {
              select: {
                name: true
              }
            }
          }
        },
        review: {
          select: {
            rating: true,
            qualityRating: true,
            timelinessRating: true,
            communicationRating: true,
            valueRating: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get applications in the period
    const applications = await prisma.application.findMany({
      where: {
        masterId: masterProfile.id,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        order: {
          select: {
            title: true,
            category: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    // Calculate project metrics
    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => p.status === 'COMPLETED').length;
    const inProgressProjects = projects.filter(p => p.status === 'IN_PROGRESS').length;
    const newProjects = projects.filter(p => p.status === 'NEW').length;
    
    const completionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;

    // Calculate on-time delivery rate
    const projectsWithDeadlines = projects.filter(p => p.deadline && p.completedAt);
    const onTimeProjects = projectsWithDeadlines.filter(p => 
      p.completedAt && p.deadline && p.completedAt <= p.deadline
    ).length;
    const onTimeRate = projectsWithDeadlines.length > 0 ? 
      (onTimeProjects / projectsWithDeadlines.length) * 100 : 0;

    // Calculate application metrics
    const totalApplications = applications.length;
    const acceptedApplications = applications.filter(a => a.status === 'ACCEPTED').length;
    const applicationSuccessRate = totalApplications > 0 ? 
      (acceptedApplications / totalApplications) * 100 : 0;

    // Calculate response time (average time from application creation to first view)
    const viewedApplications = applications.filter(a => a.viewedAt);
    const averageResponseTime = viewedApplications.length > 0 ?
      viewedApplications.reduce((sum, a) => {
        const responseTime = a.viewedAt!.getTime() - a.createdAt.getTime();
        return sum + responseTime;
      }, 0) / viewedApplications.length / (1000 * 60 * 60) : 0; // Convert to hours

    // Calculate rating metrics
    const reviewedProjects = projects.filter(p => p.review);
    const averageRating = reviewedProjects.length > 0 ?
      reviewedProjects.reduce((sum, p) => sum + p.review!.rating, 0) / reviewedProjects.length : 0;

    const averageQualityRating = reviewedProjects.length > 0 ?
      reviewedProjects.reduce((sum, p) => sum + p.review!.qualityRating, 0) / reviewedProjects.length : 0;

    const averageTimelinessRating = reviewedProjects.length > 0 ?
      reviewedProjects.reduce((sum, p) => sum + p.review!.timelinessRating, 0) / reviewedProjects.length : 0;

    const averageCommunicationRating = reviewedProjects.length > 0 ?
      reviewedProjects.reduce((sum, p) => sum + p.review!.communicationRating, 0) / reviewedProjects.length : 0;

    // Calculate project duration metrics
    const completedProjectsWithDuration = projects.filter(p => 
      p.status === 'COMPLETED' && p.startedAt && p.completedAt
    );
    
    const averageProjectDuration = completedProjectsWithDuration.length > 0 ?
      completedProjectsWithDuration.reduce((sum, p) => {
        const duration = p.completedAt!.getTime() - p.startedAt!.getTime();
        return sum + duration;
      }, 0) / completedProjectsWithDuration.length / (1000 * 60 * 60 * 24) : 0; // Convert to days

    // Calculate category performance
    const categoryPerformance = projects.reduce((acc, p) => {
      const categoryName = p.order?.category?.name || 'Other';
      if (!acc[categoryName]) {
        acc[categoryName] = {
          total: 0,
          completed: 0,
          averageRating: 0,
          ratingCount: 0
        };
      }
      
      acc[categoryName].total++;
      if (p.status === 'COMPLETED') {
        acc[categoryName].completed++;
      }
      if (p.review) {
        acc[categoryName].averageRating = 
          (acc[categoryName].averageRating * acc[categoryName].ratingCount + p.review.rating) / 
          (acc[categoryName].ratingCount + 1);
        acc[categoryName].ratingCount++;
      }
      
      return acc;
    }, {} as Record<string, any>);

    // Calculate monthly trends
    const monthlyMetrics = [];
    const currentMonth = new Date(startDate);
    
    while (currentMonth <= endDate) {
      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const monthProjects = projects.filter(p => 
        p.createdAt >= monthStart && p.createdAt <= monthEnd
      );
      
      const monthApplications = applications.filter(a => 
        a.createdAt >= monthStart && a.createdAt <= monthEnd
      );
      
      monthlyMetrics.push({
        month: currentMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        projects: monthProjects.length,
        applications: monthApplications.length,
        completionRate: monthProjects.length > 0 ? 
          (monthProjects.filter(p => p.status === 'COMPLETED').length / monthProjects.length) * 100 : 0,
        averageRating: monthProjects.filter(p => p.review).length > 0 ?
          monthProjects.filter(p => p.review).reduce((sum, p) => sum + p.review!.rating, 0) / 
          monthProjects.filter(p => p.review).length : 0
      });
      
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }

    const response = {
      period: validatedQuery.period,
      dateRange: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      },
      projects: {
        total: totalProjects,
        completed: completedProjects,
        inProgress: inProgressProjects,
        new: newProjects,
        completionRate: Math.round(completionRate * 100) / 100
      },
      performance: {
        rating: Math.round(averageRating * 100) / 100,
        qualityRating: Math.round(averageQualityRating * 100) / 100,
        timelinessRating: Math.round(averageTimelinessRating * 100) / 100,
        communicationRating: Math.round(averageCommunicationRating * 100) / 100,
        onTimeRate: Math.round(onTimeRate * 100) / 100,
        responseTime: Math.round(averageResponseTime * 100) / 100, // hours
        averageProjectDuration: Math.round(averageProjectDuration * 100) / 100 // days
      },
      applications: {
        total: totalApplications,
        accepted: acceptedApplications,
        successRate: Math.round(applicationSuccessRate * 100) / 100
      },
      categoryPerformance: Object.entries(categoryPerformance).map(([name, data]) => ({
        category: name,
        totalProjects: data.total,
        completedProjects: data.completed,
        completionRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
        averageRating: Math.round(data.averageRating * 100) / 100
      })),
      trends: monthlyMetrics,
      summary: {
        overallRating: Number(masterProfile.rating),
        totalCompletedProjects: masterProfile.completedProjectsCount,
        overallOnTimeRate: Number(masterProfile.onTimeRate)
      }
    };

    // Cache the response for 30 minutes
    await cache.set(cacheKey, response, 1800);

    return createResponse(200, response);

  } catch (error) {
    console.error('Error getting performance metrics:', error);
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(400, 'VALIDATION_ERROR', error.errors[0].message);
    }
    
    if (error.name === 'UnauthorizedError') {
      return createErrorResponse(401, 'UNAUTHORIZED', error.message);
    }

    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to get performance metrics');
  } finally {
    await prisma.$disconnect();
  }
};