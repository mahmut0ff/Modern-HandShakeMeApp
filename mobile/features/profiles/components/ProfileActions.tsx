/**
 * Profile Actions Component
 * Кнопки действий для профиля
 */

import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface ProfileActionsProps {
  userId: number;
  phone?: string | null;
  isOwnProfile?: boolean;
  onEdit?: () => void;
  onShare?: () => void;
}

export function ProfileActions({
  userId,
  phone,
  isOwnProfile = false,
  onEdit,
  onShare,
}: ProfileActionsProps) {
  const router = useRouter();

  const handleChat = () => {
    router.push(`/chat/${userId}`);
  };

  const handleCall = () => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  // Для своего профиля
  if (isOwnProfile) {
    return (
      <View className="bg-white p-4 border-t border-gray-200">
        <View className="flex-row space-x-3">
          <TouchableOpacity
            className="flex-1 bg-blue-500 rounded-xl py-3 items-center"
            onPress={onEdit}
          >
            <View className="flex-row items-center">
              <Ionicons name="create-outline" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Редактировать</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-gray-100 rounded-xl px-4 py-3 items-center"
            onPress={onShare}
          >
            <Ionicons name="share-outline" size={20} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Для чужого профиля
  return (
    <View className="bg-white p-4 border-t border-gray-200">
      <View className="flex-row space-x-3">
        <TouchableOpacity
          className="flex-1 bg-blue-500 rounded-xl py-3 items-center"
          onPress={handleChat}
        >
          <View className="flex-row items-center">
            <Ionicons name="chatbubble" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Написать</Text>
          </View>
        </TouchableOpacity>

        {phone && (
          <TouchableOpacity
            className="flex-1 bg-green-500 rounded-xl py-3 items-center"
            onPress={handleCall}
          >
            <View className="flex-row items-center">
              <Ionicons name="call" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Позвонить</Text>
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          className="bg-gray-100 rounded-xl px-4 py-3 items-center"
          onPress={onShare}
        >
          <Ionicons name="share-outline" size={20} color="#374151" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
