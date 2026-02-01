// User Repository for DynamoDB

import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryItems, updateItem } from '../db/dynamodb-client';
import { Keys } from '../db/dynamodb-keys';
import { logger } from '../utils/logger';

export interface User {
  id: string;
  phone: string;
  email?: string;
  role: 'MASTER' | 'CLIENT' | 'ADMIN';
  firstName: string;
  lastName: string;
  name?: string; // Computed field for backward compatibility
  avatar?: string;
  rating?: number; // For masters
  completedProjects?: number; // For masters
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  verificationCode?: string;
  verificationCodeExpiry?: string;
  twoFactorEnabled: boolean;
  lastLoginAt?: string;
  isOnline: boolean;
  lastSeen?: string;
  telegramId?: string;
  telegramUsername?: string;
  telegramPhotoUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TelegramUserStats {
  totalUsers: number;
  clientsWithTelegram: number;
  mastersWithTelegram: number;
  recentlyActive: number;
}

export class UserRepository {
  async create(data: Partial<User>): Promise<User> {
    try {
      if (!data.phone || !data.firstName) {
        throw new Error('Phone and firstName are required');
      }

      const user: User = {
        id: uuidv4(),
        phone: data.phone,
        email: data.email,
        role: data.role || 'CLIENT',
        firstName: data.firstName,
        lastName: data.lastName || '',
        avatar: data.avatar,
        isPhoneVerified: data.isPhoneVerified || false,
        isEmailVerified: data.isEmailVerified || false,
        verificationCode: data.verificationCode,
        verificationCodeExpiry: data.verificationCodeExpiry,
        twoFactorEnabled: data.twoFactorEnabled || false,
        isOnline: false,
        telegramId: data.telegramId,
        telegramUsername: data.telegramUsername,
        telegramPhotoUrl: data.telegramPhotoUrl,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const item: Record<string, any> = {
        ...Keys.user(user.id),
        ...user,
      };
      
      // Add GSI for phone lookup if phone exists
      if (user.phone) {
        item.GSI2PK = `PHONE#${user.phone}`;
        item.GSI2SK = 'USER';
      }
      
      // Add GSI for telegram lookup if telegramId exists
      if (user.telegramId) {
        item.GSI3PK = `TELEGRAM#${user.telegramId}`;
        item.GSI3SK = 'USER';
      }
      
      await putItem(item);
      
      logger.info('User created successfully', { userId: user.id, role: user.role });
      return user;
    } catch (error) {
      logger.error('Failed to create user', error, { phone: data.phone, role: data.role });
      throw new Error('Failed to create user');
    }
  }
  
  async findById(userId: string): Promise<User | null> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const item = await getItem(Keys.user(userId));
      if (item) {
        // Add computed name field for backward compatibility
        const user = item as User;
        user.name = `${user.firstName} ${user.lastName}`.trim();
        return user;
      }
      return null;
    } catch (error) {
      logger.error('Failed to find user by ID', error, { userId });
      throw new Error('Failed to retrieve user');
    }
  }
  
  async findByPhone(phone: string): Promise<User | null> {
    try {
      if (!phone) {
        throw new Error('Phone number is required');
      }

      const items = await queryItems({
        IndexName: 'GSI2',
        KeyConditionExpression: 'GSI2PK = :pk AND GSI2SK = :sk',
        ExpressionAttributeValues: {
          ':pk': `PHONE#${phone}`,
          ':sk': 'USER',
        },
      });
      
      const user = items[0] as User | null;
      if (user) {
        user.name = `${user.firstName} ${user.lastName}`.trim();
      }
      return user;
    } catch (error) {
      logger.error('Failed to find user by phone', error, { phone });
      throw new Error('Failed to retrieve user by phone');
    }
  }
  
  async findByTelegramId(telegramId: string): Promise<User | null> {
    try {
      if (!telegramId) {
        throw new Error('Telegram ID is required');
      }

      const items = await queryItems({
        IndexName: 'GSI3',
        KeyConditionExpression: 'GSI3PK = :pk AND GSI3SK = :sk',
        ExpressionAttributeValues: {
          ':pk': `TELEGRAM#${telegramId}`,
          ':sk': 'USER',
        },
      });
      
      const user = items[0] as User | null;
      if (user) {
        user.name = `${user.firstName} ${user.lastName}`.trim();
      }
      return user;
    } catch (error) {
      logger.error('Failed to find user by Telegram ID', error, { telegramId });
      throw new Error('Failed to retrieve user by Telegram ID');
    }
  }
  
