import { NotificationRepository, Notification } from '../repositories/notification.repository';
import { logger } from '../utils/logger';

export interface NotificationData {
  userId: string;
  type: 'ORDER' | 'APPLICATION' | 'PROJECT' | 'REVIEW' | 'CHAT' | 'PAYMENT' | 'SYSTEM' | 'LOCATION';
  title: string;
  message: string;
  data?: Record<string, any>;
}

export interface ApplicationNotificationData {
  applicationId: string;
  orderId: string;
  orderTitle?: string;
  masterName?: string;
  clientName?: string;
  proposedPrice?: number;
  status?: string;
  reason?: string;
}

export class NotificationService {
  private notificationRepo: NotificationRepository;

  constructor() {
    this.notificationRepo = new NotificationRepository();
  }

  async sendNotification(notification: NotificationData): Promise<Notification> {
    try {
      const createdNotification = await this.notificationRepo.create(notification);

      logger.info('Notification sent', {
        notificationId: createdNotification.id,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
      });

      // TODO: In production, also send push notification, email, SMS etc.
      // await this.sendPushNotification(notification);
      // await this.sendEmailNotification(notification);

      return createdNotification;
    } catch (error) {
      logger.error('Failed to send notification', error, {
        userId: notification.userId,
        type: notification.type,
      });
      throw error;
    }
  }

  // Application-specific notification methods
  async notifyApplicationCreated(
    clientId: string,
    data: ApplicationNotificationData
  ): Promise<Notification> {
    return this.sendNotification({
      userId: clientId,
      type: 'APPLICATION',
      title: 'New Application Received',
      message: `${data.masterName || 'A master'} applied to your order "${data.orderTitle || 'your order'}" with a proposal of ${data.proposedPrice} KGS`,
      data: {
        applicationId: data.applicationId,
        orderId: data.orderId,
        action: 'view_application',
      },
    });
  }

  async notifyApplicationViewed(
    masterId: string,
    data: ApplicationNotificationData
  ): Promise<Notification> {
    return this.sendNotification({
      userId: masterId,
      type: 'APPLICATION',
      title: 'Application Viewed',
      message: `${data.clientName || 'The client'} viewed your application for "${data.orderTitle || 'the order'}"`,
      data: {
        applicationId: data.applicationId,
        orderId: data.orderId,
        action: 'view_order',
      },
    });
  }

  async notifyApplicationAccepted(
    masterId: string,
    data: ApplicationNotificationData
  ): Promise<Notification> {
    return this.sendNotification({
      userId: masterId,
      type: 'APPLICATION',
      title: 'Application Accepted! 🎉',
      message: `Congratulations! Your application for "${data.orderTitle || 'the order'}" has been accepted. You can now start working.`,
      data: {
        applicationId: data.applicationId,
        orderId: data.orderId,
        action: 'view_order',
      },
    });
  }

  async notifyApplicationRejected(
    masterId: string,
    data: ApplicationNotificationData
  ): Promise<Notification> {
    const message = data.reason
      ? `Your application for "${data.orderTitle || 'the order'}" was not selected. Reason: ${data.reason}`
      : `Your application for "${data.orderTitle || 'the order'}" was not selected this time. Keep applying to other orders!`;

    return this.sendNotification({
      userId: masterId,
      type: 'APPLICATION',
      title: 'Application Not Selected',
      message,
      data: {
        applicationId: data.applicationId,
        orderId: data.orderId,
        action: 'browse_orders',
        reason: data.reason
      },
    });
  }

  async notifyApplicationUpdated(
    clientId: string,
    data: ApplicationNotificationData
  ): Promise<Notification> {
    return this.sendNotification({
      userId: clientId,
      type: 'APPLICATION',
      title: 'Application Updated',
      message: `${data.masterName || 'A master'} updated their application for "${data.orderTitle || 'your order'}"`,
      data: {
        applicationId: data.applicationId,
        orderId: data.orderId,
        action: 'view_application',
      },
    });
  }

  // Bulk notification methods
  async notifyMultipleApplicationsRejected(
    masterIds: string[],
    data: ApplicationNotificationData
  ): Promise<Notification[]> {
    const notifications = await Promise.all(
      masterIds.map(masterId =>
        this.notifyApplicationRejected(masterId, data)
      )
    );

    logger.info('Bulk application rejection notifications sent', {
      count: notifications.length,
      orderId: data.orderId,
    });

    return notifications;
  }

  // Utility methods
  async markAsRead(userId: string, notificationId: string): Promise<Notification> {
    return this.notificationRepo.update(userId, notificationId, { isRead: true });
  }

  async getUserNotifications(userId: string, limit = 50): Promise<Notification[]> {
    return this.notificationRepo.findByUser(userId, limit);
  }

  async getUnreadCount(userId: string): Promise<number> {
    const notifications = await this.notificationRepo.findByUser(userId, 1000);
    return notifications.filter(n => !n.isRead).length;
  }

