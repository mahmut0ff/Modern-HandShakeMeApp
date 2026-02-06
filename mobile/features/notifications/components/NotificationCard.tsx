import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { NotificationIcon } from './NotificationIcon';
import type { Notification } from '../../../services/notificationApi';
import { NOTIFICATION_TYPE_LABELS } from '../types';

interface NotificationCardProps {
  notification: Notification;
  onPress?: () => void;
  onMarkRead?: () => void;
  onDelete?: () => void;
}

export function NotificationCard({
  notification,
  onPress,
  onMarkRead,
  onDelete,
}: NotificationCardProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (notification.related_object_type && notification.related_object_id) {
      const routes: Record<string, string> = {
        order: `/orders/${notification.related_object_id}`,
        application: `/applications/${notification.related_object_id}`,
        project: `/projects/${notification.related_object_id}`,
        review: `/reviews/${notification.related_object_id}`,
        message: `/chat/${notification.related_object_id}`,
      };
      const route = routes[notification.related_object_type];
      if (route) {
        router.push(route as any);
      }
    }
    if (!notification.is_read && onMarkRead) {
      onMarkRead();
    }
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays < 7) return `${diffDays} дн назад`;
    return date.toLocaleDateString('ru-RU');
  };

  const getPriorityColor = (): string => {
    switch (notification.priority) {
      case 'urgent': return 'border-l-red-500';
      case 'high': return 'border-l-orange-500';
      case 'normal': return 'border-l-blue-500';
      default: return 'border-l-gray-300';
    }
  };

  return (
    <TouchableOpacity
      className={`bg-white rounded-xl mb-2 border-l-4 ${getPriorityColor()} ${
        !notification.is_read ? 'bg-blue-50' : ''
      }`}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View className="p-4">
        <View className="flex-row items-start">
          <NotificationIcon type={notification.notification_type} size={24} />
          
          <View className="flex-1 ml-3">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-sm text-gray-500">
                {NOTIFICATION_TYPE_LABELS[notification.notification_type] || 'Уведомление'}
              </Text>
              <Text className="text-xs text-gray-400">
                {formatTime(notification.created_at)}
              </Text>
            </View>
            
            <Text className={`text-base ${!notification.is_read ? 'font-semibold' : ''} text-gray-900 mb-1`}>
              {notification.title}
            </Text>
            
            <Text className="text-sm text-gray-600" numberOfLines={2}>
              {notification.message}
            </Text>
          </View>

          {!notification.is_read && (
            <View className="w-2 h-2 rounded-full bg-blue-500 ml-2 mt-2" />
          )}
        </View>

        {(onMarkRead || onDelete) && (
          <View className="flex-row justify-end mt-3 pt-2 border-t border-gray-100">
            {!notification.is_read && onMarkRead && (
              <TouchableOpacity
                className="flex-row items-center mr-4"
                onPress={onMarkRead}
              >
                <Ionicons name="checkmark" size={16} color="#3B82F6" />
                <Text className="text-blue-500 text-sm ml-1">Прочитано</Text>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                className="flex-row items-center"
                onPress={onDelete}
              >
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                <Text className="text-red-500 text-sm ml-1">Удалить</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
