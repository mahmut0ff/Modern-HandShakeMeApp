/**
 * Order Filters Component
 * Фильтры для списка заказов
 */

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
import { useGetCategoriesQuery } from '../../../services/orderApi';
import type { OrderFiltersState } from '../types';

interface OrderFiltersProps {
  filters: OrderFiltersState;
  onFiltersChange: (filters: OrderFiltersState) => void;
  onClose: () => void;
  visible: boolean;
}

const CITIES = [
  'Бишкек',
  'Ош',
  'Джалал-Абад',
  'Каракол',
  'Токмок',
  'Нарын',
  'Талас',
  'Баткен',
];

const BUDGET_RANGES = [
  { label: 'До 5 000', min: 0, max: 5000 },
  { label: '5 000 - 10 000', min: 5000, max: 10000 },
  { label: '10 000 - 25 000', min: 10000, max: 25000 },
  { label: '25 000 - 50 000', min: 25000, max: 50000 },
  { label: '50 000+', min: 50000, max: undefined },
];

export function OrderFilters({
  filters,
  onFiltersChange,
  onClose,
  visible,
}: OrderFiltersProps) {
  const [localFilters, setLocalFilters] = useState<OrderFiltersState>(filters);
  const { data: categories } = useGetCategoriesQuery();

  const handleApply = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: OrderFiltersState = {};
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const activeFiltersCount = Object.keys(localFilters).filter(
    key => localFilters[key as keyof OrderFiltersState] !== undefined
  ).length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-4 py-3">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={onClose} className="p-2">
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-lg font-bold text-gray-900">Фильтры</Text>
            <TouchableOpacity onPress={handleReset} className="p-2">
              <Text className="text-blue-600 font-medium">Сбросить</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1 p-4">
          {/* Category */}
          <View className="bg-white rounded-2xl p-4 mb-4">
            <Text className="text-base font-semibold text-gray-900 mb-3">
              Категория
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {categories?.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  className={`px-4 py-2 rounded-full border ${
                    localFilters.category === category.id
                      ? 'bg-blue-500 border-blue-500'
                      : 'bg-white border-gray-300'
                  }`}
                  onPress={() =>
                    setLocalFilters({
                      ...localFilters,
                      category:
                        localFilters.category === category.id
                          ? undefined
                          : category.id,
                    })
                  }
                >
                  <Text
                    className={
                      localFilters.category === category.id
                        ? 'text-white font-medium'
                        : 'text-gray-700'
                    }
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* City */}
          <View className="bg-white rounded-2xl p-4 mb-4">
            <Text className="text-base font-semibold text-gray-900 mb-3">
              Город
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {CITIES.map((city) => (
                <TouchableOpacity
                  key={city}
                  className={`px-4 py-2 rounded-full border ${
                    localFilters.city === city
                      ? 'bg-blue-500 border-blue-500'
                      : 'bg-white border-gray-300'
                  }`}
                  onPress={() =>
                    setLocalFilters({
                      ...localFilters,
                      city: localFilters.city === city ? undefined : city,
                    })
                  }
                >
                  <Text
                    className={
                      localFilters.city === city
                        ? 'text-white font-medium'
                        : 'text-gray-700'
                    }
                  >
                    {city}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Budget Range */}
          <View className="bg-white rounded-2xl p-4 mb-4">
            <Text className="text-base font-semibold text-gray-900 mb-3">
              Бюджет (сом)
            </Text>
            <View className="space-y-2">
              {BUDGET_RANGES.map((range, index) => {
                const isSelected =
                  localFilters.budgetMin === range.min &&
                  localFilters.budgetMax === range.max;

                return (
                  <TouchableOpacity
                    key={index}
                    className={`p-3 rounded-xl border ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-white border-gray-200'
                    }`}
                    onPress={() =>
                      setLocalFilters({
                        ...localFilters,
                        budgetMin: isSelected ? undefined : range.min,
                        budgetMax: isSelected ? undefined : range.max,
                      })
                    }
                  >
                    <Text
                      className={
                        isSelected
                          ? 'text-blue-700 font-medium'
                          : 'text-gray-700'
                      }
                    >
                      {range.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Status */}
          <View className="bg-white rounded-2xl p-4 mb-4">
            <Text className="text-base font-semibold text-gray-900 mb-3">
              Статус
            </Text>
            <View className="space-y-2">
              {[
                { value: 'active', label: 'Активные' },
                { value: 'in_progress', label: 'В работе' },
                { value: 'completed', label: 'Завершенные' },
              ].map((status) => (
                <TouchableOpacity
                  key={status.value}
                  className={`p-3 rounded-xl border ${
                    localFilters.status === status.value
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-white border-gray-200'
                  }`}
                  onPress={() =>
                    setLocalFilters({
                      ...localFilters,
                      status:
                        localFilters.status === status.value
                          ? undefined
                          : (status.value as any),
                    })
                  }
                >
                  <Text
                    className={
                      localFilters.status === status.value
                        ? 'text-blue-700 font-medium'
                        : 'text-gray-700'
                    }
                  >
                    {status.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Urgent Only */}
          <View className="bg-white rounded-2xl p-4 mb-4">
            <TouchableOpacity
              className="flex-row items-center justify-between"
              onPress={() =>
                setLocalFilters({
                  ...localFilters,
                  isUrgent: !localFilters.isUrgent,
                })
              }
            >
              <View className="flex-row items-center">
                <Ionicons name="flash" size={20} color="#EF4444" />
                <Text className="text-base font-medium text-gray-900 ml-2">
                  Только срочные
                </Text>
              </View>
              <View
                className={`w-12 h-6 rounded-full ${
                  localFilters.isUrgent ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <View
                  className={`w-5 h-5 rounded-full bg-white mt-0.5 ${
                    localFilters.isUrgent ? 'ml-6' : 'ml-0.5'
                  }`}
                />
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Apply Button */}
        <View className="bg-white border-t border-gray-200 p-4">
          <TouchableOpacity
            className="bg-blue-500 rounded-xl py-4 items-center"
            onPress={handleApply}
          >
            <Text className="text-white font-semibold text-base">
              Применить фильтры
              {activeFiltersCount > 0 && ` (${activeFiltersCount})`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
