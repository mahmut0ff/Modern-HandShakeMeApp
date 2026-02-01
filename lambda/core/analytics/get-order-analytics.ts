/**
 * Get Order Analytics
 * Получить аналитику по заказам
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.userId;
    const { startDate, endDate, category } = event.queryStringParameters || {};

    if (!userId) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    // Mock data
    const analytics = {
      summary: {
        totalOrders: 45,
        completedOrders: 38,
        inProgressOrders: 7,
        cancelledOrders: 0,
        averageOrderValue: 2777,
        totalRevenue: 125000,
      },
      trends: {
        ordersGrowth: 12.3,
        revenueGrowth: 15.5,
        averageValueGrowth: 2.8,
      },
      byStatus: [
        { status: 'pending', count: 3, percentage: 6.7, revenue: 8000 },
        { status: 'accepted', count: 4, percentage: 8.9, revenue: 12000 },
        { status: 'in_progress', count: 7, percentage: 15.6, revenue: 20000 },
        { status: 'completed', count: 31, percentage: 68.9, revenue: 85000 },
        { status: 'cancelled', count: 0, percentage: 0, revenue: 0 },
      ],
      byCategory: [
        { category: 'Сантехника', orders: 15, revenue: 45000, avgValue: 3000 },
        { category: 'Электрика', orders: 12, revenue: 35000, avgValue: 2916 },
        { category: 'Ремонт', orders: 10, revenue: 25000, avgValue: 2500 },
        { category: 'Отделка', orders: 8, revenue: 20000, avgValue: 2500 },
      ],
      byPeriod: [
        { period: '2024-01', orders: 8, revenue: 18000, avgValue: 2250 },
        { period: '2024-02', orders: 9, revenue: 22000, avgValue: 2444 },
        { period: '2024-03', orders: 10, revenue: 28000, avgValue: 2800 },
        { period: '2024-04', orders: 11, revenue: 31000, avgValue: 2818 },
        { period: '2024-05', orders: 7, revenue: 26000, avgValue: 3714 },
      ],
      topOrders: [
        { id: '1', title: 'Ремонт ванной', revenue: 8500, status: 'completed', date: '2024-05-15' },
        { id: '2', title: 'Электропроводка', revenue: 7200, status: 'completed', date: '2024-05-10' },
        { id: '3', title: 'Установка сантехники', revenue: 6800, status: 'in_progress', date: '2024-05-20' },
      ],
      timeRange: {
        startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: endDate || new Date().toISOString(),
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
    console.error('Error getting order analytics:', error);
    
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
