export interface NotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
}

export class NotificationService {
  async sendNotification(notification: NotificationData): Promise<void> {
    // Mock notification service for development
    console.log(`Notification sent to ${notification.userId}: ${notification.title}`);
  }
}
