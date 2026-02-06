/**
 * My Orders Screen
 * Мои заказы (для клиентов)
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
import { useGetMyOrdersQuery } from '../../../services/orderApi';
import { OrderCard } from '../components/OrderCard';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { EmptyState } from '../../../components/EmptyState';
import { useOrderActions } from '../hooks/useOrderActions';
import type { OrderStatus } from '../types';

const STATUS_TABS: { key: OrderStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'active', label: 'Активные' },
  { key: 'in_progress', label: 'В работе' },
  { key: 'completed', label: 'Завершенные' },
  { key: 'draft', label: 'Черновики' },
];

export default function MyOrdersScreen() {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');
  const { confirmDelete } = useOrderActions();

  const {
    data: orders,
    isLoading,
    isFetching,
    refetch,
  } = useGetMyOrdersQuery(
    selectedStatus === 'all' ? undefined : { status: selectedStatus }
  );

  const handleOrderPress = (orderId: number) => {
    router.push(`/orders/${orderId}`);
  };

  const handleEditOrder = (orderId: number) => {
    router.push(`/orders/${orderId}/edit`);
  };

  const handleDeleteOrder = (orderId: number) => {
    confirmDelete(orderId, () => {
      refetch();
    });
  };

  const renderHeader = () => (
    <View className="bg-white border-b border-gray-200">
      {/* Title */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Text className="text-2xl font-bold text-gray-900">Мои заказы</Text>
        <TouchableOpacity
          onPress={() => router.push('/orders/create')}
          className="bg-blue-500 rounded-full px-4 py-2"
        >
          <View className="flex-row items-center">
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-white font-semibold ml-1">Создать</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Status Tabs */}
      <View className="px-4 pb-3">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_TABS}
          renderItem={({ item }) => (
            <TouchableOpacity
              className={`mr-2 px-4 py-2 rounded-full ${
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
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.key}
        />
      </View>
    </View>
  );

  const renderOrderCard = ({ item }: { item: any }) => (
    <View className="mb-3">
      <OrderCard
        order={item}
        onPress={() => handleOrderPress(item.id)}
        showActions={false}
      />
      
      {/* Action Buttons */}
      <View className="flex-row space-x-2 mt-2 px-4">
        <TouchableOpacity
          className="flex-1 bg-blue-500 rounded-xl py-3 items-center"
          onPress={() => handleOrderPress(item.id)}
        >
          <View className="flex-row items-center">
            <Ionicons name="eye-outline" size={18} color="white" />
            <Text className="text-white font-medium ml-2">Просмотр</Text>
          </View>
        </TouchableOpacity>

        {(item.status === 'draft' || item.status === 'active') && (
          <TouchableOpacity
            className="flex-1 bg-gray-100 rounded-xl py-3 items-center"
            onPress={() => handleEditOrder(item.id)}
          >
            <View className="flex-row items-center">
              <Ionicons name="create-outline" size={18} color="#374151" />
              <Text className="text-gray-900 font-medium ml-2">Редактировать</Text>
            </View>
          </TouchableOpacity>
        )}

        {item.status === 'draft' && (
          <TouchableOpacity
            className="bg-red-100 rounded-xl px-4 py-3 items-center"
            onPress={() => handleDeleteOrder(item.id)}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        {renderHeader()}
        <LoadingSpinner fullScreen text="Загрузка заказов..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <FlatList
        ListHeaderComponent={renderHeader}
        data={orders}
        renderItem={renderOrderCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title="У вас пока нет заказов"
            description="Создайте свой первый заказ, чтобы найти мастера"
            actionLabel="Создать заказ"
            onAction={() => router.push('/orders/create')}
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
