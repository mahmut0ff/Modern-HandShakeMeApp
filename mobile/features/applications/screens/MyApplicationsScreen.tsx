/**
 * My Applications Screen
 * Мои заявки (для мастеров)
 */

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
import { useGetMyApplicationsQuery } from '../../../services/applicationApi';
import { ApplicationCard } from '../components/ApplicationCard';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { EmptyState } from '../../../components/EmptyState';
import type { ApplicationStatus } from '../types';

const STATUS_TABS: { key: ApplicationStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'pending', label: 'Ожидают' },
  { key: 'viewed', label: 'Просмотрены' },
  { key: 'accepted', label: 'Приняты' },
  { key: 'rejected', label: 'Отклонены' },
];

export default function MyApplicationsScreen() {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus | 'all'>('all');

  const {
    data: applications,
    isLoading,
    isFetching,
    refetch,
  } = useGetMyApplicationsQuery(
    selectedStatus === 'all' ? {} : { status: selectedStatus }
  );

  const handleApplicationPress = (applicationId: number) => {
    router.push(`/applications/${applicationId}`);
  };

  const getStatusCount = (status: ApplicationStatus | 'all'): number => {
    if (!applications) return 0;
    if (status === 'all') return applications.length;
    return applications.filter((app) => app.status === status).length;
  };

  const renderHeader = () => (
    <View className="bg-white border-b border-gray-200">
      {/* Title */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">Мои заявки</Text>
        </View>
      </View>

      {/* Status Tabs */}
      <View className="px-4 pb-3">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_TABS}
          renderItem={({ item }) => {
            const count = getStatusCount(item.key);
            return (
              <TouchableOpacity
                className={`mr-2 px-4 py-2 rounded-full flex-row items-center ${
                  selectedStatus === item.key
                    ? 'bg-blue-500'
                    : 'bg-gray-100'
                }`}
                onPress={() => setSelectedStatus(item.key)}
              >
                <Text
                  className={
                    selectedStatus === item.key
                      ? 'text-white font-medium'
                      : 'text-gray-700'
                  }
                >
                  {item.label}
                </Text>
                {count > 0 && (
                  <View
                    className={`ml-2 px-2 py-0.5 rounded-full ${
                      selectedStatus === item.key ? 'bg-white/20' : 'bg-gray-200'
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        selectedStatus === item.key ? 'text-white' : 'text-gray-600'
                      }`}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          keyExtractor={(item) => item.key}
        />
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        {renderHeader()}
        <LoadingSpinner fullScreen text="Загрузка заявок..." />
      </SafeAreaView>
    );
  }

  const filteredApplications = selectedStatus === 'all'
    ? applications
    : applications?.filter((app) => app.status === selectedStatus);

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <FlatList
        ListHeaderComponent={renderHeader}
        data={filteredApplications}
        renderItem={({ item }) => (
          <ApplicationCard
            application={item}
            onPress={() => handleApplicationPress(item.id)}
            showOrder
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title="Заявок нет"
            description={
              selectedStatus === 'all'
                ? 'Вы еще не откликались на заказы'
                : `Нет заявок со статусом "${STATUS_TABS.find(t => t.key === selectedStatus)?.label}"`
            }
            actionLabel="Найти заказы"
            onAction={() => router.push('/orders')}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            tintColor="#3B82F6"
          />
        }
      />
    </SafeAreaView>
  );
}
