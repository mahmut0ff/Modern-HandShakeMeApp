/**
 * Order Applications Screen
 * Заявки на конкретный заказ (для клиентов)
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGetOrderApplicationsQuery } from '../../../services/applicationApi';
import { useGetOrderQuery } from '../../../services/orderApi';
import { ApplicationCard } from '../components/ApplicationCard';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { EmptyState } from '../../../components/EmptyState';
import { ErrorMessage } from '../../../components/ErrorMessage';
import type { ApplicationStatus } from '../types';

const STATUS_TABS: { key: ApplicationStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'pending', label: 'Новые' },
  { key: 'viewed', label: 'Просмотрены' },
  { key: 'accepted', label: 'Приняты' },
  { key: 'rejected', label: 'Отклонены' },
];

export default function OrderApplicationsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ orderId: string }>();
  const orderId = parseInt(params.orderId);

  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus | 'all'>('all');

  const { data: order, isLoading: orderLoading } = useGetOrderQuery(orderId);
  const {
    data: applications,
    isLoading: applicationsLoading,
    isFetching,
    refetch,
    error,
  } = useGetOrderApplicationsQuery(orderId);

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
      <View className="px-4 py-3">
        <View className="flex-row items-center mb-2">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Заявки на заказ</Text>
        </View>
        
        {order && (
          <TouchableOpacity
            className="bg-gray-100 rounded-xl p-3"
            onPress={() => router.push(`/orders/${orderId}`)}
          >
            <Text className="text-base font-medium text-gray-900" numberOfLines={1}>
              {order.title}
            </Text>
            <Text className="text-sm text-gray-600 mt-1">
              {applications?.length || 0} заявок
            </Text>
          </TouchableOpacity>
        )}
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

  if (orderLoading || applicationsLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <LoadingSpinner fullScreen text="Загрузка заявок..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <ErrorMessage
          message="Не удалось загрузить заявки"
          onRetry={refetch}
        />
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
            showMaster
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="Заявок пока нет"
            description="Мастера еще не откликнулись на ваш заказ"
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
