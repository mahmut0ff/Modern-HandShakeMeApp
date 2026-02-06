/**
 * Service Detail Screen
 * Детальная информация об услуге
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGetMasterServicesQuery } from '../../../services/servicesApi';
import { ServicePriceDisplay } from '../components/ServicePriceDisplay';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ErrorMessage } from '../../../components/ErrorMessage';

export default function ServiceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const serviceId = parseInt(id || '0', 10);

  // Note: В реальном приложении нужен отдельный endpoint для получения услуги по ID
  // Пока используем заглушку с данными из списка
  const { data: services, isLoading, error } = useGetMasterServicesQuery(0, {
    skip: true, // Пропускаем, так как нет masterId
  });

  // Заглушка для демонстрации UI
  const service = {
    id: serviceId,
    name: 'Услуга',
    description: 'Описание услуги',
    category_name: 'Категория',
    price_from: '1000',
    price_to: '5000',
    unit: 'hour' as const,
    unit_display: 'час',
    is_active: true,
    is_featured: false,
    master: 1,
    master_name: 'Мастер',
    master_rating: 4.8,
    master_reviews_count: 25,
    created_at: new Date().toISOString(),
  };

  const handleContactMaster = () => {
    router.push(`/chat/new?masterId=${service.master}`);
  };

  const handleViewMasterProfile = () => {
    router.push(`/masters/${service.master}`);
  };

  const handleBookService = () => {
    router.push(`/orders/create?serviceId=${serviceId}`);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <LoadingSpinner fullScreen text="Загрузка..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <ErrorMessage message="Не удалось загрузить услугу" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900 flex-1" numberOfLines={1}>
            {service.name}
          </Text>
          <TouchableOpacity className="p-2">
            <Ionicons name="share-outline" size={24} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Main Info */}
        <View className="bg-white p-4 mb-3">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            {service.name}
          </Text>

          {/* Category */}
          <View className="flex-row items-center mb-4">
            <Ionicons name="folder-outline" size={18} color="#6B7280" />
            <Text className="text-gray-600 ml-2">{service.category_name}</Text>
          </View>

          {/* Price */}
          <View className="bg-green-50 rounded-xl p-4 mb-4">
            <ServicePriceDisplay
              priceFrom={service.price_from}
              priceTo={service.price_to}
              unit={service.unit}
              unitDisplay={service.unit_display}
              size="large"
            />
          </View>

          {/* Featured Badge */}
          {service.is_featured && (
            <View className="flex-row items-center bg-yellow-50 rounded-xl p-3 mb-4">
              <Ionicons name="star" size={20} color="#F59E0B" />
              <Text className="text-yellow-700 font-medium ml-2">
                Рекомендуемая услуга
              </Text>
            </View>
          )}

          {/* Description */}
          {service.description && (
            <View>
              <Text className="text-base font-semibold text-gray-900 mb-2">
                Описание
              </Text>
              <Text className="text-gray-700 leading-6">
                {service.description}
              </Text>
            </View>
          )}
        </View>

        {/* Master Info */}
        <View className="bg-white p-4 mb-3">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Мастер
          </Text>

          <TouchableOpacity
            className="flex-row items-center"
            onPress={handleViewMasterProfile}
          >
            <View className="w-14 h-14 bg-blue-100 rounded-full items-center justify-center">
              <Ionicons name="person" size={28} color="#3B82F6" />
            </View>

            <View className="flex-1 ml-3">
              <Text className="text-lg font-semibold text-gray-900">
                {service.master_name}
              </Text>
              <View className="flex-row items-center mt-1">
                <Ionicons name="star" size={16} color="#F59E0B" />
                <Text className="text-gray-700 ml-1">
                  {service.master_rating} ({service.master_reviews_count} отзывов)
                </Text>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Additional Info */}
        <View className="bg-white p-4 mb-3">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Информация
          </Text>

          <View className="space-y-3">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
                <Ionicons name="time-outline" size={20} color="#6B7280" />
              </View>
              <View className="ml-3">
                <Text className="text-sm text-gray-500">Единица измерения</Text>
                <Text className="text-gray-900">{service.unit_display}</Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              </View>
              <View className="ml-3">
                <Text className="text-sm text-gray-500">Добавлено</Text>
                <Text className="text-gray-900">
                  {new Date(service.created_at).toLocaleDateString('ru-RU')}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
                <Ionicons
                  name={service.is_active ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={service.is_active ? '#10B981' : '#EF4444'}
                />
              </View>
              <View className="ml-3">
                <Text className="text-sm text-gray-500">Статус</Text>
                <Text className={service.is_active ? 'text-green-600' : 'text-red-600'}>
                  {service.is_active ? 'Активна' : 'Неактивна'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View className="bg-white border-t border-gray-200 p-4">
        <View className="flex-row space-x-3">
          <TouchableOpacity
            className="flex-1 bg-gray-100 rounded-xl py-4 items-center"
            onPress={handleContactMaster}
          >
            <View className="flex-row items-center">
              <Ionicons name="chatbubble-outline" size={20} color="#374151" />
              <Text className="text-gray-700 font-semibold ml-2">Написать</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-blue-500 rounded-xl py-4 items-center"
            onPress={handleBookService}
          >
            <View className="flex-row items-center">
              <Ionicons name="calendar" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Заказать</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
