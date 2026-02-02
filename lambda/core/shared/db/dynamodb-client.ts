// DynamoDB Client with retry logic and error handling

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  QueryCommand, 
  UpdateCommand, 
  DeleteCommand, 
  ScanCommand,
  TransactWriteCommand,
  BatchGetCommand,
  BatchWriteCommand
} from '@aws-sdk/lib-dynamodb';
import { logger } from '../utils/logger';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  maxAttempts: 3,
});

export const dynamodb = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    convertEmptyValues: false,
    removeUndefinedValues: true,
    convertClassInstanceToMap: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

export const TABLE_NAME = process.env.DYNAMODB_TABLE || 'handshake-dev-table';

// Retry configuration
const MAX_RETRIES = 3;
const BASE_DELAY = 100; // milliseconds

// Helper function for exponential backoff
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Generic retry wrapper
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  context?: Record<string, any>
): Promise<T> {
  let lastError: Error = new Error('Unknown error');
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on validation errors or resource not found
      if (error.name === 'ValidationException' || 
          error.name === 'ResourceNotFoundException' ||
          error.name === 'ConditionalCheckFailedException') {
        throw error;
      }
      
      // Don't retry on the last attempt
      if (attempt === MAX_RETRIES) {
        break;
      }
      
      // Calculate delay with exponential backoff and jitter
      const delayMs = BASE_DELAY * Math.pow(2, attempt - 1) + Math.random() * 100;
      
      logger.warn(`${operationName} failed, retrying in ${delayMs}ms`, {
        attempt,
        error: error.message,
        ...context
      });
      
      await delay(delayMs);
    }
  }
  
  logger.error(`${operationName} failed after ${MAX_RETRIES} attempts`, lastError, context);
  throw lastError;
}

// Helper functions with retry logic
export async function putItem(item: Record<string, any>): Promise<void> {
  await withRetry(
    () => dynamodb.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    })),
    'putItem',
    { itemKeys: Object.keys(item).slice(0, 5) } // Log first 5 keys for context
  );
}

export async function getItem(key: Record<string, any>): Promise<Record<string, any> | undefined> {
  const result = await withRetry(
    () => dynamodb.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: key,
    })),
    'getItem',
    { key }
  );
  return result.Item;
}

export interface QueryResult {
  items: Record<string, any>[];
  lastEvaluatedKey?: Record<string, any>;
}

export async function queryItems(params: {
  KeyConditionExpression: string;
  ExpressionAttributeValues: Record<string, any>;
  ExpressionAttributeNames?: Record<string, string>;
  IndexName?: string;
  ScanIndexForward?: boolean;
  Limit?: number;
  FilterExpression?: string;
  Select?: 'ALL_ATTRIBUTES' | 'ALL_PROJECTED_ATTRIBUTES' | 'SPECIFIC_ATTRIBUTES' | 'COUNT';
  ExclusiveStartKey?: Record<string, any>;
}): Promise<Record<string, any>[]> {
  const result = await withRetry(
    () => dynamodb.send(new QueryCommand({
      TableName: TABLE_NAME,
      ...params,
    })),
    'queryItems',
    { 
      indexName: params.IndexName,
      limit: params.Limit,
      hasFilter: !!params.FilterExpression
    }
  );
  return result.Items || [];
}

export async function queryItemsWithPagination(params: {
  KeyConditionExpression: string;
  ExpressionAttributeValues: Record<string, any>;
  ExpressionAttributeNames?: Record<string, string>;
  IndexName?: string;
  ScanIndexForward?: boolean;
  Limit?: number;
  FilterExpression?: string;
  Select?: 'ALL_ATTRIBUTES' | 'ALL_PROJECTED_ATTRIBUTES' | 'SPECIFIC_ATTRIBUTES' | 'COUNT';
  ExclusiveStartKey?: Record<string, any>;
}): Promise<QueryResult> {
  const result = await withRetry(
    () => dynamodb.send(new QueryCommand({
      TableName: TABLE_NAME,
      ...params,
    })),
    'queryItemsWithPagination',
    { 
      indexName: params.IndexName,
      limit: params.Limit,
      hasFilter: !!params.FilterExpression
    }
  );
  return {
    items: result.Items || [],
    lastEvaluatedKey: result.LastEvaluatedKey
  };
}

export async function updateItem(params: {
  Key: Record<string, any>;
  UpdateExpression: string;
  ExpressionAttributeValues: Record<string, any>;
  ExpressionAttributeNames?: Record<string, string>;
  ConditionExpression?: string;
}): Promise<Record<string, any> | undefined> {
  const result = await withRetry(
    () => dynamodb.send(new UpdateCommand({
      TableName: TABLE_NAME,
      ...params,
      ReturnValues: 'ALL_NEW',
    })),
    'updateItem',
    { key: params.Key }
  );
  return result.Attributes;
}

