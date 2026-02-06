/**
 * Service Card Component
 * Карточка услуги для списков
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ServicePriceDisplay } from './ServicePriceDisplay';
import type { Service } from '../../../services/servicesApi';

interface ServiceCardProps {
  service: Service;
  onPress?: () => void;
  showMaster?: boolean;
  editable?: boolean;
  onToggleStatus?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ServiceCard({
  service,
  onPress,
  showMaster = false,
  editable = false,
  onToggleStatus,
  onEdit,
  onDelete,
}: ServiceCardProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/services/${service.id}`);
    }
  };

  return (
    <TouchableOpacity
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-3"
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View className="p-4">
        {/* Header */}
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1 mr-3">
            <Text className="text-lg font-bold text-gray-900 mb-1">
              {service.name}
            </Text>
            {service.category_name && (
              <View className="flex-row items-center">
                <Ionicons name="folder-outline" size={14} color="#6B7280" />
                <Text className="text-sm text-gray-600 ml-1">
                  {service.category_name}
                </Text>
              </View>
            )}
          </View>

          {/* Status Badge */}
          <View
            className={`px-2 py-1 rounded-full ${
              service.is_active ? 'bg-green-100' : 'bg-gray-100'
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                service.is_active ? 'text-green-700' : 'text-gray-600'
              }`}
            >
              {service.is_active ? 'Активна' : 'Неактивна'}
            </Text>
          </View>
        </View>

        {/* Description */}
        {service.description && (
          <Text className="text-gray-700 mb-3" numberOfLines={2}>
            {service.description}
          </Text>
        )}

        {/* Price */}
        <ServicePriceDisplay
          priceFrom={service.price_from}
          priceTo={service.price_to}
          unit={service.unit}
          unitDisplay={service.unit_display}
        />

        {/* Featured Badge */}
        {service.is_featured && (
          <View className="flex-row items-center mt-3">
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text className="text-sm text-yellow-700 ml-1 font-medium">
              Рекомендуемая услуга
            </Text>
          </View>
        )}

        {/* Edit Actions */}
        {editable && (
          <View className="flex-row space-x-2 mt-4 pt-3 border-t border-gray-100">
            <TouchableOpacity
              className="flex-1 bg-blue-100 rounded-xl py-2.5 items-center"
              onPress={onEdit}
            >
              <View className="flex-row items-center">
                <Ionicons name="create-outline" size={18} color="#3B82F6" />
                <Text className="text-blue-700 font-medium ml-1">Изменить</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 rounded-xl py-2.5 items-center ${
                service.is_active ? 'bg-yellow-100' : 'bg-green-100'
              }`}
              onPress={onToggleStatus}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name={service.is_active ? 'pause' : 'play'}
                  size={18}
                  color={service.is_active ? '#F59E0B' : '#10B981'}
                />
                <Text
                  className={`font-medium ml-1 ${
                    service.is_active ? 'text-yellow-700' : 'text-green-700'
                  }`}
                >
                  {service.is_active ? 'Пауза' : 'Включить'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-red-100 rounded-xl px-3 py-2.5 items-center"
              onPress={onDelete}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
