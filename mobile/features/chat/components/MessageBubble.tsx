import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatRelativeTime } from '../../../utils/format';
import type { ChatMessage } from '../../../services/chatApi';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  showAvatar: boolean;
  onReply?: (message: ChatMessage) => void;
  onEdit?: (message: ChatMessage) => void;
  onDelete?: (messageId: number) => void;
  onImagePress?: (imageUrl: string) => void;
}

export function MessageBubble({
  message,
  isOwnMessage,
  showAvatar,
  onReply,
  onEdit,
  onDelete,
  onImagePress,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);

  const handleLongPress = () => {
    if (isOwnMessage || onReply) {
      setShowActions(true);
    }
  };

  const handleReply = () => {
    setShowActions(false);
    onReply?.(message);
  };

  const handleEdit = () => {
    setShowActions(false);
    if (message.message_type === 'text') {
      onEdit?.(message);
    }
  };

  const handleDelete = () => {
    setShowActions(false);
    Alert.alert(
      'Удалить сообщение',
      'Вы уверены, что хотите удалить это сообщение?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => onDelete?.(message.id),
        },
      ]
    );
  };

  const renderReplyPreview = () => {
    if (!message.reply_to_message) return null;

    const replyMsg = message.reply_to_message;
    return (
      <View className="mb-2 p-2 bg-black/5 rounded-lg border-l-2 border-blue-500">
        <Text className={`text-xs font-medium ${isOwnMessage ? 'text-white/80' : 'text-gray-600'}`}>
          {replyMsg.sender.full_name}
        </Text>
        <Text 
          className={`text-xs ${isOwnMessage ? 'text-white/70' : 'text-gray-500'}`}
          numberOfLines={1}
        >
          {replyMsg.content || '📷 Изображение'}
        </Text>
      </View>
    );
  };

  const renderMessageContent = () => {
    switch (message.message_type) {
      case 'text':
        return (
          <Text className={`text-base ${isOwnMessage ? 'text-white' : 'text-gray-900'}`}>
            {message.content}
          </Text>
        );

      case 'image':
        return (
          <TouchableOpacity
            onPress={() => onImagePress?.(message.image_url || message.image || '')}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: message.image_url || message.image }}
              className="w-64 h-48 rounded-xl"
              resizeMode="cover"
            />
            {message.content && (
              <Text className={`mt-2 text-base ${isOwnMessage ? 'text-white' : 'text-gray-900'}`}>
                {message.content}
              </Text>
            )}
          </TouchableOpacity>
        );

      case 'file':
        return (
          <View className="flex-row items-center gap-3">
            <View className={`w-10 h-10 rounded-lg items-center justify-center ${
              isOwnMessage ? 'bg-white/20' : 'bg-blue-100'
            }`}>
              <Ionicons 
                name="document-text" 
                size={20} 
                color={isOwnMessage ? '#fff' : '#0165FB'} 
              />
            </View>
            <View className="flex-1">
              <Text 
                className={`text-sm font-medium ${isOwnMessage ? 'text-white' : 'text-gray-900'}`}
                numberOfLines={1}
              >
                {message.file_name || 'Файл'}
              </Text>
              {message.file_size && (
                <Text className={`text-xs ${isOwnMessage ? 'text-white/70' : 'text-gray-500'}`}>
                  {(message.file_size / 1024).toFixed(1)} KB
                </Text>
              )}
            </View>
            <Ionicons 
              name="download-outline" 
              size={20} 
              color={isOwnMessage ? '#fff' : '#0165FB'} 
            />
          </View>
        );

      case 'system':
        return (
          <Text className="text-sm text-gray-600 text-center italic">
            {message.content}
          </Text>
        );

      default:
        return null;
    }
  };

  if (message.message_type === 'system') {
    return (
      <View className="items-center my-2">
        <View className="bg-gray-100 px-4 py-2 rounded-full">
          {renderMessageContent()}
        </View>
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity
        onLongPress={handleLongPress}
        delayLongPress={300}
        activeOpacity={0.9}
        className={`flex-row mb-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
      >
        {/* Avatar */}
        {!isOwnMessage && (
          <View className="w-8 h-8 mr-2">
            {showAvatar && (
              <View className="w-8 h-8 bg-gray-300 rounded-full items-center justify-center overflow-hidden">
                {message.sender.avatar ? (
                  <Image 
                    source={{ uri: message.sender.avatar }} 
                    className="w-8 h-8" 
                  />
                ) : (
                  <Text className="text-xs font-medium text-gray-600">
                    {message.sender.first_name?.[0]}{message.sender.last_name?.[0]}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Message Content */}
        <View className={`max-w-[75%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
          {/* Sender Name */}
          {!isOwnMessage && showAvatar && (
            <Text className="text-xs text-gray-500 mb-1 ml-2">
              {message.sender.full_name}
            </Text>
          )}

          {/* Message Bubble */}
          <View
            className={`px-4 py-2.5 rounded-2xl ${
              isOwnMessage
                ? 'bg-blue-500 rounded-br-md'
                : 'bg-gray-100 rounded-bl-md'
            }`}
          >
            {renderReplyPreview()}
            {renderMessageContent()}
          </View>

          {/* Timestamp & Status */}
          <View className={`flex-row items-center mt-1 gap-1 ${
            isOwnMessage ? 'justify-end' : 'justify-start'
          }`}>
            <Text className="text-xs text-gray-400">
              {formatRelativeTime(message.created_at)}
            </Text>
            {message.is_edited && (
              <Text className="text-xs text-gray-400">• изменено</Text>
            )}
            {isOwnMessage && (
              <Ionicons
                name={message.is_read ? 'checkmark-done' : 'checkmark'}
                size={14}
                color={message.is_read ? '#3B82F6' : '#9CA3AF'}
              />
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Actions Modal */}
      <Modal
        visible={showActions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActions(false)}
      >
        <Pressable 
          className="flex-1 bg-black/50 justify-center items-center"
          onPress={() => setShowActions(false)}
        >
          <View className="bg-white rounded-2xl w-64 overflow-hidden">
            {onReply && (
              <TouchableOpacity
                onPress={handleReply}
                className="flex-row items-center gap-3 px-4 py-4 border-b border-gray-100"
              >
                <Ionicons name="arrow-undo" size={20} color="#0165FB" />
                <Text className="text-base text-gray-900">Ответить</Text>
              </TouchableOpacity>
            )}
            
            {isOwnMessage && message.message_type === 'text' && onEdit && (
              <TouchableOpacity
                onPress={handleEdit}
                className="flex-row items-center gap-3 px-4 py-4 border-b border-gray-100"
              >
                <Ionicons name="create-outline" size={20} color="#0165FB" />
                <Text className="text-base text-gray-900">Редактировать</Text>
              </TouchableOpacity>
            )}
            
            {isOwnMessage && onDelete && (
              <TouchableOpacity
                onPress={handleDelete}
                className="flex-row items-center gap-3 px-4 py-4"
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                <Text className="text-base text-red-500">Удалить</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              onPress={() => setShowActions(false)}
              className="flex-row items-center justify-center px-4 py-4 bg-gray-50"
            >
              <Text className="text-base text-gray-600 font-medium">Отмена</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
