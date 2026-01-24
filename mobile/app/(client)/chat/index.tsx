import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGetChatRoomsQuery } from '../../../services/chatApi';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ErrorMessage } from '../../../components/ErrorMessage';
import { ChatListItem } from '../../../features/chat/components/ChatListItem';
import { EmptyChatList } from '../../../features/chat/components/EmptyChatList';

export default function ChatListPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const { 
    data: chatRooms = [], 
    isLoading, 
    error,
    refetch,
    isFetching
  } = useGetChatRoomsQuery(undefined, {
    pollingInterval: 30000, // Poll every 30 seconds
  });

  const filteredRooms = chatRooms.filter(room => {
    const masterName = room.participants?.find(p => p.user?.role === 'master')?.user?.full_name || '';
    const orderTitle = room.order_title || room.order?.title || '';
    const projectTitle = room.project_title || room.project?.title || '';
    
    const query = searchQuery.toLowerCase();
    return masterName.toLowerCase().includes(query) ||
           orderTitle.toLowerCase().includes(query) ||
           projectTitle.toLowerCase().includes(query);
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8F7FC]">
        <LoadingSpinner fullScreen text="Загрузка чатов..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      {/* Header */}
      <View className="px-4 pt-2 pb-4">
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
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* Chat List */}
      {error ? (
        <ErrorMessage
          message="Не удалось загрузить чаты"
          onRetry={refetch}
        />
      ) : filteredRooms.length === 0 ? (
        <EmptyChatList isSearching={!!searchQuery} />
      ) : (
        <FlatList
          data={filteredRooms}
          renderItem={({ item }) => (
            <ChatListItem
              room={item}
              currentUserRole="client"
              onPress={() => router.push(`/(client)/chat/${item.id}`)}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch}
              tintColor="#0165FB"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}