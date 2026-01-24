import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatRelativeTime } from '../../../utils/format';
import type { ChatRoom } from '../../../services/chatApi';

interface ChatListItemProps {
  room: ChatRoom;
  currentUserRole: 'client' | 'master';
  onPress: () => void;
}

export function ChatListItem({ room, currentUserRole, onPress }: ChatListItemProps) {
  // Get the other participant (not current user)
  const otherParticipant = room.participants?.find(
    p => p.user?.role !== currentUserRole
  );
  
  const participantName = otherParticipant?.user?.full_name || 
                          otherParticipant?.user_full_name || 
                          'Пользователь';
  const participantAvatar = otherParticipant?.user?.avatar || 
                            otherParticipant?.user_avatar;
  const isOnline = otherParticipant?.is_online || false;
  const participantRole = otherParticipant?.user?.role || otherParticipant?.user_role;
  
  const contextTitle = room.order_title || room.order?.title || 
                       room.project_title || room.project?.title;
  
  const lastMessage = room.last_message?.content || 'Нет сообщений';
  const lastMessageTime = room.last_message?.created_at || 
                          room.updated_at || 
                          room.created_at;
  
  const getLastMessagePreview = () => {
    if (!room.last_message) return 'Нет сообщений';
    
    switch (room.last_message.message_type) {
      case 'image':
        return '📷 Изображение';
      case 'file':
        return '📎 Файл';
      case 'system':
        return room.last_message.content || 'Системное сообщение';
      default:
        return room.last_message.content || '';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 mb-3"
      activeOpacity={0.7}
    >
      <View className="flex-row items-start gap-4">
        {/* Avatar with Online Status */}
        <View className="relative">
          <View className="w-14 h-14 bg-[#0165FB] rounded-full items-center justify-center overflow-hidden">
            {participantAvatar ? (
              <Image 
                source={{ uri: participantAvatar }} 
                className="w-full h-full" 
              />
            ) : (
              <Ionicons name="person" size={28} color="white" />
            )}
          </View>
          {isOnline && (
            <View className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
          )}
        </View>

        {/* Content */}
        <View className="flex-1 min-w-0">
          {/* Header: Name & Time */}
          <View className="flex-row items-center justify-between mb-1">
            <View className="flex-row items-center gap-2 flex-1">
              <Text className="font-semibold text-gray-900" numberOfLines={1}>
                {participantName}
              </Text>
              {participantRole && (
                <View className={`px-2 py-0.5 rounded-full ${
                  participantRole === 'master' ? 'bg-blue-100' : 'bg-purple-100'
                }`}>
                  <Text className={`text-xs font-medium ${
                    participantRole === 'master' ? 'text-blue-700' : 'text-purple-700'
                  }`}>
                    {participantRole === 'master' ? 'Мастер' : 'Клиент'}
                  </Text>
                </View>
              )}
            </View>
            
            <View className="flex-row items-center gap-2">
              <Text className="text-xs text-gray-400">
                {formatRelativeTime(lastMessageTime)}
              </Text>
              {room.unread_count > 0 && (
                <View className="min-w-[20px] h-5 bg-[#0165FB] rounded-full items-center justify-center px-1.5">
                  <Text className="text-white text-xs font-bold">
                    {room.unread_count > 99 ? '99+' : room.unread_count}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Context (Order/Project) */}
          {contextTitle && (
            <Text className="text-xs text-[#0165FB] mb-1" numberOfLines={1}>
              {contextTitle}
            </Text>
          )}

          {/* Last Message */}
          <Text 
            className={`text-sm ${
              room.unread_count > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'
            }`}
            numberOfLines={2}
          >
            {getLastMessagePreview()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
