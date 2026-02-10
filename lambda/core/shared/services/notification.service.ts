/**
 * Notification Service
 * Centralized service for creating and managing notifications
 */

import { NotificationRepository, Notification } from '../repositories/notification.repository';
import { logger } from '../utils/logger';

export type NotificationType = 
  | 'ORDER' 
  | 'APPLICATION' 
  | 'PROJECT' 
  | 'REVIEW' 
  | 'CHAT' 
  | 'PAYMENT' 
  | 'SYSTEM' 
  | 'SYSTEM_TEST' 
  | 'LOCATION';

export type ReferenceType = 
  | 'order' 
  | 'application' 
  | 'chat' 
  | 'message' 
  | 'user' 
  | 'system'
  | 'review'
  | 'project';

export interface NotificationData {
  recipientId: string;
  type: NotificationType;
  title: string;
  body: string;
  referenceType: ReferenceType;
  referenceId: string;
  secondaryReferenceId?: string;
  priority?: 'low' | 'normal' | 'high';
  metadata?: Record<string, any>;
}

export class NotificationService {
  private notificationRepo: NotificationRepository;

  constructor() {
    this.notificationRepo = new NotificationRepository();
  }

  /**
   * Create a notification
   * Checks user settings before creating
   */
  async createNotification(data: NotificationData): Promise<Notification | null> {
    try {
      // Get user notification settings
      const settings = await this.notificationRepo.getNotificationSettings(data.recipientId);
      
      // Create default settings if not exist
      if (!settings) {
        await this.notificationRepo.createDefaultNotificationSettings(data.recipientId);
      }

      // Check if notification type is enabled
      if (settings && !this.isNotificationEnabled(settings, data.type)) {
        logger.info('Notification disabled by user settings', {
          userId: data.recipientId,
          type: data.type
        });
        return null;
      }

      // Create notification
      const notification = await this.notificationRepo.create({
        userId: data.recipientId,
        type: data.type,
        title: data.title,
        message: data.body,
        priority: data.priority || 'normal',
        data: {
          referenceType: data.referenceType,
          referenceId: data.referenceId,
          secondaryReferenceId: data.secondaryReferenceId,
          ...data.metadata
        }
      });

      logger.info('Notification created', {
        notificationId: notification.id,
        userId: data.recipientId,
        type: data.type
      });

      return notification;
    } catch (error) {
      logger.error('Failed to create notification', { error, data });
      return null;
    }
  }

  /**
   * Check if notification type is enabled in user settings
   */
  private isNotificationEnabled(settings: any, type: NotificationType): boolean {
    switch (type) {
      case 'ORDER':
        return settings.newOrders !== false;
      case 'APPLICATION':
        return settings.newApplications !== false || settings.applicationAccepted !== false || settings.applicationRejected !== false;
      case 'CHAT':
        return settings.newMessages !== false;
      case 'PROJECT':
        return settings.projectUpdates !== false;
      case 'PAYMENT':
        return settings.paymentReceived !== false;
      case 'REVIEW':
        return settings.reviewReceived !== false;
      case 'SYSTEM':
      case 'SYSTEM_TEST':
      case 'LOCATION':
        return true; // System notifications always enabled
      default:
        return true;
    }
  }

  /**
   * Notification Templates
   */

  // Order notifications
  async notifyOrderCreated(orderId: string, clientId: string, masterId: string, orderTitle: string) {
    return this.createNotification({
      recipientId: masterId,
      type: 'ORDER',
      title: 'Новый заказ',
      body: `Создан новый заказ: ${orderTitle}`,
      referenceType: 'order',
      referenceId: orderId,
      priority: 'high'
    });
  }

  async notifyOrderStatusChanged(orderId: string, recipientId: string, orderTitle: string, newStatus: string) {
    const statusText = this.getStatusText(newStatus);
    return this.createNotification({
      recipientId,
      type: 'ORDER',
      title: 'Статус заказа изменен',
      body: `Заказ "${orderTitle}" ${statusText}`,
      referenceType: 'order',
      referenceId: orderId,
      priority: 'normal'
    });
  }

  async notifyOrderCompleted(orderId: string, recipientId: string, orderTitle: string) {
    return this.createNotification({
      recipientId,
      type: 'ORDER',
      title: 'Заказ завершен',
      body: `Заказ "${orderTitle}" успешно завершен`,
      referenceType: 'order',
      referenceId: orderId,
      priority: 'high'
    });
  }

  async notifyOrderAssigned(orderId: string, masterId: string, orderTitle: string) {
    return this.createNotification({
      recipientId: masterId,
      type: 'ORDER',
      title: 'Вы назначены на заказ',
      body: `Вас назначили на заказ: ${orderTitle}`,
      referenceType: 'order',
      referenceId: orderId,
      priority: 'high'
    });
  }

  // Application notifications
  async notifyApplicationCreated(applicationId: string, orderId: string, clientId: string, masterName: string, orderTitle: string) {
    return this.createNotification({
      recipientId: clientId,
      type: 'APPLICATION',
      title: 'Новый отклик',
      body: `${masterName} откликнулся на ваш заказ "${orderTitle}"`,
      referenceType: 'application',
      referenceId: applicationId,
      secondaryReferenceId: orderId,
      priority: 'high'
    });
  }

  async notifyApplicationAccepted(applicationId: string, orderId: string, masterId: string, orderTitle: string) {
    return this.createNotification({
      recipientId: masterId,
      type: 'APPLICATION',
      title: 'Отклик принят',
      body: `Ваш отклик на заказ "${orderTitle}" принят`,
      referenceType: 'application',
      referenceId: applicationId,
      secondaryReferenceId: orderId,
      priority: 'high'
    });
  }

  async notifyApplicationRejected(applicationId: string, orderId: string, masterId: string, orderTitle: string) {
    return this.createNotification({
      recipientId: masterId,
      type: 'APPLICATION',
      title: 'Отклик отклонен',
      body: `Ваш отклик на заказ "${orderTitle}" отклонен`,
      referenceType: 'application',
      referenceId: applicationId,
      secondaryReferenceId: orderId,
      priority: 'normal'
    });
  }

  // Chat notifications
  async notifyNewMessage(roomId: string, recipientId: string, senderName: string, messagePreview: string) {
    return this.createNotification({
      recipientId,
      type: 'CHAT',
      title: `Сообщение от ${senderName}`,
      body: messagePreview.substring(0, 100),
      referenceType: 'chat',
      referenceId: roomId,
      priority: 'normal'
    });
  }

  // Review notifications
  async notifyReviewReceived(reviewId: string, masterId: string, clientName: string, rating: number) {
    return this.createNotification({
      recipientId: masterId,
      type: 'REVIEW',
      title: 'Новый отзыв',
      body: `${clientName} оставил отзыв с оценкой ${rating}/5`,
      referenceType: 'review',
      referenceId: reviewId,
      priority: 'normal'
    });
  }

  // System notifications
  async notifySystemMessage(userId: string, title: string, message: string) {
    return this.createNotification({
      recipientId: userId,
      type: 'SYSTEM',
      title,
      body: message,
      referenceType: 'system',
      referenceId: 'system',
      priority: 'normal'
    });
  }

  /**
   * Helper methods
   */
  private getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'ACTIVE': 'активен',
      'IN_PROGRESS': 'в работе',
      'READY_TO_CONFIRM': 'готов к подтверждению',
      'COMPLETED': 'завершен',
      'CANCELLED': 'отменен',
      'DISPUTED': 'в споре'
    };
    return statusMap[status] || status;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
