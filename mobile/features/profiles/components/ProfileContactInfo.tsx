/**
 * Profile Contact Info Component
 * Контактная информация профиля
 */

import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProfileContactInfoProps {
  phone?: string | null;
  city?: string;
  address?: string;
  workRadius?: number;
  workSchedule?: string;
  languages?: string[];
  showPhone?: boolean;
  showAddress?: boolean;
}

export function ProfileContactInfo({
  phone,
  city,
  address,
  workRadius,
  workSchedule,
  languages,
  showPhone = true,
  showAddress = true,
}: ProfileContactInfoProps) {
  const handleCall = () => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const hasContent = city || (showPhone && phone) || workSchedule || (languages && languages.length > 0);

  if (!hasContent) {
    return null;
  }

  return (
    <View className="bg-white p-4 border-t border-gray-200">
      <Text className="text-base font-semibold text-gray-900 mb-3">
        Контактная информация
      </Text>

      <View className="space-y-3">
        {/* Phone */}
        {showPhone && phone && (
          <TouchableOpacity
            className="flex-row items-center"
            onPress={handleCall}
          >
            <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center">
              <Ionicons name="call" size={20} color="#10B981" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-sm text-gray-500">Телефон</Text>
              <Text className="text-base text-gray-900">{phone}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}

        {/* Location */}
        {city && (
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center">
              <Ionicons name="location" size={20} color="#3B82F6" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-sm text-gray-500">Местоположение</Text>
              <Text className="text-base text-gray-900">
                {city}
                {showAddress && address && `, ${address}`}
              </Text>
              {workRadius && (
                <Text className="text-sm text-gray-500">
                  Радиус работы: {workRadius} км
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Work Schedule */}
        {workSchedule && (
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-purple-100 items-center justify-center">
              <Ionicons name="time" size={20} color="#8B5CF6" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-sm text-gray-500">График работы</Text>
              <Text className="text-base text-gray-900">{workSchedule}</Text>
            </View>
          </View>
        )}

        {/* Languages */}
        {languages && languages.length > 0 && (
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-yellow-100 items-center justify-center">
              <Ionicons name="language" size={20} color="#F59E0B" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-sm text-gray-500">Языки</Text>
              <Text className="text-base text-gray-900">
                {languages.join(', ')}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