  // Background Check notification methods
  async sendBackgroundCheckNotification(
    userId: string,
    backgroundCheck: any,
    eventType: 'CHECK_INITIATED' | 'CHECK_COMPLETED' | 'CHECK_FAILED' | 'DISPUTE_SUBMITTED' | 'DISPUTE_RESOLVED'
  ): Promise<Notification> {
    let title: string;
    let message: string;
    let data: any = {
      backgroundCheckId: backgroundCheck.id,
      checkType: backgroundCheck.checkType,
      eventType
    };

    switch (eventType) {
      case 'CHECK_INITIATED':
        title = 'Background Check Started';
        message = `Your ${backgroundCheck.checkType.toLowerCase()} background check has been initiated and is being processed.`;
        break;
      case 'CHECK_COMPLETED':
        title = 'Background Check Complete';
        message = backgroundCheck.result === 'PASSED'
          ? `Great news! Your ${backgroundCheck.checkType.toLowerCase()} background check passed successfully.`
          : `Your ${backgroundCheck.checkType.toLowerCase()} background check has been completed. Please review the results.`;
        data.result = backgroundCheck.result;
        break;
      case 'CHECK_FAILED':
        title = 'Background Check Failed';
        message = `Your ${backgroundCheck.checkType.toLowerCase()} background check could not be completed. Please contact support for assistance.`;
        data.failureReason = backgroundCheck.failureReason;
        break;
      case 'DISPUTE_SUBMITTED':
        title = 'Dispute Submitted';
        message = 'Your background check dispute has been submitted and is under review.';
        data.disputeId = backgroundCheck.dispute?.id;
        break;
      case 'DISPUTE_RESOLVED':
        title = 'Dispute Resolved';
        message = 'Your background check dispute has been resolved. Please review the updated results.';
        data.disputeId = backgroundCheck.dispute?.id;
        data.resolution = backgroundCheck.dispute?.resolution;
        break;
      default:
        title = 'Background Check Update';
        message = 'There has been an update to your background check.';
    }

    return this.sendNotification({
      userId,
      type: 'SYSTEM',
      title,
      message,
      data
    });
  }

  async sendAdminNotification(
    type: 'NEW_COMPREHENSIVE_BACKGROUND_CHECK' | 'NEW_BACKGROUND_CHECK_DISPUTE',
    data: any
  ): Promise<void> {
    // In a real implementation, this would send to admin users
    // For now, just log the admin notification
    logger.info('Admin notification', { type, data });
  }

  // Calendar notification methods
  async sendCalendarNotification(
    userId: string,
    eventType: 'CALENDAR_CONNECTED' | 'CALENDAR_DISCONNECTED' | 'SYNC_CONFLICTS' | 'SYNC_FAILED' | 'AVAILABILITY_UPDATED',
    data: any
  ): Promise<Notification> {
    let title: string;
    let message: string;
    let notificationData: any = {
      eventType,
      ...data
    };

    switch (eventType) {
      case 'CALENDAR_CONNECTED':
        title = 'Calendar Connected';
        message = `Your ${data.provider} calendar "${data.calendarName}" has been connected successfully.`;
        if (data.syncedEvents > 0) {
          message += ` ${data.syncedEvents} events were imported.`;
        }
        break;
      case 'CALENDAR_DISCONNECTED':
        title = 'Calendar Disconnected';
        message = `Your ${data.provider} calendar "${data.calendarName}" has been disconnected.`;
        break;
      case 'SYNC_CONFLICTS':
        title = 'Calendar Sync Conflicts';
        message = `${data.conflictCount} conflicts were found during calendar sync. Please review and resolve them.`;
        notificationData.conflicts = data.conflicts;
        break;
      case 'SYNC_FAILED':
        title = 'Calendar Sync Failed';
        message = `Failed to sync with your ${data.provider} calendar. Please check your connection and try again.`;
        notificationData.error = data.error;
        break;
      case 'AVAILABILITY_UPDATED':
        title = 'Availability Updated';
        message = 'Your availability has been updated and synced with your connected calendars.';
        notificationData.slotsUpdated = data.slotsUpdated;
        break;
      default:
        title = 'Calendar Update';
        message = 'There has been an update to your calendar integration.';
    }

    return this.sendNotification({
      userId,
      type: 'SYSTEM',
      title,
      message,
      data: notificationData
    });
  }

  async sendAvailabilityConflictNotification(
    userId: string,
    conflicts: Array<{
      id: string;
      scheduledDateTime: string;
      clientName: string;
      serviceName: string;
    }>
  ): Promise<Notification> {
    const conflictCount = conflicts.length;
    const title = 'Booking Conflicts Detected';
    const message = `${conflictCount} existing booking${conflictCount > 1 ? 's' : ''} conflict${conflictCount > 1 ? '' : 's'} with your updated availability. Please review and reschedule if needed.`;

    return this.sendNotification({
      userId,
      type: 'SYSTEM',
      title,
      message,
      data: {
        eventType: 'BOOKING_CONFLICTS',
        conflictCount,
        conflicts: conflicts.map(conflict => ({
          bookingId: conflict.id,
          scheduledDateTime: conflict.scheduledDateTime,
          clientName: conflict.clientName,
          serviceName: conflict.serviceName
        }))
      }
    });
  }

