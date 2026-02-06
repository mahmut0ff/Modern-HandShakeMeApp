/**
 * Create Application Screen
 * Создание заявки на заказ (для мастеров)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useCreateApplicationMutation } from '../../../services/applicationApi';
import { useGetOrderQuery } from '../../../services/orderApi';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ErrorMessage } from '../../../components/ErrorMessage';
import type { ApplicationFormData } from '../types';

const DURATION_OPTIONS = [
  '1 день',
  '2-3 дня',
  '1 неделя',
  '2 недели',
  '1 месяц',
  'Более месяца',
];

export default function CreateApplicationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ orderId: string }>();
  const orderId = parseInt(params.orderId);

  const { data: order, isLoading: orderLoading, error: orderError } = useGetOrderQuery(orderId);
  const [createApplication, { isLoading: isCreating }] = useCreateApplicationMutation();

  const [formData, setFormData] = useState<Partial<ApplicationFormData>>({
    order: orderId,
    proposed_price: undefined,
    message: '',
    estimated_duration: '',
    start_date: undefined,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);

  const updateField = <K extends keyof ApplicationFormData>(
    field: K,
    value: ApplicationFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.proposed_price || formData.proposed_price <= 0) {
      Alert.alert('Ошибка', 'Укажите предлагаемую цену');
      return;
    }
    if (!formData.message?.trim()) {
      Alert.alert('Ошибка', 'Напишите сообщение заказчику');
      return;
    }

    try {
      await createApplication({
        order: orderId,
        proposed_price: formData.proposed_price,
        message: formData.message.trim(),
        estimated_duration: formData.estimated_duration || undefined,
        start_date: formData.start_date || undefined,
      }).unwrap();

      Alert.alert('Успешно', 'Заявка отправлена', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Failed to create application:', error);
      Alert.alert(
        'Ошибка',
        error?.data?.message || 'Не удалось отправить заявку. Попробуйте снова.'
      );
    }
  };

  if (orderLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <LoadingSpinner fullScreen text="Загрузка..." />
      </SafeAreaView>
    );
  }

  if (orderError || !order) {
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
          <Text className="text-lg font-bold text-gray-900">Откликнуться</Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Order Info */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-sm text-gray-500 mb-2">Заказ</Text>
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            {order.title}
          </Text>
          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <Text className="text-sm text-gray-600 ml-1">{order.city}</Text>
          </View>
          {order.budget_display && (
            <View className="flex-row items-center mt-2">
              <Ionicons name="wallet-outline" size={16} color="#10B981" />
              <Text className="text-sm text-gray-600 ml-1">
                Бюджет: {order.budget_display}
              </Text>
            </View>
          )}
        </View>

        {/* Proposed Price */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-2">
            Ваша цена *
          </Text>
          <Text className="text-sm text-gray-500 mb-3">
            Укажите сумму, за которую готовы выполнить заказ
          </Text>
          <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3">
            <TextInput
              className="flex-1 text-lg text-gray-900"
              placeholder="0"
              value={formData.proposed_price?.toString() || ''}
              onChangeText={(text) => updateField('proposed_price', parseInt(text) || 0)}
              keyboardType="numeric"
            />
            <Text className="text-gray-500 ml-2">сом</Text>
          </View>
        </View>

        {/* Message */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-2">
            Сообщение заказчику *
          </Text>
          <Text className="text-sm text-gray-500 mb-3">
            Расскажите о своем опыте и почему вы подходите для этого заказа
          </Text>
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900"
            placeholder="Здравствуйте! Готов выполнить ваш заказ..."
            value={formData.message}
            onChangeText={(text) => updateField('message', text)}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={1000}
          />
          <Text className="text-xs text-gray-500 mt-1 text-right">
            {formData.message?.length || 0}/1000
          </Text>
        </View>

        {/* Estimated Duration */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-2">
            Срок выполнения
          </Text>
          <Text className="text-sm text-gray-500 mb-3">
            Примерное время, которое потребуется на выполнение
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {DURATION_OPTIONS.map((duration) => (
              <TouchableOpacity
                key={duration}
                className={`px-4 py-2 rounded-full border ${
                  formData.estimated_duration === duration
                    ? 'bg-blue-500 border-blue-500'
                    : 'bg-white border-gray-300'
                }`}
                onPress={() => updateField('estimated_duration', duration)}
              >
                <Text
                  className={
                    formData.estimated_duration === duration
                      ? 'text-white font-medium'
                      : 'text-gray-700'
                  }
                >
                  {duration}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Start Date */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-2">
            Дата начала работ
          </Text>
          <Text className="text-sm text-gray-500 mb-3">
            Когда вы готовы приступить к выполнению
          </Text>
          <TouchableOpacity
            className="border border-gray-300 rounded-xl px-4 py-3 flex-row items-center justify-between"
            onPress={() => setShowDatePicker(true)}
          >
            <Text className="text-base text-gray-700">
              {formData.start_date
                ? new Date(formData.start_date).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : 'Выберите дату'}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={formData.start_date ? new Date(formData.start_date) : new Date()}
              mode="date"
              minimumDate={new Date()}
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) {
                  updateField('start_date', date.toISOString());
                }
              }}
            />
          )}
        </View>

        {/* Tips */}
        <View className="bg-blue-50 rounded-2xl p-4 mb-4">
          <View className="flex-row items-start">
            <Ionicons name="bulb" size={20} color="#3B82F6" />
            <View className="ml-3 flex-1">
              <Text className="text-sm font-medium text-blue-900 mb-1">
                Советы для успешной заявки
              </Text>
              <Text className="text-sm text-blue-700">
                • Укажите реалистичную цену{'\n'}
                • Опишите свой опыт в подобных работах{'\n'}
                • Будьте вежливы и профессиональны{'\n'}
                • Отвечайте на вопросы заказчика быстро
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
              Отправить заявку
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
