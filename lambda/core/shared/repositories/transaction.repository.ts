import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'handshake-table';

export interface Transaction {
  id: string;
  userId: string;
  type: 'BACKGROUND_CHECK_PAYMENT' | 'ORDER_PAYMENT' | 'WITHDRAWAL' | 'REFUND' | 'DEPOSIT' | 'PAYMENT_SENT' | 'PAYMENT_RECEIVED' | 'PAYMENT' | 'COMMISSION' | 'RESERVED';
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'RESERVED';
  relatedObjectType?: 'BACKGROUND_CHECK' | 'ORDER' | 'PROJECT';
  relatedObjectId?: string;
  description: string;
  paymentMethod?: string;
  externalTransactionId?: string;
  failureReason?: string;
  createdAt: string;
  completedAt?: string;
  updatedAt: string;
}

export class TransactionRepository {
  async create(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const transaction: Transaction = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `USER#${data.userId}`,
        SK: `TRANSACTION#${id}`,
        GSI1PK: 'TRANSACTION',
        GSI1SK: `STATUS#${data.status}#${now}`,
        GSI2PK: `TRANSACTION#${data.type}`,
        GSI2SK: `USER#${data.userId}#${now}`,
        ...transaction
      }
    }));

    return transaction;
  }

  async findById(id: string): Promise<Transaction | null> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      FilterExpression: 'id = :id',
      ExpressionAttributeValues: {
        ':pk': 'TRANSACTION',
        ':id': id
      },
      Limit: 1
    }));

    return result.Items?.[0] as Transaction || null;
  }

  async findByUser(userId: string, limit = 50): Promise<Transaction[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'TRANSACTION#'
      },
      Limit: limit,
      ScanIndexForward: false
    }));

    return (result.Items || []) as Transaction[];
  }

  async update(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const currentTransaction = await this.findById(id);
    if (!currentTransaction) {
      throw new Error('Transaction not found');
    }

    const now = new Date().toISOString();
    const updateExpressions: string[] = ['updatedAt = :updatedAt'];
    const expressionAttributeValues: any = { ':updatedAt': now };

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'userId' && key !== 'createdAt' && value !== undefined) {
        updateExpressions.push(`${key} = :${key}`);
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    // Update GSI1SK if status changed
    if (updates.status) {
      updateExpressions.push('GSI1SK = :gsi1sk');
      expressionAttributeValues[':gsi1sk'] = `STATUS#${updates.status}#${now}`;
    }

    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${currentTransaction.userId}`,
        SK: `TRANSACTION#${id}`
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }));

    return result.Attributes as Transaction;
  }

  async findByStatus(status: string, limit = 50): Promise<Transaction[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': 'TRANSACTION',
        ':sk': `STATUS#${status}#`
      },
      Limit: limit,
      ScanIndexForward: false
    }));

    return (result.Items || []) as Transaction[];
  }

  async findByRelatedObject(objectType: string, objectId: string): Promise<Transaction[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      FilterExpression: 'relatedObjectType = :objectType AND relatedObjectId = :objectId',
      ExpressionAttributeValues: {
        ':pk': 'TRANSACTION',
        ':objectType': objectType,
        ':objectId': objectId
      }
    }));

    return (result.Items || []) as Transaction[];
  }
}