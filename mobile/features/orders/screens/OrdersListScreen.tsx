/**
 * Orders List Screen
 * Список всех доступных заказов с фильтрацией и поиском
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useGetOrdersQuery } from '../../../services/orderApi';
import { OrderCard } from '../components/OrderCard';
import { OrderFilters } from '../components/OrderFilters';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { EmptyState } from '../../../components/EmptyState';
import { useOrderFilters } from '../hooks/useOrderFilters';
import { useOrderActions } from '../hooks/useOrderActions';
import { useDebounce } from '../../../hooks/useDebounce';

export default function OrdersListScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);

  const {
    filters,
    updateFilters,
    isFiltersVisible,
    toggleFiltersModal,
    activeFiltersCount,
    hasActiveFilters,
  } = useOrderFilters();

  const { toggleFavorite } = useOrderActions();

  const {
    data: ordersData,
    isLoading,
    isFetching,
    refetch,
  } = useGetOrdersQuery({
    ...filters,
    search: debouncedSearch || undefined,
  });

  const orders = ordersData?.results || [];

  const handleFavoriteToggle = (orderId: number) => {
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      toggleFavorite(orderId, order.is_favorite || false);
    }
  };

  const renderHeader = () => (
    <View className="bg-white border-b border-gray-200 px-4 py-3">
      {/* Title */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-2xl font-bold text-gray-900">Заказы</Text>
        <TouchableOpacity
          onPress={() => router.push('/orders/create')}
          className="bg-blue-500 rounded-full p-2"
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View className="flex-row items-center space-x-2 mb-3">
        <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-3 py-2">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-base text-gray-900"
            placeholder="Поиск заказов..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={toggleFiltersModal}
          className={`p-2 rounded-xl ${
            hasActiveFilters ? 'bg-blue-500' : 'bg-gray-100'
          }`}
        >
          <View className="relative">
            <Ionicons
              name="options"
              size={24}
              color={hasActiveFilters ? 'white' : '#6B7280'}
            />
            {activeFiltersCount > 0 && (
              <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 items-center justify-center">
                <Text className="text-white text-xs font-bold">
                  {activeFiltersCount}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Results Count */}
      <Text className="text-sm text-gray-600">
        Найдено заказов: {ordersData?.count || 0}
      </Text>
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
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onFavoriteToggle={handleFavoriteToggle}
            showActions
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title="Заказов не найдено"
            description={
              hasActiveFilters
                ? 'Попробуйте изменить фильтры поиска'
                : 'Здесь будут отображаться доступные заказы'
            }
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

      {/* Filters Modal */}
      <OrderFilters
        visible={isFiltersVisible}
        filters={filters}
        onFiltersChange={updateFilters}
        onClose={toggleFiltersModal}
      />
    </SafeAreaView>
  );
}
