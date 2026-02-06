import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { RootState } from '../../../store';
import { chatApiDirect, ChatRoom } from '../../../services/chatApi';
import { ChatListItem } from '../components/ChatListItem';
import { EmptyChatList } from '../components/EmptyChatList';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ErrorMessage } from '../../../components/ErrorMessage';

export const ChatListScreen: React.FC = () => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { accessToken, user } = useSelector((state: RootState) => state.auth);

  const loadRooms = useCallback(async () => {
    if (!accessToken) return;

    try {
      setError(null);
      const data = await chatApiDirect.getRooms(accessToken);
      setRooms(data);
    } catch (err: any) {
      setError(err.message || 'Не удалось загрузить чаты');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadRooms();
  };

  const handleRoomPress = (room: ChatRoom) => {
    router.push({
      pathname: '/(client)/chat/[id]',
      params: { id: room.id }
    });
  };

  const getUnreadCount = () => {
    return rooms.reduce((sum, room) => sum + (room.unread_count || 0), 0);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-gray-900">Сообщения</Text>
          {getUnreadCount() > 0 && (
            <View className="bg-blue-500 rounded-full px-3 py-1">
              <Text className="text-white text-sm font-semibold">
                {getUnreadCount()} новых
              </Text>
            </View>
          )}
        </View>
      </View>

      {error && <ErrorMessage message={error} onRetry={loadRooms} />}

      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ChatListItem
            room={item}
            currentUserId={user?.id?.toString() || ''}
            onPress={() => handleRoomPress(item)}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={<EmptyChatList />}
        contentContainerStyle={rooms.length === 0 ? { flex: 1 } : undefined}
      />
    </SafeAreaView>
  );
};

export default ChatListScreen;
