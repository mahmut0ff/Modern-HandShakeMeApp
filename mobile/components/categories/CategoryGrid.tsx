import React from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useListCategoriesQuery, Category } from '../../services/categoryApi';
import { LoadingSpinner } from '../LoadingSpinner';

interface CategoryGridProps {
  onCategoryPress?: (category: Category) => void;
  columns?: number;
  showViewAll?: boolean;
}

export default function CategoryGrid({
  onCategoryPress,
  columns = 3,
  showViewAll = true,
}: CategoryGridProps) {
  const { data: categories, isLoading } = useListCategoriesQuery();

  const handlePress = (category: Category) => {
    if (onCategoryPress) {
      onCategoryPress(category);
    } else {
      router.push({
        pathname: '/categories/detail',
        params: { categoryId: category.id },
      });
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const displayCategories = showViewAll ? categories?.slice(0, 8) : categories;

  return (
    <View>
      <View className="flex-row flex-wrap justify-between">
        {displayCategories?.map((category) => (
          <TouchableOpacity
            key={category.id}
            className="bg-white rounded-lg p-3 mb-3 shadow-sm border border-gray-200 items-center"
            style={{ width: `${100 / columns - 2}%` }}
            onPress={() => handlePress(category)}
          >
            <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mb-2">
              <Text className="text-2xl">{category.icon}</Text>
            </View>
            <Text className="text-xs text-center font-medium text-gray-800" numberOfLines={2}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {showViewAll && categories && categories.length > 8 && (
        <TouchableOpacity
          className="bg-blue-50 rounded-lg p-4 items-center flex-row justify-center mt-2"
          onPress={() => router.push('/categories')}
        >
          <Text className="text-blue-600 font-semibold mr-2">Все категории</Text>
          <Ionicons name="arrow-forward" size={16} color="#2563EB" />
        </TouchableOpacity>
      )}
    </View>
  );
}
