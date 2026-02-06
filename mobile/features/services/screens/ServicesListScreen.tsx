/**
 * Services List Screen
 * Список всех услуг с поиском и фильтрами
 */

import React, { useState, useMemo } from 'react';
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
import { useSearchServicesQuery, useGetServiceCategoriesQuery } from '../../../services/servicesApi';
import { ServiceCard } from '../components/ServiceCard';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { EmptyState } from '../../../components/EmptyState';
import { useDebounce } from '../../../hooks/useDebounce';
import type { ServiceFiltersState } from '../types';

export default function ServicesListScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ServiceFiltersState>({});

  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: categories } = useGetServiceCategoriesQuery();

  const queryParams = useMemo(() => ({
    search: debouncedSearch || undefined,
    category: filters.category,
    min_price: filters.minPrice,
    max_price: filters.maxPrice,
    unit: filters.unit,
  }), [debouncedSearch, filters]);

  const {
    data: servicesData,
    isLoading,
    isFetching,
    refetch,
  } = useSearchServicesQuery(queryParams);

  const services = servicesData?.results || [];

  const handleServicePress = (serviceId: number) => {
    router.push(`/services/${serviceId}`);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  const hasActiveFilters = filters.category || filters.minPrice || filters.maxPrice || filters.unit;

  const renderHeader = () => (
    <View className="bg-white border-b border-gray-200">
      {/* Title */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">Услуги</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          className={`p-2 rounded-full ${hasActiveFilters ? 'bg-blue-100' : ''}`}
        >
          <Ionicons
            name="options-outline"
            size={24}
            color={hasActiveFilters ? '#3B82F6' : '#374151'}
          />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View className="px-4 pb-3">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-base text-gray-900"
            placeholder="Поиск услуг..."
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
      </View>

      {/* Filters Panel */}
      {showFilters && (
        <View className="px-4 pb-4 border-t border-gray-100 pt-3">
          {/* Category Filter */}
          <Text className="text-sm font-medium text-gray-700 mb-2">Категория</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[{ id: 0, name: 'Все' }, ...(categories || [])]}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                className={`px-4 py-2 rounded-full mr-2 ${
                  (item.id === 0 && !filters.category) || filters.category === item.id
                    ? 'bg-blue-500'
                    : 'bg-gray-100'
                }`}
                onPress={() => setFilters(prev => ({
                  ...prev,
                  category: item.id === 0 ? undefined : item.id
                }))}
              >
                <Text
                  className={
                    (item.id === 0 && !filters.category) || filters.category === item.id
                      ? 'text-white font-medium'
                      : 'text-gray-700'
                  }
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
            className="mb-3"
          />

          {/* Clear Filters */}
          {hasActiveFilters && (
            <TouchableOpacity
              className="flex-row items-center justify-center py-2"
              onPress={clearFilters}
            >
              <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
              <Text className="text-red-500 ml-1">Сбросить фильтры</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Results Count */}
      {servicesData && (
        <View className="px-4 pb-2">
          <Text className="text-sm text-gray-500">
            Найдено: {servicesData.count} услуг
          </Text>
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        {renderHeader()}
        <LoadingSpinner fullScreen text="Загрузка услуг..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <FlatList
        ListHeaderComponent={renderHeader}
        data={services}
        renderItem={({ item }) => (
          <ServiceCard
            service={item}
            onPress={() => handleServicePress(item.id)}
            showMaster
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <EmptyState
            icon="construct-outline"
            title="Услуги не найдены"
            description={
              hasActiveFilters || searchQuery
                ? 'Попробуйте изменить параметры поиска'
                : 'Пока нет доступных услуг'
            }
            actionLabel={hasActiveFilters ? 'Сбросить фильтры' : undefined}
            onAction={hasActiveFilters ? clearFilters : undefined}
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
    </SafeAreaView>
  );
}
