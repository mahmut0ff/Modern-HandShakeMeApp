import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, FlatList, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SearchBar, Pagination, FilterChip, SkeletonList, OptimizedImage } from '../../components/common';
import { useFilters } from '../../hooks/useFilters';

interface Master {
  id: number;
  full_name: string;
  first_name: string;
  last_name: string;
  company_name?: string;
  avatar?: string;
  city?: string;
  rating?: string;
  completed_projects_count: number;
  hourly_rate?: string;
  experience_years: number;
  is_verified: boolean;
  has_transport: boolean;
  has_tools: boolean;
  portfolio_preview?: PortfolioItem[];
}

interface PortfolioItem {
  id: number;
  title: string;
  after_image?: string;
  media?: { id: number; media_type: string; file_url: string; file: string }[];
}

interface SearchFilters {
  category?: number;
  city?: string;
  min_rating?: number;
  min_experience?: number;
  max_hourly_rate?: number;
  has_transport?: boolean;
  has_tools?: boolean;
  search?: string;
}

export default function MasterSearchPage() {
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data - replace with actual API calls
  const masters: Master[] = [
    {
      id: 1,
      full_name: 'Иван Петров',
      first_name: 'Иван',
      last_name: 'Петров',
      company_name: 'Ремонт Плюс',
      city: 'Москва',
      rating: '4.8',
      completed_projects_count: 45,
      hourly_rate: '1500',
      experience_years: 8,
      is_verified: true,
      has_transport: true,
      has_tools: true,
      portfolio_preview: [
        { id: 1, title: 'Ремонт ванной', after_image: 'https://example.com/image1.jpg' },
        { id: 2, title: 'Кухня', after_image: 'https://example.com/image2.jpg' }
      ]
    },
    {
      id: 2,
      full_name: 'Мария Сидорова',
      first_name: 'Мария',
      last_name: 'Сидорова',
      city: 'Санкт-Петербург',
      rating: '4.9',
      completed_projects_count: 32,
      hourly_rate: '1200',
      experience_years: 5,
      is_verified: false,
      has_transport: false,
      has_tools: true,
      portfolio_preview: [
        { id: 3, title: 'Покраска стен', after_image: 'https://example.com/image3.jpg' }
      ]
    }
  ];

  const {
    paginatedData,
    totalPages,
    currentPage,
    searchQuery,
    filters,
    updateFilter,
    updateSearch,
    clearFilters,
    setCurrentPage,
  } = useFilters<Master>(masters, {
    pageSize: 10,
    searchFields: ['full_name', 'first_name', 'last_name', 'company_name', 'city'],
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== undefined && v !== '').length;

  const renderMaster = ({ item }: { item: Master }) => (
    <TouchableOpacity
      onPress={() => router.push(`/(client)/masters/${item.id}`)}
      className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4"
    >
      <View className="flex-row items-start gap-4">
        <View className="relative">
          <View className="w-16 h-16 bg-[#0165FB] rounded-full items-center justify-center overflow-hidden">
            {item.avatar ? (
              <OptimizedImage uri={item.avatar} width={64} height={64} style={{ borderRadius: 32 }} />
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
          <Text className="font-semibold text-gray-900">
            {item.full_name || `${item.first_name || ''} ${item.last_name || ''}`}
          </Text>
          {item.company_name && (
            <Text className="text-sm text-gray-500" numberOfLines={1}>{item.company_name}</Text>
          )}
          <View className="flex-row items-center gap-3 mt-1">
            <View className="flex-row items-center gap-1">
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text className="text-sm font-medium">{item.rating || '—'}</Text>
            </View>
            <Text className="text-gray-300">•</Text>
            <Text className="text-sm text-gray-500">{item.completed_projects_count || 0} проектов</Text>
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
      {item.portfolio_preview && item.portfolio_preview.length > 0 && (
        <View className="flex-row gap-2 mt-3 overflow-hidden">
          {item.portfolio_preview.slice(0, 4).map((portfolioItem, idx) => (
            <View key={portfolioItem.id} className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100">
              {portfolioItem.after_image ? (
                <Image source={{ uri: portfolioItem.after_image }} className="w-full h-full" />
              ) : portfolioItem.media && portfolioItem.media.length > 0 ? (
                portfolioItem.media[0].media_type === 'video' ? (
                  <View className="w-full h-full bg-gray-200 items-center justify-center">
                    <Ionicons name="play-circle" size={24} color="#6B7280" />
                  </View>
                ) : (
                  <Image 
                    source={{ uri: portfolioItem.media[0].file_url || portfolioItem.media[0].file }} 
                    className="w-full h-full" 
                  />
                )
              ) : (
                <View className="w-full h-full items-center justify-center">
                  <Ionicons name="image" size={24} color="#D1D5DB" />
                </View>
              )}
              {idx === 3 && item.portfolio_preview && item.portfolio_preview.length > 4 && (
                <View className="absolute inset-0 items-center justify-center bg-black/50">
                  <Text className="text-white text-sm font-bold">
                    +{item.portfolio_preview.length - 4}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      <View className="flex-row items-center gap-4 mt-3 text-sm text-gray-500">
        {item.city && (
          <View className="flex-row items-center gap-1">
            <Ionicons name="location" size={12} color="#6B7280" />
            <Text className="text-gray-500">{item.city}</Text>
          </View>
        )}
        {item.experience_years > 0 && (
          <View className="flex-row items-center gap-1">
            <Ionicons name="time" size={12} color="#6B7280" />
            <Text className="text-gray-500">{item.experience_years} лет</Text>
          </View>
        )}
      </View>

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
            className={`relative w-12 h-12 rounded-2xl items-center justify-center ${
              showFilters ? 'bg-[#0165FB] shadow-lg' : 'bg-white border border-gray-100'
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
            onChangeText={updateSearch}
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
                  value={(filters.city as string) || ''}
                  onChangeText={(text) => updateFilter('city', text)}
                  placeholder="Москва"
                  className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-gray-900"
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-2">Мин. опыт</Text>
                <TextInput
                  value={(filters.min_experience as number)?.toString() || ''}
                  onChangeText={(text) => updateFilter('min_experience', text ? Number(text) : undefined)}
                  placeholder="лет"
                  keyboardType="numeric"
                  className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-gray-900"
                />
              </View>
            </View>
            
            <View className="flex-row flex-wrap gap-2 mb-4">
              {[
                { key: 'has_transport', label: 'С транспортом', icon: 'car' },
                { key: 'has_tools', label: 'С инструментами', icon: 'build' },
              ].map(item => (
                <FilterChip
                  key={item.key}
                  label={item.label}
                  selected={!!filters[item.key as keyof SearchFilters]}
                  onPress={() => updateFilter(item.key as keyof Master, !filters[item.key as keyof SearchFilters] || undefined)}
                />
              ))}
            </View>

            <TouchableOpacity onPress={clearFilters}>
              <Text className="text-[#0165FB] text-sm font-medium">Сбросить фильтры</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Results count */}
        <Text className="text-sm text-gray-500 mb-4 mt-4">
          Найдено: {paginatedData.length} мастеров
        </Text>

        {/* Results */}
        {loading ? (
          <SkeletonList count={3} />
        ) : paginatedData.length === 0 ? (
          <View className="bg-white rounded-3xl p-8 items-center shadow-sm border border-gray-100">
            <View className="w-20 h-20 bg-[#0165FB]/10 rounded-full items-center justify-center mb-4">
              <Ionicons name="search" size={40} color="#0165FB" />
            </View>
            <Text className="text-lg font-semibold text-gray-900 mb-2">Мастера не найдены</Text>
            <Text className="text-gray-500">Попробуйте изменить параметры поиска</Text>
          </View>
        ) : (
          <>
            <FlatList
              data={paginatedData}
              renderItem={renderMaster}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              loading={loading}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}