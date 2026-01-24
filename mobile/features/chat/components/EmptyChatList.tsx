import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmptyChatListProps {
  isSearching?: boolean;
}

export function EmptyChatList({ isSearching = false }: EmptyChatListProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-12">
      <View className="w-24 h-24 bg-[#0165FB]/10 rounded-full items-center justify-center mb-6">
        <Ionicons 
          name={isSearching ? 'search' : 'chatbubbles'} 
          size={48} 
          color="#0165FB" 
        />
      </View>
      
      <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
        {isSearching ? 'Чаты не найдены' : 'Нет активных чатов'}
      </Text>
      
      <Text className="text-base text-gray-500 text-center">
        {isSearching
          ? 'Попробуйте изменить поисковый запрос'
          : 'Чаты появятся после откликов на заказы или создания проектов'
        }
      </Text>
    </View>
  );
}
