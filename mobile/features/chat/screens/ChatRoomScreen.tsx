import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, FlatList, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { RootState } from '../../../store';
import { chatApi, ChatMessage, ChatRoom } from '../../../services/chatApi';
import { MessageBubble } from '../components/MessageBubble';
import { MessageInput } from '../components/MessageInput';
import { TypingIndicator } from '../components/TypingIndicator';
import { EmptyChatRoom } from '../components/EmptyChatRoom';
import { LoadingSpinner } from '../../../components/LoadingSpinner';

export const ChatRoomScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  const { accessToken, user } = useSelector((state: RootState) => state.auth);

  const loadRoom = useCallback(async () => {
    if (!accessToken || !id) return;

    try {
      const [roomData, messagesData] = await Promise.all([
        chatApi.getRoom(accessToken, id),
        chatApi.getMessages(accessToken, id)
      ]);
      setRoom(roomData);
      setMessages(messagesData.reverse());
      
      // Mark as read
      await chatApi.markRoomRead(accessToken, id);
    } catch (err: any) {
      Alert.alert('Ошибка', err.message || 'Не удалось загрузить чат');
    } finally {
      setLoading(false);
    }
  }, [accessToken, id]);

  useEffect(() => {
    loadRoom();
  }, [loadRoom]);

  const handleSend = async (text: string) => {
    if (!accessToken || !id || !text.trim()) return;

    setSending(true);
    try {
      const newMessage = await chatApi.sendMessage(accessToken, id, {
        content: text.trim(),
        replyToId: replyTo?.id
      });
      
      setMessages(prev => [...prev, newMessage]);
      setReplyTo(null);
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err: any) {
      Alert.alert('Ошибка', err.message || 'Не удалось отправить сообщение');
    } finally {
      setSending(false);
    }
  };

  const handleImageSend = async (imageUri: string) => {
    if (!accessToken || !id) return;

    setSending(true);
    try {
      const newMessage = await chatApi.sendImage(accessToken, id, imageUri);
      setMessages(prev => [...prev, newMessage]);
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err: any) {
      Alert.alert('Ошибка', err.message || 'Не удалось отправить изображение');
    } finally {
      setSending(false);
    }
  };

  const getOtherParticipant = () => {
    if (!room || !user) return null;
    return room.participants?.find(p => p.id !== user.id.toString());
  };

  const otherUser = getOtherParticipant();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900">
            {otherUser?.firstName} {otherUser?.lastName}
          </Text>
          {isTyping && (
            <Text className="text-sm text-blue-500">печатает...</Text>
          )}
        </View>

        <TouchableOpacity className="p-2">
          <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <MessageBubble
              message={item}
              isOwn={item.senderId === user?.id?.toString()}
              showAvatar={
                index === 0 || 
                messages[index - 1]?.senderId !== item.senderId
              }
              onReply={() => setReplyTo(item)}
            />
          )}
          ListEmptyComponent={<EmptyChatRoom />}
          contentContainerStyle={messages.length === 0 ? { flex: 1 } : { paddingVertical: 16 }}
          onContentSizeChange={() => {
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
        />

        {/* Typing Indicator */}
        {isTyping && <TypingIndicator />}

        {/* Message Input */}
        <MessageInput
          onSend={handleSend}
          onImageSend={handleImageSend}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          disabled={sending}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatRoomScreen;
