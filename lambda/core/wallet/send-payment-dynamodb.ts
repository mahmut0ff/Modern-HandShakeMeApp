import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { TransactionRepository } from '../shared/repositories/transaction.repository';
import { v4 as uuidv4 } from 'uuid';

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

    const body = JSON.parse(event.body || '{}');
    const { recipient_id, amount, description, order_id, project_id } = body;

    if (!recipient_id || !amount) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Create transaction for sender (debit)
    const senderTransaction = await transactionRepository.create({
      userId: decoded.userId,
      type: 'PAYMENT_SENT',
      amount: amount.toString(),
      status: 'COMPLETED',
      description: description || `Payment to user ${recipient_id}`,
      relatedObjectType: order_id ? 'ORDER' : project_id ? 'PROJECT' : undefined,
      relatedObjectId: order_id || project_id
    });

    // Create transaction for recipient (credit)
    const recipientTransaction = await transactionRepository.create({
      userId: recipient_id,
      type: 'PAYMENT_RECEIVED',
      amount: amount.toString(),
      status: 'COMPLETED',
      description: description || `Payment from user ${decoded.userId}`,
      relatedObjectType: order_id ? 'ORDER' : project_id ? 'PROJECT' : undefined,
      relatedObjectId: order_id || project_id
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: senderTransaction.transactionId,
        transaction_type: 'payment',
        amount: amount.toString(),
        status: 'completed',
        recipient_id,
        created_at: senderTransaction.createdAt
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
