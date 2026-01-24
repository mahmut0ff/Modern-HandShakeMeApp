import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'handshake-table';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JWTPayload {
  userId: string;
  role: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
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
    const { message, message_type = 'text', is_internal = false } = body;

    if (!message || message.trim().length === 0) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Message is required' }),
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
    const isInvolved =
      dispute.initiatorId === decoded.userId ||
      dispute.respondentId === decoded.userId ||
      decoded.role === 'admin';

    if (!isInvolved) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Access denied' }),
      };
    }

    // Check if dispute is closed
    if (dispute.status === 'closed') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Cannot send message to closed dispute' }),
      };
    }

    const messageId = uuidv4();
    const now = new Date().toISOString();

    // Create message
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `DISPUTE#${disputeId}`,
          SK: `MESSAGE#${now}#${messageId}`,
          senderId: decoded.userId,
          senderName: `${decoded.firstName || ''} ${decoded.lastName || ''}`.trim(),
          senderAvatar: decoded.avatar || null,
          senderRole: decoded.role,
          message: message.trim(),
          messageType: message_type,
          isInternal: is_internal,
          createdAt: now,
        },
      })
    );

    // Update dispute messages count
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `DISPUTE#${disputeId}`,
          SK: `DISPUTE#${disputeId}`,
        },
        UpdateExpression:
          'SET messagesCount = if_not_exists(messagesCount, :zero) + :inc, updatedAt = :now',
        ExpressionAttributeValues: {
          ':zero': 0,
          ':inc': 1,
          ':now': now,
        },
      })
    );

    // TODO: Send notification to other party

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        id: messageId,
        dispute: disputeId,
        sender: {
          id: decoded.userId,
          name: `${decoded.firstName || ''} ${decoded.lastName || ''}`.trim(),
          avatar: decoded.avatar || null,
          role: decoded.role,
        },
        message: message.trim(),
        message_type,
        is_internal,
        created_at: now,
      }),
    };
  } catch (error: any) {
    console.error('Error sending dispute message:', error);

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
      body: JSON.stringify({ error: 'Failed to send message' }),
    };
  }
};
