import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useListCategoriesQuery, Category } from '../../services/categoryApi';
import { LoadingSpinner } from '../LoadingSpinner';

interface CategoryPickerProps {
  selectedCategoryId?: number;
  onSelect: (category: Category) => void;
  placeholder?: string;
  error?: string;
}

export default function CategoryPicker({
  selectedCategoryId,
  onSelect,
  placeholder = 'Выберите категорию',
  error,
}: CategoryPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: categories, isLoading } = useListCategoriesQuery();

  const selectedCategory = categories?.find((cat) => cat.id === selectedCategoryId);

  const filteredCategories = searchQuery.trim()
    ? categories?.filter((cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : categories;

  const handleSelect = (category: Category) => {
    onSelect(category);
    setModalVisible(false);
    setSearchQuery('');
  };

  return (
    <>
      <TouchableOpacity
        className={`bg-white border rounded-lg px-4 py-3 flex-row items-center justify-between ${error ? 'border-red-500' : 'border-gray-300'
          }`}
        onPress={() => setModalVisible(true)}
      >
        {selectedCategory ? (
          <View className="flex-row items-center flex-1">
            <Text className="text-2xl mr-2">{selectedCategory.icon}</Text>
            <Text className="text-gray-900 font-medium">{selectedCategory.name}</Text>
          </View>
        ) : (
          <Text className="text-gray-400 flex-1">{placeholder}</Text>
        )}
        <Ionicons name="chevron-down" size={20} color="#6B7280" />
      </TouchableOpacity>

      {error && <Text className="text-red-500 text-sm mt-1">{error}</Text>}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl" style={{ maxHeight: '80%' }}>
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <Text className="text-lg font-semibold">Выберите категорию</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View className="p-4 border-b border-gray-200">
              <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                <Ionicons name="search" size={20} color="#6B7280" />
                <TextInput
                  className="flex-1 ml-2"
                  placeholder="Поиск..."
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

            {/* Categories List */}
            <ScrollView className="flex-1">
              {isLoading ? (
                <LoadingSpinner />
              ) : filteredCategories && filteredCategories.length > 0 ? (
                filteredCategories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    className={`p-4 border-b border-gray-100 flex-row items-center ${selectedCategoryId === category.id ? 'bg-blue-50' : ''
                      }`}
                    onPress={() => handleSelect(category)}
                  >
                    <Text className="text-3xl mr-3">{category.icon}</Text>
                    <Text
                      className={`flex-1 font-medium ${selectedCategoryId === category.id ? 'text-blue-600' : 'text-gray-800'
                        }`}
                    >
                      {category.name}
                    </Text>
                    {selectedCategoryId === category.id && (
                      <Ionicons name="checkmark-circle" size={24} color="#2563EB" />
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View className="p-8 items-center">
                  <Ionicons name="search-outline" size={48} color="#D1D5DB" />
                  <Text className="text-gray-500 mt-2">Категории не найдены</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
