/**
 * Application Card Component
 * Карточка заявки для списков
 */

import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ApplicationStatusBadge } from './ApplicationStatusBadge';
import type { Application } from '../../../services/applicationApi';
import { formatRelativeTime } from '../../../utils/format';

interface ApplicationCardProps {
  application: Application;
  onPress?: () => void;
  showOrder?: boolean; // Показывать информацию о заказе (для мастеров)
  showMaster?: boolean; // Показывать информацию о мастере (для клиентов)
}

export function ApplicationCard({
  application,
  onPress,
  showOrder = false,
  showMaster = false,
}: ApplicationCardProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/applications/${application.id}`);
    }
  };

  const formatPrice = (price: string): string => {
    const num = parseFloat(price);
    return num.toLocaleString('ru-RU');
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
            {showOrder && (
              <Text className="text-lg font-bold text-gray-900 mb-1" numberOfLines={2}>
                {application.order_title}
              </Text>
            )}
            {showMaster && (
              <View className="flex-row items-center mb-2">
                {application.master_avatar ? (
                  <Image
                    source={{ uri: application.master_avatar }}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center">
                    <Ionicons name="person" size={20} color="#6B7280" />
                  </View>
                )}
                <View className="ml-2 flex-1">
                  <Text className="text-base font-semibold text-gray-900">
                    {application.master_name || application.master?.name}
                  </Text>
                  {application.master_rating && (
                    <View className="flex-row items-center">
                      <Ionicons name="star" size={12} color="#F59E0B" />
                      <Text className="text-xs text-gray-600 ml-1">
                        {application.master_rating}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
          
          <ApplicationStatusBadge status={application.status} size="small" />
        </View>
      </View>

      {/* Content */}
      <View className="p-4">
        {/* Proposed Price */}
        <View className="flex-row items-center mb-3">
          <Ionicons name="wallet-outline" size={20} color="#10B981" />
          <Text className="text-lg font-bold text-gray-900 ml-2">
            {formatPrice(application.proposed_price)} сом
          </Text>
        </View>

        {/* Message */}
        <Text className="text-gray-700 mb-3" numberOfLines={3}>
          {application.message}
        </Text>

        {/* Details */}
        <View className="flex-row flex-wrap gap-3">
          {application.estimated_duration && (
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={16} color="#6B7280" />
              <Text className="text-sm text-gray-600 ml-1">
                {application.estimated_duration}
              </Text>
            </View>
          )}

          {application.start_date && (
            <View className="flex-row items-center">
              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              <Text className="text-sm text-gray-600 ml-1">
                Начало: {new Date(application.start_date).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                })}
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View className="flex-row items-center justify-between pt-3 mt-3 border-t border-gray-100">
          <Text className="text-xs text-gray-500">
            {formatRelativeTime(application.created_at)}
          </Text>

          {application.viewed_at && application.status === 'viewed' && (
            <View className="flex-row items-center">
              <Ionicons name="eye" size={14} color="#3B82F6" />
              <Text className="text-xs text-blue-600 ml-1">
                Просмотрена {formatRelativeTime(application.viewed_at)}
              </Text>
            </View>
          )}

          {application.responded_at && (application.status === 'accepted' || application.status === 'rejected') && (
            <View className="flex-row items-center">
              <Ionicons 
                name={application.status === 'accepted' ? 'checkmark-circle' : 'close-circle'} 
                size={14} 
                color={application.status === 'accepted' ? '#10B981' : '#EF4444'} 
              />
              <Text className={`text-xs ml-1 ${
                application.status === 'accepted' ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatRelativeTime(application.responded_at)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
