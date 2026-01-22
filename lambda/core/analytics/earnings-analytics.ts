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
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  currency: z.enum(['KGS', 'USD', 'RUB']).default('KGS')
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await requireAuth()(event);
    
    if (user.role !== 'MASTER') {
      return createErrorResponse(403, 'FORBIDDEN', 'Only masters can view earnings analytics');
    }

    const queryParams = event.queryStringParameters || {};
    const validatedQuery = querySchema.parse(queryParams);

    // Check cache first
    const cacheKey = `earnings:${user.userId}:${JSON.stringify(validatedQuery)}`;
    const cachedAnalytics = await cache.get(cacheKey);
    
    if (cachedAnalytics) {
      return createResponse(200, cachedAnalytics);
    }

    // Calculate date range based on period
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

    // Get master profile to access masterId
    const masterProfile = await prisma.masterProfile.findUnique({
      where: { userId: user.userId },
      select: { id: true }
    });

    if (!masterProfile) {
      return createErrorResponse(404, 'NOT_FOUND', 'Master profile not found');
    }

    // Get completed transactions (earnings)
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.userId,
        transactionType: 'PAYMENT',
        status: 'COMPLETED',
        completedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        project: {
          select: {
            id: true,
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
        }
      },
      orderBy: {
        completedAt: 'asc'
      }
    });

    // Calculate current period earnings
    const currentEarnings = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const currentCommissions = transactions.reduce((sum, t) => sum + Number(t.commission), 0);
    const netEarnings = currentEarnings - currentCommissions;

    // Calculate previous period for comparison
    const periodLength = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - periodLength);
    const prevEndDate = new Date(startDate.getTime() - 1);

    const prevTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.userId,
        transactionType: 'PAYMENT',
        status: 'COMPLETED',
        completedAt: {
          gte: prevStartDate,
          lte: prevEndDate
        }
      }
    });

    const prevEarnings = prevTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const trend = prevEarnings > 0 ? ((currentEarnings - prevEarnings) / prevEarnings) * 100 : 0;

    // Group earnings by time period for chart data
    const groupBy = validatedQuery.period === 'week' ? 'day' : 
                   validatedQuery.period === 'month' ? 'day' :
                   validatedQuery.period === 'quarter' ? 'week' : 'month';

    const earningsBreakdown = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      let periodStart: Date;
      let periodEnd: Date;
      let label: string;

      if (groupBy === 'day') {
        periodStart = new Date(current);
        periodEnd = new Date(current.getTime() + 24 * 60 * 60 * 1000 - 1);
        label = current.toISOString().split('T')[0];
        current.setDate(current.getDate() + 1);
      } else if (groupBy === 'week') {
        periodStart = new Date(current);
        periodEnd = new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
        label = `Week ${Math.ceil(current.getDate() / 7)}`;
        current.setDate(current.getDate() + 7);
      } else { // month
        periodStart = new Date(current.getFullYear(), current.getMonth(), 1);
        periodEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
        label = current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        current.setMonth(current.getMonth() + 1);
      }

      const periodTransactions = transactions.filter(t => 
        t.completedAt && t.completedAt >= periodStart && t.completedAt <= periodEnd
      );

      const periodEarnings = periodTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const periodProjects = periodTransactions.length;

      earningsBreakdown.push({
        period: label,
        earnings: periodEarnings,
        projects: periodProjects,
        date: periodStart.toISOString().split('T')[0]
      });
    }

    // Calculate earnings by category
    const categoryEarnings = transactions.reduce((acc, t) => {
      const categoryName = t.project?.order?.category?.name || 'Other';
      acc[categoryName] = (acc[categoryName] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);

    // Calculate average project value
    const totalProjects = transactions.length;
    const averageProjectValue = totalProjects > 0 ? currentEarnings / totalProjects : 0;

    // Get top earning projects
    const topProjects = transactions
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 5)
      .map(t => ({
        projectId: t.project?.id,
        title: t.project?.order?.title || 'Unknown Project',
        amount: Number(t.amount),
        completedAt: t.completedAt?.toISOString()
      }));

    const response = {
      period: validatedQuery.period,
      dateRange: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      },
      earnings: {
        total: currentEarnings,
        net: netEarnings,
        commissions: currentCommissions,
        trend: Math.round(trend * 100) / 100,
        currency: validatedQuery.currency
      },
      projects: {
        completed: totalProjects,
        averageValue: Math.round(averageProjectValue * 100) / 100
      },
      breakdown: earningsBreakdown,
      categories: Object.entries(categoryEarnings)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount),
      topProjects,
      stats: {
        totalTransactions: transactions.length,
        averageTransactionValue: totalProjects > 0 ? Math.round((currentEarnings / totalProjects) * 100) / 100 : 0,
        bestDay: earningsBreakdown.reduce((best, day) => 
          day.earnings > best.earnings ? day : best, 
          { earnings: 0, period: '', projects: 0, date: '' }
        )
      }
    };

    // Cache the response for 1 hour
    await cache.set(cacheKey, response, 3600);

    return createResponse(200, response);

  } catch (error) {
    console.error('Error getting earnings analytics:', error);
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(400, 'VALIDATION_ERROR', error.errors[0].message);
    }
    
    if (error.name === 'UnauthorizedError') {
      return createErrorResponse(401, 'UNAUTHORIZED', error.message);
    }

    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to get earnings analytics');
  } finally {
    await prisma.$disconnect();
  }
};