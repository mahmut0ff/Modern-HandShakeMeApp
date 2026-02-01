// Telegram Auth Session Repository for DynamoDB

import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryItems, updateItem, deleteItem } from '../db/dynamodb-client';
import { Keys } from '../db/dynamodb-keys';

export interface TelegramAuthSession {
  id: string;
  visitorId: string;
  code: string;
  userId?: string;
  isUsed: boolean;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTelegramAuthSessionData {
  visitorId: string;
  code: string;
  expiresAt: string;
}

export class TelegramAuthSessionRepository {
  async create(data: CreateTelegramAuthSessionData): Promise<TelegramAuthSession> {
    const session: TelegramAuthSession = {
      id: uuidv4(),
      visitorId: data.visitorId,
      code: data.code,
      isUsed: false,
      expiresAt: data.expiresAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await putItem({
      ...Keys.telegramSession(session.id),
      ...session,
      GSI1PK: `CODE#${session.code}`,
      GSI1SK: `EXPIRES#${session.expiresAt}`,
      GSI2PK: `VISITOR#${session.visitorId}`,
      GSI2SK: `CREATED#${session.createdAt}`,
    });
    
    return session;
  }
  
  async findById(sessionId: string): Promise<TelegramAuthSession | null> {
    const item = await getItem(Keys.telegramSession(sessionId));
    return item as TelegramAuthSession | null;
  }
  
  async findByCode(code: string): Promise<TelegramAuthSession | null> {
    const items = await queryItems({
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      FilterExpression: 'isUsed = :false AND expiresAt > :now',
      ExpressionAttributeValues: {
        ':pk': `CODE#${code}`,
        ':false': false,
        ':now': new Date().toISOString(),
      },
      ScanIndexForward: false,
      Limit: 1,
    });
    
    return items.length > 0 ? items[0] as TelegramAuthSession : null;
  }
  
  async findByVisitorId(visitorId: string): Promise<TelegramAuthSession | null> {
    const items = await queryItems({
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :pk',
      FilterExpression: 'isUsed = :false AND expiresAt > :now',
      ExpressionAttributeValues: {
        ':pk': `VISITOR#${visitorId}`,
        ':false': false,
        ':now': new Date().toISOString(),
      },
      ScanIndexForward: false,
      Limit: 1,
    });
    
    return items.length > 0 ? items[0] as TelegramAuthSession : null;
  }
  
  async update(sessionId: string, data: Partial<TelegramAuthSession>): Promise<TelegramAuthSession> {
    const updateExpressions: string[] = [];
    const attributeValues: Record<string, any> = {};
    const attributeNames: Record<string, string> = {};
    
    // Always update the updatedAt field
    updateExpressions.push('#updatedAt = :updatedAt');
    attributeNames['#updatedAt'] = 'updatedAt';
    attributeValues[':updatedAt'] = new Date().toISOString();
    
    Object.entries(data).forEach(([key, value], index) => {
      if (value !== undefined && key !== 'updatedAt') {
        updateExpressions.push(`#attr${index} = :val${index}`);
        attributeNames[`#attr${index}`] = key;
        attributeValues[`:val${index}`] = value;
      }
    });
    
    const updated = await updateItem({
      Key: Keys.telegramSession(sessionId),
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: attributeNames,
      ExpressionAttributeValues: attributeValues,
    });
    
    return updated as TelegramAuthSession;
  }
  
  async markAsUsed(sessionId: string, userId: string): Promise<TelegramAuthSession> {
    return this.update(sessionId, {
      isUsed: true,
      userId: userId,
    });
  }
  
  async delete(sessionId: string): Promise<void> {
    await deleteItem(Keys.telegramSession(sessionId));
  }
  
  async cleanupExpired(): Promise<number> {
    // Query all expired sessions
    const now = new Date().toISOString();
    
    // This is a simplified version - in production, use DynamoDB TTL
    // or a scheduled Lambda to clean up expired sessions
    const items = await queryItems({
      IndexName: 'GSI1',
      KeyConditionExpression: 'begins_with(GSI1PK, :prefix)',
      FilterExpression: 'expiresAt < :now',
      ExpressionAttributeValues: {
        ':prefix': 'CODE#',
        ':now': now,
      },
    });
    
    // Delete expired sessions
    let deleted = 0;
    for (const item of items) {
      try {
        await this.delete(item.id);
        deleted++;
      } catch (error) {
        logger.error('Failed to delete expired session', { sessionId: item.id, error });
      }
    }
    
    logger.info('Cleaned up expired sessions', { deleted, total: items.length });
    return deleted;
  }
}