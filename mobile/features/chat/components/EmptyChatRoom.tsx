import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function EmptyChatRoom() {
  return (
    <View className="flex-1 items-center justify-center px-8 py-12">
      <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
        <Ionicons name="chatbubbles-outline" size={40} color="#9CA3AF" />
      </View>
      
      <Text className="text-lg font-semibold text-gray-900 mb-2 text-center">
        Начните общение
      </Text>
      
      <Text className="text-base text-gray-500 text-center">
        Отправьте первое сообщение, чтобы начать диалог
      </Text>
    </View>
  );
}
