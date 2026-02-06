/**
 * Edit Order Screen
 * Редактирование существующего заказа
 */

import React, { useState, useEffect } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  useGetOrderQuery,
  useUpdateOrderMutation,
  useGetCategoriesQuery,
  useGetCategorySkillsForOrderQuery,
} from '../../../services/orderApi';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ErrorMessage } from '../../../components/ErrorMessage';
import type { OrderFormData, BudgetType } from '../types';

const CITIES = ['Бишкек', 'Ош', 'Джалал-Абад', 'Каракол', 'Токмок', 'Нарын', 'Талас', 'Баткен'];

export default function EditOrderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const orderId = parseInt(params.id);

  const { data: order, isLoading: orderLoading, error } = useGetOrderQuery(orderId);
  const [updateOrder, { isLoading: isUpdating }] = useUpdateOrderMutation();
  const { data: categories } = useGetCategoriesQuery();

  const [formData, setFormData] = useState<Partial<OrderFormData>>({});
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const { data: skills } = useGetCategorySkillsForOrderQuery(formData.category || 0, {
    skip: !formData.category,
  });

  // Initialize form data when order loads
  useEffect(() => {
    if (order) {
      setFormData({
        category: order.category,
        subcategory: order.subcategory || undefined,
        required_skills: order.required_skills,
        title: order.title,
        description: order.description,
        city: order.city,
        address: order.address || '',
        hide_address: order.hide_address,
        budget_type: order.budget_type,
        budget_min: order.budget_min ? parseFloat(order.budget_min) : undefined,
        budget_max: order.budget_max ? parseFloat(order.budget_max) : undefined,
        start_date: order.start_date || undefined,
        end_date: order.end_date || undefined,
        floor: order.floor,
        has_elevator: order.has_elevator,
        material_status: order.material_status,
        has_electricity: order.has_electricity,
        has_water: order.has_water,
        can_store_tools: order.can_store_tools,
        has_parking: order.has_parking,
        required_experience: order.required_experience,
        need_team: order.need_team,
        additional_requirements: order.additional_requirements,
        is_urgent: order.is_urgent,
        work_volume: order.work_volume,
        is_public: order.is_public,
        auto_close_applications: order.auto_close_applications,
      });
    }
  }, [order]);

  const updateField = <K extends keyof OrderFormData>(
    field: K,
    value: OrderFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.title?.trim()) {
      Alert.alert('Ошибка', 'Введите название заказа');
      return;
    }
    if (!formData.description?.trim()) {
      Alert.alert('Ошибка', 'Введите описание заказа');
      return;
    }

    try {
      await updateOrder({
        id: orderId,
        data: formData,
      }).unwrap();
      
      Alert.alert('Успешно', 'Заказ обновлен', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Failed to update order:', error);
      Alert.alert('Ошибка', error?.data?.message || 'Не удалось обновить заказ');
    }
  };

  if (orderLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <LoadingSpinner fullScreen text="Загрузка заказа..." />
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <ErrorMessage message="Не удалось загрузить заказ" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">Редактировать заказ</Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Category */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-2">
            Категория *
          </Text>
          <View className="border border-gray-300 rounded-xl overflow-hidden">
            <Picker
              selectedValue={formData.category}
              onValueChange={(value) => updateField('category', value)}
            >
              {categories?.map((cat) => (
                <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Skills */}
        {skills && skills.length > 0 && (
          <View className="bg-white rounded-2xl p-4 mb-4">
            <Text className="text-base font-semibold text-gray-900 mb-2">
              Требуемые навыки
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {skills.map((skill) => {
                const isSelected = formData.required_skills?.includes(skill.id);
                return (
                  <TouchableOpacity
                    key={skill.id}
                    className={`px-3 py-2 rounded-full border ${
                      isSelected
                        ? 'bg-blue-500 border-blue-500'
                        : 'bg-white border-gray-300'
                    }`}
                    onPress={() => {
                      const current = formData.required_skills || [];
                      updateField(
                        'required_skills',
                        isSelected
                          ? current.filter((id) => id !== skill.id)
                          : [...current, skill.id]
                      );
                    }}
                  >
                    <Text
                      className={isSelected ? 'text-white font-medium' : 'text-gray-700'}
                    >
                      {skill.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Title */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-2">
            Название заказа *
          </Text>
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900"
            placeholder="Например: Ремонт квартиры"
            value={formData.title}
            onChangeText={(text) => updateField('title', text)}
            maxLength={200}
          />
        </View>

        {/* Description */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-2">
            Описание *
          </Text>
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900"
            placeholder="Подробно опишите, что нужно сделать..."
            value={formData.description}
            onChangeText={(text) => updateField('description', text)}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={2000}
          />
        </View>

        {/* Location */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Местоположение *
          </Text>
          
          <Text className="text-sm text-gray-700 mb-2">Город</Text>
          <View className="border border-gray-300 rounded-xl overflow-hidden mb-3">
            <Picker
              selectedValue={formData.city}
              onValueChange={(value) => updateField('city', value)}
            >
              {CITIES.map((city) => (
                <Picker.Item key={city} label={city} value={city} />
              ))}
            </Picker>
          </View>

          <Text className="text-sm text-gray-700 mb-2">Адрес</Text>
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 mb-3"
            placeholder="Улица, дом, квартира"
            value={formData.address}
            onChangeText={(text) => updateField('address', text)}
          />

          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-gray-700">Скрыть точный адрес</Text>
            <Switch
              value={formData.hide_address}
              onValueChange={(value) => updateField('hide_address', value)}
            />
          </View>
        </View>

        {/* Budget */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Бюджет
          </Text>

          <View className="flex-row space-x-2 mb-3">
            {[
              { value: 'negotiable', label: 'Договорная' },
              { value: 'fixed', label: 'Фиксированная' },
              { value: 'range', label: 'Диапазон' },
            ].map((type) => (
              <TouchableOpacity
                key={type.value}
                className={`flex-1 py-3 rounded-xl border ${
                  formData.budget_type === type.value
                    ? 'bg-blue-500 border-blue-500'
                    : 'bg-white border-gray-300'
                }`}
                onPress={() => updateField('budget_type', type.value as BudgetType)}
              >
                <Text
                  className={`text-center font-medium ${
                    formData.budget_type === type.value ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {formData.budget_type === 'fixed' && (
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900"
              placeholder="Сумма в сомах"
              value={formData.budget_min?.toString() || ''}
              onChangeText={(text) => updateField('budget_min', parseInt(text) || undefined)}
              keyboardType="numeric"
            />
          )}

          {formData.budget_type === 'range' && (
            <View className="flex-row space-x-3">
              <TextInput
                className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900"
                placeholder="От"
                value={formData.budget_min?.toString() || ''}
                onChangeText={(text) => updateField('budget_min', parseInt(text) || undefined)}
                keyboardType="numeric"
              />
              <TextInput
                className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900"
                placeholder="До"
                value={formData.budget_max?.toString() || ''}
                onChangeText={(text) => updateField('budget_max', parseInt(text) || undefined)}
                keyboardType="numeric"
              />
            </View>
          )}
        </View>

        {/* Dates */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Сроки выполнения
          </Text>

          <TouchableOpacity
            className="border border-gray-300 rounded-xl px-4 py-3 mb-3"
            onPress={() => setShowStartDatePicker(true)}
          >
            <Text className="text-gray-700">
              Начало: {formData.start_date
                ? new Date(formData.start_date).toLocaleDateString('ru-RU')
                : 'Не указано'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="border border-gray-300 rounded-xl px-4 py-3"
            onPress={() => setShowEndDatePicker(true)}
          >
            <Text className="text-gray-700">
              Окончание: {formData.end_date
                ? new Date(formData.end_date).toLocaleDateString('ru-RU')
                : 'Не указано'}
            </Text>
          </TouchableOpacity>

          {showStartDatePicker && (
            <DateTimePicker
              value={formData.start_date ? new Date(formData.start_date) : new Date()}
              mode="date"
              onChange={(event, date) => {
                setShowStartDatePicker(false);
                if (date) {
                  updateField('start_date', date.toISOString());
                }
              }}
            />
          )}

          {showEndDatePicker && (
            <DateTimePicker
              value={formData.end_date ? new Date(formData.end_date) : new Date()}
              mode="date"
              onChange={(event, date) => {
                setShowEndDatePicker(false);
                if (date) {
                  updateField('end_date', date.toISOString());
                }
              }}
            />
          )}
        </View>

        {/* Additional Options */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Дополнительно
          </Text>

          <View className="space-y-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-700">Срочный заказ</Text>
              <Switch
                value={formData.is_urgent}
                onValueChange={(value) => updateField('is_urgent', value)}
              />
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-gray-700">Нужна бригада</Text>
              <Switch
                value={formData.need_team}
                onValueChange={(value) => updateField('need_team', value)}
              />
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-gray-700">Публичный заказ</Text>
              <Switch
                value={formData.is_public}
                onValueChange={(value) => updateField('is_public', value)}
              />
            </View>
          </View>
        </View>

        {/* Additional Requirements */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-2">
            Дополнительные требования
          </Text>
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900"
            placeholder="Укажите особые требования или пожелания..."
            value={formData.additional_requirements}
            onChangeText={(text) => updateField('additional_requirements', text)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View className="bg-white border-t border-gray-200 p-4">
        <TouchableOpacity
          className={`rounded-xl py-4 items-center ${
            isUpdating ? 'bg-gray-400' : 'bg-blue-500'
          }`}
          onPress={handleSubmit}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <LoadingSpinner size="small" />
          ) : (
            <Text className="text-white font-semibold text-base">
              Сохранить изменения
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
