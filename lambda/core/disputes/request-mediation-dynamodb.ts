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

    const body = JSON.parse(event.body || '{}');
    const { reason } = body;

    const disputeResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: `DISPUTE#${disputeId}`, SK: `DISPUTE#${disputeId}` },
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

    if (dispute.status === 'in_mediation') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Mediation already requested' }),
      };
    }

    if (dispute.status === 'closed' || dispute.status === 'resolved') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Cannot request mediation for closed/resolved dispute' }),
      };
    }

    const now = new Date().toISOString();

    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: `DISPUTE#${disputeId}`, SK: `DISPUTE#${disputeId}` },
        UpdateExpression: 'SET #status = :status, priority = :priority, updatedAt = :now',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':status': 'in_mediation',
          ':priority': 'high',
          ':now': now,
        },
      })
    );

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `DISPUTE#${disputeId}`,
          SK: `TIMELINE#${Date.now()}`,
          action: 'MEDIATION_REQUESTED',
          description: reason || 'Mediation requested',
          userId: decoded.userId,
          createdAt: now,
        },
      })
    );

    // TODO: Notify admin/mediator team

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        id: disputeId,
        status: 'in_mediation',
        priority: 'high',
        updated_at: now,
        message: 'Mediation requested successfully',
      }),
    };
  } catch (error: any) {
    console.error('Error requesting mediation:', error);
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
      body: JSON.stringify({ error: 'Failed to request mediation' }),
    };
  }
};
