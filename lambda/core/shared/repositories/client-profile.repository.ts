import { PutCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { dynamodb as docClient } from '../db/dynamodb-client';

const TABLE_NAME = process.env.DYNAMODB_TABLE || 'handshake-table';

export interface ClientProfile {
  profileId: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  city: string;
  address?: string;
  companyName?: string;
  companyType?: string;
  preferredContactMethod?: 'phone' | 'chat' | 'email';
  rating: string;
  reviewsCount: number;
  totalOrders: number;
  completedOrders: number;
  avgBudget: string;
  createdAt: string;
  updatedAt?: string;
}

export class ClientProfileRepository {
  async create(userId: string, data: Partial<ClientProfile>): Promise<ClientProfile> {
    const profileId = uuidv4();
    const now = new Date().toISOString();

    const profile: ClientProfile = {
      profileId,
      userId,
      bio: data.bio,
      city: data.city || '',
      address: data.address,
      companyName: data.companyName,
      companyType: data.companyType,
      preferredContactMethod: data.preferredContactMethod || 'phone',
      rating: '0',
      reviewsCount: 0,
      totalOrders: 0,
      completedOrders: 0,
      avgBudget: '0',
      createdAt: now,
      updatedAt: now
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `USER#${userId}`,
        SK: 'CLIENT_PROFILE',
        ...profile
      }
    }));

    return profile;
  }

  async findByUserId(userId: string): Promise<ClientProfile | null> {
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: 'CLIENT_PROFILE'
      }
    }));

    return result.Item as ClientProfile || null;
  }

  async update(userId: string, data: Partial<ClientProfile>): Promise<ClientProfile> {
    const now = new Date().toISOString();

    const updateExpressions: string[] = ['updatedAt = :updatedAt'];
    const expressionAttributeValues: any = { ':updatedAt': now };

    if (data.bio !== undefined) {
      updateExpressions.push('bio = :bio');
      expressionAttributeValues[':bio'] = data.bio;
    }
    if (data.firstName !== undefined) {
      updateExpressions.push('firstName = :firstName');
      expressionAttributeValues[':firstName'] = data.firstName;
    }
    if (data.lastName !== undefined) {
      updateExpressions.push('lastName = :lastName');
      expressionAttributeValues[':lastName'] = data.lastName;
    }
    if (data.city !== undefined) {
      updateExpressions.push('city = :city');
      expressionAttributeValues[':city'] = data.city;
    }
    if (data.address !== undefined) {
      updateExpressions.push('address = :address');
      expressionAttributeValues[':address'] = data.address;
    }
    if (data.companyName !== undefined) {
      updateExpressions.push('companyName = :companyName');
      expressionAttributeValues[':companyName'] = data.companyName;
    }
    if (data.preferredContactMethod !== undefined) {
      updateExpressions.push('preferredContactMethod = :preferredContactMethod');
      expressionAttributeValues[':preferredContactMethod'] = data.preferredContactMethod;
    }

    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: 'CLIENT_PROFILE'
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }));

    return result.Attributes as ClientProfile;
  }
}
