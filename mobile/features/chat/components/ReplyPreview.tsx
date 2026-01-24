import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ChatMessage } from '../../../services/chatApi';

interface ReplyPreviewProps {
  message: ChatMessage | null | undefined;
  isEditing?: boolean;
  onCancel?: () => void;
}

export function ReplyPreview({ message, isEditing = false, onCancel }: ReplyPreviewProps) {
  if (!message) return null;

  return (
    <View className="px-4 pt-3 pb-2 bg-gray-50 border-b border-gray-200">
      <View className="flex-row items-start gap-2">
        <View className="flex-1 border-l-2 border-blue-500 pl-3">
          <Text className="text-xs font-medium text-blue-600 mb-1">
            {isEditing ? 'Редактирование' : `Ответ ${message.sender.full_name}`}
          </Text>
          <Text className="text-sm text-gray-600" numberOfLines={2}>
            {message.message_type === 'text' 
              ? message.content 
              : message.message_type === 'image'
              ? '📷 Изображение'
              : '📎 Файл'
            }
          </Text>
        </View>
        
        {onCancel && (
          <TouchableOpacity
            onPress={onCancel}
            className="w-6 h-6 items-center justify-center"
          >
            <Ionicons name="close" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