  async sendVacationNotification(
    userId: string,
    vacation: {
      id: string;
      startDateTime: string;
      endDateTime: string;
      reason: string;
    },
    conflicts?: Array<{
      id: string;
      scheduledDateTime: string;
      clientName: string;
      serviceName: string;
    }>
  ): Promise<Notification> {
    const title = 'Vacation Period Set';
    let message = `Your vacation period from ${new Date(vacation.startDateTime).toLocaleDateString()} to ${new Date(vacation.endDateTime).toLocaleDateString()} has been set.`;

    if (conflicts && conflicts.length > 0) {
      message += ` ${conflicts.length} existing booking${conflicts.length > 1 ? 's' : ''} conflict${conflicts.length > 1 ? '' : 's'} with this period.`;
    }

    return this.sendNotification({
      userId,
      type: 'SYSTEM',
      title,
      message,
      data: {
        eventType: 'VACATION_SET',
        vacation,
        conflicts: conflicts || []
      }
    });
  }

  // Time Tracking notification methods
  async sendTimeTrackingNotification(
    userId: string,
    eventType: 'SESSION_STARTED' | 'SESSION_COMPLETED' | 'SESSION_PAUSED' | 'SESSION_RESUMED' | 'MANUAL_ENTRY_ADDED',
    data: any
  ): Promise<Notification> {
    let title: string;
    let message: string;

    switch (eventType) {
      case 'SESSION_STARTED':
        title = 'Time Tracking Started';
        message = `Master started tracking time for ${data.taskType?.toLowerCase() || 'work'}.`;
        break;
      case 'SESSION_COMPLETED':
        title = 'Time Tracking Completed';
        const hours = data.totalTime?.hours || 0;
        const minutes = data.totalTime?.minutes || 0;
        message = `Master completed time tracking session. Duration: ${hours}h ${minutes}m`;
        if (data.billingAmount) {
          message += `. Amount: ${data.billingAmount} KGS`;
        }
        break;
      case 'SESSION_PAUSED':
        title = 'Time Tracking Paused';
        message = 'Master paused the time tracking session.';
        break;
      case 'MANUAL_ENTRY_ADDED':
        title = 'Manual Time Entry Added';
        const durationHours = data.durationMinutes ? Math.floor(data.durationMinutes / 60) : 0;
        const durationMins = data.durationMinutes ? data.durationMinutes % 60 : 0;
        message = `Master added a manual time entry. Duration: ${durationHours}h ${durationMins}m`;
        if (data.billingAmount) {
          message += `. Amount: ${data.billingAmount} KGS`;
        }
        break;
      case 'SESSION_RESUMED':
        title = 'Time Tracking Resumed';
        message = 'Master resumed the time tracking session.';
        break;
      default:
        title = 'Time Tracking Update';
        message = 'There has been an update to time tracking.';
    }

    return this.sendNotification({
      userId,
      type: 'PROJECT',
      title,
      message,
      data: {
        eventType,
        ...data,
      }
    });
  }

  // Location Tracking notification methods
  async sendLocationTrackingNotification(
    targetId: string,
    eventType: 'TRACKING_STARTED' | 'TRACKING_STOPPED' | 'MASTER_ARRIVED' | 'GEOFENCE_ALERT',
    data: any
  ): Promise<Notification> {
    let title: string;
    let message: string;

    switch (eventType) {
      case 'TRACKING_STARTED':
        title = 'Location Tracking Started';
        message = 'Master started sharing their location.';
        break;
      case 'TRACKING_STOPPED':
        title = 'Location Tracking Stopped';
        message = 'Master stopped sharing their location.';
        if (data.stats) {
          const distance = Math.round(data.stats.totalDistance / 1000);
          const duration = Math.round(data.stats.duration / 60);
          message += ` Distance: ${distance}km, Duration: ${duration}min`;
        }
        break;
      case 'MASTER_ARRIVED':
        title = 'Master Arrived';
        message = 'Master has arrived at the destination.';
        break;
      case 'GEOFENCE_ALERT':
        title = 'Location Alert';
        message = data.message || 'Master location update.';
        break;
      default:
        title = 'Location Update';
        message = 'There has been a location tracking update.';
    }

    return this.sendNotification({
      userId: targetId,
      type: 'LOCATION',
      title,
      message,
      data: {
        eventType,
        ...data,
      }
    });
  }

  async notifyCustom(userId: string, data: { title: string, body: string, type?: string, metadata?: any }): Promise<Notification> {
    return this.sendNotification({
      userId,
      type: (data.type as any) || 'SYSTEM',
      title: data.title,
      message: data.body,
      data: data.metadata,
    });
  }
}
