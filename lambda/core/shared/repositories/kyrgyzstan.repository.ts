/**
 * Kyrgyzstan Repository
 * Репозиторий для работы с кыргызстанскими данными в DynamoDB
 */

import AWS from 'aws-sdk';
import { 
  KyrgyzstanBooking, 
  KyrgyzstanService, 
  KyrgyzstanMaster, 
  KyrgyzstanClient,
  KyrgyzstanRegion,
  AvailabilityCheck
} from '../types/kyrgyzstan';

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME!;

export class KyrgyzstanRepository {
  
  /**
   * Создать бронирование
   */
  async createBooking(booking: KyrgyzstanBooking): Promise<KyrgyzstanBooking> {
    await dynamodb.put({
      TableName: TABLE_NAME,
      Item: {
        PK: `BOOKING#${booking.id}`,
        SK: `DETAILS`,
        GSI1PK: `USER#${booking.clientId}`,
        GSI1SK: `BOOKING#${booking.datetime}`,
        GSI2PK: `MASTER#${booking.masterId}`,
        GSI2SK: `BOOKING#${booking.datetime}`,
        GSI3PK: `REGION#${booking.region}`,
        GSI3SK: `BOOKING#${booking.datetime}`,
        
        ...booking,
        
        entityType: 'KYRGYZSTAN_BOOKING',
        searchableText: `${booking.address.value} ${booking.clientNotes || ''}`.toLowerCase()
      }
    }).promise();
    
    return booking;
  }
  
  /**
   * Получить бронирование по ID
   */
  async getBooking(bookingId: string): Promise<KyrgyzstanBooking | null> {
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
   * Обновить бронирование
   */
  async updateBooking(bookingId: string, updates: Partial<KyrgyzstanBooking>): Promise<KyrgyzstanBooking> {
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
    
    // Всегда обновляем updatedAt
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
   * Получить услугу
   */
  async getService(serviceId: string): Promise<KyrgyzstanService | null> {
    const result = await dynamodb.get({
      TableName: TABLE_NAME,
      Key: {
        PK: `SERVICE#${serviceId}`,
        SK: `DETAILS`
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
      pricePerHour: result.Item.pricePerHour || result.Item.basePrice,
      instantBookingEnabled: result.Item.instantBookingEnabled || false,
      availableRegions: result.Item.availableRegions || ['bishkek'],
      acceptedPaymentMethods: result.Item.acceptedPaymentMethods || ['cash_on_meeting']
    };
  }
  
  /**
   * Получить профиль мастера
   */
  async getMasterProfile(masterId: string): Promise<KyrgyzstanMaster | null> {
    const result = await dynamodb.get({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${masterId}`,
        SK: `PROFILE`
      }
    }).promise();
    
    if (!result.Item || result.Item.userType !== 'MASTER') {
      return null;
    }
    
    return {
      id: result.Item.id,
      firstName: result.Item.firstName,
      lastName: result.Item.lastName,
      phone: result.Item.phone,
      email: result.Item.email,
      avatar: result.Item.avatar,
      rating: result.Item.rating || 0,
      responseTime: result.Item.averageResponseTime || 60,
      preferredLanguage: result.Item.preferredLanguage || 'ru',
      workingRegions: result.Item.workingRegions || ['bishkek'],
      acceptedPaymentMethods: result.Item.acceptedPaymentMethods || ['cash_on_meeting'],
      notifications: {
        sms: result.Item.notifications?.sms !== false,
        push: result.Item.notifications?.push !== false,
        email: result.Item.notifications?.email || false
      }
    };
  }
  
  /**
   * Получить профиль клиента
   */
  async getClientProfile(clientId: string): Promise<KyrgyzstanClient | null> {
    const result = await dynamodb.get({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${clientId}`,
        SK: `PROFILE`
      }
    }).promise();
    
    if (!result.Item) {
      return null;
    }
    
    return {
      id: result.Item.id,
      firstName: result.Item.firstName,
      lastName: result.Item.lastName,
      phone: result.Item.phone,
      email: result.Item.email,
      avatar: result.Item.avatar,
      preferredLanguage: result.Item.preferredLanguage || 'ru',
      preferredRegion: result.Item.preferredRegion || 'bishkek',
      preferredPaymentMethod: result.Item.preferredPaymentMethod || 'cash_on_meeting'
    };
  }
  
  /**
   * Проверить доступность временного слота
   */
  async checkSlotAvailability(
    masterId: string,
    datetime: string,
    duration: number,
    excludeBookingId?: string
  ): Promise<AvailabilityCheck> {
    const startTime = new Date(datetime);
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
    
    // Получаем все бронирования мастера на этот день
    const dayStart = new Date(startTime);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(startTime);
    dayEnd.setHours(23, 59, 59, 999);
    
    const result = await dynamodb.query({
      TableName: TABLE_NAME,
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :pk AND GSI2SK BETWEEN :start AND :end',
      FilterExpression: excludeBookingId ? 
        '#status IN (:confirmed, :inProgress) AND #id <> :excludeId' :
        '#status IN (:confirmed, :inProgress)',
      ExpressionAttributeNames: {
        '#status': 'status',
        ...(excludeBookingId && { '#id': 'id' })
      },
      ExpressionAttributeValues: {
        ':pk': `MASTER#${masterId}`,
        ':start': `BOOKING#${dayStart.toISOString()}`,
        ':end': `BOOKING#${dayEnd.toISOString()}`,
        ':confirmed': 'confirmed',
        ':inProgress': 'in_progress',
        ...(excludeBookingId && { ':excludeId': excludeBookingId })
      }
    }).promise();
    
    // Проверяем пересечения времени
    for (const item of result.Items || []) {
      const bookingStart = new Date(item.datetime);
      const bookingEnd = new Date(bookingStart.getTime() + item.duration * 60 * 1000);
      
      // Проверяем пересечение
      if (startTime < bookingEnd && endTime > bookingStart) {
        return {
          isAvailable: false,
          reason: 'time_conflict'
        };
      }
    }
    
    return { isAvailable: true };
  }
  
  /**
   * Получить бронирования мастера за период
   */
  async getMasterBookings(
    masterId: string,
    startDate: Date,
    endDate: Date
  ): Promise<KyrgyzstanBooking[]> {
    const result = await dynamodb.query({
      TableName: TABLE_NAME,
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :pk AND GSI2SK BETWEEN :start AND :end',
      ExpressionAttributeValues: {
        ':pk': `MASTER#${masterId}`,
        ':start': `BOOKING#${startDate.toISOString()}`,
        ':end': `BOOKING#${endDate.toISOString()}`
      }
    }).promise();
    
    return (result.Items || []).map(item => this.mapDynamoItemToBooking(item));
  }
  
  /**
   * Получить бронирования клиента
   */
  async getClientBookings(
    clientId: string,
    limit: number = 20,
    lastEvaluatedKey?: any
  ): Promise<{ bookings: KyrgyzstanBooking[]; lastEvaluatedKey?: any }> {
    const params: AWS.DynamoDB.DocumentClient.QueryInput = {
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `USER#${clientId}`
      },
      ScanIndexForward: false, // Сортировка по убыванию (новые первыми)
      Limit: limit
    };
    
    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = lastEvaluatedKey;
    }
    
    const result = await dynamodb.query(params).promise();
    
    return {
      bookings: (result.Items || []).map(item => this.mapDynamoItemToBooking(item)),
      lastEvaluatedKey: result.LastEvaluatedKey
    };
  }
  
  /**
   * Получить бронирования по региону
   */
  async getRegionalBookings(
    region: KyrgyzstanRegion,
    limit: number = 50
  ): Promise<KyrgyzstanBooking[]> {
    const result = await dynamodb.query({
      TableName: TABLE_NAME,
      IndexName: 'GSI3',
      KeyConditionExpression: 'GSI3PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `REGION#${region}`
      },
      ScanIndexForward: false,
      Limit: limit
    }).promise();
    
    return (result.Items || []).map(item => this.mapDynamoItemToBooking(item));
  }
  
