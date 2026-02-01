/**
 * Get Master Analytics
 * Получить аналитику для мастера
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.userId;
    const { startDate, endDate, granularity = 'DAY' } = event.queryStringParameters || {};

    if (!userId) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    // Mock data - replace with actual database queries
    const analytics = {
      summary: {
        totalRevenue: 125000,
        totalOrders: 45,
        completedOrders: 38,
        averageRating: 4.7,
        completionRate: 84.4,
        responseTime: 2.5, // hours
        activeProjects: 7,
      },
      revenue: {
        total: 125000,
        byPeriod: [
          { timestamp: '2024-01-01', value: 18000, label: 'Янв' },
          { timestamp: '2024-02-01', value: 22000, label: 'Фев' },
          { timestamp: '2024-03-01', value: 28000, label: 'Мар' },
          { timestamp: '2024-04-01', value: 31000, label: 'Апр' },
          { timestamp: '2024-05-01', value: 26000, label: 'Май' },
        ],
        growth: 15.5,
        averageOrderValue: 2777,
      },
      orders: {
        total: 45,
        byStatus: [
          { status: 'completed', count: 38, percentage: 84.4 },
          { status: 'in_progress', count: 7, percentage: 15.6 },
          { status: 'cancelled', count: 0, percentage: 0 },
        ],
        completionRate: 84.4,
        growth: 12.3,
      },
      categories: [
        { category: 'Сантехника', orders: 15, revenue: 45000, percentage: 36 },
        { category: 'Электрика', orders: 12, revenue: 35000, percentage: 28 },
        { category: 'Ремонт', orders: 10, revenue: 25000, percentage: 20 },
        { category: 'Отделка', orders: 8, revenue: 20000, percentage: 16 },
      ],
      performance: {
        averageRating: 4.7,
        totalReviews: 42,
        ratingDistribution: [
          { rating: 5, count: 28, percentage: 66.7 },
          { rating: 4, count: 10, percentage: 23.8 },
          { rating: 3, count: 3, percentage: 7.1 },
          { rating: 2, count: 1, percentage: 2.4 },
          { rating: 1, count: 0, percentage: 0 },
        ],
        responseTime: 2.5,
        completionTime: 4.2, // days
      },
      clients: {
        total: 38,
        new: 12,
        returning: 26,
        retentionRate: 68.4,
        topClients: [
          { id: '1', name: 'Иван П.', orders: 5, revenue: 15000 },
          { id: '2', name: 'Мария К.', orders: 4, revenue: 12000 },
          { id: '3', name: 'Алексей С.', orders: 3, revenue: 9000 },
        ],
      },
      timeRange: {
        startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: endDate || new Date().toISOString(),
        granularity,
      },
      generatedAt: new Date().toISOString(),
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'private, max-age=300',
      },
      body: JSON.stringify(analytics)
    };

  } catch (error) {
    console.error('Error getting master analytics:', error);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