export async function deleteItem(key: Record<string, any>): Promise<void> {
  await withRetry(
    () => dynamodb.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: key,
    })),
    'deleteItem',
    { key }
  );
}

export async function scanItems(params?: {
  FilterExpression?: string;
  ExpressionAttributeValues?: Record<string, any>;
  ExpressionAttributeNames?: Record<string, string>;
  Limit?: number;
  ExclusiveStartKey?: Record<string, any>;
}): Promise<Record<string, any>[]> {
  const result = await withRetry(
    () => dynamodb.send(new ScanCommand({
      TableName: TABLE_NAME,
      ...params,
    })),
    'scanItems',
    { 
      limit: params?.Limit,
      hasFilter: !!params?.FilterExpression
    }
  );
  return result.Items || [];
}

// Transaction support
export async function transactWrite(items: Array<{
  Put?: {
    TableName: string;
    Item: Record<string, any>;
    ConditionExpression?: string;
    ExpressionAttributeNames?: Record<string, string>;
    ExpressionAttributeValues?: Record<string, any>;
  };
  Update?: {
    TableName: string;
    Key: Record<string, any>;
    UpdateExpression: string;
    ConditionExpression?: string;
    ExpressionAttributeNames?: Record<string, string>;
    ExpressionAttributeValues?: Record<string, any>;
  };
  Delete?: {
    TableName: string;
    Key: Record<string, any>;
    ConditionExpression?: string;
    ExpressionAttributeNames?: Record<string, string>;
    ExpressionAttributeValues?: Record<string, any>;
  };
}>): Promise<void> {
  await withRetry(
    () => dynamodb.send(new TransactWriteCommand({
      TransactItems: items,
    })),
    'transactWrite',
    { itemCount: items.length }
  );
}

// Batch operations
export async function batchGetItems(keys: Array<{
  [tableName: string]: {
    Keys: Record<string, any>[];
    ProjectionExpression?: string;
    ExpressionAttributeNames?: Record<string, string>;
  };
}>): Promise<Record<string, Record<string, any>[]>> {
  const result = await withRetry(
    () => dynamodb.send(new BatchGetCommand({
      RequestItems: keys[0],
    })),
    'batchGetItems',
    { keyCount: Object.values(keys[0])[0]?.Keys?.length || 0 }
  );
  return result.Responses || {};
}

export async function batchWriteItems(items: Array<{
  [tableName: string]: Array<{
    PutRequest?: {
      Item: Record<string, any>;
    };
    DeleteRequest?: {
      Key: Record<string, any>;
    };
  }>;
}>): Promise<void> {
  await withRetry(
    () => dynamodb.send(new BatchWriteCommand({
      RequestItems: items[0],
    })),
    'batchWriteItems',
    { itemCount: Object.values(items[0])[0]?.length || 0 }
  );
}

// Utility functions for common patterns
export async function putItemWithCondition(
  item: Record<string, any>,
  conditionExpression: string,
  expressionAttributeNames?: Record<string, string>,
  expressionAttributeValues?: Record<string, any>
): Promise<void> {
  await withRetry(
    () => dynamodb.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
      ConditionExpression: conditionExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    })),
    'putItemWithCondition',
    { condition: conditionExpression }
  );
}

export async function updateItemWithCondition(
  key: Record<string, any>,
  updateExpression: string,
  conditionExpression: string,
  expressionAttributeNames?: Record<string, string>,
  expressionAttributeValues?: Record<string, any>
): Promise<Record<string, any> | undefined> {
  const result = await withRetry(
    () => dynamodb.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: key,
      UpdateExpression: updateExpression,
      ConditionExpression: conditionExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    })),
    'updateItemWithCondition',
    { key, condition: conditionExpression }
  );
  return result.Attributes;
}

// Health check function
export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  details: {
    tableName: string;
    region: string;
    timestamp: string;
    latency?: number;
  };
}> {
  const startTime = Date.now();
  
  try {
    // Try a simple operation to test connectivity
    await dynamodb.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: 'HEALTH_CHECK', SK: 'TEST' },
    }));
    
    const latency = Date.now() - startTime;
    
    return {
      status: 'healthy',
      details: {
        tableName: TABLE_NAME,
        region: process.env.AWS_REGION || 'us-east-1',
        timestamp: new Date().toISOString(),
        latency,
      },
    };
  } catch (error) {
    logger.error('DynamoDB health check failed', error);
    
    return {
      status: 'unhealthy',
      details: {
        tableName: TABLE_NAME,
        region: process.env.AWS_REGION || 'us-east-1',
        timestamp: new Date().toISOString(),
      },
    };
  }
}
