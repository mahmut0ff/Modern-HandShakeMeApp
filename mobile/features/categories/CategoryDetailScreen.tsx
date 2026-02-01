import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGetCategorySkillsQuery } from '../../services/categoryApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';

export default function CategoryDetailScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: categoryData,
    isLoading,
    error,
    refetch,
  } = useGetCategorySkillsQuery(categoryId);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message="Не удалось загрузить категорию" onRetry={refetch} />;
  }

  if (!categoryData) {
    return <EmptyState icon="apps-outline" title="Категория не найдена" />;
  }

  const filteredSkills = searchQuery.trim()
    ? categoryData.skills.filter((skill) =>
        skill.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : categoryData.skills;

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Header */}
        <View className="bg-white p-6 mb-2">
          <View className="items-center mb-4">
            <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-3">
              <Text className="text-4xl">{categoryData.category.icon}</Text>
            </View>
            <Text className="text-2xl font-bold text-center mb-2">
              {categoryData.category.name}
            </Text>
            <Text className="text-gray-500">
              {categoryData.count} {categoryData.count === 1 ? 'навык' : 'навыков'}
            </Text>
          </View>
        </View>

        {/* Search */}
        <View className="bg-white p-4 mb-2">
          <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              className="flex-1 ml-2"
              placeholder="Поиск навыков..."
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

        {/* Skills Grid */}
        {filteredSkills.length === 0 ? (
          <View className="bg-white p-8">
            <EmptyState
              icon="search-outline"
              title="Навыки не найдены"
              message={
                searchQuery
                  ? 'Попробуйте изменить поисковый запрос'
                  : 'В этой категории пока нет навыков'
              }
            />
          </View>
        ) : (
          <View className="bg-white p-4">
            <Text className="text-sm text-gray-500 mb-3">
              Найдено: {filteredSkills.length}
            </Text>
            <View className="flex-row flex-wrap">
              {filteredSkills.map((skill) => (
                <View
                  key={skill.id}
                  className="bg-gray-100 rounded-lg px-4 py-3 mr-2 mb-2"
                >
                  <Text className="text-gray-800 font-medium">{skill.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Find Masters Button */}
        <View className="p-4">
          <TouchableOpacity
            className="bg-blue-600 rounded-lg py-4 items-center flex-row justify-center"
            onPress={() =>
              router.push({
                pathname: '/search/masters',
                params: { categoryId },
              })
            }
          >
            <Ionicons name="search" size={20} color="white" />
            <Text className="text-white font-semibold text-base ml-2">
              Найти мастеров в этой категории
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
