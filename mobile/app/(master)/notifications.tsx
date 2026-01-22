import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Switch, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { 
  useGetNotificationsQuery, 
  useGetNotificationSettingsQuery,
  useUpdateNotificationSettingsMutation,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useGetUnreadCountQuery,
  type Notification as APINotification,
  type NotificationSettings as APINotificationSettings
} from '../../services/notificationApi';

// Map API notification types to display types
const notificationTypeMap: Record<string, string> = {
  'order_created': 'new_order',
  'order_updated': 'new_order',
  'application_received': 'application_status',
  'application_accepted': 'application_status',
  'application_rejected': 'application_status',
  'project_started': 'project_update',
  'project_completed': 'project_update',
  'project_cancelled': 'project_update',
  'payment_received': 'payment',
  'payment_sent': 'payment',
  'review_received': 'review',
  'message_received': 'new_message',
  'system': 'system',
  'promotion': 'system',
};

interface Notification {
  id: number;
  notification_type: string;
  title: string;
  text: string;
  is_read: boolean;
  created_at: string;
  data: any;
}

const notificationIcons: Record<string, any> = {
  new_order: 'briefcase',
  application_status: 'checkmark-circle',
  new_message: 'chatbubble',
  payment: 'card',
  review: 'star',
  system: 'notifications',
  project_update: 'construct',
};

const notificationColors: Record<string, string> = {
  new_order: 'bg-blue-500',
  application_status: 'bg-green-500',
  new_message: 'bg-[#0165FB]',
  payment: 'bg-green-500',
  review: 'bg-yellow-500',
  system: 'bg-gray-500',
  project_update: 'bg-orange-500',
};

