/**
 * Instant Booking Repository
 * Репозиторий для работы с мгновенными бронированиями в DynamoDB
 */

import AWS from 'aws-sdk';
import { 
  InstantBooking, 
  BookingStatus, 
  BookingFilters, 
  BookingSort,
  MasterAvailability,
  ServiceInfo,
  UserProfile
} from '../types/instant-booking';

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME!;

export class InstantBookingRepository {
  
  /**
   * Create new booking
   */
  async createBooking(booking: InstantBooking): Promise<InstantBooking> {
    await dynamodb.put({
      TableName: TABLE_NAME,
      Item: {
        PK: `BOOKING#${booking.id}`,
        SK: `DETAILS`,
        GSI1PK: `USER#${booking.clientId}`,
        GSI1SK: `BOOKING#${booking.createdAt}`,
        GSI2PK: `MASTER#${booking.masterId}`,
        GSI2SK: `BOOKING#${booking.createdAt}`,
        GSI3PK: `STATUS#${booking.status}`,
        GSI3SK: `BOOKING#${booking.scheduledDateTime}`,
        
        ...booking,
        
        entityType: 'INSTANT_BOOKING',
        ttl: booking.expiresAt ? Math.floor(new Date(booking.expiresAt).getTime() / 1000) : undefined
      }
    }).promise();
    
    return booking;
  }
  
  /**
   * Get booking by ID
   */
  async getBooking(bookingId: string): Promise<InstantBooking | null> {
    const result = await dynamodb.get({
      TableName: TABLE_NAME,
      Key: {
        PK: `BOOKING#${bookingId}`,
        SK: `DETAILS`
      }
    }).promise();
    
    if (!result.Item) {
      return null;
    }
    
    return this.mapDynamoItemToBooking(result.Item);
  }
  
