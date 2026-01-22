import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, FlatList, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { 
  useGetChatRoomsQuery,
  type ChatRoom 
} from '../../services/chatApi'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { ErrorMessage } from '../../components/ErrorMessage'
import { formatRelativeTime } from '../../utils/format'

export default function MasterChatPage() {
  const [searchQuery, setSearchQuery] = useState('')

  // API queries
  const { 
    data: chatRooms = [], 
    isLoading, 
    error,
    refetch 
  } = useGetChatRoomsQuery();

  const filteredChats = chatRooms.filter(chat => {
    const clientName = chat.participants?.find(p => p.user?.role === 'client')?.user?.full_name || '';
    const orderTitle = chat.order_title || chat.order?.title || '';
    
    return clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           orderTitle.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatTime = (timeString: string) => {
    return formatRelativeTime(timeString);
  }

  const renderChatRoom = ({ item }: { item: ChatRoom }) => {
    const client = item.participants?.find(p => p.user?.role === 'client');
    const clientName = client?.user?.full_name || client?.user_full_name || 'Клиент';
    const clientAvatar = client?.user?.avatar || client?.user_avatar;
    const isOnline = client?.is_online || false;
    const orderTitle = item.order_title || item.order?.title;
    const lastMessage = item.last_message?.content || 'Нет сообщений';
    const lastMessageTime = item.last_message?.created_at || item.updated_at || item.created_at;

    return (
      <TouchableOpacity
        onPress={() => router.push(`/(master)/chat/${item.id}`)}
        className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 mb-4"
      >
        <View className="flex-row items-start gap-4">
          <View className="relative">
            <View className="w-14 h-14 bg-[#0165FB] rounded-full items-center justify-center overflow-hidden">
              {clientAvatar ? (
                <Image source={{ uri: clientAvatar }} className="w-full h-full" />
              ) : (
                <Ionicons name="person" size={28} color="white" />
              )}
            </View>
            {isOnline && (
              <View className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
            )}
          </View>
          
          <View className="flex-1 min-w-0">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="font-semibold text-gray-900" numberOfLines={1}>
                {clientName}
              </Text>
              <View className="flex-row items-center gap-2">
                <Text className="text-xs text-gray-400">
                  {formatTime(lastMessageTime)}
                </Text>
                {item.unread_count > 0 && (
                  <View className="w-5 h-5 bg-[#0165FB] rounded-full items-center justify-center">
                    <Text className="text-white text-xs font-bold">
                      {item.unread_count > 9 ? '9+' : item.unread_count}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            
            {orderTitle && (
              <Text className="text-xs text-[#0165FB] mb-1" numberOfLines={1}>
                {orderTitle}
              </Text>
            )}
            
            <Text className="text-sm text-gray-600" numberOfLines={2}>
              {lastMessage}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      <ScrollView 
        className="flex-1 px-4" 
        contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="pt-4 mb-4 px-0">
          <Text className="text-2xl font-bold text-gray-900 mb-4">Чаты</Text>
          
          {/* Search */}
          <View className="relative">
            <Ionicons 
              name="search" 
              size={20} 
              color="#9CA3AF" 
              style={{ position: 'absolute', left: 16, top: 14, zIndex: 1 }}
            />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Поиск по имени или заказу..."
              className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl border border-gray-100 text-gray-900"
            />
          </View>
        </View>

        {/* Chat List */}
        {isLoading ? (
          <LoadingSpinner text="Загрузка чатов..." />
        ) : error ? (
          <ErrorMessage
            message="Не удалось загрузить чаты"
            onRetry={refetch}
          />
        ) : filteredChats.length === 0 ? (
          <View className="bg-white rounded-3xl p-8 items-center shadow-sm border border-gray-100 mt-4">
            <View className="w-20 h-20 bg-[#0165FB]/10 rounded-full items-center justify-center mb-4">
              <Ionicons name="chatbubbles" size={40} color="#0165FB" />
            </View>
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? 'Чаты не найдены' : 'Нет активных чатов'}
            </Text>
            <Text className="text-gray-500 text-center">
              {searchQuery 
                ? 'Попробуйте изменить поисковый запрос'
                : 'Чаты появятся после откликов на заказы'
              }
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredChats}
            renderItem={renderChatRoom}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Stats */}
        {!searchQuery && filteredChats.length > 0 && (
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mt-4 mb-4">
            <Text className="text-lg font-bold text-gray-900 mb-3">Статистика</Text>
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-2xl font-bold text-[#0165FB]">
                  {filteredChats.length}
                </Text>
                <Text className="text-sm text-gray-500">Всего чатов</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-green-500">
                  {filteredChats.filter(chat => {
                    const client = chat.participants?.find(p => p.user?.role === 'client');
                    return client?.is_online;
                  }).length}
                </Text>
                <Text className="text-sm text-gray-500">Онлайн</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-orange-500">
                  {filteredChats.reduce((sum, chat) => sum + (chat.unread_count || 0), 0)}
                </Text>
                <Text className="text-sm text-gray-500">Непрочитанных</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}