import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'handshake-table';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { refresh } = body;

    if (!refresh) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Refresh token is required' })
      };
    }

    // Add token to blacklist
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `TOKEN#${refresh}`,
        SK: 'BLACKLIST',
        token: refresh,
        blacklistedAt: new Date().toISOString(),
        expiresAt: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
      }
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Logged out successfully' })
    };
  } catch (error) {
    console.error('Error logging out:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