  /**
   * Поиск бронирований
   */
  async searchBookings(params: {
    userId: string;
    userType: 'client' | 'master';
    status?: string;
    region?: KyrgyzstanRegion;
    dateFrom?: string;
    dateTo?: string;
    searchText?: string;
    limit?: number;
  }): Promise<KyrgyzstanBooking[]> {
    const { userId, userType, status, region, dateFrom, dateTo, searchText, limit = 20 } = params;
    
    const indexName = userType === 'client' ? 'GSI1' : 'GSI2';
    const pkValue = userType === 'client' ? `USER#${userId}` : `MASTER#${userId}`;
    
    let keyConditionExpression = `${indexName}PK = :pk`;
    const expressionAttributeValues: any = { ':pk': pkValue };
    
    // Добавляем фильтр по дате если указан
    if (dateFrom && dateTo) {
      keyConditionExpression += ` AND ${indexName}SK BETWEEN :dateFrom AND :dateTo`;
      expressionAttributeValues[':dateFrom'] = `BOOKING#${dateFrom}`;
      expressionAttributeValues[':dateTo'] = `BOOKING#${dateTo}`;
    }
    
    // Строим фильтр
    const filterExpressions: string[] = [];
    const expressionAttributeNames: any = {};
    
    if (status) {
      filterExpressions.push('#status = :status');
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = status;
    }
    
    if (region) {
      filterExpressions.push('#region = :region');
      expressionAttributeNames['#region'] = 'region';
      expressionAttributeValues[':region'] = region;
    }
    
    if (searchText) {
      filterExpressions.push('contains(searchableText, :searchText)');
      expressionAttributeValues[':searchText'] = searchText.toLowerCase();
    }
    
    const queryParams: AWS.DynamoDB.DocumentClient.QueryInput = {
      TableName: TABLE_NAME,
      IndexName: indexName,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ScanIndexForward: false,
      Limit: limit
    };
    
    if (filterExpressions.length > 0) {
      queryParams.FilterExpression = filterExpressions.join(' AND ');
      queryParams.ExpressionAttributeNames = expressionAttributeNames;
    }
    
    const result = await dynamodb.query(queryParams).promise();
    
    return (result.Items || []).map(item => this.mapDynamoItemToBooking(item));
  }
  
  /**
   * Маппинг DynamoDB элемента в KyrgyzstanBooking
   */
  private mapDynamoItemToBooking(item: any): KyrgyzstanBooking {
    return {
      id: item.id,
      clientId: item.clientId,
      masterId: item.masterId,
      serviceId: item.serviceId,
      datetime: item.datetime,
      duration: item.duration,
      paymentMethod: item.paymentMethod,
      paymentStatus: item.paymentStatus,
      address: item.address,
      region: item.region,
      language: item.language,
      urgency: item.urgency,
      basePrice: item.basePrice,
      regionalMultiplier: item.regionalMultiplier,
      urgencyMultiplier: item.urgencyMultiplier,
      paymentMultiplier: item.paymentMultiplier,
      totalPrice: item.totalPrice,
      commission: item.commission,
      clientNotes: item.clientNotes,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      confirmedAt: item.confirmedAt,
      completedAt: item.completedAt,
      cancelledAt: item.cancelledAt
    };
  }
}