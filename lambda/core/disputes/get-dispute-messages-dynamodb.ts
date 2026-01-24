import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'handshake-table';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JWTPayload {
  userId: string;
  role: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Verify JWT token
    const token = event.headers.Authorization?.replace('Bearer ', '') || '';
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    const disputeId = event.pathParameters?.id;
    if (!disputeId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Dispute ID is required' }),
      };
    }

    // Get dispute to verify access
    const disputeResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `DISPUTE#${disputeId}`,
          SK: `DISPUTE#${disputeId}`,
        },
      })
    );

    if (!disputeResult.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Dispute not found' }),
      };
    }

    const dispute = disputeResult.Item;

    // Verify user has access
    if (
      dispute.initiatorId !== decoded.userId &&
      dispute.respondentId !== decoded.userId &&
      decoded.role !== 'admin'
    ) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Access denied' }),
      };
    }

    // Get query parameters
    const limit = parseInt(event.queryStringParameters?.limit || '50');
    const lastKey = event.queryStringParameters?.lastKey;

    // Query messages
    const params: any = {
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `DISPUTE#${disputeId}`,
        ':sk': 'MESSAGE#',
      },
      Limit: limit,
      ScanIndexForward: true, // Oldest first
    };

    if (lastKey) {
      params.ExclusiveStartKey = JSON.parse(Buffer.from(lastKey, 'base64').toString());
    }

    const result = await docClient.send(new QueryCommand(params));

    // Format messages
    const messages = (result.Items || []).map(item => ({
      id: item.SK.replace('MESSAGE#', ''),
      dispute: disputeId,
      sender: {
        id: item.senderId,
        name: item.senderName,
        avatar: item.senderAvatar,
        role: item.senderRole,
      },
      message: item.message,
      message_type: item.messageType || 'text',
      is_internal: item.isInternal || false,
      created_at: item.createdAt,
    }));

    // Prepare pagination token
    const nextKey = result.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
      : null;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        results: messages,
        count: messages.length,
        next: nextKey,
      }),
    };
  } catch (error: any) {
    console.error('Error fetching dispute messages:', error);

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to fetch messages' }),
    };
  }
};
