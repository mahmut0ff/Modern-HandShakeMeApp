import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { notificationsApi, Notification } from '@/src/api/notifications';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getRelativeTime } from '@/src/utils/date';

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationsApi.getNotifications();
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await notificationsApi.markAsRead(notification.id);
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );
      } catch (error) {
        console.error('Failed to mark notification as read', error);
      }
    }

    const refType = notification.data?.referenceType;
    const refId = notification.data?.referenceId;
    const secondaryRefId = notification.data?.secondaryReferenceId;

    if (!refType || !refId) return;

    switch (refType) {
      case 'order':
        router.push(`/jobs/${refId}` as any);
        break;
      case 'application':
        router.push(`/jobs/${secondaryRefId || refId}/applications` as any);
        break;
      case 'chat':
        router.push(`/chat/${refId}` as any);
        break;
      case 'user':
        router.push(`/masters/${refId}` as any);
        break;
      default:
        break;
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  const getNotificationIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
      ORDER: 'briefcase',
      APPLICATION: 'mail',
      CHAT: 'chatbubble',
      REVIEW: 'star',
      PAYMENT: 'wallet',
      SYSTEM: 'information-circle',
    };
    return icons[type] || 'notifications';
  };

  const getNotificationColor = (type: string): string => {
    const colors: Record<string, string> = {
      ORDER: '#667eea',
      APPLICATION: '#f093fb',
      CHAT: '#4facfe',
      REVIEW: '#FFD700',
      PAYMENT: '#43e97b',
      SYSTEM: '#FF9800',
    };
    return colors[type] || theme.tint;
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: theme.card }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Уведомления</Text>
            {unreadCount > 0 && (
              <View style={[styles.headerBadge, { backgroundColor: theme.tint }]}>
                <Text style={styles.headerBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllRead}>
              <Text style={[styles.markAllText, { color: theme.tint }]}>Все</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color={theme.text + '40'} />
          <Text style={[styles.emptyText, { color: theme.text + '99' }]}>Нет уведомлений</Text>
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />}
          showsVerticalScrollIndicator={false}
        >
          {notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationItem,
                { backgroundColor: theme.card },
                !notification.isRead && { backgroundColor: theme.tint + '10', borderLeftColor: theme.tint }
              ]}
              onPress={() => handleNotificationPress(notification)}
            >
              <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(notification.type) + '20' }]}>
                <Ionicons name={getNotificationIcon(notification.type)} size={24} color={getNotificationColor(notification.type)} />
              </View>
              <View style={styles.notificationContent}>
                <Text style={[styles.notificationTitle, { color: theme.text }]} numberOfLines={1}>
                  {notification.title}
                </Text>
                <Text style={[styles.notificationMessage, { color: theme.text + 'CC' }]} numberOfLines={2}>
                  {notification.message}
                </Text>
                <Text style={[styles.notificationTime, { color: theme.text + '66' }]}>
                  {getRelativeTime(notification.createdAt)}
                </Text>
              </View>
              {!notification.isRead && (
                <View style={[styles.unreadDot, { backgroundColor: theme.tint }]} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { marginRight: 12 },
  headerTitleContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  headerBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, minWidth: 24, alignItems: 'center' },
  headerBadgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  markAllText: { fontSize: 14, fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: 16, textAlign: 'center' },
  notificationItem: { flexDirection: 'row', padding: 16, marginHorizontal: 16, marginTop: 12, borderRadius: 12, borderLeftWidth: 3, borderLeftColor: 'transparent', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  iconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  notificationContent: { flex: 1 },
  notificationTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  notificationMessage: { fontSize: 14, lineHeight: 20, marginBottom: 6 },
  notificationTime: { fontSize: 12 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8, alignSelf: 'center' },
});
