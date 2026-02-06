import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useGetNotificationsQuery } from '../../../services/notificationApi';
import { NotificationCard } from '../components/NotificationCard';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { EmptyState } from '../../../components/EmptyState';
import { useNotificationActions } from '../hooks/useNotificationActions';
import type { NotificationFiltersState } from '../types';

export default function NotificationsListScreen() {
  const router = useRouter();
  const [filters, setFilters] = useState<NotificationFiltersState>({});
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const {
    data: notificationsData,
    isLoading,
    isFetching,
    refetch,
  } = useGetNotificationsQuery({
    is_read: showUnreadOnly ? false : undefined,
    notification_type: filters.type,
    priority: filters.priority,
    page_size: 50,
  });

  const {
    handleMarkRead,
    handleMarkAllRead,
    handleDelete,
    confirmDeleteAll,
    isMarkingAllRead,
  } = useNotificationActions();

  const notifications = notificationsData?.results || [];
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const renderHeader = () => (
    <View className="bg-white border-b border-gray-200">
      <View className="flex-row items-center justify-between px-4 py-3">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">Уведомления</Text>
          {unreadCount > 0 && (
            <View className="bg-red-500 rounded-full px-2 py-0.5 ml-2">
              <Text className="text-white text-xs font-bold">{unreadCount}</Text>
            </View>
          )}
        </View>
        
        <View className="flex-row items-center">
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={handleMarkAllRead}
              disabled={isMarkingAllRead}
              className="mr-3"
            >
              <Ionicons name="checkmark-done" size={24} color="#3B82F6" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => router.push('/settings/notifications' as any)}>
            <Ionicons name="settings-outline" size={24} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-row px-4 pb-3">
        <TouchableOpacity
          className={`px-4 py-2 rounded-full mr-2 ${
            !showUnreadOnly ? 'bg-blue-500' : 'bg-gray-100'
          }`}
          onPress={() => setShowUnreadOnly(false)}
        >
          <Text className={!showUnreadOnly ? 'text-white font-medium' : 'text-gray-700'}>
            Все
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`px-4 py-2 rounded-full ${
            showUnreadOnly ? 'bg-blue-500' : 'bg-gray-100'
          }`}
          onPress={() => setShowUnreadOnly(true)}
        >
          <Text className={showUnreadOnly ? 'text-white font-medium' : 'text-gray-700'}>
            Непрочитанные
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        {renderHeader()}
        <LoadingSpinner fullScreen text="Загрузка уведомлений..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <FlatList
        ListHeaderComponent={renderHeader}
        data={notifications}
        renderItem={({ item }) => (
          <NotificationCard
            notification={item}
            onMarkRead={() => handleMarkRead(item.id)}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-off-outline"
            title={showUnreadOnly ? 'Нет непрочитанных' : 'Нет уведомлений'}
            description={
              showUnreadOnly
                ? 'Все уведомления прочитаны'
                : 'Здесь будут появляться ваши уведомления'
            }
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor="#3B82F6"
          />
        }
      />

      {notifications.length > 0 && (
        <View className="bg-white border-t border-gray-200 p-4">
          <TouchableOpacity
            className="flex-row items-center justify-center"
            onPress={confirmDeleteAll}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
            <Text className="text-red-500 ml-2">Удалить все</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
