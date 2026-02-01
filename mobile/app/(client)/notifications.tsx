import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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
  new_application: 'document',
  application_accepted: 'checkmark-circle',
  application_rejected: 'close-circle',
  new_message: 'chatbubble',
  project_status: 'bar-chart',
  payment: 'card',
  review: 'star',
  system: 'notifications',
};

const notificationColors: Record<string, string> = {
  new_application: 'bg-blue-500',
  application_accepted: 'bg-green-500',
  application_rejected: 'bg-red-500',
  new_message: 'bg-[#0165FB]',
  project_status: 'bg-orange-500',
  payment: 'bg-green-500',
  review: 'bg-yellow-500',
  system: 'bg-gray-500',
};

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'settings'>('all');
  const [filterTab, setFilterTab] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(false);

  // Mock data - replace with actual API calls
  const notifications: Notification[] = [
    {
      id: 1,
      notification_type: 'new_application',
      title: 'Новый отклик',
      text: 'Мастер Иван откликнулся на ваш заказ "Ремонт ванной"',
      is_read: false,
      created_at: '2024-01-15T10:30:00Z',
      data: { order_id: 123 }
    },
    {
      id: 2,
      notification_type: 'new_message',
      title: 'Новое сообщение',
      text: 'Мастер Петр написал вам сообщение',
      is_read: false,
      created_at: '2024-01-15T09:15:00Z',
      data: { room_id: 456, sender_name: 'Петр' }
    },
    {
      id: 3,
      notification_type: 'payment',
      title: 'Платеж выполнен',
      text: 'Оплата заказа #123 прошла успешно',
      is_read: true,
      created_at: '2024-01-14T16:20:00Z',
      data: { amount: 5000 }
    }
  ];

  const [settings, setSettings] = useState({
    push_new_message: true,
    push_new_application: true,
    push_application_status: true,
    push_project_status: true,
    push_new_order: false,
    push_deadline: true,
    push_review: true,
    sms_important: true,
    sms_security: true,
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleNotificationClick = (notification: Notification) => {
    const { notification_type, data } = notification;
    const userRole = 'client'; // Get from auth context

    switch (notification_type) {
      case 'new_message':
        if (data.room_id) {
          router.push(`/(client)/chat/${data.room_id}`);
        }
        break;
      case 'new_application':
        if (data.order_id) {
          router.push(`/(client)/orders/${data.order_id}`);
        }
        break;
      case 'payment':
        router.push('/(client)/wallet');
        break;
      default:
        break;
    }
  };

  const groupedNotifications = useMemo(() => {
    const filtered = filterTab === 'unread' 
      ? notifications.filter(n => !n.is_read)
      : notifications;

    const groups: Record<string, Notification[]> = {
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

    filtered.forEach((notification) => {
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
  }, [notifications, filterTab]);

  const NotificationItem = ({ notification }: { notification: Notification }) => (
    <TouchableOpacity
      onPress={() => handleNotificationClick(notification)}
      className={`p-4 rounded-2xl mb-2 ${!notification.is_read ? 'bg-[#0165FB]/5' : 'bg-white'}`}
    >
      <View className="flex-row items-start gap-3">
        <View className={`w-12 h-12 rounded-2xl items-center justify-center ${
          notificationColors[notification.notification_type] || 'bg-gray-500'
        }`}>
          <Ionicons 
            name={notificationIcons[notification.notification_type] || 'notifications'} 
            size={20} 
            color="white" 
          />
        </View>
        <View className="flex-1 min-w-0">
          <Text className={`font-semibold ${!notification.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
            {notification.title}
          </Text>
          <Text className="text-sm text-gray-500 mt-1" numberOfLines={2}>
            {notification.text}
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

  const NotificationSettings = () => (
    <ScrollView className="flex-1">
      <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
        <View className="flex-row items-center gap-2 mb-4">
          <Ionicons name="chatbubble" size={20} color="#0165FB" />
          <Text className="text-lg font-bold text-gray-900">SMS уведомления</Text>
        </View>
        <View className="flex flex-col gap-2">
          <View className="flex-row items-center justify-between p-3 bg-gray-50 rounded-2xl">
            <View className="flex-row items-center gap-3">
              <Ionicons name="shield-checkmark" size={20} color="#6B7280" />
              <Text className="text-gray-700 font-medium">Безопасность</Text>
            </View>
            <Switch
              value={settings.sms_security}
              onValueChange={(value) => setSettings({...settings, sms_security: value})}
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
              onValueChange={(value) => setSettings({...settings, sms_important: value})}
              trackColor={{ false: '#E5E7EB', true: '#0165FB' }}
              thumbColor="white"
            />
          </View>
        </View>
      </View>

      <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
        <View className="flex-row items-center gap-2 mb-4">
          <Ionicons name="notifications" size={20} color="#0165FB" />
          <Text className="text-lg font-bold text-gray-900">Push уведомления</Text>
        </View>
        <View className="flex flex-col gap-2">
          {[
            { key: 'push_new_message', label: 'Новые сообщения', icon: 'chatbubble' },
            { key: 'push_new_application', label: 'Новые отклики', icon: 'document' },
            { key: 'push_application_status', label: 'Статус откликов', icon: 'checkmark-circle' },
            { key: 'push_project_status', label: 'Статус проектов', icon: 'bar-chart' },
            { key: 'push_deadline', label: 'Дедлайны', icon: 'time' },
            { key: 'push_review', label: 'Отзывы', icon: 'star' },
          ].map((setting) => (
            <View key={setting.key} className="flex-row items-center justify-between p-3 bg-gray-50 rounded-2xl">
              <View className="flex-row items-center gap-3">
                <Ionicons name={setting.icon as any} size={20} color="#6B7280" />
                <Text className="text-gray-700 font-medium">{setting.label}</Text>
              </View>
              <Switch
                value={settings[setting.key as keyof typeof settings] as boolean}
                onValueChange={(value) => setSettings({...settings, [setting.key]: value})}
                trackColor={{ false: '#E5E7EB', true: '#0165FB' }}
                thumbColor="white"
              />
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      <View className="px-4">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-4 pt-4 px-0">
          <Text className="text-2xl font-bold text-gray-900">Уведомления</Text>
          {unreadCount > 0 && activeTab === 'all' && (
            <TouchableOpacity>
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

          {/* Notifications list */}
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
              <View className="flex flex-col gap-4 pb-6 px-0">
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
        </View>
      ) : (
        <View className="flex-1 px-4">
          <NotificationSettings />
        </View>
      )}
    </SafeAreaView>
  );
}