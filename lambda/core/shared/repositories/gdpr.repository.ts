// GDPR Repository for DynamoDB operations

import AWS from 'aws-sdk';
import { logger } from '../utils/logger';
import { GDPRDeletionRecord, GDPROperationResult, AnonymizedUserData } from '../types/gdpr';

export class GDPRRepository {
  private dynamodb: AWS.DynamoDB.DocumentClient;
  private tableName: string;

  constructor() {
    this.dynamodb = new AWS.DynamoDB.DocumentClient();
    this.tableName = process.env.DYNAMODB_TABLE_NAME!;
    
    if (!this.tableName) {
      throw new Error('DYNAMODB_TABLE_NAME environment variable is required');
    }
  }

  /**
   * Create deletion record for audit and legal compliance
   */
  async createDeletionRecord(record: GDPRDeletionRecord): Promise<void> {
    const item = {
      PK: `GDPR#DELETION`,
      SK: `USER#${record.userId}#${Date.now()}`,
      GSI1PK: `USER#${record.userId}`,
      GSI1SK: `GDPR#DELETION#${record.deletedAt}`,
      
      ...record,
      type: 'gdpr_deletion',
      createdAt: new Date().toISOString(),
      ttl: Math.floor(new Date(record.retentionUntil).getTime() / 1000) // Auto-delete after retention period
    };

    try {
      await this.dynamodb.put({
        TableName: this.tableName,
        Item: item,
        ConditionExpression: 'attribute_not_exists(PK)'
      }).promise();

      logger.info('GDPR deletion record created', { userId: record.userId });
    } catch (error: any) {
      logger.error('Failed to create GDPR deletion record', { userId: record.userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get user data for export
   */
  async getUserData(userId: string): Promise<any> {
    try {
      const result = await this.dynamodb.query({
        TableName: this.tableName,
        KeyConditionExpression: 'GSI1PK = :userId',
        ExpressionAttributeValues: {
          ':userId': `USER#${userId}`
        },
        IndexName: 'GSI1'
      }).promise();

      return result.Items || [];
    } catch (error: any) {
      logger.error('Failed to get user data for export', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<any> {
    try {
      const result = await this.dynamodb.get({
        TableName: this.tableName,
        Key: {
          PK: `USER#${userId}`,
          SK: `PROFILE`
        }
      }).promise();

      return result.Item;
    } catch (error: any) {
      logger.error('Failed to get user profile', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get user orders
   */
  async getUserOrders(userId: string, role: 'CLIENT' | 'MASTER'): Promise<any[]> {
    try {
      const keyCondition = role === 'CLIENT' ? 'CLIENT#' : 'MASTER#';
      
      const result = await this.dynamodb.query({
        TableName: this.tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :userKey',
        ExpressionAttributeValues: {
          ':userKey': `${keyCondition}${userId}`
        }
      }).promise();

      return result.Items?.filter(item => item.type === 'order') || [];
    } catch (error: any) {
      logger.error('Failed to get user orders', { userId, role, error: error.message });
      throw error;
    }
  }

  /**
   * Get user applications
   */
  async getUserApplications(userId: string, role: 'CLIENT' | 'MASTER'): Promise<any[]> {
    try {
      const result = await this.dynamodb.query({
        TableName: this.tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :userId',
        FilterExpression: '#type = :type',
        ExpressionAttributeNames: {
          '#type': 'type'
        },
        ExpressionAttributeValues: {
          ':userId': `USER#${userId}`,
          ':type': 'application'
        }
      }).promise();

      return result.Items || [];
    } catch (error: any) {
      logger.error('Failed to get user applications', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get user reviews
   */
  async getUserReviews(userId: string): Promise<{ given: any[], received: any[] }> {
    try {
      // Get reviews given by user
      const givenResult = await this.dynamodb.query({
        TableName: this.tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :reviewerId',
        FilterExpression: '#type = :type',
        ExpressionAttributeNames: {
          '#type': 'type'
        },
        ExpressionAttributeValues: {
          ':reviewerId': `REVIEWER#${userId}`,
          ':type': 'review'
        }
      }).promise();

      // Get reviews received by user
      const receivedResult = await this.dynamodb.query({
        TableName: this.tableName,
        IndexName: 'GSI2',
        KeyConditionExpression: 'GSI2PK = :revieweeId',
        FilterExpression: '#type = :type',
        ExpressionAttributeNames: {
          '#type': 'type'
        },
        ExpressionAttributeValues: {
          ':revieweeId': `REVIEWEE#${userId}`,
          ':type': 'review'
        }
      }).promise();

      return {
        given: givenResult.Items || [],
        received: receivedResult.Items || []
      };
    } catch (error: any) {
      logger.error('Failed to get user reviews', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get user messages
   */
  async getUserMessages(userId: string): Promise<any[]> {
    try {
      const result = await this.dynamodb.query({
        TableName: this.tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :userId',
        FilterExpression: '#type = :type',
        ExpressionAttributeNames: {
          '#type': 'type'
        },
        ExpressionAttributeValues: {
          ':userId': `USER#${userId}`,
          ':type': 'message'
        }
      }).promise();

      return result.Items || [];
    } catch (error: any) {
      logger.error('Failed to get user messages', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string): Promise<any[]> {
    try {
      const result = await this.dynamodb.query({
        TableName: this.tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :userId',
        FilterExpression: '#type = :type',
        ExpressionAttributeNames: {
          '#type': 'type'
        },
        ExpressionAttributeValues: {
          ':userId': `USER#${userId}`,
          ':type': 'notification'
        }
      }).promise();

      return result.Items || [];
    } catch (error: any) {
      logger.error('Failed to get user notifications', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get user wallet data
   */
  async getUserWallet(userId: string): Promise<any> {
    try {
      const result = await this.dynamodb.get({
        TableName: this.tableName,
        Key: {
          PK: `USER#${userId}`,
          SK: `WALLET`
        }
      }).promise();

      return result.Item;
    } catch (error: any) {
      logger.error('Failed to get user wallet', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get user transactions
   */
  async getUserTransactions(userId: string): Promise<any[]> {
    try {
      const result = await this.dynamodb.query({
        TableName: this.tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :userId',
        FilterExpression: '#type = :type',
        ExpressionAttributeNames: {
          '#type': 'type'
        },
        ExpressionAttributeValues: {
          ':userId': `USER#${userId}`,
          ':type': 'transaction'
        }
      }).promise();

      return result.Items || [];
    } catch (error: any) {
      logger.error('Failed to get user transactions', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Anonymize user profile
   */
  async anonymizeUser(userId: string, anonymizedData: AnonymizedUserData): Promise<void> {
    try {
      await this.dynamodb.update({
        TableName: this.tableName,
        Key: {
          PK: `USER#${userId}`,
          SK: `PROFILE`
        },
        UpdateExpression: `
          SET 
            email = :email,
            phone = :phone,
            firstName = :firstName,
            lastName = :lastName,
            avatar = :avatar,
            passwordHash = :passwordHash,
            telegramId = :telegramId,
            telegramUsername = :telegramUsername,
            isBlocked = :isBlocked,
            isDeleted = :isDeleted,
            deletedAt = :deletedAt,
            lastLoginAt = :lastLoginAt,
            updatedAt = :updatedAt
        `,
        ExpressionAttributeValues: {
          ':email': anonymizedData.email,
          ':phone': anonymizedData.phone,
          ':firstName': anonymizedData.firstName,
          ':lastName': anonymizedData.lastName,
          ':avatar': anonymizedData.avatar,
          ':passwordHash': anonymizedData.passwordHash,
          ':telegramId': anonymizedData.telegramId,
          ':telegramUsername': anonymizedData.telegramUsername,
          ':isBlocked': anonymizedData.isBlocked,
          ':isDeleted': anonymizedData.isDeleted,
          ':deletedAt': anonymizedData.deletedAt,
          ':lastLoginAt': anonymizedData.lastLoginAt,
          ':updatedAt': new Date().toISOString()
        }
      }).promise();

      logger.info('User profile anonymized', { userId });
    } catch (error: any) {
      logger.error('Failed to anonymize user profile', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Anonymize user reviews (keep for ratings but remove personal data)
   */
  async anonymizeUserReviews(userId: string): Promise<number> {
    try {
      const reviews = await this.getUserReviews(userId);
      let anonymizedCount = 0;

      // Anonymize reviews given by user
      for (const review of reviews.given) {
        await this.dynamodb.update({
          TableName: this.tableName,
          Key: {
            PK: review.PK,
            SK: review.SK
          },
          UpdateExpression: `
            SET 
              comment = :comment,
              reviewerName = :reviewerName,
              isAnonymized = :isAnonymized,
              updatedAt = :updatedAt
          `,
          ExpressionAttributeValues: {
            ':comment': '[Review from deleted user]',
            ':reviewerName': 'Deleted User',
            ':isAnonymized': true,
            ':updatedAt': new Date().toISOString()
          }
        }).promise();
        anonymizedCount++;
      }

      logger.info('User reviews anonymized', { userId, count: anonymizedCount });
      return anonymizedCount;
    } catch (error: any) {
      logger.error('Failed to anonymize user reviews', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Delete user messages
   */
  async deleteUserMessages(userId: string): Promise<number> {
    try {
      const messages = await this.getUserMessages(userId);
      let deletedCount = 0;

      for (const message of messages) {
        await this.dynamodb.delete({
          TableName: this.tableName,
          Key: {
            PK: message.PK,
            SK: message.SK
          }
        }).promise();
        deletedCount++;
      }

      logger.info('User messages deleted', { userId, count: deletedCount });
      return deletedCount;
    } catch (error: any) {
      logger.error('Failed to delete user messages', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Delete user notifications
   */
  async deleteUserNotifications(userId: string): Promise<number> {
    try {
      const notifications = await this.getUserNotifications(userId);
      let deletedCount = 0;

      for (const notification of notifications) {
        await this.dynamodb.delete({
          TableName: this.tableName,
          Key: {
            PK: notification.PK,
            SK: notification.SK
          }
        }).promise();
        deletedCount++;
      }

      logger.info('User notifications deleted', { userId, count: deletedCount });
      return deletedCount;
    } catch (error: any) {
      logger.error('Failed to delete user notifications', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Check if user has active orders
   */
  async hasActiveOrders(userId: string, role: 'CLIENT' | 'MASTER'): Promise<boolean> {
    try {
      const orders = await this.getUserOrders(userId, role);
      const activeStatuses = ['PENDING', 'ACCEPTED', 'IN_PROGRESS'];
      
      return orders.some(order => activeStatuses.includes(order.status));
    } catch (error: any) {
      logger.error('Failed to check active orders', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(userId: string): Promise<number> {
    try {
      const wallet = await this.getUserWallet(userId);
      return wallet?.balance || 0;
    } catch (error: any) {
      logger.error('Failed to get wallet balance', { userId, error: error.message });
      return 0;
    }
  }

  /**
   * Verify user password
   */
  async verifyUserPassword(userId: string, password: string): Promise<boolean> {
    try {
      const user = await this.getUserProfile(userId);
      if (!user || !user.passwordHash) {
        return false;
      }

      // In a real implementation, you would use bcrypt or similar
      // For now, this is a placeholder
      const bcrypt = require('bcryptjs');
      return await bcrypt.compare(password, user.passwordHash);
    } catch (error: any) {
      logger.error('Failed to verify user password', { userId, error: error.message });
      return false;
    }
  }
}