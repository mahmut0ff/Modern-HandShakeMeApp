import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand, DeleteCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { BackgroundCheck, BackgroundCheckDispute, DisputeTimeline, VerificationBadge } from '../types';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'handshake-table';

export class BackgroundCheckRepository {
  // Background Check methods
  async createBackgroundCheck(userId: string, data: Omit<BackgroundCheck, 'id' | 'userId' | 'createdAt' | 'lastUpdated'>): Promise<BackgroundCheck> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const backgroundCheck: BackgroundCheck = {
      id,
      userId,
      ...data,
      createdAt: now,
      lastUpdated: now
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `USER#${userId}`,
        SK: `BACKGROUND_CHECK#${id}`,
        GSI1PK: 'BACKGROUND_CHECK',
        GSI1SK: `STATUS#${data.status}#${now}`,
        GSI2PK: `BACKGROUND_CHECK#${data.checkType}`,
        GSI2SK: `USER#${userId}#${now}`,
        ...backgroundCheck
      }
    }));

    return backgroundCheck;
  }

  async getBackgroundCheck(id: string): Promise<BackgroundCheck | null> {
    // Since we need to find by ID, we'll use GSI1 to query all background checks and filter
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      FilterExpression: 'id = :id',
      ExpressionAttributeValues: {
        ':pk': 'BACKGROUND_CHECK',
        ':id': id
      },
      Limit: 1
    }));

    return result.Items?.[0] as BackgroundCheck || null;
  }

  async getUserBackgroundChecks(userId: string, filters?: {
    status?: string;
    checkType?: string;
    limit?: number;
  }): Promise<BackgroundCheck[]> {
    let keyConditionExpression = 'PK = :pk AND begins_with(SK, :sk)';
    const expressionAttributeValues: any = {
      ':pk': `USER#${userId}`,
      ':sk': 'BACKGROUND_CHECK#'
    };

    let filterExpression = '';
    if (filters?.status) {
      filterExpression = 'status = :status';
      expressionAttributeValues[':status'] = filters.status;
    }
    if (filters?.checkType) {
      filterExpression = filterExpression ? 
        `${filterExpression} AND checkType = :checkType` : 
        'checkType = :checkType';
      expressionAttributeValues[':checkType'] = filters.checkType;
    }

    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: keyConditionExpression,
      ...(filterExpression && { FilterExpression: filterExpression }),
      ExpressionAttributeValues: expressionAttributeValues,
      Limit: filters?.limit || 50,
      ScanIndexForward: false
    }));

    return (result.Items || []) as BackgroundCheck[];
  }

  async getLatestUserBackgroundCheck(userId: string): Promise<BackgroundCheck | null> {
    const checks = await this.getUserBackgroundChecks(userId, { limit: 1 });
    return checks[0] || null;
  }

  async updateBackgroundCheck(id: string, updates: Partial<BackgroundCheck>): Promise<BackgroundCheck> {
    // First get the current item to find its PK/SK
    const currentCheck = await this.getBackgroundCheck(id);
    if (!currentCheck) {
      throw new Error('Background check not found');
    }

    const now = new Date().toISOString();
    const updateExpressions: string[] = ['lastUpdated = :lastUpdated'];
    const expressionAttributeValues: any = { ':lastUpdated': now };

    // Build update expression dynamically
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'userId' && key !== 'createdAt' && value !== undefined) {
        updateExpressions.push(`${key} = :${key}`);
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    // Update GSI1SK if status changed
    if (updates.status) {
      updateExpressions.push('GSI1SK = :gsi1sk');
      expressionAttributeValues[':gsi1sk'] = `STATUS#${updates.status}#${now}`;
    }

    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${currentCheck.userId}`,
        SK: `BACKGROUND_CHECK#${id}`
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }));

    return result.Attributes as BackgroundCheck;
  }

  async getBackgroundChecksByStatus(status: string, limit = 50): Promise<BackgroundCheck[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': 'BACKGROUND_CHECK',
        ':sk': `STATUS#${status}#`
      },
      Limit: limit,
      ScanIndexForward: false
    }));

    return (result.Items || []) as BackgroundCheck[];
  }

  // Dispute methods
  async createDispute(data: Omit<BackgroundCheckDispute, 'id' | 'createdAt'>): Promise<BackgroundCheckDispute> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const dispute: BackgroundCheckDispute = {
      id,
      ...data,
      createdAt: now
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `BACKGROUND_CHECK#${data.backgroundCheckId}`,
        SK: `DISPUTE#${id}`,
        GSI1PK: 'DISPUTE',
        GSI1SK: `STATUS#${data.status}#${now}`,
        GSI2PK: `USER#${data.userId}`,
        GSI2SK: `DISPUTE#${now}`,
        ...dispute
      }
    }));

    return dispute;
  }

  async getDispute(id: string): Promise<BackgroundCheckDispute | null> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      FilterExpression: 'id = :id',
      ExpressionAttributeValues: {
        ':pk': 'DISPUTE',
        ':id': id
      },
      Limit: 1
    }));

    return result.Items?.[0] as BackgroundCheckDispute || null;
  }

  async getBackgroundCheckDisputes(backgroundCheckId: string): Promise<BackgroundCheckDispute[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `BACKGROUND_CHECK#${backgroundCheckId}`,
        ':sk': 'DISPUTE#'
      },
      ScanIndexForward: false
    }));

    return (result.Items || []) as BackgroundCheckDispute[];
  }

  async updateDispute(id: string, updates: Partial<BackgroundCheckDispute>): Promise<BackgroundCheckDispute> {
    // First get the current dispute to find its PK/SK
    const currentDispute = await this.getDispute(id);
    if (!currentDispute) {
      throw new Error('Dispute not found');
    }

    const now = new Date().toISOString();
    const updateExpressions: string[] = [];
    const expressionAttributeValues: any = {};

    // Build update expression dynamically
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'backgroundCheckId' && key !== 'userId' && key !== 'createdAt' && value !== undefined) {
        updateExpressions.push(`${key} = :${key}`);
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    // Update GSI1SK if status changed
    if (updates.status) {
      updateExpressions.push('GSI1SK = :gsi1sk');
      expressionAttributeValues[':gsi1sk'] = `STATUS#${updates.status}#${now}`;
    }

    if (updateExpressions.length === 0) {
      return currentDispute;
    }

    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `BACKGROUND_CHECK#${currentDispute.backgroundCheckId}`,
        SK: `DISPUTE#${id}`
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }));

    return result.Attributes as BackgroundCheckDispute;
  }

  // Timeline methods
  async createTimelineEntry(data: Omit<DisputeTimeline, 'id'>): Promise<DisputeTimeline> {
    const id = uuidv4();

    const timeline: DisputeTimeline = {
      id,
      ...data
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `DISPUTE#${data.disputeId}`,
        SK: `TIMELINE#${data.performedAt}#${id}`,
        GSI1PK: `DISPUTE_TIMELINE#${data.disputeId}`,
        GSI1SK: data.performedAt,
        ...timeline
      }
    }));

    return timeline;
  }

  async getDisputeTimeline(disputeId: string): Promise<DisputeTimeline[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `DISPUTE#${disputeId}`,
        ':sk': 'TIMELINE#'
      },
      ScanIndexForward: true
    }));

    return (result.Items || []) as DisputeTimeline[];
  }

  // Verification Badge methods
  async createVerificationBadge(data: Omit<VerificationBadge, 'id'>): Promise<VerificationBadge> {
    const id = uuidv4();

    const badge: VerificationBadge = {
      id,
      ...data
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `USER#${data.userId}`,
        SK: `BADGE#${data.badgeType}`,
        GSI1PK: 'VERIFICATION_BADGE',
        GSI1SK: `USER#${data.userId}#${data.earnedAt}`,
        ...badge
      }
    }));

    return badge;
  }

  async getUserVerificationBadges(userId: string): Promise<VerificationBadge[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'BADGE#'
      }
    }));

    return (result.Items || []) as VerificationBadge[];
  }

  async updateVerificationBadge(userId: string, badgeType: string, updates: Partial<VerificationBadge>): Promise<VerificationBadge> {
    const updateExpressions: string[] = [];
    const expressionAttributeValues: any = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'userId' && key !== 'badgeType' && value !== undefined) {
        updateExpressions.push(`${key} = :${key}`);
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    if (updateExpressions.length === 0) {
      throw new Error('No updates provided');
    }

    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `BADGE#${badgeType}`
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }));

    return result.Attributes as VerificationBadge;
  }
}