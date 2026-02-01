/**
 * Masters Location Service
 * Сервис для поиска мастеров по геолокации с использованием DynamoDB
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  QueryCommand, 
  ScanCommand
} from '@aws-sdk/lib-dynamodb';

export interface MasterProfile {
  id: string;
  userId: string;
  companyName?: string;
  description?: string;
  experienceYears?: number;
  city?: string;
  categoryId?: string;
  rating: number;
  completedProjectsCount: number;
  onTimeRate: number;
  isVerified: boolean;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MasterWithDistance extends MasterProfile {
  distance: number;
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  category?: {
    id: string;
    name: string;
  };
  services?: Array<{
    id: string;
    name: string;
    priceFrom: number;
    priceTo?: number;
    unit: string;
  }>;
  portfolio?: Array<{
    id: string;
    title: string;
    image?: string;
  }>;
  isAvailable?: boolean;
}

export interface SearchFilters {
  latitude: number;
  longitude: number;
  radius: number; // km
  categoryId?: string;
  services?: string[];
  minRating?: number;
  verified?: boolean;
  available?: boolean;
  limit: number;
  offset: number;
}

export interface SearchResult {
  masters: MasterWithDistance[];
  searchParams: SearchFilters;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  stats: {
    total: number;
    averageDistance: number;
    averageRating: number;
    verified: number;
    byCategory: Record<string, number>;
  };
}

export class MastersLocationService {
  private client: DynamoDBDocumentClient;
  private mastersTable: string;
  private usersTable: string;
  private categoriesTable: string;
  private servicesTable: string;
  private portfolioTable: string;
  private availabilityTable: string;

  constructor() {
    const dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    
    this.client = DynamoDBDocumentClient.from(dynamoClient);
    this.mastersTable = process.env.MASTERS_TABLE || 'masters';
    this.usersTable = process.env.USERS_TABLE || 'users';
    this.categoriesTable = process.env.CATEGORIES_TABLE || 'categories';
    this.servicesTable = process.env.SERVICES_TABLE || 'services';
    this.portfolioTable = process.env.PORTFOLIO_TABLE || 'portfolio';
    this.availabilityTable = process.env.AVAILABILITY_TABLE || 'availability';
  }

  async findNearbyMasters(filters: SearchFilters): Promise<SearchResult> {
    try {
      // Get masters with location data
      const masters = await this.getMastersWithLocation(filters);
      
      // Calculate distances and filter by radius
      const mastersWithDistance = await this.calculateDistancesAndFilter(masters, filters);
      
      // Sort by distance
      mastersWithDistance.sort((a, b) => a.distance - b.distance);
      
      // Apply pagination
      const paginatedMasters = mastersWithDistance.slice(filters.offset, filters.offset + filters.limit);
      
      // Enrich with additional data
      const enrichedMasters = await this.enrichMastersData(paginatedMasters, filters);
      
      // Calculate statistics
      const stats = this.calculateStats(mastersWithDistance);
      
      return {
        masters: enrichedMasters,
        searchParams: filters,
        pagination: {
          total: mastersWithDistance.length,
          limit: filters.limit,
          offset: filters.offset,
          hasMore: filters.offset + filters.limit < mastersWithDistance.length
        },
        stats
      };
    } catch (error) {
      console.error('Error finding nearby masters:', error);
      throw error;
    }
  }

  private async getMastersWithLocation(filters: SearchFilters): Promise<MasterProfile[]> {
    try {
      // Create bounding box for initial filtering
      const { minLat, maxLat, minLng, maxLng } = this.createBoundingBox(
        filters.latitude, 
        filters.longitude, 
        filters.radius
      );

      // Build filter expression
      let filterExpression = 'attribute_exists(latitude) AND attribute_exists(longitude)';
      const expressionAttributeValues: Record<string, any> = {};

      // Add bounding box filter
      filterExpression += ' AND latitude BETWEEN :minLat AND :maxLat AND longitude BETWEEN :minLng AND :maxLng';
      expressionAttributeValues[':minLat'] = minLat;
      expressionAttributeValues[':maxLat'] = maxLat;
      expressionAttributeValues[':minLng'] = minLng;
      expressionAttributeValues[':maxLng'] = maxLng;

      // Add category filter
      if (filters.categoryId) {
        filterExpression += ' AND categoryId = :categoryId';
        expressionAttributeValues[':categoryId'] = filters.categoryId;
      }

      // Add rating filter
      if (filters.minRating) {
        filterExpression += ' AND rating >= :minRating';
        expressionAttributeValues[':minRating'] = filters.minRating;
      }

      // Add verification filter
      if (filters.verified === true) {
        filterExpression += ' AND isVerified = :verified';
        expressionAttributeValues[':verified'] = true;
      }

      const response = await this.client.send(new ScanCommand({
        TableName: this.mastersTable,
        FilterExpression: filterExpression,
        ExpressionAttributeValues: expressionAttributeValues
      }));

      return (response.Items || []).map(item => ({
        id: item.id,
        userId: item.userId,
        companyName: item.companyName,
        description: item.description,
        experienceYears: item.experienceYears,
        city: item.city,
        categoryId: item.categoryId,
        rating: Number(item.rating) || 0,
        completedProjectsCount: Number(item.completedProjectsCount) || 0,
        onTimeRate: Number(item.onTimeRate) || 0,
        isVerified: Boolean(item.isVerified),
        latitude: Number(item.latitude),
        longitude: Number(item.longitude),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));
    } catch (error) {
      console.error('Error getting masters with location:', error);
      return [];
    }
  }

  private async calculateDistancesAndFilter(
    masters: MasterProfile[], 
    filters: SearchFilters
  ): Promise<MasterWithDistance[]> {
    const mastersWithDistance: MasterWithDistance[] = [];

    for (const master of masters) {
      if (!master.latitude || !master.longitude) continue;

      const distance = this.calculateDistance(
        filters.latitude,
        filters.longitude,
        master.latitude,
        master.longitude
      );

      if (distance <= filters.radius) {
        mastersWithDistance.push({
          ...master,
          distance: Math.round(distance * 100) / 100
        });
      }
    }

    return mastersWithDistance;
  }

  private async enrichMastersData(
    masters: MasterWithDistance[], 
    filters: SearchFilters
  ): Promise<MasterWithDistance[]> {
    const enrichedMasters: MasterWithDistance[] = [];

    for (const master of masters) {
      try {
        // Get user data
        const user = await this.getUserData(master.userId);
        
        // Get category data
        const category = master.categoryId ? await this.getCategoryData(master.categoryId) : undefined;
        
        // Get services
        const services = await this.getMasterServices(master.id, filters.services);
        
        // Get portfolio
        const portfolio = await this.getMasterPortfolio(master.id);
        
        // Check availability if requested
        let isAvailable: boolean | undefined;
        if (filters.available === true) {
          isAvailable = await this.checkMasterAvailability(master.id);
          if (!isAvailable) continue; // Skip unavailable masters
        }

        enrichedMasters.push({
          ...master,
          user,
          category,
          services,
          portfolio,
          isAvailable
        });
      } catch (error) {
        console.error(`Error enriching master ${master.id}:`, error);
        // Include master without enriched data
        enrichedMasters.push(master);
      }
    }

    return enrichedMasters;
  }

  private async getUserData(userId: string): Promise<MasterWithDistance['user']> {
    try {
      const response = await this.client.send(new QueryCommand({
        TableName: this.usersTable,
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`
        },
        ProjectionExpression: 'id, email, firstName, lastName, avatar',
        Limit: 1
      }));

      if (!response.Items || response.Items.length === 0) return undefined;

      const item = response.Items[0];
      return {
        id: item.id,
        email: item.email,
        firstName: item.firstName,
        lastName: item.lastName,
        avatar: item.avatar
      };
    } catch (error) {
      console.error('Error getting user data:', error);
      return undefined;
    }
  }

  private async getCategoryData(categoryId: string): Promise<MasterWithDistance['category']> {
    try {
      const response = await this.client.send(new QueryCommand({
        TableName: this.categoriesTable,
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: {
          ':pk': `CATEGORY#${categoryId}`
        },
        ProjectionExpression: 'id, #name',
        ExpressionAttributeNames: {
          '#name': 'name'
        },
        Limit: 1
      }));

      if (!response.Items || response.Items.length === 0) return undefined;

      const item = response.Items[0];
      return {
        id: item.id,
        name: item.name
      };
    } catch (error) {
      console.error('Error getting category data:', error);
      return undefined;
    }
  }

  private async getMasterServices(
    masterId: string, 
    serviceNames?: string[]
  ): Promise<MasterWithDistance['services']> {
    try {
      let keyConditionExpression = 'pk = :pk AND begins_with(sk, :sk)';
      const expressionAttributeValues: Record<string, any> = {
        ':pk': `MASTER#${masterId}`,
        ':sk': 'SERVICE#'
      };

      let filterExpression = 'isActive = :isActive';
      expressionAttributeValues[':isActive'] = true;

      if (serviceNames && serviceNames.length > 0) {
        filterExpression += ' AND #name IN (' + serviceNames.map((_, i) => `:name${i}`).join(', ') + ')';
        serviceNames.forEach((name, i) => {
          expressionAttributeValues[`:name${i}`] = name.trim();
        });
      }

      const response = await this.client.send(new QueryCommand({
        TableName: this.servicesTable,
        KeyConditionExpression: keyConditionExpression,
        FilterExpression: filterExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: {
          '#name': 'name'
        },
        ProjectionExpression: 'id, #name, priceFrom, priceTo, unit',
        Limit: serviceNames ? undefined : 3
      }));

      return (response.Items || []).map(item => ({
        id: item.id,
        name: item.name,
        priceFrom: Number(item.priceFrom) || 0,
        priceTo: item.priceTo ? Number(item.priceTo) : undefined,
        unit: item.unit || 'час'
      }));
    } catch (error) {
      console.error('Error getting master services:', error);
      return [];
    }
  }

  private async getMasterPortfolio(masterId: string): Promise<MasterWithDistance['portfolio']> {
    try {
      const response = await this.client.send(new QueryCommand({
        TableName: this.portfolioTable,
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :sk)',
        FilterExpression: 'isPublic = :isPublic',
        ExpressionAttributeValues: {
          ':pk': `MASTER#${masterId}`,
          ':sk': 'PORTFOLIO#',
          ':isPublic': true
        },
        ProjectionExpression: 'id, title, images',
        Limit: 3
      }));

      return (response.Items || []).map(item => ({
        id: item.id,
        title: item.title,
        image: item.images && item.images.length > 0 ? item.images[0] : undefined
      }));
    } catch (error) {
      console.error('Error getting master portfolio:', error);
      return [];
    }
  }

  private async checkMasterAvailability(masterId: string): Promise<boolean> {
    try {
      const response = await this.client.send(new QueryCommand({
        TableName: this.availabilityTable,
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: {
          ':pk': `MASTER#${masterId}`
        },
        ProjectionExpression: 'workingHours',
        Limit: 1
      }));

      if (!response.Items || response.Items.length === 0) return false;

      const workingHours = response.Items[0].workingHours;
      return this.checkCurrentAvailability(workingHours);
    } catch (error) {
      console.error('Error checking master availability:', error);
      return false;
    }
  }

  private checkCurrentAvailability(workingHours: any): boolean {
    if (!workingHours) return false;
    
    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[now.getDay()];
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM
    
    const dayHours = workingHours[dayName];
    if (!dayHours || !dayHours.enabled) return false;
    
    return currentTime >= dayHours.start && currentTime <= dayHours.end;
  }

  private calculateStats(masters: MasterWithDistance[]): SearchResult['stats'] {
    if (masters.length === 0) {
      return {
        total: 0,
        averageDistance: 0,
        averageRating: 0,
        verified: 0,
        byCategory: {}
      };
    }

    const totalDistance = masters.reduce((sum, m) => sum + m.distance, 0);
    const totalRating = masters.reduce((sum, m) => sum + m.rating, 0);
    const verified = masters.filter(m => m.isVerified).length;
    
    const byCategory: Record<string, number> = {};
    masters.forEach(m => {
      const categoryName = m.category?.name || 'Other';
      byCategory[categoryName] = (byCategory[categoryName] || 0) + 1;
    });

    return {
      total: masters.length,
      averageDistance: Math.round((totalDistance / masters.length) * 100) / 100,
      averageRating: Math.round((totalRating / masters.length) * 100) / 100,
      verified,
      byCategory
    };
  }

  private createBoundingBox(lat: number, lng: number, radiusKm: number) {
    const latDelta = radiusKm / 111; // Rough conversion: 1 degree ≈ 111 km
    const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

    return {
      minLat: lat - latDelta,
      maxLat: lat + latDelta,
      minLng: lng - lngDelta,
      maxLng: lng + lngDelta
    };
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}