import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'handshake-table';

export interface MasterProfile {
  profileId: string;
  userId: string;
  categories: number[];
  skills: number[];
  bio?: string;
  experienceYears?: number;
  hourlyRate?: string;
  minOrderAmount?: string;
  maxOrderAmount?: string;
  city: string;
  address?: string;
  workRadius?: number;
  languages?: string[];
  certifications?: string[];
  education?: string;
  workSchedule?: string;
  isVerified: boolean;
  isAvailable: boolean;
  isPremium: boolean;
  rating: string;
  reviewsCount: number;
  completedOrders: number;
  successRate: string;
  repeatClients: number;
  createdAt: string;
  updatedAt?: string;
}

export class MasterProfileRepository {
  async create(userId: string, data: Partial<MasterProfile>): Promise<MasterProfile> {
    const profileId = uuidv4();
    const now = new Date().toISOString();

    const profile: MasterProfile = {
      profileId,
      userId,
      categories: data.categories || [],
      skills: data.skills || [],
      bio: data.bio,
      experienceYears: data.experienceYears,
      hourlyRate: data.hourlyRate,
      minOrderAmount: data.minOrderAmount,
      maxOrderAmount: data.maxOrderAmount,
      city: data.city || '',
      address: data.address,
      workRadius: data.workRadius,
      languages: data.languages || [],
      certifications: data.certifications || [],
      education: data.education,
      workSchedule: data.workSchedule,
      isVerified: false,
      isAvailable: data.isAvailable ?? true,
      isPremium: false,
      rating: '0',
      reviewsCount: 0,
      completedOrders: 0,
      successRate: '0',
      repeatClients: 0,
      createdAt: now,
      updatedAt: now
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `USER#${userId}`,
        SK: 'MASTER_PROFILE',
        GSI1PK: 'MASTER_PROFILE',
        GSI1SK: `RATING#${profile.rating}#USER#${userId}`,
        GSI2PK: `CITY#${profile.city}`,
        GSI2SK: `RATING#${profile.rating}`,
        ...profile
      }
    }));

    return profile;
  }

  async findByUserId(userId: string): Promise<MasterProfile | null> {
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: 'MASTER_PROFILE'
      }
    }));

    return result.Item as MasterProfile || null;
  }

  async update(userId: string, data: Partial<MasterProfile>): Promise<MasterProfile> {
    const now = new Date().toISOString();
    
    const updateExpressions: string[] = ['updatedAt = :updatedAt'];
    const expressionAttributeValues: any = { ':updatedAt': now };
    const expressionAttributeNames: any = {};

    if (data.categories !== undefined) {
      updateExpressions.push('categories = :categories');
      expressionAttributeValues[':categories'] = data.categories;
    }
    if (data.skills !== undefined) {
      updateExpressions.push('skills = :skills');
      expressionAttributeValues[':skills'] = data.skills;
    }
    if (data.bio !== undefined) {
      updateExpressions.push('bio = :bio');
      expressionAttributeValues[':bio'] = data.bio;
    }
    if (data.experienceYears !== undefined) {
      updateExpressions.push('experienceYears = :experienceYears');
      expressionAttributeValues[':experienceYears'] = data.experienceYears;
    }
    if (data.hourlyRate !== undefined) {
      updateExpressions.push('hourlyRate = :hourlyRate');
      expressionAttributeValues[':hourlyRate'] = data.hourlyRate;
    }
    if (data.city !== undefined) {
      updateExpressions.push('city = :city');
      expressionAttributeValues[':city'] = data.city;
    }
    if (data.isAvailable !== undefined) {
      updateExpressions.push('isAvailable = :isAvailable');
      expressionAttributeValues[':isAvailable'] = data.isAvailable;
    }

    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: 'MASTER_PROFILE'
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ...(Object.keys(expressionAttributeNames).length > 0 && { ExpressionAttributeNames: expressionAttributeNames }),
      ReturnValues: 'ALL_NEW'
    }));

    return result.Attributes as MasterProfile;
  }

  async search(filters: {
    city?: string;
    category?: number;
    minRating?: number;
    isVerified?: boolean;
    isAvailable?: boolean;
    limit?: number;
  }): Promise<MasterProfile[]> {
    const limit = filters.limit || 20;

    if (filters.city) {
      const result = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI2',
        KeyConditionExpression: 'GSI2PK = :city',
        ExpressionAttributeValues: {
          ':city': `CITY#${filters.city}`
        },
        Limit: limit,
        ScanIndexForward: false
      }));

      return (result.Items || []) as MasterProfile[];
    }

    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :type',
      ExpressionAttributeValues: {
        ':type': 'MASTER_PROFILE'
      },
      Limit: limit,
      ScanIndexForward: false
    }));

    return (result.Items || []) as MasterProfile[];
  }

  async updateRating(userId: string, rating: number, reviewsCount: number): Promise<void> {
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: 'MASTER_PROFILE'
      },
      UpdateExpression: 'SET rating = :rating, reviewsCount = :reviewsCount, GSI1SK = :gsi1sk, GSI2SK = :gsi2sk',
      ExpressionAttributeValues: {
        ':rating': rating.toFixed(1),
        ':reviewsCount': reviewsCount,
        ':gsi1sk': `RATING#${rating.toFixed(1)}#USER#${userId}`,
        ':gsi2sk': `RATING#${rating.toFixed(1)}`
      }
    }));
  }
}
