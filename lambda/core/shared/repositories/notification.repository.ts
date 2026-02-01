import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'handshake-table';

export interface Notification {
  id: string;
  userId: string;
  type: 'ORDER' | 'APPLICATION' | 'PROJECT' | 'REVIEW' | 'CHAT' | 'PAYMENT' | 'SYSTEM' | 'SYSTEM_TEST' | 'LOCATION';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  priority?: 'low' | 'normal' | 'high';
  createdAt: string;
  readAt?: string;
}

export interface NotificationSettings {
  id: string;
  userId: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  newOrders: boolean;
  newApplications: boolean;
  applicationAccepted: boolean;
  applicationRejected: boolean;
  newMessages: boolean;
  projectUpdates: boolean;
  paymentReceived: boolean;
  reviewReceived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PushToken {
  id: string;
  userId: string;
  token: string;
  platform: 'IOS' | 'ANDROID' | 'WEB';
  deviceId?: string;
  appVersion?: string;
  osVersion?: string;
  isActive: boolean;
  isVerified: boolean;
  registeredAt: string;
  lastVerifiedAt?: string;
  lastTestError?: string;
}

export interface User {
  id: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
}

export class NotificationRepository {
  async create(notification: {
    userId: string;
    type: 'ORDER' | 'APPLICATION' | 'PROJECT' | 'REVIEW' | 'CHAT' | 'PAYMENT' | 'SYSTEM' | 'SYSTEM_TEST' | 'LOCATION';
    title: string;
    message: string;
    data?: Record<string, any>;
    priority?: 'low' | 'normal' | 'high';
  }): Promise<Notification> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const notificationRecord: Notification = {
      id,
      ...notification,
      isRead: false,
      priority: notification.priority || 'normal',
      createdAt: now
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `USER#${notification.userId}`,
        SK: `NOTIFICATION#${now}#${id}`,
        GSI1PK: 'NOTIFICATION',
        GSI1SK: `USER#${notification.userId}#${now}`,
        GSI2PK: `NOTIFICATION_TYPE#${notification.type}`,
        GSI2SK: `USER#${notification.userId}#${now}`,
        ...notificationRecord
      }
    }));

    return notificationRecord;
  }

  async findByUser(userId: string, limit = 50): Promise<Notification[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'NOTIFICATION#'
      },
      Limit: limit,
      ScanIndexForward: false // Most recent first
    }));

    return (result.Items || []) as Notification[];
  }

  async update(userId: string, notificationId: string, updates: Partial<Notification>): Promise<Notification> {
    // First find the notification to get its sort key
    const notifications = await this.findByUser(userId, 1000);
    const notification = notifications.find(n => n.id === notificationId);
    
    if (!notification) {
      throw new Error('Notification not found');
    }

    const now = new Date().toISOString();
    const updateExpressions: string[] = [];
    const expressionAttributeValues: any = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'userId' && key !== 'createdAt' && value !== undefined) {
        updateExpressions.push(`${key} = :${key}`);
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    if (updates.isRead === true) {
      updateExpressions.push('readAt = :readAt');
      expressionAttributeValues[':readAt'] = now;
    }

    if (updateExpressions.length === 0) {
      return notification;
    }

    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `NOTIFICATION#${notification.createdAt}#${notificationId}`
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }));

    return result.Attributes as Notification;
  }

  async delete(userId: string, notificationId: string): Promise<void> {
    // First find the notification to get its sort key
    const notifications = await this.findByUser(userId, 1000);
    const notification = notifications.find(n => n.id === notificationId);
    
    if (!notification) {
      return; // Already deleted or doesn't exist
    }

    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `NOTIFICATION#${notification.createdAt}#${notificationId}`
      }
    }));
  }

  async markAllAsRead(userId: string): Promise<number> {
    const notifications = await this.findByUser(userId, 1000);
    const unreadNotifications = notifications.filter(n => !n.isRead);
    
    let updatedCount = 0;
    
    for (const notification of unreadNotifications) {
      try {
        await this.update(userId, notification.id, { isRead: true });
        updatedCount++;
      } catch (error) {
        // Continue with other notifications if one fails
        console.error('Failed to mark notification as read:', error);
      }
    }
    
    return updatedCount;
  }

  async deleteAllForUser(userId: string): Promise<number> {
    return this.deleteAll(userId);
  }

  async deleteAll(userId: string): Promise<number> {
    const notifications = await this.findByUser(userId, 1000);
    
    let deletedCount = 0;
    
    for (const notification of notifications) {
      try {
        await this.delete(userId, notification.id);
        deletedCount++;
      } catch (error) {
        // Continue with other notifications if one fails
        console.error('Failed to delete notification:', error);
      }
    }
    
    return deletedCount;
  }

  // Notification Settings Methods
  async getNotificationSettings(userId: string): Promise<NotificationSettings | null> {
    try {
      const result = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: 'NOTIFICATION_SETTINGS'
        }
      }));

      return result.Item as NotificationSettings || null;
    } catch (error) {
      console.error('Failed to get notification settings:', error);
      return null;
    }
  }

  async createDefaultNotificationSettings(
    userId: string, 
    options: { pushEnabled?: boolean; platform?: string } = {}
  ): Promise<NotificationSettings> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const settings: NotificationSettings = {
      id,
      userId,
      pushEnabled: options.pushEnabled || true,
      emailEnabled: true,
      smsEnabled: false,
      newOrders: true,
      newApplications: true,
      applicationAccepted: true,
      applicationRejected: true,
      newMessages: true,
      projectUpdates: true,
      paymentReceived: true,
      reviewReceived: true,
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `USER#${userId}`,
        SK: 'NOTIFICATION_SETTINGS',
        GSI1PK: 'NOTIFICATION_SETTINGS',
        GSI1SK: `USER#${userId}`,
        ...settings
      }
    }));

    return settings;
  }

  async updateNotificationSettings(
    userId: string, 
    updates: Partial<NotificationSettings>
  ): Promise<NotificationSettings> {
    const now = new Date().toISOString();
    const updateExpressions: string[] = [];
    const expressionAttributeValues: any = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'userId' && key !== 'createdAt' && value !== undefined) {
        updateExpressions.push(`${key} = :${key}`);
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    updateExpressions.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = now;

    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: 'NOTIFICATION_SETTINGS'
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }));

    return result.Attributes as NotificationSettings;
  }

  // Push Token Methods
  async getPushTokens(userId: string): Promise<PushToken[]> {
    try {
      const result = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': 'PUSH_TOKEN#'
        }
      }));

      return (result.Items || []) as PushToken[];
    } catch (error) {
      console.error('Failed to get push tokens:', error);
      return [];
    }
  }

  async findPushTokenByToken(token: string): Promise<PushToken | null> {
    try {
      const result = await docClient.send(new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'begins_with(SK, :sk) AND #token = :token',
        ExpressionAttributeNames: {
          '#token': 'token'
        },
        ExpressionAttributeValues: {
          ':sk': 'PUSH_TOKEN#',
          ':token': token
        }
      }));

      return result.Items?.[0] as PushToken || null;
    } catch (error) {
      console.error('Failed to find push token:', error);
      return null;
    }
  }

  async upsertPushToken(tokenData: {
    userId: string;
    token: string;
    platform: 'IOS' | 'ANDROID' | 'WEB';
    deviceId?: string;
    appVersion?: string;
    osVersion?: string;
    isActive: boolean;
    registeredAt: string;
  }): Promise<PushToken> {
    const id = uuidv4();
    const pushToken: PushToken = {
      id,
      ...tokenData,
      isVerified: false,
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `USER#${tokenData.userId}`,
        SK: `PUSH_TOKEN#${tokenData.platform}`,
        GSI1PK: 'PUSH_TOKEN',
        GSI1SK: `USER#${tokenData.userId}#${tokenData.platform}`,
        ...pushToken
      }
    }));

    return pushToken;
  }

  async updatePushToken(
    userId: string, 
    platform: 'IOS' | 'ANDROID' | 'WEB', 
    updates: Partial<PushToken>
  ): Promise<PushToken> {
    const updateExpressions: string[] = [];
    const expressionAttributeValues: any = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'userId' && key !== 'platform' && value !== undefined) {
        updateExpressions.push(`${key} = :${key}`);
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    if (updateExpressions.length === 0) {
      throw new Error('No valid updates provided');
    }

    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `PUSH_TOKEN#${platform}`
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }));

    return result.Attributes as PushToken;
  }

  async deletePushToken(userId: string, platform: 'IOS' | 'ANDROID' | 'WEB'): Promise<void> {
    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `PUSH_TOKEN#${platform}`
      }
    }));
  }

  // User Methods (simplified for notifications)
  async getUserById(userId: string): Promise<User | null> {
    try {
      const result = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: 'PROFILE'
        }
      }));

      if (!result.Item) {
        return null;
      }

      return {
        id: userId,
        email: result.Item.email,
        phone: result.Item.phone,
        firstName: result.Item.firstName,
        lastName: result.Item.lastName,
      };
    } catch (error) {
      console.error('Failed to get user:', error);
      return null;
    }
  }
}