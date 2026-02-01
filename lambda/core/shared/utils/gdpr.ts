// GDPR utility functions

import { logger } from './logger';
import { GDPRDeletionRecord, AnonymizedUserData, FileReference } from '../types/gdpr';
import crypto from 'crypto';

export class GDPRUtils {
  
  /**
   * Generate anonymized email that can't be traced back to original
   */
  static generateAnonymizedEmail(userId: string): string {
    const hash = crypto.createHash('sha256').update(userId + process.env.GDPR_SALT || 'default-salt').digest('hex');
    return `deleted_${hash.substring(0, 8)}@anonymized.local`;
  }

  /**
   * Generate anonymized identifier
   */
  static generateAnonymizedId(): string {
    return `anon_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Calculate retention period (30 days from deletion)
   */
  static calculateRetentionUntil(deletionDate: Date = new Date()): string {
    const retentionDate = new Date(deletionDate);
    retentionDate.setDate(retentionDate.getDate() + 30);
    return retentionDate.toISOString();
  }

  /**
   * Validate if user can be deleted (no active obligations)
   */
  static validateDeletionEligibility(activeOrders: any[], walletBalance: number): {
    canDelete: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];

    if (activeOrders.length > 0) {
      reasons.push(`${activeOrders.length} active orders must be completed or cancelled first`);
    }

    if (walletBalance > 0) {
      reasons.push(`Wallet balance of ${walletBalance} must be withdrawn first`);
    }

    return {
      canDelete: reasons.length === 0,
      reasons
    };
  }

  /**
   * Create anonymized user data
   */
  static createAnonymizedUserData(userId: string): AnonymizedUserData {
    return {
      email: this.generateAnonymizedEmail(userId),
      phone: null,
      firstName: 'Deleted',
      lastName: 'User',
      avatar: null,
      passwordHash: '', // Clear password hash
      telegramId: null,
      telegramUsername: null,
      isBlocked: true,
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      lastLoginAt: null,
    };
  }

  /**
   * Extract file references from user data
   */
  static extractFileReferences(userData: any): FileReference[] {
    const files: FileReference[] = [];

    // Avatar
    if (userData.avatar) {
      files.push({
        url: userData.avatar,
        category: 'avatar',
        userId: userData.id
      });
    }

    // Portfolio images
    if (userData.portfolio) {
      userData.portfolio.forEach((item: any) => {
        if (item.images) {
          item.images.forEach((imageUrl: string) => {
            files.push({
              url: imageUrl,
              category: 'portfolio',
              userId: userData.id,
              relatedId: item.id
            });
          });
        }
      });
    }

    // Order attachments
    if (userData.orders) {
      userData.orders.forEach((order: any) => {
        if (order.attachments) {
          order.attachments.forEach((attachmentUrl: string) => {
            files.push({
              url: attachmentUrl,
              category: 'order_attachment',
              userId: userData.id,
              relatedId: order.id
            });
          });
        }
      });
    }

    return files;
  }

  /**
   * Sanitize data for export (remove sensitive internal fields)
   */
  static sanitizeForExport(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeForExport(item));
    }

    const sanitized = { ...data };
    
    // Remove sensitive fields
    const sensitiveFields = [
      'passwordHash',
      'internalNotes',
      'adminFlags',
      'systemMetadata',
      'ipAddress',
      'userAgent',
      'sessionId',
      'refreshToken'
    ];

    sensitiveFields.forEach(field => {
      delete sanitized[field];
    });

    // Recursively sanitize nested objects
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeForExport(sanitized[key]);
      }
    });

    return sanitized;
  }

  /**
   * Log GDPR operation for audit trail
   */
  static logGDPROperation(
    operation: 'DELETE_ACCOUNT' | 'EXPORT_DATA',
    userId: string,
    details: any,
    success: boolean,
    error?: any
  ): void {
    const logData = {
      operation,
      userId,
      timestamp: new Date().toISOString(),
      success,
      details: this.sanitizeForExport(details),
      error: error ? {
        message: error.message,
        code: error.code,
        stack: error.stack
      } : undefined
    };

    if (success) {
      logger.info('GDPR operation completed', logData);
    } else {
      logger.error('GDPR operation failed', logData);
    }
  }

  /**
   * Validate export request parameters
   */
  static validateExportRequest(sections?: string[], includeFiles?: boolean): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const validSections = ['profile', 'orders', 'applications', 'projects', 'reviews', 'messages', 'notifications', 'wallet', 'portfolio'];

    if (sections) {
      const invalidSections = sections.filter(section => !validSections.includes(section));
      if (invalidSections.length > 0) {
        errors.push(`Invalid sections: ${invalidSections.join(', ')}`);
      }
    }

    if (includeFiles && !process.env.AWS_S3_BUCKET) {
      errors.push('File export not available - S3 not configured');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate operation ID for tracking
   */
  static generateOperationId(operation: string, userId: string): string {
    const timestamp = Date.now();
    const hash = crypto.createHash('md5').update(`${operation}_${userId}_${timestamp}`).digest('hex');
    return `${operation.toLowerCase()}_${hash.substring(0, 8)}`;
  }
}