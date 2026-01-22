import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { TransactionRepository } from '../shared/repositories/transaction.repository';
import { verifyToken } from '../shared/services/token';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const token = event.headers.Authorization?.replace('Bearer ', '');
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const decoded = verifyToken(token);
    const transactionRepo = new TransactionRepository();
    const transactions = await transactionRepo.findByUser(decoded.userId);

    // Calculate balance
    let balance = 0;
    for (const txn of transactions) {
      if (txn.status === 'COMPLETED') {
        if (txn.type === 'DEPOSIT' || txn.type === 'REFUND') {
          balance += txn.amount;
        } else if (txn.type === 'WITHDRAWAL' || txn.type === 'PAYMENT' || txn.type === 'COMMISSION') {
          balance -= txn.amount;
        }
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        balance,
        currency: 'KZT',
        userId: decoded.userId,
      }),
    };
  } catch (error: any) {
    console.error('Get wallet error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