export default function MasterNotificationsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'settings'>('all');
  const [filterTab, setFilterTab] = useState<'all' | 'unread'>('all');
  const [page, setPage] = useState(1);

  // API queries
  const { 
    data: notificationsData, 
    isLoading: notificationsLoading, 
    error: notificationsError,
    refetch: refetchNotifications 
  } = useGetNotificationsQuery({
    is_read: filterTab === 'unread' ? false : undefined,
    page,
    page_size: 20,
  });

  const { 
    data: unreadCountData, 
    isLoading: unreadCountLoading 
  } = useGetUnreadCountQuery();

  const { 
    data: settingsData, 
    isLoading: settingsLoading,
    error: settingsError 
  } = useGetNotificationSettingsQuery();

  // Mutations
  const [updateSettings] = useUpdateNotificationSettingsMutation();
  const [markAsRead] = useMarkNotificationReadMutation();
  const [markAllAsRead] = useMarkAllNotificationsReadMutation();

  const notifications = notificationsData?.results || [];
  const unreadCount = unreadCountData?.count || 0;

  // Convert API notification settings to local state format
  const [settings, setSettings] = useState({
    push_new_order: settingsData?.push_order_updates ?? true,
    push_application_status: settingsData?.push_application_updates ?? true,
    push_new_message: settingsData?.push_message_updates ?? true,
    push_payment: settingsData?.push_payment_updates ?? true,
    push_review: settingsData?.push_review_updates ?? true,
    push_project_update: settingsData?.push_project_updates ?? true,
    sms_important: settingsData?.sms_security_alerts ?? true,
    sms_security: settingsData?.sms_security_alerts ?? true,
  });

  // Update local settings when API data changes
  React.useEffect(() => {
    if (settingsData) {
      setSettings({
        push_new_order: settingsData.push_order_updates,
        push_application_status: settingsData.push_application_updates,
        push_new_message: settingsData.push_message_updates,
        push_payment: settingsData.push_payment_updates,
        push_review: settingsData.push_review_updates,
        push_project_update: settingsData.push_project_updates,
        sms_important: settingsData.sms_security_alerts,
        sms_security: settingsData.sms_security_alerts,
      });
    }
  }, [settingsData]);

  const handleSettingChange = async (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // Map local setting keys to API keys
    const apiKeyMap: Record<string, string> = {
      'push_new_order': 'push_order_updates',
      'push_application_status': 'push_application_updates',
      'push_new_message': 'push_message_updates',
      'push_payment': 'push_payment_updates',
      'push_review': 'push_review_updates',
      'push_project_update': 'push_project_updates',
      'sms_important': 'sms_security_alerts',
      'sms_security': 'sms_security_alerts',
    };

    const apiKey = apiKeyMap[key];
    if (apiKey) {
      try {
        await updateSettings({ [apiKey]: value }).unwrap();
      } catch (error) {
        console.error('Failed to update notification settings:', error);
        // Revert local state on error
        setSettings(prev => ({ ...prev, [key]: !value }));
        Alert.alert('Ошибка', 'Не удалось обновить настройки уведомлений');
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead().unwrap();
      refetchNotifications();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      Alert.alert('Ошибка', 'Не удалось отметить уведомления как прочитанные');
    }
  };

  const handleNotificationClick = async (notification: APINotification) => {
    // Mark as read if not already read
    if (!notification.is_read) {
      try {
        await markAsRead(notification.id).unwrap();
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    const { notification_type, related_object_type, related_object_id, data } = notification;
    const displayType = notificationTypeMap[notification_type] || notification_type;

    switch (displayType) {
      case 'new_order':
        if (related_object_id && related_object_type === 'order') {
          router.push(`/(master)/orders/${related_object_id}`);
        } else {
          router.push('/(master)/orders');
        }
        break;
      case 'application_status':
        if (related_object_id && related_object_type === 'project') {
          router.push(`/(master)/projects/${related_object_id}`);
        } else if (related_object_id && related_object_type === 'application') {
          router.push('/(master)/applications');
        }
        break;
      case 'new_message':
        if (data?.room_id) {
          router.push(`/(master)/chat/${data.room_id}`);
        } else {
          router.push('/(master)/chat');
        }
        break;
      case 'payment':
        router.push('/(master)/wallet');
        break;
      case 'review':
        router.push('/(master)/reviews');
        break;
      case 'project_update':
        if (related_object_id && related_object_type === 'project') {
          router.push(`/(master)/projects/${related_object_id}`);
        } else {
          router.push('/(master)/projects');
        }
        break;
      default:
        break;
    }
  };

  const groupedNotifications = useMemo(() => {
    const groups: Record<string, APINotification[]> = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    notifications.forEach((notification) => {
      const notifDate = new Date(notification.created_at);
      const notifDay = new Date(notifDate.getFullYear(), notifDate.getMonth(), notifDate.getDate());

      if (notifDay.getTime() === today.getTime()) {
        groups.today.push(notification);
      } else if (notifDay.getTime() === yesterday.getTime()) {
        groups.yesterday.push(notification);
      } else if (notifDate >= weekAgo) {
        groups.thisWeek.push(notification);
      } else {
        groups.older.push(notification);
      }
    });

    return groups;
  }, [notifications]);

  const NotificationItem = ({ notification }: { notification: APINotification }) => {
    const displayType = notificationTypeMap[notification.notification_type] || notification.notification_type;
    
    return (
      <TouchableOpacity
        onPress={() => handleNotificationClick(notification)}
        className={`p-4 rounded-2xl mb-2 ${!notification.is_read ? 'bg-[#0165FB]/5' : 'bg-white'}`}
      >
        <View className="flex-row items-start gap-3">
          <View className={`w-12 h-12 rounded-2xl items-center justify-center ${
            notificationColors[displayType] || 'bg-gray-500'
          }`}>
            <Ionicons 
              name={notificationIcons[displayType] || 'notifications'} 
              size={20} 
              color="white" 
            />
          </View>
          <View className="flex-1 min-w-0">
            <Text className={`font-semibold ${!notification.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
              {notification.title}
            </Text>
            <Text className="text-sm text-gray-500 mt-1" numberOfLines={2}>
              {notification.message}
            </Text>
            <Text className="text-xs text-gray-400 mt-2">
              {new Date(notification.created_at).toLocaleString('ru-RU')}
            </Text>
          </View>
          {!notification.is_read && (
            <View className="w-3 h-3 bg-[#0165FB] rounded-full mt-1" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const NotificationSettings = () => {
    if (settingsLoading) {
      return (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0165FB" />
          <Text className="text-gray-500 mt-2">Загрузка настроек...</Text>
        </View>
      );
    }

    if (settingsError) {
      return (
        <View className="flex-1 items-center justify-center">
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text className="text-gray-900 font-semibold mt-2">Ошибка загрузки</Text>
          <Text className="text-gray-500 text-center mt-1">
            Не удалось загрузить настройки уведомлений
          </Text>
        </View>
      );
    }

    return (
      <ScrollView className="flex-1">
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-4">
            <Ionicons name="chatbubble" size={20} color="#0165FB" />
            {' '}SMS уведомления
          </Text>
          <View className="space-y-2">
            <View className="flex-row items-center justify-between p-3 bg-gray-50 rounded-2xl">
              <View className="flex-row items-center gap-3">
                <Ionicons name="shield-checkmark" size={20} color="#6B7280" />
                <Text className="text-gray-700 font-medium">Безопасность</Text>
              </View>
              <Switch
                value={settings.sms_security}
                onValueChange={(value) => handleSettingChange('sms_security', value)}
                trackColor={{ false: '#E5E7EB', true: '#0165FB' }}
                thumbColor="white"
              />
            </View>
            <View className="flex-row items-center justify-between p-3 bg-gray-50 rounded-2xl">
              <View className="flex-row items-center gap-3">
                <Ionicons name="alert-circle" size={20} color="#6B7280" />
                <Text className="text-gray-700 font-medium">Важные уведомления</Text>
              </View>
              <Switch
                value={settings.sms_important}
                onValueChange={(value) => handleSettingChange('sms_important', value)}
                trackColor={{ false: '#E5E7EB', true: '#0165FB' }}
                thumbColor="white"
              />
            </View>
          </View>
        </View>

        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-4">
            <Ionicons name="notifications" size={20} color="#0165FB" />
            {' '}Push уведомления
          </Text>
          <View className="space-y-2">
            {[
              { key: 'push_new_order', label: 'Новые заказы', icon: 'briefcase' },
              { key: 'push_application_status', label: 'Статус откликов', icon: 'checkmark-circle' },
              { key: 'push_new_message', label: 'Новые сообщения', icon: 'chatbubble' },
              { key: 'push_payment', label: 'Платежи', icon: 'card' },
              { key: 'push_review', label: 'Отзывы', icon: 'star' },
              { key: 'push_project_update', label: 'Обновления проектов', icon: 'construct' },
            ].map((setting) => (
              <View key={setting.key} className="flex-row items-center justify-between p-3 bg-gray-50 rounded-2xl">
                <View className="flex-row items-center gap-3">
                  <Ionicons name={setting.icon as any} size={20} color="#6B7280" />
                  <Text className="text-gray-700 font-medium">{setting.label}</Text>
                </View>
                <Switch
                  value={settings[setting.key as keyof typeof settings] as boolean}
                  onValueChange={(value) => handleSettingChange(setting.key, value)}
                  trackColor={{ false: '#E5E7EB', true: '#0165FB' }}
                  thumbColor="white"
                />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      <View className="px-4">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-4 pt-4 px-0">
          <Text className="text-2xl font-bold text-gray-900">Уведомления</Text>
          {unreadCount > 0 && activeTab === 'all' && (
            <TouchableOpacity onPress={handleMarkAllAsRead}>
              <Text className="text-[#0165FB] text-sm font-medium">Прочитать все</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Main Tabs */}
        <View className="flex-row gap-2 mb-4 mt-4">
          <TouchableOpacity
            onPress={() => setActiveTab('all')}
            className={`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-2xl ${
              activeTab === 'all'
                ? 'bg-[#0165FB] shadow-lg'
                : 'bg-white border border-gray-100'
            }`}
          >
            <Ionicons name="notifications" size={16} color={activeTab === 'all' ? 'white' : '#6B7280'} />
            <Text className={`font-medium ${activeTab === 'all' ? 'text-white' : 'text-gray-600'}`}>
              Все
            </Text>
            {unreadCount > 0 && (
              <View className={`px-2 py-0.5 rounded-full ${
                activeTab === 'all' ? 'bg-white/20' : 'bg-[#0165FB]/10'
              }`}>
                <Text className={`text-xs font-bold ${
                  activeTab === 'all' ? 'text-white' : 'text-[#0165FB]'
                }`}>
                  {unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('settings')}
            className={`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-2xl ${
              activeTab === 'settings'
                ? 'bg-[#0165FB] shadow-lg'
                : 'bg-white border border-gray-100'
            }`}
          >
            <Ionicons name="settings" size={16} color={activeTab === 'settings' ? 'white' : '#6B7280'} />
            <Text className={`font-medium ${activeTab === 'settings' ? 'text-white' : 'text-gray-600'}`}>
              Настройки
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {activeTab === 'all' ? (
        <View className="flex-1 px-4">
          {/* Filter tabs */}
          <View className="flex-row bg-gray-100 p-0.5 rounded-xl mb-4 mt-4">
            <TouchableOpacity
              onPress={() => setFilterTab('all')}
              className={`flex-1 py-1.5 px-3 rounded-lg ${
                filterTab === 'all' ? 'bg-white shadow-sm' : ''
              }`}
            >
              <Text className={`text-xs font-medium text-center ${
                filterTab === 'all' ? 'text-gray-900' : 'text-gray-500'
              }`}>
                Все
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setFilterTab('unread')}
              className={`flex-1 py-1.5 px-3 rounded-lg ${
                filterTab === 'unread' ? 'bg-white shadow-sm' : ''
              }`}
            >
              <Text className={`text-xs font-medium text-center ${
                filterTab === 'unread' ? 'text-gray-900' : 'text-gray-500'
              }`}>
                Непрочитанные
                {unreadCount > 0 && (
                  <Text className="text-[#0165FB]"> ({unreadCount})</Text>
                )}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Loading state */}
          {notificationsLoading && (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="large" color="#0165FB" />
              <Text className="text-gray-500 mt-2">Загрузка уведомлений...</Text>
            </View>
          )}

          {/* Error state */}
          {notificationsError && (
            <View className="bg-white rounded-3xl p-8 items-center mt-4">
              <View className="w-20 h-20 bg-red-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="alert-circle" size={40} color="#EF4444" />
              </View>
              <Text className="text-lg font-semibold text-gray-900 mb-2">Ошибка загрузки</Text>
              <Text className="text-gray-500 text-center mb-4">
                Не удалось загрузить уведомления
              </Text>
              <TouchableOpacity 
                onPress={() => refetchNotifications()}
                className="bg-[#0165FB] px-6 py-2 rounded-xl"
              >
                <Text className="text-white font-medium">Повторить</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Notifications list */}
          {!notificationsLoading && !notificationsError && (
            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
              {notifications.length === 0 ? (
                <View className="bg-white rounded-3xl p-8 items-center mt-4">
                  <View className="w-20 h-20 bg-[#0165FB]/10 rounded-full items-center justify-center mb-4">
                    <Ionicons name="notifications-off" size={40} color="#0165FB" />
                  </View>
                  <Text className="text-lg font-semibold text-gray-900 mb-2">Нет уведомлений</Text>
                  <Text className="text-gray-500">Здесь будут появляться ваши уведомления</Text>
                </View>
              ) : (
                <View className="space-y-4 pb-6 px-0">
                  {groupedNotifications?.today?.length > 0 && (
                    <View>
                      <Text className="text-sm font-semibold text-gray-500 mb-2 px-1">Сегодня</Text>
                      <View className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100">
                        {groupedNotifications.today.map((notification) => (
                          <NotificationItem key={notification.id} notification={notification} />
                        ))}
                      </View>
                    </View>
                  )}

                  {groupedNotifications?.yesterday?.length > 0 && (
                    <View>
                      <Text className="text-sm font-semibold text-gray-500 mb-2 px-1">Вчера</Text>
                      <View className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100">
                        {groupedNotifications.yesterday.map((notification) => (
                          <NotificationItem key={notification.id} notification={notification} />
                        ))}
                      </View>
                    </View>
                  )}

                  {groupedNotifications?.older?.length > 0 && (
                    <View>
                      <Text className="text-sm font-semibold text-gray-500 mb-2 px-1">Ранее</Text>
                      <View className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100">
                        {groupedNotifications.older.map((notification) => (
                          <NotificationItem key={notification.id} notification={notification} />
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      ) : (
        <View className="flex-1 px-4">
          <NotificationSettings />
        </View>
      )}
    </SafeAreaView>
  );
}