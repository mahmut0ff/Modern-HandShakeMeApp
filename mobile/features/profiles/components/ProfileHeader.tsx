/**
 * Profile Header Component
 * Шапка профиля с аватаром и основной информацией
 */

import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProfileHeaderProps {
  name: string;
  avatar?: string | null;
  rating?: string;
  reviewsCount?: number;
  isVerified?: boolean;
  isPremium?: boolean;
  isAvailable?: boolean;
  subtitle?: string;
  onAvatarPress?: () => void;
  editable?: boolean;
}

export function ProfileHeader({
  name,
  avatar,
  rating,
  reviewsCount,
  isVerified,
  isPremium,
  isAvailable,
  subtitle,
  onAvatarPress,
  editable = false,
}: ProfileHeaderProps) {
  return (
    <View className="bg-white p-4 items-center">
      {/* Avatar */}
      <TouchableOpacity
        onPress={onAvatarPress}
        disabled={!editable && !onAvatarPress}
        className="relative mb-3"
      >
        {avatar ? (
          <Image
            source={{ uri: avatar }}
            className="w-24 h-24 rounded-full"
          />
        ) : (
          <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center">
            <Ionicons name="person" size={48} color="#6B7280" />
          </View>
        )}

        {/* Edit Badge */}
        {editable && (
          <View className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2">
            <Ionicons name="camera" size={16} color="white" />
          </View>
        )}

        {/* Verification Badge */}
        {isVerified && (
          <View className="absolute top-0 right-0 bg-green-500 rounded-full p-1">
            <Ionicons name="checkmark" size={14} color="white" />
          </View>
        )}
      </TouchableOpacity>

      {/* Name */}
      <View className="flex-row items-center mb-1">
        <Text className="text-xl font-bold text-gray-900">{name}</Text>
        {isPremium && (
          <View className="ml-2 bg-yellow-100 px-2 py-0.5 rounded-full">
            <Text className="text-xs text-yellow-700 font-medium">PRO</Text>
          </View>
        )}
      </View>

      {/* Subtitle */}
      {subtitle && (
        <Text className="text-sm text-gray-600 mb-2">{subtitle}</Text>
      )}

      {/* Rating */}
      {rating && (
        <View className="flex-row items-center mb-2">
          <Ionicons name="star" size={18} color="#F59E0B" />
          <Text className="text-base font-semibold text-gray-900 ml-1">
            {rating}
          </Text>
          {reviewsCount !== undefined && (
            <Text className="text-sm text-gray-500 ml-1">
              ({reviewsCount} отзывов)
            </Text>
          )}
        </View>
      )}

      {/* Availability Status */}
      {isAvailable !== undefined && (
        <View
          className={`flex-row items-center px-3 py-1.5 rounded-full ${
            isAvailable ? 'bg-green-100' : 'bg-gray-100'
          }`}
        >
          <View
            className={`w-2 h-2 rounded-full mr-2 ${
              isAvailable ? 'bg-green-500' : 'bg-gray-400'
            }`}
          />
          <Text
            className={`text-sm font-medium ${
              isAvailable ? 'text-green-700' : 'text-gray-600'
            }`}
          >
            {isAvailable ? 'Доступен для заказов' : 'Не принимает заказы'}
          </Text>
        </View>
      )}
    </View>
  );
}
