/**
 * Location Repository
 * Репозиторий для работы с location данными в DynamoDB
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  QueryCommand, 
  DeleteCommand,
  BatchWriteCommand,
  ScanCommand,
  UpdateCommand
} from '@aws-sdk/lib-dynamodb';

export interface LocationTracking {
  id: string;
  masterId: string;
  bookingId?: string;
  projectId?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  settings: {
    updateInterval?: number;
    highAccuracyMode?: boolean;
    shareWithClient?: boolean;
    autoStopAfterCompletion?: boolean;
    geofenceRadius?: number;
  };
  currentLatitude?: number;
  currentLongitude?: number;
  startedAt: string;
  endedAt?: string;
  lastUpdateAt?: string;
  stats?: {
    duration: number;
    totalDistance: number;
    averageSpeed: number;
    maxSpeed: number;
    pointsCount: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface LocationUpdate {
  id: string;
  trackingId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: string;
  createdAt: string;
}

export interface TrackingEvent {
  id: string;
  trackingId: string;
  eventType: 'ARRIVAL' | 'DEPARTURE' | 'GEOFENCE_ENTER' | 'GEOFENCE_EXIT' | 'SPEED_LIMIT';
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface GeocodingCache {
  id: string;
  type: 'GEOCODE' | 'REVERSE_GEOCODE' | 'SEARCH_PLACES' | 'GET_ROUTE';
  address?: string;
  coordinates?: string;
  query?: string;
  results: any;
  userId: string;
  expiresAt: string;
  createdAt: string;
}

export interface MapsUsage {
  id: string;
  userId: string;
  action: string;
  query?: string;
  coordinates?: string;
  resultsCount: number;
  createdAt: string;
}

export class LocationRepository {
  private client: DynamoDBDocumentClient;
  private trackingTable: string;
  private updatesTable: string;
  private eventsTable: string;
  private geocodingTable: string;
  private usageTable: string;

  constructor() {
    const dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    
    this.client = DynamoDBDocumentClient.from(dynamoClient);
    this.trackingTable = process.env.LOCATION_TRACKING_TABLE || 'location-tracking';
    this.updatesTable = process.env.LOCATION_UPDATES_TABLE || 'location-updates';
    this.eventsTable = process.env.TRACKING_EVENTS_TABLE || 'tracking-events';
    this.geocodingTable = process.env.GEOCODING_CACHE_TABLE || 'geocoding-cache';
    this.usageTable = process.env.MAPS_USAGE_TABLE || 'maps-usage';
  }

  // Location Tracking methods
  async createLocationTracking(tracking: LocationTracking): Promise<LocationTracking> {
    try {
      const item = {
        pk: `TRACKING#${tracking.id}`,
        sk: `MASTER#${tracking.masterId}`,
        gsi1pk: `MASTER#${tracking.masterId}`,
        gsi1sk: `STATUS#${tracking.status}#${tracking.createdAt}`,
        gsi2pk: tracking.bookingId ? `BOOKING#${tracking.bookingId}` : `PROJECT#${tracking.projectId}`,
        gsi2sk: `TRACKING#${tracking.id}`,
        ...tracking
      };

      await this.client.send(new PutCommand({
        TableName: this.trackingTable,
        Item: item
      }));

      return tracking;
    } catch (error) {
      console.error('Error creating location tracking:', error);
      throw error;
    }
  }

  async getLocationTracking(trackingId: string): Promise<LocationTracking | null> {
    try {
      const response = await this.client.send(new QueryCommand({
        TableName: this.trackingTable,
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: {
          ':pk': `TRACKING#${trackingId}`
        },
        Limit: 1
      }));

      if (!response.Items || response.Items.length === 0) return null;

      const item = response.Items[0];
      return {
        id: item.id,
        masterId: item.masterId,
        bookingId: item.bookingId,
        projectId: item.projectId,
        status: item.status,
        settings: item.settings || {},
        currentLatitude: item.currentLatitude,
        currentLongitude: item.currentLongitude,
        startedAt: item.startedAt,
        endedAt: item.endedAt,
        lastUpdateAt: item.lastUpdateAt,
        stats: item.stats,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      };
    } catch (error) {
      console.error('Error getting location tracking:', error);
      return null;
    }
  }

  async findActiveTrackingByMaster(
    masterId: string, 
    bookingId?: string, 
    projectId?: string
  ): Promise<LocationTracking | null> {
    try {
      const response = await this.client.send(new QueryCommand({
        TableName: this.trackingTable,
        IndexName: 'GSI1',
        KeyConditionExpression: 'gsi1pk = :masterId AND begins_with(gsi1sk, :status)',
        ExpressionAttributeValues: {
          ':masterId': `MASTER#${masterId}`,
          ':status': 'STATUS#ACTIVE'
        }
      }));

      if (!response.Items || response.Items.length === 0) return null;

      // Filter by booking/project if specified
      const filtered = response.Items.filter(item => {
        if (bookingId && item.bookingId !== bookingId) return false;
        if (projectId && item.projectId !== projectId) return false;
        return true;
      });

      if (filtered.length === 0) return null;

      const item = filtered[0];
      return {
        id: item.id,
        masterId: item.masterId,
        bookingId: item.bookingId,
        projectId: item.projectId,
        status: item.status,
        settings: item.settings || {},
        currentLatitude: item.currentLatitude,
        currentLongitude: item.currentLongitude,
        startedAt: item.startedAt,
        endedAt: item.endedAt,
        lastUpdateAt: item.lastUpdateAt,
        stats: item.stats,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      };
    } catch (error) {
      console.error('Error finding active tracking:', error);
      return null;
    }
  }

  async updateLocationTracking(trackingId: string, updates: Partial<LocationTracking>): Promise<void> {
    try {
      const updateExpression: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          updateExpression.push(`#${key} = :${key}`);
          expressionAttributeNames[`#${key}`] = key;
          expressionAttributeValues[`:${key}`] = value;
        }
      });

      if (updateExpression.length === 0) return;

      // Add updatedAt
      updateExpression.push('#updatedAt = :updatedAt');
      expressionAttributeNames['#updatedAt'] = 'updatedAt';
      expressionAttributeValues[':updatedAt'] = new Date().toISOString();

      // Update GSI1SK if status changed
      if (updates.status) {
        updateExpression.push('#gsi1sk = :gsi1sk');
        expressionAttributeNames['#gsi1sk'] = 'gsi1sk';
        expressionAttributeValues[':gsi1sk'] = `STATUS#${updates.status}#${updates.createdAt || new Date().toISOString()}`;
      }

      await this.client.send(new UpdateCommand({
        TableName: this.trackingTable,
        Key: { pk: `TRACKING#${trackingId}` },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues
      }));
    } catch (error) {
      console.error('Error updating location tracking:', error);
      throw error;
    }
  }

  // Location Updates methods
  async createLocationUpdate(update: LocationUpdate): Promise<LocationUpdate> {
    try {
      const item = {
        pk: `TRACKING#${update.trackingId}`,
        sk: `UPDATE#${update.timestamp}#${update.id}`,
        gsi1pk: `UPDATE#${update.id}`,
        gsi1sk: `TIMESTAMP#${update.timestamp}`,
        ...update
      };

      await this.client.send(new PutCommand({
        TableName: this.updatesTable,
        Item: item
      }));

      return update;
    } catch (error) {
      console.error('Error creating location update:', error);
      throw error;
    }
  }

  async getLocationUpdates(
    trackingId: string, 
    startTime?: string, 
    endTime?: string,
    limit?: number
  ): Promise<LocationUpdate[]> {
    try {
      let keyConditionExpression = 'pk = :pk';
      const expressionAttributeValues: Record<string, any> = {
        ':pk': `TRACKING#${trackingId}`
      };

      if (startTime && endTime) {
        keyConditionExpression += ' AND sk BETWEEN :startTime AND :endTime';
        expressionAttributeValues[':startTime'] = `UPDATE#${startTime}`;
        expressionAttributeValues[':endTime'] = `UPDATE#${endTime}#ZZZZ`;
      } else if (startTime) {
        keyConditionExpression += ' AND sk >= :startTime';
        expressionAttributeValues[':startTime'] = `UPDATE#${startTime}`;
      }

      const response = await this.client.send(new QueryCommand({
        TableName: this.updatesTable,
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ScanIndexForward: true,
        Limit: limit
      }));

      return (response.Items || []).map(item => ({
        id: item.id,
        trackingId: item.trackingId,
        latitude: item.latitude,
        longitude: item.longitude,
        accuracy: item.accuracy,
        altitude: item.altitude,
        heading: item.heading,
        speed: item.speed,
        timestamp: item.timestamp,
        createdAt: item.createdAt
      }));
    } catch (error) {
      console.error('Error getting location updates:', error);
      return [];
    }
  }

  async getLatestLocationUpdate(trackingId: string): Promise<LocationUpdate | null> {
    try {
      const response = await this.client.send(new QueryCommand({
        TableName: this.updatesTable,
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :sk)',
        ExpressionAttributeValues: {
          ':pk': `TRACKING#${trackingId}`,
          ':sk': 'UPDATE#'
        },
        ScanIndexForward: false,
        Limit: 1
      }));

      if (!response.Items || response.Items.length === 0) return null;

      const item = response.Items[0];
      return {
        id: item.id,
        trackingId: item.trackingId,
        latitude: item.latitude,
        longitude: item.longitude,
        accuracy: item.accuracy,
        altitude: item.altitude,
        heading: item.heading,
        speed: item.speed,
        timestamp: item.timestamp,
        createdAt: item.createdAt
      };
    } catch (error) {
      console.error('Error getting latest location update:', error);
      return null;
    }
  }

  // Tracking Events methods
  async createTrackingEvent(event: TrackingEvent): Promise<TrackingEvent> {
    try {
      const item = {
        pk: `TRACKING#${event.trackingId}`,
        sk: `EVENT#${event.timestamp}#${event.id}`,
        gsi1pk: `EVENT#${event.id}`,
        gsi1sk: `TYPE#${event.eventType}#${event.timestamp}`,
        ...event
      };

      await this.client.send(new PutCommand({
        TableName: this.eventsTable,
        Item: item
      }));

      return event;
    } catch (error) {
      console.error('Error creating tracking event:', error);
      throw error;
    }
  }

  async getTrackingEvents(trackingId: string, limit?: number): Promise<TrackingEvent[]> {
    try {
      const response = await this.client.send(new QueryCommand({
        TableName: this.eventsTable,
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :sk)',
        ExpressionAttributeValues: {
          ':pk': `TRACKING#${trackingId}`,
          ':sk': 'EVENT#'
        },
        ScanIndexForward: false,
        Limit: limit
      }));

      return (response.Items || []).map(item => ({
        id: item.id,
        trackingId: item.trackingId,
        eventType: item.eventType,
        description: item.description,
        timestamp: item.timestamp,
        metadata: item.metadata,
        createdAt: item.createdAt
      }));
    } catch (error) {
      console.error('Error getting tracking events:', error);
      return [];
    }
  }

  // Geocoding Cache methods
  async getGeocodingCache(
    type: string, 
    key: string, 
    maxAge: number = 24 * 60 * 60 * 1000
  ): Promise<GeocodingCache | null> {
    try {
      const response = await this.client.send(new GetCommand({
        TableName: this.geocodingTable,
        Key: {
          pk: `CACHE#${type}`,
          sk: `KEY#${key}`
        }
      }));

      if (!response.Item) return null;

      const item = response.Item;
      const createdAt = new Date(item.createdAt).getTime();
      const now = Date.now();

      if (now - createdAt > maxAge) {
        // Cache expired, delete it
        await this.deleteGeocodingCache(type, key);
        return null;
      }

      return {
        id: item.id,
        type: item.type,
        address: item.address,
        coordinates: item.coordinates,
        query: item.query,
        results: item.results,
        userId: item.userId,
        expiresAt: item.expiresAt,
        createdAt: item.createdAt
      };
    } catch (error) {
      console.error('Error getting geocoding cache:', error);
      return null;
    }
  }

  async setGeocodingCache(cache: GeocodingCache): Promise<void> {
    try {
      const key = cache.address || cache.coordinates || cache.query || '';
      const item = {
        pk: `CACHE#${cache.type}`,
        sk: `KEY#${key}`,
        ...cache,
        ttl: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours TTL
      };

      await this.client.send(new PutCommand({
        TableName: this.geocodingTable,
        Item: item
      }));
    } catch (error) {
      console.error('Error setting geocoding cache:', error);
      throw error;
    }
  }

  async deleteGeocodingCache(type: string, key: string): Promise<void> {
    try {
      await this.client.send(new DeleteCommand({
        TableName: this.geocodingTable,
        Key: {
          pk: `CACHE#${type}`,
          sk: `KEY#${key}`
        }
      }));
    } catch (error) {
      console.error('Error deleting geocoding cache:', error);
    }
  }

  // Maps Usage methods
  async createMapsUsage(usage: MapsUsage): Promise<void> {
    try {
      const item = {
        pk: `USER#${usage.userId}`,
        sk: `USAGE#${usage.createdAt}#${usage.id}`,
        gsi1pk: `ACTION#${usage.action}`,
        gsi1sk: `DATE#${usage.createdAt.split('T')[0]}`,
        ...usage
      };

      await this.client.send(new PutCommand({
        TableName: this.usageTable,
        Item: item
      }));
    } catch (error) {
      console.error('Error creating maps usage:', error);
      // Don't throw error for usage tracking
    }
  }

  async getMapsUsageStats(
    userId?: string, 
    action?: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<{ totalRequests: number; byAction: Record<string, number> }> {
    try {
      let keyConditionExpression: string;
      let expressionAttributeValues: Record<string, any>;
      let indexName: string | undefined;

      if (userId) {
        keyConditionExpression = 'pk = :pk';
        expressionAttributeValues = { ':pk': `USER#${userId}` };
        
        if (startDate && endDate) {
          keyConditionExpression += ' AND sk BETWEEN :start AND :end';
          expressionAttributeValues[':start'] = `USAGE#${startDate}`;
          expressionAttributeValues[':end'] = `USAGE#${endDate}#ZZZZ`;
        }
      } else if (action) {
        indexName = 'GSI1';
        keyConditionExpression = 'gsi1pk = :action';
        expressionAttributeValues = { ':action': `ACTION#${action}` };
        
        if (startDate && endDate) {
          keyConditionExpression += ' AND gsi1sk BETWEEN :start AND :end';
          expressionAttributeValues[':start'] = `DATE#${startDate}`;
          expressionAttributeValues[':end'] = `DATE#${endDate}`;
        }
      } else {
        // Scan all usage records (expensive, use with caution)
        const response = await this.client.send(new ScanCommand({
          TableName: this.usageTable,
          ProjectionExpression: '#action',
          ExpressionAttributeNames: { '#action': 'action' }
        }));

        const byAction: Record<string, number> = {};
        (response.Items || []).forEach(item => {
          byAction[item.action] = (byAction[item.action] || 0) + 1;
        });

        return {
          totalRequests: response.Items?.length || 0,
          byAction
        };
      }

      const response = await this.client.send(new QueryCommand({
        TableName: this.usageTable,
        IndexName: indexName,
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ProjectionExpression: '#action',
        ExpressionAttributeNames: { '#action': 'action' }
      }));

      const byAction: Record<string, number> = {};
      (response.Items || []).forEach(item => {
        byAction[item.action] = (byAction[item.action] || 0) + 1;
      });

      return {
        totalRequests: response.Items?.length || 0,
        byAction
      };
    } catch (error) {
      console.error('Error getting maps usage stats:', error);
      return { totalRequests: 0, byAction: {} };
    }
  }
}