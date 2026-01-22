import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'handshake-table';

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
    const { method_type, provider, name, details, is_default } = body;

    if (!method_type || !provider || !name) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    const methodId = uuidv4();
    const paymentMethod = {
      methodId,
      userId: decoded.userId,
      methodType: method_type,
      provider,
      name,
      details: details || {},
      isDefault: is_default || false,
      isVerified: false,
      createdAt: new Date().toISOString()
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `USER#${decoded.userId}`,
        SK: `PAYMENT_METHOD#${methodId}`,
        ...paymentMethod
      }
    }));

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: methodId,
        method_type,
        provider,
        name,
        is_default: is_default || false,
        is_verified: false,
        created_at: paymentMethod.createdAt
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
