import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

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

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { reason } = body;

    // Get dispute
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

    // Verify user is involved in dispute
    if (
      dispute.initiatorId !== decoded.userId &&
      dispute.respondentId !== decoded.userId
    ) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Access denied' }),
      };
    }

    // Check if dispute can be escalated
    if (dispute.status === 'escalated') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Dispute is already escalated' }),
      };
    }

    if (dispute.status === 'closed') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Cannot escalate closed dispute' }),
      };
    }

    const now = new Date().toISOString();

    // Update dispute status
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `DISPUTE#${disputeId}`,
          SK: `DISPUTE#${disputeId}`,
        },
        UpdateExpression:
          'SET #status = :status, #priority = :priority, #updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#priority': 'priority',
          '#updatedAt': 'updatedAt',
        },
        ExpressionAttributeValues: {
          ':status': 'escalated',
          ':priority': 'urgent',
          ':updatedAt': now,
        },
      })
    );

    // Add timeline entry
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `DISPUTE#${disputeId}`,
          SK: `TIMELINE#${Date.now()}`,
          action: 'DISPUTE_ESCALATED',
          description: reason || 'Dispute escalated to admin review',
          userId: decoded.userId,
          createdAt: now,
        },
      })
    );

    // TODO: Send notification to admin team

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        id: disputeId,
        status: 'escalated',
        priority: 'urgent',
        updated_at: now,
        message: 'Dispute escalated to admin review',
      }),
    };
  } catch (error: any) {
    console.error('Error escalating dispute:', error);

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
      body: JSON.stringify({ error: 'Failed to escalate dispute' }),
    };
  }
};
