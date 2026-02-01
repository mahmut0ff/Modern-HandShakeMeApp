// GDPR data export with DynamoDB

import type { APIGatewayProxyResult } from 'aws-lambda';
import { GDPRRepository } from '../shared/repositories/gdpr.repository';
import { S3Service } from '../shared/services/s3.service';
import { NotificationService } from '../shared/services/notification.service';
import { GDPRUtils } from '../shared/utils/gdpr';
import { success, badRequest } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { logger } from '../shared/utils/logger';
import { z } from 'zod';
import { ExportDataRequest, GDPRExportData, GDPROperationResult } from '../shared/types/gdpr';

const exportDataSchema = z.object({
  format: z.enum(['json', 'csv']).default('json'),
  includeFiles: z.boolean().default(false),
  sections: z.array(z.enum([
    'profile', 'orders', 'applications', 'projects', 'reviews', 
    'messages', 'notifications', 'wallet', 'portfolio'
  ])).optional(),
});

const gdprRepo = new GDPRRepository();
const s3Service = new S3Service();
const notificationService = new NotificationService();

// Rate limiting: max 1 export per user per hour
const exportRateLimit = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

async function exportDataHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const userRole = event.auth.role;
  const operationId = GDPRUtils.generateOperationId('EXPORT_DATA', userId);
  
  logger.info('GDPR data export request started', { userId, operationId });
  
  try {
    // Rate limiting check
    const lastExport = exportRateLimit.get(userId);
    const now = Date.now();
    
    if (lastExport && (now - lastExport) < RATE_LIMIT_WINDOW) {
      const remainingTime = Math.ceil((RATE_LIMIT_WINDOW - (now - lastExport)) / 1000 / 60);
      return badRequest(`Rate limit exceeded. Please wait ${remainingTime} minutes before requesting another export.`);
    }
    
    // Parse and validate request
    const queryParams = event.queryStringParameters || {};
    const data = exportDataSchema.parse(queryParams);
    
    // Validate export request
    const validation = GDPRUtils.validateExportRequest(data.sections, data.includeFiles);
    if (!validation.isValid) {
      return badRequest(`Invalid export request: ${validation.errors.join(', ')}`);
    }
    
    // Get user profile
    const user = await gdprRepo.getUserProfile(userId);
    if (!user) {
      return badRequest('User not found');
    }
    
    // Update rate limit
    exportRateLimit.set(userId, now);
    
    // Initialize export data
    const exportData: GDPRExportData = {
      exportInfo: {
        userId: userId,
        exportedAt: new Date().toISOString(),
        format: data.format,
        requestedSections: data.sections ? data.sections.join(', ') : 'all',
        dataRetentionPolicy: 'Data exported under GDPR Article 20 (Right to Data Portability). Export links valid for 24 hours.'
      },
      summary: {
        totalOrders: 0,
        totalApplications: 0,
        totalProjects: 0,
        totalReviews: 0,
        totalMessages: 0,
        totalNotifications: 0,
        totalTransactions: 0,
        totalPortfolioItems: 0
      }
    };
    
    try {
      // Export user profile data
      if (!data.sections || data.sections.includes('profile')) {
        exportData.profile = {
          user: GDPRUtils.sanitizeForExport({
            id: user.id,
            email: user.email,
            phone: user.phone,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            avatar: user.avatar,
            isPhoneVerified: user.isPhoneVerified,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
            telegramId: user.telegramId,
            telegramUsername: user.telegramUsername,
          })
        };
      }
      
      // Export orders
      if (!data.sections || data.sections.includes('orders')) {
        const orders = await gdprRepo.getUserOrders(userId, userRole as 'CLIENT' | 'MASTER');
        exportData.orders = GDPRUtils.sanitizeForExport(orders);
        exportData.summary.totalOrders = orders.length;
      }
      
      // Export applications
      if (!data.sections || data.sections.includes('applications')) {
        const applications = await gdprRepo.getUserApplications(userId, userRole as 'CLIENT' | 'MASTER');
        exportData.applications = GDPRUtils.sanitizeForExport(applications);
        exportData.summary.totalApplications = applications.length;
      }
      
      // Export reviews
      if (!data.sections || data.sections.includes('reviews')) {
        const reviews = await gdprRepo.getUserReviews(userId);
        exportData.reviews = {
          given: GDPRUtils.sanitizeForExport(reviews.given),
          received: GDPRUtils.sanitizeForExport(reviews.received)
        };
        exportData.summary.totalReviews = reviews.given.length + reviews.received.length;
      }
      
      // Export messages
      if (!data.sections || data.sections.includes('messages')) {
        const messages = await gdprRepo.getUserMessages(userId);
        exportData.messages = GDPRUtils.sanitizeForExport(messages);
        exportData.summary.totalMessages = messages.length;
      }
      
      // Export notifications
      if (!data.sections || data.sections.includes('notifications')) {
        const notifications = await gdprRepo.getUserNotifications(userId);
        exportData.notifications = GDPRUtils.sanitizeForExport(notifications);
        exportData.summary.totalNotifications = notifications.length;
      }
      
      // Export wallet data
      if (!data.sections || data.sections.includes('wallet')) {
        const wallet = await gdprRepo.getUserWallet(userId);
        const transactions = await gdprRepo.getUserTransactions(userId);
        
        exportData.wallet = {
          balance: wallet?.balance || 0,
          currency: wallet?.currency || 'KGS',
          transactions: GDPRUtils.sanitizeForExport(transactions),
          paymentMethods: [] // Payment methods are sensitive, only include metadata
        };
        exportData.summary.totalTransactions = transactions.length;
      }
      
      // Export portfolio (for masters)
      if ((!data.sections || data.sections.includes('portfolio')) && userRole === 'MASTER') {
        // Portfolio data would be fetched from user profile or separate table
        exportData.portfolio = []; // Placeholder
        exportData.summary.totalPortfolioItems = 0;
      }
      
      // Include file URLs if requested
      if (data.includeFiles) {
        const fileReferences = GDPRUtils.extractFileReferences({
          ...user,
          orders: exportData.orders,
          portfolio: exportData.portfolio
        });
        
        if (fileReferences.length > 0) {
          // Generate signed URLs (valid for 24 hours)
          const signedUrls = await s3Service.getSignedUrls(fileReferences, 24 * 3600);
          exportData.downloadUrls = signedUrls;
          
          exportData.files = {
            avatar: user.avatar,
            portfolioImages: fileReferences
              .filter(ref => ref.category === 'portfolio')
              .map(ref => ref.url),
            orderAttachments: fileReferences
              .filter(ref => ref.category === 'order_attachment')
              .map(ref => ref.url)
          };
        }
      }
      
      // Send notification email if export is large
      const totalRecords = Object.values(exportData.summary).reduce((sum, count) => sum + count, 0);
      if (totalRecords > 100 && user.email && !user.email.includes('@anonymized.local')) {
        try {
          await notificationService.sendEmail(user.email, 'data_export_ready', {
            sections: data.sections || ['all'],
            totalRecords
          });
        } catch (error: any) {
          logger.warn('Failed to send export notification email', { userId, error: error.message });
        }
      }
      
      // Send admin notification for large exports
      if (totalRecords > 1000) {
        await notificationService.sendAdminAlert(
          'Large GDPR Data Export',
          `User ${userId} exported ${totalRecords} records`,
          'INFO'
        );
      }
      
      GDPRUtils.logGDPROperation('EXPORT_DATA', userId, {
        operationId,
        sections: data.sections || 'all',
        totalRecords,
        includeFiles: data.includeFiles
      }, true);
      
      logger.info('GDPR data export completed successfully', { 
        userId, 
        operationId,
        totalRecords,
        sections: Object.keys(exportData).filter(k => k !== 'exportInfo' && k !== 'summary')
      });
      
      return success(exportData);
      
    } catch (error: any) {
      // Send admin alert for export failures
      await notificationService.sendAdminAlert(
        'GDPR Data Export Failed',
        `Export failed for user ${userId}: ${error.message}`,
        'ERROR'
      );
      
      throw error;
    }
    
  } catch (error: any) {
    GDPRUtils.logGDPROperation('EXPORT_DATA', userId, {
      operationId,
      error: error.message
    }, false, error);
    
    logger.error('GDPR data export failed', { userId, operationId, error: error.message });
    
    if (error.name === 'ZodError') {
      return badRequest(error.errors[0].message);
    }
    
    throw error;
  }
}

export const handler = withErrorHandler(withAuth(exportDataHandler));