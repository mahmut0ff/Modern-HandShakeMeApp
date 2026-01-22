// Notification Repository for DynamoDB

import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryItems, updateItem, deleteItem } from '../db/dynamodb-client';
import { Keys } from '../db/dynamodb-keys';

export interface Notification {
  id: string;
  userId: string;
  type: 'ORDER' | 'APPLICATION' | 'PROJECT' | 'REVIEW' | 'CHAT' | 'PAYMENT' | 'SYSTEM';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export class NotificationRepository {
  async create(data: Partial<Notification>): Promise<Notification> {
    const notification: Notification = {
      id: uuidv4(),
      userId: data.userId!,
      type: data.type!,
      title: data.title!,
      message: data.message!,
      data: data.data,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    
    await putItem({
      ...Keys.notification(notification.userId, notification.id),
      ...notification,
    });
    
    return notification;
  }
  
  async findById(userId: string, notificationId: string): Promise<Notification | null> {
    const item = await getItem(Keys.notification(userId, notificationId));
    return item as Notification | null;
  }
  
  async findByUser(userId: string, limit = 50): Promise<Notification[]> {
    const items = await queryItems({
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'NOTIF#',
      },
      ScanIndexForward: false,
      Limit: limit,
    });
    
    return items as Notification[];
  }
  
  async update(userId: string, notificationId: string, data: Partial<Notification>): Promise<Notification> {
    const updateExpressions: string[] = [];
    const attributeValues: Record<string, any> = {};
    const attributeNames: Record<string, string> = {};
    
    Object.entries(data).forEach(([key, value], index) => {
      if (value !== undefined) {
        updateExpressions.push(`#attr${index} = :val${index}`);
        attributeNames[`#attr${index}`] = key;
        attributeValues[`:val${index}`] = value;
      }
    });
    
    const updated = await updateItem({
      Key: Keys.notification(userId, notificationId),
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: attributeNames,
      ExpressionAttributeValues: attributeValues,
    });
    
    return updated as Notification;
  }
  
  async delete(userId: string, notificationId: string): Promise<void> {
    await deleteItem(Keys.notification(userId, notificationId));
  }
  
  async deleteAllForUser(userId: string): Promise<void> {
    const notifications = await this.findByUser(userId, 1000);
    
    for (const notification of notifications) {
      await this.delete(userId, notification.id);
    }
  }
}
