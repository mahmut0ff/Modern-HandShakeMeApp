// Transaction Repository for DynamoDB

import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryItems } from '../db/dynamodb-client';
import { Keys } from '../db/dynamodb-keys';

export interface Transaction {
  id: string;
  userId: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'PAYMENT' | 'REFUND' | 'COMMISSION';
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  description: string;
  projectId?: string;
  orderId?: string;
  paymentMethod?: string;
  externalId?: string;
  createdAt: string;
  completedAt?: string;
}

export class TransactionRepository {
  async create(data: Partial<Transaction>): Promise<Transaction> {
    const transaction: Transaction = {
      id: uuidv4(),
      userId: data.userId!,
      type: data.type!,
      amount: data.amount!,
      currency: data.currency || 'KZT',
      status: data.status || 'PENDING',
      description: data.description!,
      projectId: data.projectId,
      orderId: data.orderId,
      paymentMethod: data.paymentMethod,
      externalId: data.externalId,
      createdAt: new Date().toISOString(),
      completedAt: data.completedAt,
    };
    
    await putItem({
      ...Keys.transaction(transaction.userId, transaction.id),
      ...transaction,
    });
    
    return transaction;
  }
  
  async findById(userId: string, transactionId: string): Promise<Transaction | null> {
    const item = await getItem(Keys.transaction(userId, transactionId));
    return item as Transaction | null;
  }
  
  async findByUser(userId: string, limit = 50): Promise<Transaction[]> {
    const items = await queryItems({
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'TXN#',
      },
      ScanIndexForward: false,
      Limit: limit,
    });
    
    return items as Transaction[];
  }
}
