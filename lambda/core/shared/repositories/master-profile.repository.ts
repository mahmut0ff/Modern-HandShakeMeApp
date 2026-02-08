import { PutCommand, GetCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { dynamodb as docClient } from '../db/dynamodb-client';
import { PortfolioRepository } from './portfolio.repository';

const TABLE_NAME = process.env.DYNAMODB_TABLE || 'handshake-table';

export interface MasterProfile {
  profileId: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  categories: number[];
  skills: number[];
  bio?: string;
  experienceYears?: number;
  hourlyRate?: string;
  dailyRate?: string;
  minOrderCost?: string;
  minOrderAmount?: string;
  maxOrderAmount?: string;
  city: string;
  address?: string;
  workRadius?: number;
  travelRadius?: number;
  hasTransport?: boolean;
  hasTools?: boolean;
  canPurchaseMaterials?: boolean;
  workingHours?: Record<string, string>;
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
  portfolioPreview?: string[]; // 1-3 preview images
  status?: 'ONLINE' | 'OFFLINE';
  lastSeen?: string;
  createdAt: string;
  updatedAt?: string;
}

export class MasterProfileRepository {
  private portfolioRepo = new PortfolioRepository();

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

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && key !== 'userId' && key !== 'profileId' && key !== 'createdAt') {
        const attrName = `#${key}`;
        const valName = `:${key}`;
        updateExpressions.push(`${attrName} = ${valName}`);
        expressionAttributeNames[attrName] = key;
        expressionAttributeValues[valName] = value;
      }
    });

    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: 'MASTER_PROFILE'
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
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
    withPortfolio?: boolean;
  }): Promise<MasterProfile[]> {
    const limit = filters.limit || 20;
    let masters: MasterProfile[] = [];

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
      masters = (result.Items || []) as MasterProfile[];
    } else {
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
      masters = (result.Items || []) as MasterProfile[];
    }

    // Apply manual filters that DynamoDB GSI can't handle easily in combination
    if (filters.category) {
      masters = masters.filter(m => m.categories?.includes(filters.category!));
    }
    if (filters.minRating) {
      masters = masters.filter(m => parseFloat(m.rating) >= filters.minRating!);
    }
    if (filters.isVerified !== undefined) {
      masters = masters.filter(m => m.isVerified === filters.isVerified);
    }
    if (filters.isAvailable !== undefined) {
      masters = masters.filter(m => m.isAvailable === filters.isAvailable);
    }

    // Enhance with portfolio previews if requested
    if (filters.withPortfolio) {
      masters = await Promise.all(masters.map(async (m) => {
        const { items } = await this.portfolioRepo.findMasterItems(m.userId, { pageSize: 3, isPublic: true });
        return {
          ...m,
          portfolioPreview: items.flatMap(item => item.images).slice(0, 3)
        };
      }));
    }

    return masters;
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

  async listMasters(filters: {
    category_id?: number;
    skill_id?: number;
    city?: string;
    min_rating?: number;
    max_hourly_rate?: number;
    is_verified?: boolean;
    is_available?: boolean;
    search?: string;
    ordering?: string;
    page?: number;
    page_size?: number;
    with_portfolio?: boolean;
  }): Promise<MasterProfile[]> {
    return this.search({
      city: filters.city,
      category: filters.category_id,
      minRating: filters.min_rating,
      isVerified: filters.is_verified,
      isAvailable: filters.is_available,
      limit: filters.page_size || 20,
      withPortfolio: filters.with_portfolio ?? true, // Default to true for the catalog
    });
  }
}
