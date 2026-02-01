import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand, DeleteCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { WeeklyWorkingHours, AvailabilitySlot, MasterAvailability } from '../types';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'handshake-table';

export interface DynamoMasterAvailability {
  availabilityId: string;
  masterId: string;
  workingHours: WeeklyWorkingHours;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface DynamoAvailabilitySlot {
  slotId: string;
  masterId: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  isBooked: boolean;
  bookedBy?: string;
  orderId?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export class AvailabilityRepository {
  // Master Availability methods
  async createMasterAvailability(masterId: string, data: {
    workingHours: WeeklyWorkingHours;
    timezone?: string;
  }): Promise<DynamoMasterAvailability> {
    const availabilityId = uuidv4();
    const now = new Date().toISOString();

    const availability: DynamoMasterAvailability = {
      availabilityId,
      masterId,
      workingHours: data.workingHours,
      timezone: data.timezone || 'Asia/Bishkek',
      createdAt: now,
      updatedAt: now
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `MASTER#${masterId}`,
        SK: 'AVAILABILITY',
        GSI1PK: 'MASTER_AVAILABILITY',
        GSI1SK: `MASTER#${masterId}`,
        ...availability
      }
    }));

    return availability;
  }

  async getMasterAvailability(masterId: string): Promise<DynamoMasterAvailability | null> {
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `MASTER#${masterId}`,
        SK: 'AVAILABILITY'
      }
    }));

    return result.Item as DynamoMasterAvailability || null;
  }

  async updateMasterAvailability(masterId: string, data: {
    workingHours?: WeeklyWorkingHours;
    timezone?: string;
  }): Promise<DynamoMasterAvailability> {
    const now = new Date().toISOString();
    
    const updateExpressions: string[] = ['updatedAt = :updatedAt'];
    const expressionAttributeValues: any = { ':updatedAt': now };

    if (data.workingHours !== undefined) {
      updateExpressions.push('workingHours = :workingHours');
      expressionAttributeValues[':workingHours'] = data.workingHours;
    }
    if (data.timezone !== undefined) {
      updateExpressions.push('timezone = :timezone');
      expressionAttributeValues[':timezone'] = data.timezone;
    }

    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `MASTER#${masterId}`,
        SK: 'AVAILABILITY'
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }));

    return result.Attributes as DynamoMasterAvailability;
  }

  // Availability Slots methods
  async createSlot(masterId: string, data: {
    date: string;
    startTime: string;
    endTime: string;
  }): Promise<DynamoAvailabilitySlot> {
    const slotId = uuidv4();
    const now = new Date().toISOString();

    const slot: DynamoAvailabilitySlot = {
      slotId,
      masterId,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      isBooked: false,
      createdAt: now
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `MASTER#${masterId}`,
        SK: `SLOT#${data.date}#${data.startTime}`,
        GSI1PK: `SLOTS#${masterId}`,
        GSI1SK: `DATE#${data.date}#TIME#${data.startTime}`,
        GSI2PK: `AVAILABLE_SLOTS`,
        GSI2SK: `MASTER#${masterId}#DATE#${data.date}#TIME#${data.startTime}`,
        ...slot
      }
    }));

    return slot;
  }

  async createManySlots(masterId: string, slots: Array<{
    date: string;
    startTime: string;
    endTime: string;
  }>): Promise<void> {
    const now = new Date().toISOString();
    const batchSize = 25; // DynamoDB batch write limit

    for (let i = 0; i < slots.length; i += batchSize) {
      const batch = slots.slice(i, i + batchSize);
      
      const writeRequests = batch.map(slotData => {
        const slotId = uuidv4();
        const slot: DynamoAvailabilitySlot = {
          slotId,
          masterId,
          date: slotData.date,
          startTime: slotData.startTime,
          endTime: slotData.endTime,
          isBooked: false,
          createdAt: now
        };

        return {
          PutRequest: {
            Item: {
              PK: `MASTER#${masterId}`,
              SK: `SLOT#${slotData.date}#${slotData.startTime}`,
              GSI1PK: `SLOTS#${masterId}`,
              GSI1SK: `DATE#${slotData.date}#TIME#${slotData.startTime}`,
              GSI2PK: `AVAILABLE_SLOTS`,
              GSI2SK: `MASTER#${masterId}#DATE#${slotData.date}#TIME#${slotData.startTime}`,
              ...slot
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

  async getSlot(masterId: string, date: string, startTime: string): Promise<DynamoAvailabilitySlot | null> {
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `MASTER#${masterId}`,
        SK: `SLOT#${date}#${startTime}`
      }
    }));

    return result.Item as DynamoAvailabilitySlot || null;
  }

  async getSlotById(slotId: string): Promise<DynamoAvailabilitySlot | null> {
    // Since we need to find by slotId, we'll use GSI1 to query all slots and filter
    // In production, consider adding a separate GSI for slotId lookups
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :pk',
      FilterExpression: 'slotId = :slotId',
      ExpressionAttributeValues: {
        ':pk': 'AVAILABLE_SLOTS',
        ':slotId': slotId
      },
      Limit: 1
    }));

    return result.Items?.[0] as DynamoAvailabilitySlot || null;
  }

  async getMasterSlots(masterId: string, filters: {
    startDate?: string;
    endDate?: string;
    includeBooked?: boolean;
    limit?: number;
  } = {}): Promise<DynamoAvailabilitySlot[]> {
    const limit = filters.limit || 100;
    
    let keyConditionExpression = 'GSI1PK = :pk';
    const expressionAttributeValues: any = {
      ':pk': `SLOTS#${masterId}`
    };

    if (filters.startDate) {
      keyConditionExpression += ' AND GSI1SK >= :startDate';
      expressionAttributeValues[':startDate'] = `DATE#${filters.startDate}#TIME#00:00`;
    }

    let filterExpression = '';
    if (filters.endDate) {
      filterExpression = 'begins_with(GSI1SK, :endDatePrefix) OR GSI1SK < :endDate';
      expressionAttributeValues[':endDatePrefix'] = `DATE#${filters.endDate}`;
      expressionAttributeValues[':endDate'] = `DATE#${filters.endDate}#TIME#23:59`;
    }

    if (!filters.includeBooked) {
      filterExpression = filterExpression ? 
        `${filterExpression} AND isBooked = :isBooked` : 
        'isBooked = :isBooked';
      expressionAttributeValues[':isBooked'] = false;
    }

    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: keyConditionExpression,
      ...(filterExpression && { FilterExpression: filterExpression }),
      ExpressionAttributeValues: expressionAttributeValues,
      Limit: limit,
      ScanIndexForward: true
    }));

    return (result.Items || []) as DynamoAvailabilitySlot[];
  }

  async bookSlot(slotId: string, bookedBy: string, orderId?: string, notes?: string): Promise<DynamoAvailabilitySlot> {
    // First, get the slot to find its PK/SK
    const slot = await this.getSlotById(slotId);
    if (!slot) {
      throw new Error('Slot not found');
    }

    const now = new Date().toISOString();

    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `MASTER#${slot.masterId}`,
        SK: `SLOT#${slot.date}#${slot.startTime}`
      },
      UpdateExpression: 'SET isBooked = :isBooked, bookedBy = :bookedBy, updatedAt = :updatedAt, GSI2PK = :gsi2pk' +
        (orderId ? ', orderId = :orderId' : '') +
        (notes ? ', notes = :notes' : ''),
      ConditionExpression: 'isBooked = :currentBooked', // Prevent double booking
      ExpressionAttributeValues: {
        ':isBooked': true,
        ':bookedBy': bookedBy,
        ':updatedAt': now,
        ':currentBooked': false,
        ':gsi2pk': 'BOOKED_SLOTS',
        ...(orderId && { ':orderId': orderId }),
        ...(notes && { ':notes': notes })
      },
      ReturnValues: 'ALL_NEW'
    }));

    return result.Attributes as DynamoAvailabilitySlot;
  }

  async deleteSlots(masterId: string, filters: {
    startDate?: string;
    endDate?: string;
    onlyUnbooked?: boolean;
  }): Promise<void> {
    // Get slots to delete
    const slots = await this.getMasterSlots(masterId, {
      startDate: filters.startDate,
      endDate: filters.endDate,
      includeBooked: !filters.onlyUnbooked
    });

    const slotsToDelete = filters.onlyUnbooked ? 
      slots.filter(slot => !slot.isBooked) : 
      slots;

    if (slotsToDelete.length === 0) return;

    const batchSize = 25;
    for (let i = 0; i < slotsToDelete.length; i += batchSize) {
      const batch = slotsToDelete.slice(i, i + batchSize);
      
      const deleteRequests = batch.map(slot => ({
        DeleteRequest: {
          Key: {
            PK: `MASTER#${slot.masterId}`,
            SK: `SLOT#${slot.date}#${slot.startTime}`
          }
        }
      }));

      await docClient.send(new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: deleteRequests
        }
      }));
    }
  }

  async getAvailableSlots(filters: {
    masterId?: string;
    startDate?: string;
    endDate?: string;
    minDuration?: number;
    limit?: number;
  } = {}): Promise<DynamoAvailabilitySlot[]> {
    const limit = filters.limit || 100;

    if (filters.masterId) {
      return this.getMasterSlots(filters.masterId, {
        startDate: filters.startDate,
        endDate: filters.endDate,
        includeBooked: false,
        limit
      });
    }

    // Query all available slots
    let keyConditionExpression = 'GSI2PK = :pk';
    const expressionAttributeValues: any = {
      ':pk': 'AVAILABLE_SLOTS'
    };

    let filterExpression = '';
    if (filters.startDate) {
      filterExpression = 'GSI2SK >= :startDate';
      expressionAttributeValues[':startDate'] = `MASTER#${filters.masterId || ''}#DATE#${filters.startDate}`;
    }

    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI2',
      KeyConditionExpression: keyConditionExpression,
      ...(filterExpression && { FilterExpression: filterExpression }),
      ExpressionAttributeValues: expressionAttributeValues,
      Limit: limit,
      ScanIndexForward: true
    }));

    let slots = (result.Items || []) as DynamoAvailabilitySlot[];

    // Filter by duration if specified
    if (filters.minDuration) {
      slots = slots.filter(slot => {
        const startTime = new Date(`2000-01-01T${slot.startTime}:00`);
        const endTime = new Date(`2000-01-01T${slot.endTime}:00`);
        const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
        return duration >= filters.minDuration!;
      });
    }

    return slots;
  }
}