  async update(userId: string, data: Partial<User>): Promise<User> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Validate that user exists first
      const existingUser = await this.findById(userId);
      if (!existingUser) {
        throw new Error('User not found');
      }

      const updateExpressions: string[] = [];
      const attributeValues: Record<string, any> = {};
      const attributeNames: Record<string, string> = {};
      
      Object.entries(data).forEach(([key, value], index) => {
        if (value !== undefined && key !== 'id' && key !== 'createdAt') {
          updateExpressions.push(`#attr${index} = :val${index}`);
          attributeNames[`#attr${index}`] = key;
          attributeValues[`:val${index}`] = value;
        }
      });
      
      updateExpressions.push('#updatedAt = :updatedAt');
      attributeNames['#updatedAt'] = 'updatedAt';
      attributeValues[':updatedAt'] = new Date().toISOString();
      
      const updated = await updateItem({
        Key: Keys.user(userId),
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: attributeNames,
        ExpressionAttributeValues: attributeValues,
      });
      
      logger.info('User updated successfully', { userId });
      return updated as User;
    } catch (error) {
      logger.error('Failed to update user', error, { userId });
      throw new Error('Failed to update user');
    }
  }
  
  async findUsersWithTelegram(role: 'CLIENT' | 'MASTER' | 'ALL' = 'ALL'): Promise<User[]> {
    try {
      // This would require a GSI on telegramId field
      // For now, we'll scan the table (not efficient for large datasets)
      const items = await queryItems({
        KeyConditionExpression: 'PK = :pk',
        FilterExpression: role === 'ALL' 
          ? 'attribute_exists(telegramId) AND isActive = :isActive'
          : 'attribute_exists(telegramId) AND #role = :role AND isActive = :isActive',
        ExpressionAttributeNames: role === 'ALL' ? { '#isActive': 'isActive' } : { '#role': 'role', '#isActive': 'isActive' },
        ExpressionAttributeValues: role === 'ALL' 
          ? { ':pk': 'USER', ':isActive': true }
          : { ':pk': 'USER', ':role': role, ':isActive': true },
      });
      
      return items.map(item => {
        const user = item as User;
        user.name = `${user.firstName} ${user.lastName}`.trim();
        return user;
      });
    } catch (error) {
      logger.error('Failed to find users with Telegram', error, { role });
      throw new Error('Failed to retrieve users with Telegram');
    }
  }
  
  async getTelegramUserStats(): Promise<TelegramUserStats> {
    try {
      // Get all users with Telegram
      const telegramUsers = await this.findUsersWithTelegram('ALL');
      
      const stats: TelegramUserStats = {
        totalUsers: telegramUsers.length,
        clientsWithTelegram: telegramUsers.filter(u => u.role === 'CLIENT').length,
        mastersWithTelegram: telegramUsers.filter(u => u.role === 'MASTER').length,
        recentlyActive: telegramUsers.filter(u => {
          if (!u.lastLoginAt) return false;
          const lastLogin = new Date(u.lastLoginAt);
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return lastLogin > weekAgo;
        }).length,
      };
      
      return stats;
    } catch (error) {
      logger.error('Failed to get Telegram user stats', error);
      throw new Error('Failed to retrieve Telegram user statistics');
    }
  }

  async deactivateUser(userId: string): Promise<void> {
    try {
      await this.update(userId, { isActive: false });
      logger.info('User deactivated', { userId });
    } catch (error) {
      logger.error('Failed to deactivate user', error, { userId });
      throw new Error('Failed to deactivate user');
    }
  }

  async activateUser(userId: string): Promise<void> {
    try {
      await this.update(userId, { isActive: true });
      logger.info('User activated', { userId });
    } catch (error) {
      logger.error('Failed to activate user', error, { userId });
      throw new Error('Failed to activate user');
    }
  }
}