  /**
   * Update booking
   */
  async updateBooking(bookingId: string, updates: Partial<InstantBooking>): Promise<InstantBooking> {
    const updateExpression: string[] = [];
    const expressionAttributeNames: { [key: string]: string } = {};
    const expressionAttributeValues: { [key: string]: any } = {};
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateExpression.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      }
    });
    
    // Always update the updatedAt timestamp
    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();
    
    const result = await dynamodb.update({
      TableName: TABLE_NAME,
      Key: {
        PK: `BOOKING#${bookingId}`,
        SK: `DETAILS`
      },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }).promise();
    
    return this.mapDynamoItemToBooking(result.Attributes!);
  }
  
  /**
   * Get user bookings with filters and pagination
   */
  async getUserBookings(
    userId: string,
    role: 'client' | 'master',
    filters: BookingFilters,
    sort: BookingSort,
    page: number,
    limit: number
  ): Promise<{ bookings: InstantBooking[]; totalCount: number }> {
    const gsiPK = role === 'client' ? `USER#${userId}` : `MASTER#${userId}`;
    const indexName = role === 'client' ? 'GSI1' : 'GSI2';
    
    let keyConditionExpression = 'GSI1PK = :pk';
    let expressionAttributeValues: { [key: string]: any } = {
      ':pk': gsiPK
    };
    
    if (role === 'master') {
      keyConditionExpression = 'GSI2PK = :pk';
    }
    
    // Add date range filter
    if (filters.dateFrom || filters.dateTo) {
      if (filters.dateFrom && filters.dateTo) {
        keyConditionExpression += ' AND GSI1SK BETWEEN :dateFrom AND :dateTo';
        expressionAttributeValues[':dateFrom'] = `BOOKING#${filters.dateFrom}`;
        expressionAttributeValues[':dateTo'] = `BOOKING#${filters.dateTo}T23:59:59.999Z`;
      } else if (filters.dateFrom) {
        keyConditionExpression += ' AND GSI1SK >= :dateFrom';
        expressionAttributeValues[':dateFrom'] = `BOOKING#${filters.dateFrom}`;
      } else if (filters.dateTo) {
        keyConditionExpression += ' AND GSI1SK <= :dateTo';
        expressionAttributeValues[':dateTo'] = `BOOKING#${filters.dateTo}T23:59:59.999Z`;
      }
    }
    
    // Build filter expression
    let filterExpression: string[] = [];
    let expressionAttributeNames: { [key: string]: string } = {};
    
    if (filters.status) {
      filterExpression.push('#status = :status');
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = filters.status;
    }
    
    if (filters.search) {
      filterExpression.push('(contains(#notes, :search) OR contains(#address, :search))');
      expressionAttributeNames['#notes'] = 'notes';
      expressionAttributeNames['#address'] = 'address';
      expressionAttributeValues[':search'] = filters.search;
    }
    
    const queryParams: AWS.DynamoDB.DocumentClient.QueryInput = {
      TableName: TABLE_NAME,
      IndexName: indexName,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ScanIndexForward: sort.sortOrder === 'asc',
      Limit: limit
    };
    
    if (filterExpression.length > 0) {
      queryParams.FilterExpression = filterExpression.join(' AND ');
      queryParams.ExpressionAttributeNames = expressionAttributeNames;
    }
    
    // Handle pagination
    if (page > 1) {
      // For simplicity, we'll scan from the beginning and skip items
      // In production, you'd want to implement proper cursor-based pagination
      const skipCount = (page - 1) * limit;
      let allItems: any[] = [];
      let lastEvaluatedKey: any = undefined;
      
      do {
        const tempParams = { ...queryParams };
        if (lastEvaluatedKey) {
          tempParams.ExclusiveStartKey = lastEvaluatedKey;
        }
        tempParams.Limit = undefined; // Remove limit for full scan
        
        const result = await dynamodb.query(tempParams).promise();
        allItems = allItems.concat(result.Items || []);
        lastEvaluatedKey = result.LastEvaluatedKey;
      } while (lastEvaluatedKey && allItems.length < skipCount + limit);
      
      const paginatedItems = allItems.slice(skipCount, skipCount + limit);
      const bookings = paginatedItems.map(item => this.mapDynamoItemToBooking(item));
      
      return {
        bookings,
        totalCount: allItems.length
      };
    }
    
    const result = await dynamodb.query(queryParams).promise();
    const bookings = (result.Items || []).map(item => this.mapDynamoItemToBooking(item));
    
    // Get total count with a separate query
    const countParams = { ...queryParams };
    delete countParams.Limit;
    countParams.Select = 'COUNT';
    const countResult = await dynamodb.query(countParams).promise();
    
    return {
      bookings,
      totalCount: countResult.Count || 0
    };
  }
  
  /**
   * Get master's bookings for availability check
   */
  async getMasterBookings(
    masterId: string,
    startDate: Date,
    endDate: Date,
    excludeBookingId?: string
  ): Promise<InstantBooking[]> {
    const result = await dynamodb.query({
      TableName: TABLE_NAME,
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :pk AND GSI2SK BETWEEN :startDate AND :endDate',
      FilterExpression: excludeBookingId ? 
        '#status IN (:confirmed, :inProgress) AND #id <> :excludeId' :
        '#status IN (:confirmed, :inProgress)',
      ExpressionAttributeNames: {
        '#status': 'status',
        ...(excludeBookingId && { '#id': 'id' })
      },
      ExpressionAttributeValues: {
        ':pk': `MASTER#${masterId}`,
        ':startDate': `BOOKING#${startDate.toISOString()}`,
        ':endDate': `BOOKING#${endDate.toISOString()}`,
        ':confirmed': 'CONFIRMED',
        ':inProgress': 'IN_PROGRESS',
        ...(excludeBookingId && { ':excludeId': excludeBookingId })
      }
    }).promise();
    
    return (result.Items || []).map(item => this.mapDynamoItemToBooking(item));
  }
  
  /**
   * Get master profile
   */
  async getMasterProfile(masterId: string): Promise<UserProfile | null> {
    const result = await dynamodb.get({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${masterId}`,
        SK: `PROFILE`
      }
    }).promise();
    
    if (!result.Item) {
      return null;
    }
    
    return {
      id: result.Item.id,
      name: `${result.Item.firstName} ${result.Item.lastName}`,
      avatar: result.Item.avatar,
      phone: result.Item.phone,
      rating: result.Item.rating,
      responseTime: result.Item.averageResponseTime
    };
  }
  
  /**
   * Get service info
   */
  async getServiceInfo(serviceId: string, masterId: string): Promise<ServiceInfo | null> {
    const result = await dynamodb.get({
      TableName: TABLE_NAME,
      Key: {
        PK: `SERVICE#${serviceId}`,
        SK: `DETAILS`
      },
      FilterExpression: 'masterId = :masterId AND isActive = :active',
      ExpressionAttributeValues: {
        ':masterId': masterId,
        ':active': true
      }
    }).promise();
    
    if (!result.Item) {
      return null;
    }
    
    return {
      id: result.Item.id,
      name: result.Item.name,
      description: result.Item.description,
      category: result.Item.category,
      basePrice: result.Item.basePrice,
      instantBookingEnabled: result.Item.instantBookingEnabled
    };
  }
  
  /**
   * Get master availability
   */
  async getMasterAvailability(masterId: string, dayOfWeek: number): Promise<MasterAvailability[]> {
    const result = await dynamodb.query({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      FilterExpression: 'dayOfWeek = :dayOfWeek AND isAvailable = :available',
      ExpressionAttributeValues: {
        ':pk': `MASTER#${masterId}`,
        ':sk': 'AVAILABILITY#',
        ':dayOfWeek': dayOfWeek,
        ':available': true
      }
    }).promise();
    
    return (result.Items || []).map(item => ({
      dayOfWeek: item.dayOfWeek,
      startTime: item.startTime,
      endTime: item.endTime,
      isAvailable: item.isAvailable
    }));
  }
  
  /**
   * Map DynamoDB item to InstantBooking
   */
  private mapDynamoItemToBooking(item: any): InstantBooking {
    return {
      id: item.id,
      clientId: item.clientId,
      masterId: item.masterId,
      serviceId: item.serviceId,
      scheduledDateTime: item.scheduledDateTime,
      duration: item.duration,
      address: item.address,
      coordinates: item.coordinates,
      notes: item.notes,
      baseAmount: item.baseAmount,
      urgentFee: item.urgentFee || 0,
      platformFee: item.platformFee || 0,
      totalAmount: item.totalAmount,
      status: item.status,
      urgentBooking: item.urgentBooking || false,
      autoConfirmed: item.autoConfirmed || false,
      paymentMethodId: item.paymentMethodId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      confirmedAt: item.confirmedAt,
      startedAt: item.startedAt,
      completedAt: item.completedAt,
      cancelledAt: item.cancelledAt,
      cancelledBy: item.cancelledBy,
      cancellationReason: item.cancellationReason,
      cancellationFee: item.cancellationFee,
      refundAmount: item.refundAmount,
      rescheduledAt: item.rescheduledAt,
      rescheduledBy: item.rescheduledBy,
      expiresAt: item.expiresAt
    };
  }
}