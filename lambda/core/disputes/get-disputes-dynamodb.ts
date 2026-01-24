import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

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

    // Get query parameters
    const status = event.queryStringParameters?.status;
    const limit = parseInt(event.queryStringParameters?.limit || '20');
    const lastKey = event.queryStringParameters?.lastKey;

    // Query disputes for user
    const params: any = {
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `USER#${decoded.userId}#DISPUTES`,
      },
      Limit: limit,
      ScanIndexForward: false, // Most recent first
    };

    // Add status filter if provided
    if (status) {
      params.FilterExpression = '#status = :status';
      params.ExpressionAttributeNames = { '#status': 'status' };
      params.ExpressionAttributeValues[':status'] = status;
    }

    // Add pagination
    if (lastKey) {
      params.ExclusiveStartKey = JSON.parse(Buffer.from(lastKey, 'base64').toString());
    }

    const result = await docClient.send(new QueryCommand(params));

    // Format response
    const disputes = (result.Items || []).map(item => ({
      id: item.SK.replace('DISPUTE#', ''),
      project_id: item.projectId,
      project_title: item.projectTitle,
      order_title: item.orderTitle,
      initiator: {
        id: item.initiatorId,
        name: item.initiatorName,
        avatar: item.initiatorAvatar,
        role: item.initiatorRole,
      },
      respondent: {
        id: item.respondentId,
        name: item.respondentName,
        avatar: item.respondentAvatar,
        role: item.respondentRole,
      },
      reason: item.reason,
      description: item.description,
      status: item.status,
      priority: item.priority || 'medium',
      resolution: item.resolution,
      resolution_type: item.resolutionType,
      amount_disputed: item.amountDisputed,
      amount_resolved: item.amountResolved,
      messages_count: item.messagesCount || 0,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
      resolved_at: item.resolvedAt,
      closed_at: item.closedAt,
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
        results: disputes,
        count: disputes.length,
        next: nextKey,
      }),
    };
  } catch (error: any) {
    console.error('Error fetching disputes:', error);

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
      body: JSON.stringify({ error: 'Failed to fetch disputes' }),
    };
  }
};
