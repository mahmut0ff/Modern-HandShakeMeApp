import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { success, badRequest } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { CacheService } from '@/shared/services/cache';

const prisma = new PrismaClient();
const cache = new CacheService();

// Query parameters validation schema
const querySchema = z.object({
  type: z.enum(['RESERVATION', 'PAYMENT', 'WITHDRAWAL', 'REFUND', 'COMMISSION']).optional(),
  status: z.enum(['PENDING', 'RESERVED', 'COMPLETED', 'REFUNDED', 'FAILED']).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  projectId: z.string().uuid().optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional()
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await requireAuth()(event);

    const queryParams = event.queryStringParameters || {};
    const validatedQuery = querySchema.parse(queryParams);

    // Check cache first
    const cacheKey = `transactions:${user.userId}:${JSON.stringify(validatedQuery)}`;
    const cachedTransactions = await cache.get(cacheKey);
    
    if (cachedTransactions) {
      return createResponse(200, cachedTransactions);
    }

    // Build where clause
    const whereClause: any = {
      userId: user.userId
    };

    if (validatedQuery.type) {
      whereClause.transactionType = validatedQuery.type;
    }

    if (validatedQuery.status) {
      whereClause.status = validatedQuery.status;
    }

    if (validatedQuery.projectId) {
      whereClause.projectId = validatedQuery.projectId;
    }

    if (validatedQuery.startDate || validatedQuery.endDate) {
      whereClause.createdAt = {};
      if (validatedQuery.startDate) {
        whereClause.createdAt.gte = new Date(validatedQuery.startDate);
      }
      if (validatedQuery.endDate) {
        const endDate = new Date(validatedQuery.endDate);
        endDate.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = endDate;
      }
    }

    // Get transactions with pagination
    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
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
          createdAt: 'desc'
        },
        take: validatedQuery.limit || 50,
        skip: validatedQuery.offset || 0
      }),
      prisma.transaction.count({
        where: whereClause
      })
    ]);

    // Format transactions
    const formattedTransactions = transactions.map(transaction => ({
      id: transaction.id,
      type: transaction.transactionType,
      status: transaction.status,
      amount: Number(transaction.amount),
      commission: Number(transaction.commission),
      netAmount: Number(transaction.amount) - Number(transaction.commission),
      paymentMethod: transaction.paymentMethod,
      description: getTransactionDescription(transaction),
      project: transaction.project ? {
        id: transaction.project.id,
        title: transaction.project.order?.title,
        category: transaction.project.order?.category?.name
      } : null,
      createdAt: transaction.createdAt.toISOString(),
      completedAt: transaction.completedAt?.toISOString()
    }));

    // Calculate summary statistics
    const summary = {
      totalTransactions: totalCount,
      totalAmount: transactions.reduce((sum, t) => sum + Number(t.amount), 0),
      totalCommissions: transactions.reduce((sum, t) => sum + Number(t.commission), 0),
      byType: transactions.reduce((acc, t) => {
        acc[t.transactionType] = (acc[t.transactionType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byStatus: transactions.reduce((acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    // Calculate running balance (for display purposes)
    let runningBalance = 0;
    const transactionsWithBalance = formattedTransactions.map(transaction => {
      if (transaction.status === 'COMPLETED') {
        switch (transaction.type) {
          case 'PAYMENT':
            runningBalance += transaction.netAmount;
            break;
          case 'WITHDRAWAL':
            runningBalance -= transaction.amount;
            break;
          case 'REFUND':
            runningBalance -= transaction.amount;
            break;
          case 'COMMISSION':
            runningBalance -= transaction.amount;
            break;
        }
      }
      
      return {
        ...transaction,
        runningBalance: Math.round(runningBalance * 100) / 100
      };
    });

    // Group transactions by month for analytics
    const monthlyBreakdown = transactions.reduce((acc, t) => {
      const month = t.createdAt.toISOString().slice(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = {
          month,
          transactions: 0,
          totalAmount: 0,
          earnings: 0,
          withdrawals: 0
        };
      }
      
      acc[month].transactions++;
      acc[month].totalAmount += Number(t.amount);
      
      if (t.transactionType === 'PAYMENT' && t.status === 'COMPLETED') {
        acc[month].earnings += Number(t.amount) - Number(t.commission);
      } else if (t.transactionType === 'WITHDRAWAL' && t.status === 'COMPLETED') {
        acc[month].withdrawals += Number(t.amount);
      }
      
      return acc;
    }, {} as Record<string, any>);

    const response = {
      transactions: transactionsWithBalance,
      pagination: {
        total: totalCount,
        limit: validatedQuery.limit || 50,
        offset: validatedQuery.offset || 0,
        hasMore: (validatedQuery.offset || 0) + formattedTransactions.length < totalCount
      },
      summary,
      monthlyBreakdown: Object.values(monthlyBreakdown).sort((a: any, b: any) => 
        b.month.localeCompare(a.month)
      ),
      filters: {
        type: validatedQuery.type,
        status: validatedQuery.status,
        startDate: validatedQuery.startDate,
        endDate: validatedQuery.endDate,
        projectId: validatedQuery.projectId
      }
    };

    // Cache the response for 5 minutes
    await cache.set(cacheKey, response, 300);

    return createResponse(200, response);

  } catch (error) {
    console.error('Error getting transaction history:', error);
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(400, 'VALIDATION_ERROR', error.errors[0].message);
    }
    
    if (error.name === 'UnauthorizedError') {
      return createErrorResponse(401, 'UNAUTHORIZED', error.message);
    }

    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to get transaction history');
  } finally {
    await prisma.$disconnect();
  }
};

function getTransactionDescription(transaction: any): string {
  switch (transaction.transactionType) {
    case 'RESERVATION':
      return `Резервирование средств для проекта`;
    case 'PAYMENT':
      return `Оплата за выполненный проект`;
    case 'WITHDRAWAL':
      return `Вывод средств на ${transaction.paymentMethod || 'банковскую карту'}`;
    case 'REFUND':
      return `Возврат средств`;
    case 'COMMISSION':
      return `Комиссия платформы`;
    default:
      return `Транзакция ${transaction.transactionType}`;
  }
}