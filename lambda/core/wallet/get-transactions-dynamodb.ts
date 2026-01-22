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

    return {
      statusCode: 200,
      body: JSON.stringify(transactions),
    };
  } catch (error: any) {
    console.error('Get transactions error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
