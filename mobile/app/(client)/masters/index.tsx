import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, FlatList, Image, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SearchBar, FilterChip, OptimizedImage } from '../../../components/common';
import { useSearchMastersQuery } from '../../../services/profileApi';
import { getFullName, getAvatarUrl } from '../../../utils/normalizers';
import type { MasterProfile } from '../../../services/profileApi';

export default function MasterSearchPage() {
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<{
    category?: number;
    city?: string;
    min_rating?: number;
    max_hourly_rate?: number;
    is_verified?: boolean;
    is_available?: boolean;
  }>({});
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useSearchMastersQuery({
    ...filters,
    search: searchQuery || undefined,
    page,
  });

  const masters = data?.results || [];
  const totalCount = data?.count || 0;

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setPage(1);
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== undefined && v !== '').length;

  const renderMaster = ({ item }: { item: MasterProfile }) => {
    const fullName = getFullName(item.user);
    const avatar = getAvatarUrl(item.user);
    
    return (
      <TouchableOpacity
        onPress={() => router.push(`/(client)/masters/${item.id}`)}
        className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4"
      >
        <View className="flex-row items-start gap-4">
          <View className="relative">
            <View className="w-16 h-16 bg-[#0165FB] rounded-full items-center justify-center overflow-hidden">
              {avatar ? (
                <OptimizedImage uri={avatar} width={64} height={64} style={{ borderRadius: 32 }} />
              ) : (
                <Ionicons name="person" size={32} color="white" />
              )}
            </View>
            {item.is_verified && (
              <View className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full items-center justify-center shadow">
                <Ionicons name="checkmark-circle" size={20} color="#0165FB" />
              </View>
            )}
          </View>

          <View className="flex-1 min-w-0">
            <Text className="font-semibold text-gray-900">{fullName}</Text>
            {item.company_name && (
              <Text className="text-sm text-gray-500" numberOfLines={1}>{item.company_name}</Text>
            )}
            <View className="flex-row items-center gap-3 mt-1">
              <View className="flex-row items-center gap-1">
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text className="text-sm font-medium">{item.rating || '—'}</Text>
              </View>
              <Text className="text-gray-300">•</Text>
              <Text className="text-sm text-gray-500">{item.completed_orders || 0} проектов</Text>
            </View>
          </View>

          {item.hourly_rate && (
            <View className="items-end">
              <Text className="text-lg font-bold text-[#0165FB]">
                {item.hourly_rate} сом
              </Text>
              <Text className="text-xs text-gray-400">в час</Text>
            </View>
          )}
        </View>

        {/* Portfolio Preview */}
        {item.portfolio_items && item.portfolio_items.length > 0 && (
          <View className="flex-row gap-2 mt-3 overflow-hidden">
            {item.portfolio_items.slice(0, 4).map((portfolioItem, idx) => {
              const firstImage = portfolioItem.images?.[0];
              return (
                <View key={portfolioItem.id} className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100">
                  {firstImage ? (
                    <Image source={{ uri: firstImage.image_url || firstImage.image }} className="w-full h-full" />
                  ) : (
                    <View className="w-full h-full items-center justify-center">
                      <Ionicons name="image" size={24} color="#D1D5DB" />
                    </View>
                  )}
                  {idx === 3 && item.portfolio_items && item.portfolio_items.length > 4 && (
                    <View className="absolute inset-0 items-center justify-center bg-black/50">
                      <Text className="text-white text-sm font-bold">
                        +{item.portfolio_items.length - 4}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <View className="flex-row items-center gap-4 mt-3 text-sm text-gray-500">
          {item.city && (
            <View className="flex-row items-center gap-1">
              <Ionicons name="location" size={12} color="#6B7280" />
              <Text className="text-gray-500">{item.city}</Text>
            </View>
          )}
          {item.experience_years && item.experience_years > 0 && (
            <View className="flex-row items-center gap-1">
              <Ionicons name="time" size={12} color="#6B7280" />
              <Text className="text-gray-500">{item.experience_years} лет</Text>
            </View>
          )}
        </View>

        {/* Badges */}
        <View className="flex-row flex-wrap gap-2 mt-3">
          {item.has_transport && (
            <View className="px-3 py-1 bg-blue-100 rounded-full">
              <View className="flex-row items-center gap-1">
                <Ionicons name="car" size={12} color="#2563EB" />
                <Text className="text-xs font-medium text-blue-700">Транспорт</Text>
              </View>
            </View>
          )}
          {item.has_tools && (
            <View className="px-3 py-1 bg-green-100 rounded-full">
              <View className="flex-row items-center gap-1">
                <Ionicons name="build" size={12} color="#059669" />
                <Text className="text-xs font-medium text-green-700">Инструменты</Text>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4 pt-4 px-0">
          <Text className="text-2xl font-bold text-gray-900">Мастера</Text>
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            className={`relative w-12 h-12 rounded-2xl items-center justify-center ${showFilters ? 'bg-[#0165FB] shadow-lg' : 'bg-white border border-gray-100'
              }`}
          >
            <Ionicons
              name="options"
              size={20}
              color={showFilters ? 'white' : '#6B7280'}
            />
            {activeFiltersCount > 0 && (
              <View className="absolute -top-1 -right-1 w-5 h-5 bg-[#0165FB] rounded-full items-center justify-center">
                <Text className="text-white text-xs font-bold">{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View className="mb-4">
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Поиск по имени или специализации..."
          />
        </View>

        {/* Filters Panel */}
        {showFilters && (
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-2">Город</Text>
                <TextInput
                  value={filters.city || ''}
                  onChangeText={(text) => updateFilter('city', text || undefined)}
                  placeholder="Бишкек"
                  className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-gray-900"
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-2">Макс. ставка</Text>
                <TextInput
                  value={filters.max_hourly_rate?.toString() || ''}
                  onChangeText={(text) => updateFilter('max_hourly_rate', text ? Number(text) : undefined)}
                  placeholder="сом/час"
                  keyboardType="numeric"
                  className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-gray-900"
                />
              </View>
            </View>

            <View className="flex-row flex-wrap gap-2 mb-4">
              <FilterChip
                label="Верифицированные"
                selected={!!filters.is_verified}
                onPress={() => updateFilter('is_verified', !filters.is_verified || undefined)}
              />
              <FilterChip
                label="Доступны сейчас"
                selected={!!filters.is_available}
                onPress={() => updateFilter('is_available', !filters.is_available || undefined)}
              />
            </View>

            <TouchableOpacity onPress={clearFilters}>
              <Text className="text-[#0165FB] text-sm font-medium">Сбросить фильтры</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Results count */}
        <Text className="text-sm text-gray-500 mb-4 mt-4">
          Найдено: {totalCount} мастеров
        </Text>

        {/* Results */}
        {isLoading ? (
          <View className="bg-white rounded-3xl p-8 items-center shadow-sm border border-gray-100">
            <ActivityIndicator size="large" color="#0165FB" />
            <Text className="text-gray-500 mt-4">Загрузка мастеров...</Text>
          </View>
        ) : masters.length === 0 ? (
          <View className="bg-white rounded-3xl p-8 items-center shadow-sm border border-gray-100">
            <View className="w-20 h-20 bg-[#0165FB]/10 rounded-full items-center justify-center mb-4">
              <Ionicons name="search" size={40} color="#0165FB" />
            </View>
            <Text className="text-lg font-semibold text-gray-900 mb-2">Мастера не найдены</Text>
            <Text className="text-gray-500">Попробуйте изменить параметры поиска</Text>
          </View>
        ) : (
          <FlatList
            data={masters}
            renderItem={renderMaster}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}