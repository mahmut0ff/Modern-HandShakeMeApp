import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { TransactionRepository } from '../shared/repositories/transaction.repository';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const transactionRepository = new TransactionRepository();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Authorization required' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded: any = jwt.verify(token, JWT_SECRET);

    const { period = 'month' } = event.queryStringParameters || {};

    // Get all transactions
    const transactions = await transactionRepository.findByUser(decoded.userId);

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Filter transactions by period
    const periodTransactions = transactions.filter(t => 
      new Date(t.createdAt) >= startDate
    );

    // Calculate statistics
    let totalEarned = 0;
    let totalSpent = 0;
    let pendingEarnings = 0;
    let thisMonthEarnings = 0;
    let thisMonthSpending = 0;

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    transactions.forEach(t => {
      const amount = parseFloat(t.amount);
      
      if (t.type === 'DEPOSIT' || t.type === 'PAYMENT_RECEIVED') {
        totalEarned += amount;
        if (t.status === 'PENDING') {
          pendingEarnings += amount;
        }
        if (new Date(t.createdAt) >= monthStart) {
          thisMonthEarnings += amount;
        }
      } else if (t.type === 'WITHDRAW' || t.type === 'PAYMENT_SENT') {
        totalSpent += amount;
        if (new Date(t.createdAt) >= monthStart) {
          thisMonthSpending += amount;
        }
      }
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        total_earned: totalEarned.toFixed(2),
        total_spent: totalSpent.toFixed(2),
        pending_earnings: pendingEarnings.toFixed(2),
        this_month_earnings: thisMonthEarnings.toFixed(2),
        this_month_spending: thisMonthSpending.toFixed(2),
        transactions_count: transactions.length
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
