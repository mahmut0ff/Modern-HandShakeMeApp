import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand, DeleteCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { 
  CalendarIntegration, 
  CalendarSyncLog, 
  MasterAvailability, 
  BlockedTimeSlot, 
  CalendarEvent,
  CalendarSettings,
  CalendarSyncStats,
  CalendarConflict,
  RecurrencePattern
} from '../types';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'handshake-table';

export class CalendarRepository {
  // Calendar Integration methods
  async createCalendarIntegration(userId: string, data: Omit<CalendarIntegration, 'id' | 'userId' | 'createdAt'>): Promise<CalendarIntegration> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const integration: CalendarIntegration = {
      id,
      userId,
      ...data,
      createdAt: now
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `USER#${userId}`,
        SK: `CALENDAR_INTEGRATION#${data.provider}`,
        GSI1PK: 'CALENDAR_INTEGRATION',
        GSI1SK: `USER#${userId}#${data.provider}`,
        GSI2PK: `CALENDAR_PROVIDER#${data.provider}`,
        GSI2SK: `USER#${userId}#${now}`,
        ...integration
      }
    }));

    return integration;
  }

  async getCalendarIntegration(userId: string, provider: string): Promise<CalendarIntegration | null> {
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `CALENDAR_INTEGRATION#${provider}`
      }
    }));

    return result.Item as CalendarIntegration || null;
  }

  async getUserCalendarIntegrations(userId: string): Promise<CalendarIntegration[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'CALENDAR_INTEGRATION#'
      }
    }));

    return (result.Items || []) as CalendarIntegration[];
  }

  async updateCalendarIntegration(userId: string, provider: string, updates: Partial<CalendarIntegration>): Promise<CalendarIntegration> {
    const now = new Date().toISOString();
    const updateExpressions: string[] = [];
    const expressionAttributeValues: any = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'userId' && key !== 'provider' && key !== 'createdAt' && value !== undefined) {
        updateExpressions.push(`${key} = :${key}`);
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    if (updates.isActive !== undefined) {
      updateExpressions.push('updatedAt = :updatedAt');
      expressionAttributeValues[':updatedAt'] = now;
    }

    if (updateExpressions.length === 0) {
      const current = await this.getCalendarIntegration(userId, provider);
      return current!;
    }

    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `CALENDAR_INTEGRATION#${provider}`
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }));

    return result.Attributes as CalendarIntegration;
  }

  // Master Availability methods
  async createMasterAvailability(masterId: string, data: Omit<MasterAvailability, 'id' | 'masterId' | 'createdAt'>): Promise<MasterAvailability> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const availability: MasterAvailability = {
      id,
      masterId,
      ...data,
      createdAt: now
    };

    const sk = data.scheduleType === 'WEEKLY' 
      ? `AVAILABILITY#WEEKLY#${data.dayOfWeek}#${data.startTime}`
      : `AVAILABILITY#SPECIFIC#${data.specificDate}#${data.startTime}`;

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `MASTER#${masterId}`,
        SK: sk,
        GSI1PK: `AVAILABILITY#${masterId}`,
        GSI1SK: `${data.scheduleType}#${data.specificDate || data.dayOfWeek}#${data.startTime}`,
        GSI2PK: 'MASTER_AVAILABILITY',
        GSI2SK: `MASTER#${masterId}#${data.scheduleType}#${now}`,
        ...availability
      }
    }));

    return availability;
  }

  async getMasterAvailability(masterId: string, filters?: {
    scheduleType?: 'WEEKLY' | 'SPECIFIC_DATE';
    date?: string;
    dayOfWeek?: number;
    includeUnavailable?: boolean;
  }): Promise<MasterAvailability[]> {
    let keyConditionExpression = 'GSI1PK = :pk';
    const expressionAttributeValues: any = {
      ':pk': `AVAILABILITY#${masterId}`
    };

    if (filters?.scheduleType) {
      keyConditionExpression += ' AND begins_with(GSI1SK, :scheduleType)';
      expressionAttributeValues[':scheduleType'] = filters.scheduleType;
    }

    let filterExpression = '';
    if (!filters?.includeUnavailable) {
      filterExpression = 'isAvailable = :isAvailable';
      expressionAttributeValues[':isAvailable'] = true;
    }

    if (filters?.date) {
      filterExpression = filterExpression ? 
        `${filterExpression} AND specificDate = :date` : 
        'specificDate = :date';
      expressionAttributeValues[':date'] = filters.date;
    }

    if (filters?.dayOfWeek !== undefined) {
      filterExpression = filterExpression ? 
        `${filterExpression} AND dayOfWeek = :dayOfWeek` : 
        'dayOfWeek = :dayOfWeek';
      expressionAttributeValues[':dayOfWeek'] = filters.dayOfWeek;
    }

    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: keyConditionExpression,
      ...(filterExpression && { FilterExpression: filterExpression }),
      ExpressionAttributeValues: expressionAttributeValues,
      ScanIndexForward: true
    }));

    return (result.Items || []) as MasterAvailability[];
  }

  async deleteMasterAvailability(masterId: string, filters: {
    scheduleType?: 'WEEKLY' | 'SPECIFIC_DATE';
    date?: string;
    dayOfWeek?: number;
  }): Promise<void> {
    // Get items to delete
    const items = await this.getMasterAvailability(masterId, { 
      ...filters, 
      includeUnavailable: true 
    });

    if (items.length === 0) return;

    const batchSize = 25;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      const deleteRequests = batch.map(item => {
        const sk = item.scheduleType === 'WEEKLY' 
          ? `AVAILABILITY#WEEKLY#${item.dayOfWeek}#${item.startTime}`
          : `AVAILABILITY#SPECIFIC#${item.specificDate}#${item.startTime}`;

        return {
          DeleteRequest: {
            Key: {
              PK: `MASTER#${masterId}`,
              SK: sk
            }
          }
        };
      });

      await docClient.send(new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: deleteRequests
        }
      }));
    }
  }

  async createManyAvailabilitySlots(masterId: string, slots: Array<Omit<MasterAvailability, 'id' | 'masterId' | 'createdAt'>>): Promise<void> {
    const now = new Date().toISOString();
    const batchSize = 25;

    for (let i = 0; i < slots.length; i += batchSize) {
      const batch = slots.slice(i, i + batchSize);
      
      const writeRequests = batch.map(slotData => {
        const id = uuidv4();
        const availability: MasterAvailability = {
          id,
          masterId,
          ...slotData,
          createdAt: now
        };

        const sk = slotData.scheduleType === 'WEEKLY' 
          ? `AVAILABILITY#WEEKLY#${slotData.dayOfWeek}#${slotData.startTime}`
          : `AVAILABILITY#SPECIFIC#${slotData.specificDate}#${slotData.startTime}`;

        return {
          PutRequest: {
            Item: {
              PK: `MASTER#${masterId}`,
              SK: sk,
              GSI1PK: `AVAILABILITY#${masterId}`,
              GSI1SK: `${slotData.scheduleType}#${slotData.specificDate || slotData.dayOfWeek}#${slotData.startTime}`,
              GSI2PK: 'MASTER_AVAILABILITY',
              GSI2SK: `MASTER#${masterId}#${slotData.scheduleType}#${now}`,
              ...availability
            }
          }
        };
      });

      await docClient.send(new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: writeRequests
        }
      }));
    }
  }

  // Blocked Time Slot methods
  async createBlockedTimeSlot(masterId: string, data: Omit<BlockedTimeSlot, 'id' | 'masterId' | 'createdAt'>): Promise<BlockedTimeSlot> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const blockedSlot: BlockedTimeSlot = {
      id,
      masterId,
      ...data,
      createdAt: now
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `MASTER#${masterId}`,
        SK: `BLOCKED_SLOT#${data.startDateTime}#${id}`,
        GSI1PK: `BLOCKED_SLOTS#${masterId}`,
        GSI1SK: `${data.blockType}#${data.startDateTime}`,
        GSI2PK: 'BLOCKED_TIME_SLOTS',
        GSI2SK: `MASTER#${masterId}#${data.startDateTime}`,
        ...blockedSlot
      }
    }));

    return blockedSlot;
  }

  async getMasterBlockedSlots(masterId: string, filters?: {
    blockType?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<BlockedTimeSlot[]> {
    let keyConditionExpression = 'GSI1PK = :pk';
    const expressionAttributeValues: any = {
      ':pk': `BLOCKED_SLOTS#${masterId}`
    };

    if (filters?.blockType) {
      keyConditionExpression += ' AND begins_with(GSI1SK, :blockType)';
      expressionAttributeValues[':blockType'] = filters.blockType;
    }

    let filterExpression = '';
    if (filters?.startDate) {
      filterExpression = 'startDateTime >= :startDate';
      expressionAttributeValues[':startDate'] = filters.startDate;
    }
    if (filters?.endDate) {
      filterExpression = filterExpression ? 
        `${filterExpression} AND endDateTime <= :endDate` : 
        'endDateTime <= :endDate';
      expressionAttributeValues[':endDate'] = filters.endDate;
    }

    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: keyConditionExpression,
      ...(filterExpression && { FilterExpression: filterExpression }),
      ExpressionAttributeValues: expressionAttributeValues,
      ScanIndexForward: true
    }));

    return (result.Items || []) as BlockedTimeSlot[];
  }

  async deleteBlockedTimeSlots(masterId: string, filters: {
    startDateTime?: string;
    endDateTime?: string;
    blockType?: string;
  }): Promise<number> {
    const slots = await this.getMasterBlockedSlots(masterId, filters);
    
    if (slots.length === 0) return 0;

    const batchSize = 25;
    for (let i = 0; i < slots.length; i += batchSize) {
      const batch = slots.slice(i, i + batchSize);
      
      const deleteRequests = batch.map(slot => ({
        DeleteRequest: {
          Key: {
            PK: `MASTER#${masterId}`,
            SK: `BLOCKED_SLOT#${slot.startDateTime}#${slot.id}`
          }
        }
      }));

      await docClient.send(new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: deleteRequests
        }
      }));
    }

    return slots.length;
  }

  // Calendar Sync Log methods
  async createSyncLog(data: Omit<CalendarSyncLog, 'id' | 'createdAt'>): Promise<CalendarSyncLog> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const syncLog: CalendarSyncLog = {
      id,
      ...data,
      createdAt: now
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `CALENDAR_INTEGRATION#${data.integrationId}`,
        SK: `SYNC_LOG#${now}#${id}`,
        GSI1PK: 'CALENDAR_SYNC_LOG',
        GSI1SK: `INTEGRATION#${data.integrationId}#${now}`,
        GSI2PK: `SYNC_STATUS#${data.status}`,
        GSI2SK: `INTEGRATION#${data.integrationId}#${now}`,
        ...syncLog
      }
    }));

    return syncLog;
  }

  async getIntegrationSyncLogs(integrationId: string, limit = 50): Promise<CalendarSyncLog[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `CALENDAR_INTEGRATION#${integrationId}`,
        ':sk': 'SYNC_LOG#'
      },
      Limit: limit,
      ScanIndexForward: false
    }));

    return (result.Items || []) as CalendarSyncLog[];
  }

  // Calendar Event methods
  async createCalendarEvent(data: Omit<CalendarEvent, 'id' | 'createdAt'>): Promise<CalendarEvent> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const event: CalendarEvent = {
      id,
      ...data,
      createdAt: now
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `CALENDAR_INTEGRATION#${data.integrationId}`,
        SK: `EVENT#${data.externalEventId}`,
        GSI1PK: 'CALENDAR_EVENT',
        GSI1SK: `INTEGRATION#${data.integrationId}#${data.startDateTime}`,
        GSI2PK: `EVENT_STATUS#${data.status}`,
        GSI2SK: `INTEGRATION#${data.integrationId}#${data.startDateTime}`,
        ...event
      }
    }));

    return event;
  }

  async getCalendarEvents(integrationId: string, filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<CalendarEvent[]> {
    let keyConditionExpression = 'GSI1PK = :pk';
    const expressionAttributeValues: any = {
      ':pk': 'CALENDAR_EVENT'
    };

    keyConditionExpression += ' AND begins_with(GSI1SK, :integration)';
    expressionAttributeValues[':integration'] = `INTEGRATION#${integrationId}#`;

    let filterExpression = '';
    if (filters?.startDate) {
      filterExpression = 'startDateTime >= :startDate';
      expressionAttributeValues[':startDate'] = filters.startDate;
    }
    if (filters?.endDate) {
      filterExpression = filterExpression ? 
        `${filterExpression} AND endDateTime <= :endDate` : 
        'endDateTime <= :endDate';
      expressionAttributeValues[':endDate'] = filters.endDate;
    }
    if (filters?.status) {
      filterExpression = filterExpression ? 
        `${filterExpression} AND status = :status` : 
        'status = :status';
      expressionAttributeValues[':status'] = filters.status;
    }

    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: keyConditionExpression,
      ...(filterExpression && { FilterExpression: filterExpression }),
      ExpressionAttributeValues: expressionAttributeValues,
      ScanIndexForward: true
    }));

    return (result.Items || []) as CalendarEvent[];
  }
}