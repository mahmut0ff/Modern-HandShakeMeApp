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
    const { resolution, resolution_type } = body;

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

    // Verify user has permission (admin or involved party)
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

    // Check if dispute can be closed
    if (dispute.status === 'closed') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Dispute is already closed' }),
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
          'SET #status = :status, #resolution = :resolution, #resolutionType = :resolutionType, #closedAt = :closedAt, #updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#resolution': 'resolution',
          '#resolutionType': 'resolutionType',
          '#closedAt': 'closedAt',
          '#updatedAt': 'updatedAt',
        },
        ExpressionAttributeValues: {
          ':status': 'closed',
          ':resolution': resolution || 'Dispute closed',
          ':resolutionType': resolution_type || 'no_action',
          ':closedAt': now,
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
          action: 'DISPUTE_CLOSED',
          description: resolution || 'Dispute closed',
          userId: decoded.userId,
          createdAt: now,
        },
      })
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        id: disputeId,
        status: 'closed',
        resolution,
        resolution_type,
        closed_at: now,
        updated_at: now,
      }),
    };
  } catch (error: any) {
    console.error('Error closing dispute:', error);

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
      body: JSON.stringify({ error: 'Failed to close dispute' }),
    };
  }
};
