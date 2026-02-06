/**
 * Order Detail Screen
 * Детальная информация о заказе
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGetOrderQuery } from '../../../services/orderApi';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { OrderBudgetDisplay } from '../components/OrderBudgetDisplay';
import { OrderFilesList } from '../components/OrderFilesList';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ErrorMessage } from '../../../components/ErrorMessage';
import { useOrderActions } from '../hooks/useOrderActions';
import { formatRelativeTime } from '../../../utils/format';

export default function OrderDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const orderId = parseInt(params.id);

  const { data: order, isLoading, error, refetch } = useGetOrderQuery(orderId);
  const { toggleFavorite, confirmDelete } = useOrderActions();

  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Заказ: ${order?.title}\n\n${order?.description}\n\nБюджет: ${order?.budget_display}`,
        title: order?.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCallClient = () => {
    if (order?.client_phone) {
      Linking.openURL(`tel:${order.client_phone}`);
    }
  };

  const handleChatWithClient = () => {
    router.push(`/chat/${order?.client?.id}`);
  };

  const handleApply = () => {
    router.push(`/applications/create?orderId=${orderId}`);
  };

  const handleEdit = () => {
    router.push(`/orders/${orderId}/edit`);
  };

  const handleDelete = () => {
    confirmDelete(orderId, () => {
      router.back();
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <LoadingSpinner fullScreen text="Загрузка заказа..." />
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <ErrorMessage
          message="Не удалось загрузить заказ"
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  const isMyOrder = false; // TODO: Check if current user is order owner
  const canApply = order.status === 'active' && !order.has_applied && !isMyOrder;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          
          <View className="flex-row items-center space-x-2">
            <TouchableOpacity onPress={handleShare} className="p-2">
              <Ionicons name="share-outline" size={24} color="#374151" />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => toggleFavorite(orderId, order.is_favorite || false)}
              className="p-2"
            >
              <Ionicons
                name={order.is_favorite ? 'heart' : 'heart-outline'}
                size={24}
                color={order.is_favorite ? '#EF4444' : '#374151'}
              />
            </TouchableOpacity>

            {isMyOrder && (
              <TouchableOpacity onPress={handleEdit} className="p-2">
                <Ionicons name="create-outline" size={24} color="#374151" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Main Info */}
        <View className="bg-white p-4 border-b border-gray-200">
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1 mr-3">
              <Text className="text-2xl font-bold text-gray-900 mb-2">
                {order.title}
              </Text>
              <OrderStatusBadge status={order.status} size="medium" />
            </View>
          </View>

          {/* Category & Skills */}
          <View className="flex-row flex-wrap gap-2 mb-3">
            <View className="bg-blue-100 px-3 py-1.5 rounded-full">
              <Text className="text-blue-700 font-medium">
                {order.category_name}
              </Text>
            </View>
            {order.skills_list?.map((skill) => (
              <View key={skill.id} className="bg-gray-100 px-3 py-1.5 rounded-full">
                <Text className="text-gray-700">{skill.name}</Text>
              </View>
            ))}
          </View>

          {/* Tags */}
          <View className="flex-row flex-wrap gap-2">
            {order.is_urgent && (
              <View className="flex-row items-center bg-red-100 px-3 py-1.5 rounded-full">
                <Ionicons name="flash" size={14} color="#EF4444" />
                <Text className="text-red-700 font-medium ml-1">Срочно</Text>
              </View>
            )}
            {order.need_team && (
              <View className="flex-row items-center bg-purple-100 px-3 py-1.5 rounded-full">
                <Ionicons name="people" size={14} color="#8B5CF6" />
                <Text className="text-purple-700 font-medium ml-1">Нужна бригада</Text>
              </View>
            )}
          </View>
        </View>

        {/* Budget */}
        <View className="bg-white p-4 border-b border-gray-200">
          <Text className="text-base font-semibold text-gray-900 mb-2">Бюджет</Text>
          <OrderBudgetDisplay
            budgetType={order.budget_type}
            budgetMin={order.budget_min}
            budgetMax={order.budget_max}
            size="large"
          />
        </View>

        {/* Description */}
        <View className="bg-white p-4 border-b border-gray-200">
          <Text className="text-base font-semibold text-gray-900 mb-2">
            Описание
          </Text>
          <Text
            className="text-gray-700 leading-6"
            numberOfLines={isDescriptionExpanded ? undefined : 5}
          >
            {order.description}
          </Text>
          {order.description.length > 200 && (
            <TouchableOpacity
              onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              className="mt-2"
            >
              <Text className="text-blue-600 font-medium">
                {isDescriptionExpanded ? 'Свернуть' : 'Показать полностью'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Location & Dates */}
        <View className="bg-white p-4 border-b border-gray-200">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Местоположение и сроки
          </Text>
          
          <View className="space-y-3">
            <View className="flex-row items-center">
              <Ionicons name="location" size={20} color="#3B82F6" />
              <Text className="text-gray-700 ml-2 flex-1">
                {order.city}
                {order.address && !order.hide_address && `, ${order.address}`}
              </Text>
            </View>

            {order.start_date && (
              <View className="flex-row items-center">
                <Ionicons name="calendar" size={20} color="#10B981" />
                <Text className="text-gray-700 ml-2">
                  Начало: {new Date(order.start_date).toLocaleDateString('ru-RU')}
                </Text>
              </View>
            )}

            {order.end_date && (
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={20} color="#F59E0B" />
                <Text className="text-gray-700 ml-2">
                  Окончание: {new Date(order.end_date).toLocaleDateString('ru-RU')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Additional Requirements */}
        {order.additional_requirements && (
          <View className="bg-white p-4 border-b border-gray-200">
            <Text className="text-base font-semibold text-gray-900 mb-2">
              Дополнительные требования
            </Text>
            <Text className="text-gray-700">{order.additional_requirements}</Text>
          </View>
        )}

        {/* Files */}
        {order.files && order.files.length > 0 && (
          <View className="bg-white p-4 border-b border-gray-200">
            <OrderFilesList files={order.files} />
          </View>
        )}

        {/* Client Info */}
        <View className="bg-white p-4 border-b border-gray-200">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Заказчик
          </Text>
          
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center">
                <Ionicons name="person" size={24} color="#6B7280" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-base font-semibold text-gray-900">
                  {order.client_name || order.client?.name}
                </Text>
                {order.client_rating && (
                  <View className="flex-row items-center mt-1">
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text className="text-sm text-gray-600 ml-1">
                      {order.client_rating}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {!isMyOrder && (
              <View className="flex-row space-x-2">
                <TouchableOpacity
                  onPress={handleChatWithClient}
                  className="bg-blue-100 p-3 rounded-full"
                >
                  <Ionicons name="chatbubble" size={20} color="#3B82F6" />
                </TouchableOpacity>
                
                {order.client_phone && (
                  <TouchableOpacity
                    onPress={handleCallClient}
                    className="bg-green-100 p-3 rounded-full"
                  >
                    <Ionicons name="call" size={20} color="#10B981" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Stats */}
        <View className="bg-white p-4">
          <View className="flex-row items-center justify-around">
            <View className="items-center">
              <Ionicons name="eye-outline" size={24} color="#6B7280" />
              <Text className="text-gray-900 font-semibold mt-1">
                {order.views_count || 0}
              </Text>
              <Text className="text-xs text-gray-600">Просмотров</Text>
            </View>

            <View className="items-center">
              <Ionicons name="people-outline" size={24} color="#6B7280" />
              <Text className="text-gray-900 font-semibold mt-1">
                {order.applications_count || 0}
              </Text>
              <Text className="text-xs text-gray-600">Откликов</Text>
            </View>

            <View className="items-center">
              <Ionicons name="time-outline" size={24} color="#6B7280" />
              <Text className="text-gray-900 font-semibold mt-1">
                {formatRelativeTime(order.created_at)}
              </Text>
              <Text className="text-xs text-gray-600">Опубликован</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View className="bg-white border-t border-gray-200 p-4">
        {canApply && (
          <TouchableOpacity
            onPress={handleApply}
            className="bg-blue-500 rounded-xl py-4 items-center"
          >
            <Text className="text-white font-semibold text-base">
              Откликнуться на заказ
            </Text>
          </TouchableOpacity>
        )}

        {isMyOrder && order.status === 'draft' && (
          <View className="flex-row space-x-3">
            <TouchableOpacity
              onPress={handleEdit}
              className="flex-1 bg-blue-500 rounded-xl py-4 items-center"
            >
              <Text className="text-white font-semibold text-base">
                Редактировать
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDelete}
              className="bg-red-500 rounded-xl px-6 py-4 items-center"
            >
              <Ionicons name="trash-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>
        )}

        {order.has_applied && (
          <View className="bg-green-100 rounded-xl p-4 items-center">
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text className="text-green-700 font-medium ml-2">
                Вы уже откликнулись на этот заказ
              </Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
