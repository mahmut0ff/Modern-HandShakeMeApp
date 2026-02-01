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

export default function MasterChatPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: chatRoomsData,
    isLoading,
    error,
    refetch,
    isFetching
  } = useGetChatRoomsQuery(undefined, {
    pollingInterval: 30000,
  });

  const chatRooms: any[] = Array.isArray(chatRoomsData) ? chatRoomsData : [];

  const filteredChats = chatRooms.filter((chat: any) => {
    const clientName = chat.participants?.find((p: any) => p.user?.role === 'client')?.user?.full_name || '';
    const orderTitle = chat.order_title || chat.order?.title || '';
    const projectTitle = chat.project_title || chat.project?.title || '';

    const query = searchQuery.toLowerCase();
    return clientName.toLowerCase().includes(query) ||
      orderTitle.toLowerCase().includes(query) ||
      projectTitle.toLowerCase().includes(query);
  });

  const totalUnread = filteredChats.reduce((sum: number, chat: any) => sum + (chat.unread_count || 0), 0);
  const onlineCount = filteredChats.filter((chat: any) => {
    const client = chat.participants?.find((p: any) => p.user?.role === 'client');
    return client?.is_online;
  }).length;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8F7FC]">
        <LoadingSpinner fullScreen text="Загрузка чатов..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      <View className="px-4 pt-2 pb-4">
        <Text className="text-2xl font-bold text-gray-900 mb-4">Чаты</Text>
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

      {error ? (
        <ErrorMessage message="Не удалось загрузить чаты" onRetry={refetch} />
      ) : filteredChats.length === 0 ? (
        <EmptyChatList isSearching={!!searchQuery} />
      ) : (
        <>
          <FlatList
            data={filteredChats}
            renderItem={({ item }) => (
              <ChatListItem
                room={item}
                currentUserRole="master"
                onPress={() => router.push(`/(master)/chat/${item.id}`)}
              />
            )}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor="#0165FB" />
            }
          />

          {!searchQuery && filteredChats.length > 0 && (
            <View className="bg-white rounded-3xl p-5 mx-4 mb-4 shadow-sm border border-gray-100">
              <Text className="text-lg font-bold text-gray-900 mb-3">Статистика</Text>
              <View className="flex-row justify-between">
                <View className="items-center">
                  <Text className="text-2xl font-bold text-[#0165FB]">{filteredChats.length}</Text>
                  <Text className="text-sm text-gray-500">Всего чатов</Text>
                </View>
                <View className="items-center">
                  <Text className="text-2xl font-bold text-green-500">{onlineCount}</Text>
                  <Text className="text-sm text-gray-500">Онлайн</Text>
                </View>
                <View className="items-center">
                  <Text className="text-2xl font-bold text-orange-500">{totalUnread}</Text>
                  <Text className="text-sm text-gray-500">Непрочитанных</Text>
                </View>
              </View>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}
