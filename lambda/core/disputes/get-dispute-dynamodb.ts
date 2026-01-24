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

    // Get dispute details
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

    // Verify user has access to this dispute
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

    // Get evidence files
    const evidenceResult = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `DISPUTE#${disputeId}`,
          ':sk': 'EVIDENCE#',
        },
      })
    );

    const evidence_files = (evidenceResult.Items || []).map(item => ({
      id: item.SK.replace('EVIDENCE#', ''),
      file_url: item.fileUrl,
      file_name: item.fileName,
      file_type: item.fileType,
      file_size: item.fileSize,
      uploaded_by: item.uploadedBy,
      uploaded_at: item.uploadedAt,
    }));

    // Format response
    const response = {
      id: disputeId,
      project: {
        id: dispute.projectId,
        title: dispute.projectTitle,
        order_title: dispute.orderTitle,
      },
      initiator: {
        id: dispute.initiatorId,
        name: dispute.initiatorName,
        avatar: dispute.initiatorAvatar,
        role: dispute.initiatorRole,
      },
      respondent: {
        id: dispute.respondentId,
        name: dispute.respondentName,
        avatar: dispute.respondentAvatar,
        role: dispute.respondentRole,
      },
      reason: dispute.reason,
      description: dispute.description,
      status: dispute.status,
      priority: dispute.priority || 'medium',
      resolution: dispute.resolution,
      resolution_type: dispute.resolutionType,
      amount_disputed: dispute.amountDisputed,
      amount_resolved: dispute.amountResolved,
      evidence_files,
      messages_count: dispute.messagesCount || 0,
      created_at: dispute.createdAt,
      updated_at: dispute.updatedAt,
      resolved_at: dispute.resolvedAt,
      closed_at: dispute.closedAt,
      mediator: dispute.mediatorId
        ? {
            id: dispute.mediatorId,
            name: dispute.mediatorName,
          }
        : undefined,
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(response),
    };
  } catch (error: any) {
    console.error('Error fetching dispute:', error);

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
      body: JSON.stringify({ error: 'Failed to fetch dispute' }),
    };
  }
};
