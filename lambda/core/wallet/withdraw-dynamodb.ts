import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { TransactionRepository } from '../shared/repositories/transaction.repository';
import { verifyToken } from '../shared/services/token';

const withdrawSchema = z.object({
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
    const data = withdrawSchema.parse(body);

    // Check balance
    const transactionRepo = new TransactionRepository();
    const transactions = await transactionRepo.findByUser(decoded.userId);

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

    if (balance < data.amount) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Insufficient balance' }),
      };
    }

    const transaction = await transactionRepo.create({
      userId: decoded.userId,
      type: 'WITHDRAWAL',
      amount: data.amount,
      currency: 'KZT',
      status: 'PENDING',
      description: 'Вывод средств',
      paymentMethod: data.paymentMethod,
    });

    // TODO: Integrate with payment provider
    // For now, just return pending transaction

    return {
      statusCode: 201,
      body: JSON.stringify(transaction),
    };
  } catch (error: any) {
    console.error('Withdraw error:', error);
    return {
      statusCode: error.name === 'ZodError' ? 400 : 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
