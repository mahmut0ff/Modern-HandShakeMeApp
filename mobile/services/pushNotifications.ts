/**
 * Push Notifications Service
 * Manages push notification registration, handling, and permissions
 */

import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Check if we're in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Only import and configure notifications if not in Expo Go
let Notifications: typeof import('expo-notifications') | null = null;

if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');

    if (Notifications) {
      // Configure notification behavior
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }
  } catch (e) {
    console.warn('Failed to load expo-notifications');
  }
}

export interface PushNotificationData {
  title?: string;
  body?: string;
  data?: Record<string, any>;
}

class PushNotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;

  /**
   * Initialize push notifications
   * Request permissions and register device
   */
  async initialize(): Promise<string | null> {
    // Skip initialization in Expo Go (SDK 53+)
    if (!Device.isDevice || isExpoGo || !Notifications) {
      console.warn('Push notifications require a development build (not available in Expo Go)');
      return null;
    }

    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Failed to get push notification permissions');
        return null;
      }

      // Get Expo push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      if (!projectId) {
        console.warn('No project ID found for push notifications');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      this.expoPushToken = token.data;

      // Configure Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#0165FB',
        });
      }

      return this.expoPushToken;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return null;
    }
  }

  /**
   * Set up notification listeners
   */
  setupListeners(
    onNotificationReceived?: (notification: any) => void,
    onNotificationResponse?: (response: any) => void
  ) {
    if (!Notifications) return;

    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        onNotificationReceived?.(notification);
      }
    );

    // Listener for user interactions with notifications
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification response:', response);
        onNotificationResponse?.(response);
      }
    );
  }

  /**
   * Remove notification listeners
   */
  removeListeners() {
    if (!Notifications) return;

    try {
      if (this.notificationListener) {
        (Notifications as any).removeNotificationSubscription(this.notificationListener);
        this.notificationListener = null;
      }

      if (this.responseListener) {
        (Notifications as any).removeNotificationSubscription(this.responseListener);
        this.responseListener = null;
      }
    } catch (error) {
      // Ignore errors in Expo Go
      console.log('Listener cleanup skipped');
    }
  }

  /**
   * Schedule a local notification
   */
  async scheduleNotification(
    title: string,
    body: string,
    data?: Record<string, any>,
    trigger?: any
  ): Promise<string> {
    if (!Notifications) return '';

    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: trigger || null,
    });
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    if (!Notifications) return;
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    if (!Notifications) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    if (!Notifications) return 0;
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    if (!Notifications) return;
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Clear badge
   */
  async clearBadge(): Promise<void> {
    if (!Notifications) return;
    await Notifications.setBadgeCountAsync(0);
  }

  /**
   * Get current push token
   */
  getToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    if (!Notifications) return false;
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Open device notification settings
   */
  async openSettings(): Promise<void> {
    if (!Notifications) return;
    await Notifications.getPermissionsAsync();
  }
}

// Singleton instance
export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
