import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useListCategoriesQuery, Category } from '../../services/categoryApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';

export default function CategoriesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { data: categories, isLoading, error, refetch } = useListCategoriesQuery();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message="Не удалось загрузить категории" onRetry={refetch} />;
  }

  const filteredCategories = searchQuery.trim()
    ? categories?.filter((cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : categories;

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Search */}
        <View className="bg-white p-4 mb-2">
          <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              className="flex-1 ml-2"
              placeholder="Поиск категорий..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Categories Grid */}
        <View className="p-4">
          {filteredCategories && filteredCategories.length > 0 ? (
            <View className="flex-row flex-wrap justify-between">
              {filteredCategories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </View>
          ) : (
            <View className="bg-white rounded-lg p-8 items-center">
              <Ionicons name="search-outline" size={64} color="#D1D5DB" />
              <Text className="text-gray-500 text-center mt-4">
                {searchQuery ? 'Категории не найдены' : 'Нет доступных категорий'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

interface CategoryCardProps {
  category: Category;
}

function CategoryCard({ category }: CategoryCardProps) {
  return (
    <TouchableOpacity
      className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200"
      style={{ width: '48%' }}
      onPress={() =>
        router.push({
          pathname: '/categories/detail',
          params: { categoryId: category.id },
        })
      }
    >
      <View className="items-center">
        <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-3">
          <Text className="text-3xl">{category.icon}</Text>
        </View>
        <Text className="text-center font-semibold text-gray-800" numberOfLines={2}>
          {category.name}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
