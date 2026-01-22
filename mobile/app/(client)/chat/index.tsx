import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { 
  useGetChatRoomsQuery,
  type ChatRoom 
} from '../../../services/chatApi';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ErrorMessage } from '../../../components/ErrorMessage';
import { formatRelativeTime } from '../../../utils/format';

export default function ChatListPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // API queries
  const { 
    data: chatRooms = [], 
    isLoading, 
    error,
    refetch 
  } = useGetChatRoomsQuery();

  const filteredRooms = chatRooms.filter(room => {
    const masterName = room.participants?.find(p => p.user?.role === 'master')?.user?.full_name || '';
    const orderTitle = room.order_title || room.order?.title || '';
    
    return masterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           orderTitle.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatTime = (timeString: string) => {
    return formatRelativeTime(timeString);
  };

  const renderChatRoom = ({ item }: { item: ChatRoom }) => {
    const master = item.participants?.find(p => p.user?.role === 'master');
    const masterName = master?.user?.full_name || master?.user_full_name || 'Мастер';
    const masterAvatar = master?.user?.avatar || master?.user_avatar;
    const isOnline = master?.is_online || false;
    const orderTitle = item.order_title || item.order?.title;
    const lastMessage = item.last_message?.content || 'Нет сообщений';
    const lastMessageTime = item.last_message?.created_at || item.updated_at || item.created_at;

    return (
      <TouchableOpacity
        onPress={() => router.push(`/(client)/chat/${item.id}`)}
        className="flex-row items-center gap-4 p-4 bg-white rounded-2xl mb-2 shadow-sm border border-gray-100"
      >
        <View className="relative">
          <View className="w-12 h-12 bg-[#0165FB] rounded-full items-center justify-center overflow-hidden">
            {masterAvatar ? (
              <Image source={{ uri: masterAvatar }} className="w-full h-full" />
            ) : (
              <Ionicons name="person" size={24} color="white" />
            )}
          </View>
          {isOnline && (
            <View className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
          )}
        </View>

        <View className="flex-1 min-w-0">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="font-semibold text-gray-900" numberOfLines={1}>
              {masterName}
            </Text>
            <Text className="text-xs text-gray-400">
              {formatTime(lastMessageTime)}
            </Text>
          </View>
          
          {orderTitle && (
            <Text className="text-xs text-[#0165FB] mb-1" numberOfLines={1}>
              {orderTitle}
            </Text>
          )}
          
          <View className="flex-row items-center justify-between">
            <Text 
              className={`text-sm flex-1 ${item.unread_count > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}
              numberOfLines={1}
            >
              {lastMessage}
            </Text>
            
            {item.unread_count > 0 && (
              <View className="w-5 h-5 bg-[#0165FB] rounded-full items-center justify-center ml-2">
                <Text className="text-white text-xs font-bold">
                  {item.unread_count > 9 ? '9+' : item.unread_count}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      <View className="px-4">
        {/* Header */}
        <View className="flex-row items-center gap-4 mb-6">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 bg-white rounded-2xl items-center justify-center shadow-sm border border-gray-100"
          >
            <Ionicons name="arrow-back" size={20} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">Чаты</Text>
        </View>

        {/* Search */}
        <View className="relative mb-4">
          <Ionicons 
            name="search" 
            size={20} 
            color="#9CA3AF" 
            style={{ position: 'absolute', left: 16, top: 12, zIndex: 1 }}
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Поиск чатов..."
            className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl border border-gray-100 text-gray-900"
          />
        </View>
      </View>

      {/* Chat List */}
      <View className="flex-1 px-4">
        {isLoading ? (
          <LoadingSpinner text="Загрузка чатов..." />
        ) : error ? (
          <ErrorMessage
            message="Не удалось загрузить чаты"
            onRetry={refetch}
          />
        ) : filteredRooms.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <View className="w-20 h-20 bg-[#0165FB]/10 rounded-full items-center justify-center mb-4">
              <Ionicons name="chatbubbles" size={40} color="#0165FB" />
            </View>
            <Text className="text-lg font-semibold text-gray-900 mb-2">Нет чатов</Text>
            <Text className="text-gray-500 text-center">
              {searchQuery ? 'Чаты не найдены' : 'Начните общение с мастерами или клиентами'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredRooms}
            renderItem={renderChatRoom}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}