import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { TransactionRepository } from '../shared/repositories/transaction.repository';
import { verifyToken } from '../shared/services/token';

const depositSchema = z.object({
  amount: z.number().positive(),
  paymentMethod: z.string(),
});

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const token = event.headers.Authorization?.replace('Bearer ', '');
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const decoded = verifyToken(token);
    const body = JSON.parse(event.body || '{}');
    const data = depositSchema.parse(body);

    const transactionRepo = new TransactionRepository();
    const transaction = await transactionRepo.create({
      userId: decoded.userId,
      type: 'DEPOSIT',
      amount: data.amount,
      currency: 'KZT',
      status: 'PENDING',
      description: 'Пополнение кошелька',
      paymentMethod: data.paymentMethod,
    });

    // TODO: Integrate with payment provider (Kaspi, CloudPayments, etc.)
    // For now, just return pending transaction

    return {
      statusCode: 201,
      body: JSON.stringify(transaction),
    };
  } catch (error: any) {
    console.error('Deposit error:', error);
    return {
      statusCode: error.name === 'ZodError' ? 400 : 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
