// DynamoDB Client

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

export const dynamodb = DynamoDBDocumentClient.from(client);

export const TABLE_NAME = process.env.DYNAMODB_TABLE || 'handshake-dev-table';

// Helper functions
export async function putItem(item: Record<string, any>) {
  return dynamodb.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: item,
  }));
}

export async function getItem(key: Record<string, any>) {
  const result = await dynamodb.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: key,
  }));
  return result.Item;
}

export async function queryItems(params: {
  KeyConditionExpression: string;
  ExpressionAttributeValues: Record<string, any>;
  ExpressionAttributeNames?: Record<string, string>;
  IndexName?: string;
  ScanIndexForward?: boolean;
  Limit?: number;
}) {
  const result = await dynamodb.send(new QueryCommand({
    TableName: TABLE_NAME,
    ...params,
  }));
  return result.Items || [];
}

export async function updateItem(params: {
  Key: Record<string, any>;
  UpdateExpression: string;
  ExpressionAttributeValues: Record<string, any>;
  ExpressionAttributeNames?: Record<string, string>;
}) {
  const result = await dynamodb.send(new UpdateCommand({
    TableName: TABLE_NAME,
    ...params,
    ReturnValues: 'ALL_NEW',
  }));
  return result.Attributes;
}

export async function deleteItem(key: Record<string, any>) {
  return dynamodb.send(new DeleteCommand({
    TableName: TABLE_NAME,
    Key: key,
  }));
}

export async function scanItems(params?: {
  FilterExpression?: string;
  ExpressionAttributeValues?: Record<string, any>;
  ExpressionAttributeNames?: Record<string, string>;
  Limit?: number;
}) {
  const result = await dynamodb.send(new ScanCommand({
    TableName: TABLE_NAME,
    ...params,
  }));
  return result.Items || [];
}
