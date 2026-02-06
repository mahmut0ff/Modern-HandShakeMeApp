/**
 * Service Category Picker Component
 * Выбор категории для услуги
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGetServiceCategoriesQuery } from '../../../services/servicesApi';
import { LoadingSpinner } from '../../../components/LoadingSpinner';

interface ServiceCategoryPickerProps {
  selectedCategoryId?: number;
  onSelect: (categoryId: number, categoryName: string) => void;
}

export function ServiceCategoryPicker({
  selectedCategoryId,
  onSelect,
}: ServiceCategoryPickerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: categories, isLoading } = useGetServiceCategoriesQuery();

  const selectedCategory = categories?.find((c) => c.id === selectedCategoryId);

  const filteredCategories = categories?.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (categoryId: number, categoryName: string) => {
    onSelect(categoryId, categoryName);
    setIsVisible(false);
    setSearchQuery('');
  };

  return (
    <>
      <TouchableOpacity
        className="border border-gray-300 rounded-xl px-4 py-3 flex-row items-center justify-between"
        onPress={() => setIsVisible(true)}
      >
        <Text
          className={selectedCategory ? 'text-gray-900' : 'text-gray-500'}
        >
          {selectedCategory?.name || 'Выберите категорию'}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#6B7280" />
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsVisible(false)}
      >
        <View className="flex-1 bg-gray-50">
          {/* Header */}
          <View className="bg-white border-b border-gray-200 px-4 py-3">
            <View className="flex-row items-center justify-between mb-3">
              <TouchableOpacity onPress={() => setIsVisible(false)} className="p-2">
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
              <Text className="text-lg font-bold text-gray-900">
                Выберите категорию
              </Text>
              <View className="w-10" />
            </View>

            {/* Search */}
            <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2">
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-2 text-base text-gray-900"
                placeholder="Поиск категории..."
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

          {/* Categories List */}
          {isLoading ? (
            <LoadingSpinner fullScreen text="Загрузка категорий..." />
          ) : (
            <FlatList
              data={filteredCategories}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className={`bg-white px-4 py-4 border-b border-gray-100 flex-row items-center justify-between ${
                    item.id === selectedCategoryId ? 'bg-blue-50' : ''
                  }`}
                  onPress={() => handleSelect(item.id, item.name)}
                >
                  <View className="flex-row items-center flex-1">
                    {item.icon && (
                      <Text className="text-2xl mr-3">{item.icon}</Text>
                    )}
                    <View className="flex-1">
                      <Text
                        className={`text-base ${
                          item.id === selectedCategoryId
                            ? 'text-blue-700 font-semibold'
                            : 'text-gray-900'
                        }`}
                      >
                        {item.name}
                      </Text>
                      {item.description && (
                        <Text className="text-sm text-gray-500" numberOfLines={1}>
                          {item.description}
                        </Text>
                      )}
                    </View>
                  </View>
                  {item.id === selectedCategoryId && (
                    <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View className="p-8 items-center">
                  <Ionicons name="search" size={48} color="#9CA3AF" />
                  <Text className="text-gray-500 mt-2">Категории не найдены</Text>
                </View>
              }
            />
          )}
        </View>
      </Modal>
    </>
  );
}
