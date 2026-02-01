/**
 * Get Financial Analytics
 * Получить финансовую аналитику
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.userId;
    const { startDate, endDate } = event.queryStringParameters || {};

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
        totalEarnings: 125000,
        totalWithdrawals: 45000,
        totalCommissions: 6250,
        netIncome: 73750,
        pendingPayments: 25000,
        availableBalance: 48750,
      },
      breakdown: {
        earnings: {
          fromOrders: 110000,
          fromProjects: 15000,
          bonuses: 0,
          tips: 0,
        },
        deductions: {
          platformFee: 6250,
          taxes: 0,
          refunds: 0,
          chargebacks: 0,
        },
        withdrawals: {
          total: 45000,
          count: 5,
          averageAmount: 9000,
          lastWithdrawal: {
            amount: 10000,
            date: '2024-05-15',
            status: 'completed',
          },
        },
      },
      cashFlow: [
        { date: '2024-01', income: 18000, expenses: 900, net: 17100 },
        { date: '2024-02', income: 22000, expenses: 1100, net: 20900 },
        { date: '2024-03', income: 28000, expenses: 1400, net: 26600 },
        { date: '2024-04', income: 31000, expenses: 1550, net: 29450 },
        { date: '2024-05', income: 26000, expenses: 1300, net: 24700 },
      ],
      projections: {
        nextMonth: {
          estimatedEarnings: 28000,
          estimatedCommissions: 1400,
          estimatedNet: 26600,
          confidence: 0.85,
        },
        nextQuarter: {
          estimatedEarnings: 85000,
          estimatedCommissions: 4250,
          estimatedNet: 80750,
          confidence: 0.75,
        },
      },
      paymentMethods: [
        { method: 'bank_transfer', count: 30, amount: 95000, percentage: 76 },
        { method: 'cash', count: 10, amount: 25000, percentage: 20 },
        { method: 'card', count: 5, amount: 5000, percentage: 4 },
      ],
      insights: [
        {
          type: 'opportunity',
          title: 'Рост доходов',
          description: 'Ваши доходы выросли на 15.5% за последний месяц',
          impact: 'positive',
        },
        {
          type: 'warning',
          title: 'Ожидающие платежи',
          description: 'У вас есть 25,000 сом в ожидающих платежах',
          impact: 'neutral',
        },
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
    console.error('Error getting financial analytics:', error);
    
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
