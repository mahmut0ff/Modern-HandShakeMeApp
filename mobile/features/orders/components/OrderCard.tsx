/**
 * Order Card Component
 * Карточка заказа для списков
 */

import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderBudgetDisplay } from './OrderBudgetDisplay';
import type { Order } from '../../../services/orderApi';
import { formatRelativeTime } from '../../../utils/format';

interface OrderCardProps {
  order: Order;
  onPress?: () => void;
  showActions?: boolean;
  onFavoriteToggle?: (orderId: number) => void;
}

export function OrderCard({ 
  order, 
  onPress,
  showActions = true,
  onFavoriteToggle,
}: OrderCardProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/orders/${order.id}`);
    }
  };

  const handleFavoritePress = (e: any) => {
    e.stopPropagation();
    onFavoriteToggle?.(order.id);
  };

  return (
    <TouchableOpacity
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-3"
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View className="p-4 border-b border-gray-100">
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1 mr-3">
            <Text className="text-lg font-bold text-gray-900 mb-1" numberOfLines={2}>
              {order.title}
            </Text>
            <View className="flex-row items-center">
              <Ionicons name="folder-outline" size={14} color="#6B7280" />
              <Text className="text-sm text-gray-600 ml-1">
                {order.category_name}
              </Text>
            </View>
          </View>
          
          {showActions && (
            <TouchableOpacity
              onPress={handleFavoritePress}
              className="p-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={order.is_favorite ? 'heart' : 'heart-outline'}
                size={24}
                color={order.is_favorite ? '#EF4444' : '#9CA3AF'}
              />
            </TouchableOpacity>
          )}
        </View>

        <OrderStatusBadge status={order.status} size="small" />
      </View>

      {/* Content */}
      <View className="p-4">
        {/* Description */}
        <Text className="text-gray-700 mb-3" numberOfLines={3}>
          {order.description}
        </Text>

        {/* Budget */}
        <View className="mb-3">
          <OrderBudgetDisplay
            budgetType={order.budget_type}
            budgetMin={order.budget_min}
            budgetMax={order.budget_max}
            size="medium"
          />
        </View>

        {/* Location & Date */}
        <View className="flex-row items-center mb-3">
          <View className="flex-row items-center flex-1">
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <Text className="text-sm text-gray-600 ml-1" numberOfLines={1}>
              {order.city}
            </Text>
          </View>
          
          {order.start_date && (
            <View className="flex-row items-center">
              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              <Text className="text-sm text-gray-600 ml-1">
                {new Date(order.start_date).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                })}
              </Text>
            </View>
          )}
        </View>

        {/* Tags */}
        <View className="flex-row flex-wrap gap-2 mb-3">
          {order.is_urgent && (
            <View className="bg-red-100 px-2 py-1 rounded-full">
              <Text className="text-xs text-red-700 font-medium">Срочно</Text>
            </View>
          )}
          {order.need_team && (
            <View className="bg-blue-100 px-2 py-1 rounded-full">
              <Text className="text-xs text-blue-700 font-medium">Нужна бригада</Text>
            </View>
          )}
          {order.required_experience && (
            <View className="bg-purple-100 px-2 py-1 rounded-full">
              <Text className="text-xs text-purple-700 font-medium">
                Опыт: {order.required_experience}
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
          {/* Client Info */}
          <View className="flex-row items-center flex-1">
            {order.client_avatar ? (
              <Image
                source={{ uri: order.client_avatar }}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <View className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center">
                <Ionicons name="person" size={16} color="#6B7280" />
              </View>
            )}
            <View className="ml-2 flex-1">
              <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>
                {order.client_name || order.client?.name}
              </Text>
              {order.client_rating && (
                <View className="flex-row items-center">
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text className="text-xs text-gray-600 ml-1">
                    {order.client_rating}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Stats */}
          <View className="flex-row items-center space-x-3">
            <View className="flex-row items-center">
              <Ionicons name="eye-outline" size={16} color="#6B7280" />
              <Text className="text-sm text-gray-600 ml-1">
                {order.views_count || 0}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="people-outline" size={16} color="#6B7280" />
              <Text className="text-sm text-gray-600 ml-1">
                {order.applications_count || 0}
              </Text>
            </View>
          </View>
        </View>

        {/* Time */}
        <Text className="text-xs text-gray-500 mt-2">
          {formatRelativeTime(order.created_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
