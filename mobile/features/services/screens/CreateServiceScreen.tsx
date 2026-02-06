/**
 * Create Service Screen
 * Создание новой услуги
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { useCreateServiceMutation } from '../../../services/servicesApi';
import { ServiceCategoryPicker } from '../components/ServiceCategoryPicker';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { SERVICE_UNITS, type ServiceFormData, type ServiceUnit } from '../types';

export default function CreateServiceScreen() {
  const router = useRouter();
  const [createService, { isLoading: isCreating }] = useCreateServiceMutation();

  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    category: 0,
    price_from: 0,
    price_to: undefined,
    unit: 'hour',
    is_active: true,
    is_featured: false,
  });

  const [categoryName, setCategoryName] = useState('');
  const [showPriceRange, setShowPriceRange] = useState(false);

  const updateField = <K extends keyof ServiceFormData>(
    field: K,
    value: ServiceFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCategorySelect = (categoryId: number, name: string) => {
    updateField('category', categoryId);
    setCategoryName(name);
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Alert.alert('Ошибка', 'Введите название услуги');
      return false;
    }
    if (!formData.category) {
      Alert.alert('Ошибка', 'Выберите категорию');
      return false;
    }
    if (!formData.price_from || formData.price_from <= 0) {
      Alert.alert('Ошибка', 'Укажите минимальную цену');
      return false;
    }
    if (showPriceRange && formData.price_to && formData.price_to < formData.price_from) {
      Alert.alert('Ошибка', 'Максимальная цена должна быть больше минимальной');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const dataToSubmit = {
        ...formData,
        price_to: showPriceRange ? formData.price_to : undefined,
      };

      const result = await createService(dataToSubmit).unwrap();
      Alert.alert('Успешно', 'Услуга создана', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Failed to create service:', error);
      Alert.alert('Ошибка', error?.data?.message || 'Не удалось создать услугу');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">Новая услуга</Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Name */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-2">
            Название услуги *
          </Text>
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900"
            placeholder="Например: Укладка плитки"
            value={formData.name}
            onChangeText={(text) => updateField('name', text)}
            maxLength={100}
          />
          <Text className="text-xs text-gray-500 mt-1">
            {formData.name.length}/100
          </Text>
        </View>

        {/* Category */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-2">
            Категория *
          </Text>
          <ServiceCategoryPicker
            selectedCategoryId={formData.category}
            onSelect={handleCategorySelect}
          />
        </View>

        {/* Description */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-2">
            Описание
          </Text>
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900"
            placeholder="Подробно опишите услугу..."
            value={formData.description}
            onChangeText={(text) => updateField('description', text)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text className="text-xs text-gray-500 mt-1">
            {formData.description?.length || 0}/500
          </Text>
        </View>

        {/* Price */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Стоимость *
          </Text>

          {/* Unit */}
          <Text className="text-sm text-gray-700 mb-2">Единица измерения</Text>
          <View className="border border-gray-300 rounded-xl overflow-hidden mb-4">
            <Picker
              selectedValue={formData.unit}
              onValueChange={(value) => updateField('unit', value as ServiceUnit)}
            >
              {SERVICE_UNITS.map((unit) => (
                <Picker.Item key={unit.value} label={unit.label} value={unit.value} />
              ))}
            </Picker>
          </View>

          {/* Price From */}
          <Text className="text-sm text-gray-700 mb-2">
            {showPriceRange ? 'Цена от (сом)' : 'Цена (сом)'}
          </Text>
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 mb-3"
            placeholder="0"
            value={formData.price_from ? formData.price_from.toString() : ''}
            onChangeText={(text) => updateField('price_from', parseInt(text) || 0)}
            keyboardType="numeric"
          />

          {/* Price Range Toggle */}
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-gray-700">Указать диапазон цен</Text>
            <Switch
              value={showPriceRange}
              onValueChange={setShowPriceRange}
            />
          </View>

          {/* Price To */}
          {showPriceRange && (
            <>
              <Text className="text-sm text-gray-700 mb-2">Цена до (сом)</Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900"
                placeholder="0"
                value={formData.price_to ? formData.price_to.toString() : ''}
                onChangeText={(text) => updateField('price_to', parseInt(text) || undefined)}
                keyboardType="numeric"
              />
            </>
          )}
        </View>

        {/* Settings */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Настройки
          </Text>

          <View className="space-y-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text className="text-gray-900">Активна</Text>
                <Text className="text-sm text-gray-500">
                  Услуга видна клиентам
                </Text>
              </View>
              <Switch
                value={formData.is_active}
                onValueChange={(value) => updateField('is_active', value)}
              />
            </View>

            <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
              <View className="flex-1 mr-3">
                <Text className="text-gray-900">Рекомендуемая</Text>
                <Text className="text-sm text-gray-500">
                  Выделить услугу в списке
                </Text>
              </View>
              <Switch
                value={formData.is_featured}
                onValueChange={(value) => updateField('is_featured', value)}
              />
            </View>
          </View>
        </View>

        {/* Tips */}
        <View className="bg-blue-50 rounded-2xl p-4 mb-4">
          <View className="flex-row items-start">
            <Ionicons name="bulb-outline" size={24} color="#3B82F6" />
            <View className="flex-1 ml-3">
              <Text className="text-blue-900 font-semibold mb-1">Советы</Text>
              <Text className="text-blue-800 text-sm leading-5">
                • Укажите конкурентную цену{'\n'}
                • Добавьте подробное описание{'\n'}
                • Выберите правильную категорию{'\n'}
                • Используйте понятное название
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View className="bg-white border-t border-gray-200 p-4">
        <TouchableOpacity
          className={`rounded-xl py-4 items-center ${
            isCreating ? 'bg-gray-400' : 'bg-blue-500'
          }`}
          onPress={handleSubmit}
          disabled={isCreating}
        >
          {isCreating ? (
            <LoadingSpinner size="small" />
          ) : (
            <Text className="text-white font-semibold text-base">
              Создать услугу
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
