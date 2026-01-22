import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { 
  useGetChatRoomQuery,
  useGetChatMessagesQuery,
  useSendMessageMutation,
  useSendImageMessageMutation,
  useMarkMessageReadMutation,
  useSetTypingMutation
} from '../../../services/chatApi';
import { useChatRoom } from '../../../hooks/useWebSocket';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ErrorMessage } from '../../../components/ErrorMessage';
import { formatRelativeTime } from '../../../utils/format';
import { useAppSelector } from '../../../hooks/redux';

export default function ChatRoomPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = parseInt(id);
  const { user } = useAppSelector(state => state.auth);
  
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // API queries
  const { 
    data: room, 
    isLoading: roomLoading, 
    error: roomError 
  } = useGetChatRoomQuery(roomId);

  const { 
    data: messagesData, 
    isLoading: messagesLoading, 
    error: messagesError,
    refetch: refetchMessages 
  } = useGetChatMessagesQuery({ roomId, page_size: 50 });

  // Mutations
  const [sendMessage, { isLoading: sendingMessage }] = useSendMessageMutation();
  const [sendImageMessage] = useSendImageMessageMutation();
  const [markMessageRead] = useMarkMessageReadMutation();
  const [setTypingStatus] = useSetTypingMutation();

  // WebSocket integration
  const { 
    messages: realtimeMessages, 
    typingUsers, 
    sendMessage: sendRealtimeMessage,
    markRead,
    updateTyping,
    isConnected 
  } = useChatRoom(roomId);

  const messages = messagesData?.results || [];
  const allMessages = [...messages, ...realtimeMessages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  useEffect(() => {
    // Mark messages as read when entering the room
    const unreadMessages = allMessages.filter(msg => 
      !msg.is_read && msg.sender.id !== user?.id
    );
    
    unreadMessages.forEach(msg => {
      markMessageRead(msg.id);
      markRead(msg.id);
    });
  }, [allMessages, user?.id]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [allMessages.length]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const messageText = message.trim();
    setMessage('');
    
    try {
      // Send via API
      await sendMessage({
        room: roomId,
        message_type: 'text',
        content: messageText
      }).unwrap();

      // Also send via WebSocket for real-time delivery
      sendRealtimeMessage(messageText);
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Ошибка', 'Не удалось отправить сообщение');
      setMessage(messageText); // Restore message on error
    }
  };

  const handleImagePicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      try {
        const formData = new FormData();
        formData.append('image', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: 'chat-image.jpg',
        } as any);

        await sendImageMessage({ roomId, image: formData }).unwrap();
      } catch (error) {
        console.error('Failed to send image:', error);
        Alert.alert('Ошибка', 'Не удалось отправить изображение');
      }
    }
  };

  const handleTyping = (text: string) => {
    setMessage(text);
    
    if (!isTyping && text.length > 0) {
      setIsTyping(true);
      updateTyping(true);
      setTypingStatus({ roomId, isTyping: true });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        updateTyping(false);
        setTypingStatus({ roomId, isTyping: false });
      }
    }, 2000);
  };

  const renderMessage = (msg: any, index: number) => {
    const isOwnMessage = msg.sender.id === user?.id;
    const showAvatar = !isOwnMessage && (
      index === 0 || 
      allMessages[index - 1]?.sender.id !== msg.sender.id
    );

    return (
      <View
        key={msg.id}
        className={`flex-row mb-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
      >
        {!isOwnMessage && (
          <View className="w-8 h-8 mr-2">
            {showAvatar && (
              <View className="w-8 h-8 bg-gray-300 rounded-full items-center justify-center">
                {msg.sender.avatar ? (
                  <Image source={{ uri: msg.sender.avatar }} className="w-8 h-8 rounded-full" />
                ) : (
                  <Text className="text-xs font-medium text-gray-600">
                    {msg.sender.first_name?.[0]}{msg.sender.last_name?.[0]}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}
        
        <View className={`max-w-[75%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
          {!isOwnMessage && showAvatar && (
            <Text className="text-xs text-gray-500 mb-1 ml-2">
              {msg.sender.full_name || `${msg.sender.first_name} ${msg.sender.last_name}`}
            </Text>
          )}
          
          <View
            className={`px-4 py-2 rounded-2xl ${
              isOwnMessage
                ? 'bg-blue-500 rounded-br-md'
                : 'bg-gray-100 rounded-bl-md'
            }`}
          >
            {msg.message_type === 'text' && (
              <Text className={`${isOwnMessage ? 'text-white' : 'text-gray-900'}`}>
                {msg.content}
              </Text>
            )}
            
            {msg.message_type === 'image' && (
              <View>
                <Image 
                  source={{ uri: msg.image_url }} 
                  className="w-48 h-32 rounded-xl mb-2"
                  resizeMode="cover"
                />
                {msg.content && (
                  <Text className={`${isOwnMessage ? 'text-white' : 'text-gray-900'}`}>
                    {msg.content}
                  </Text>
                )}
              </View>
            )}
          </View>
          
          <View className={`flex-row items-center mt-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            <Text className="text-xs text-gray-400 mr-1">
              {formatRelativeTime(msg.created_at)}
            </Text>
            {isOwnMessage && (
              <Ionicons 
                name={msg.is_read ? 'checkmark-done' : 'checkmark'} 
                size={12} 
                color={msg.is_read ? '#3B82F6' : '#9CA3AF'} 
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  if (roomLoading) {
    return <LoadingSpinner fullScreen text="Загрузка чата..." />;
  }

  if (roomError) {
    return (
      <ErrorMessage
        fullScreen
        message="Не удалось загрузить чат"
        onRetry={() => router.back()}
        retryText="Назад"
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        className="flex-1" 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View className="flex-row items-center gap-4 px-4 py-3 border-b border-gray-100">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-900">
              {room?.order_title || room?.project_title || 'Чат'}
            </Text>
            <View className="flex-row items-center gap-2">
              {!isConnected && (
                <View className="w-2 h-2 bg-red-500 rounded-full" />
              )}
              <Text className="text-sm text-gray-500">
                {typingUsers.length > 0 
                  ? `${typingUsers.map(u => u.first_name).join(', ')} печатает...`
                  : isConnected ? 'В сети' : 'Не в сети'
                }
              </Text>
            </View>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4 py-4"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messagesLoading ? (
            <LoadingSpinner text="Загрузка сообщений..." />
          ) : allMessages.length === 0 ? (
            <View className="flex-1 items-center justify-center py-12">
              <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="chatbubbles-outline" size={32} color="#9CA3AF" />
              </View>
              <Text className="text-gray-500 text-center">
                Начните общение с отправки первого сообщения
              </Text>
            </View>
          ) : (
            allMessages.map((msg, index) => renderMessage(msg, index))
          )}
        </ScrollView>

        {/* Input */}
        <View className="flex-row items-end gap-3 px-4 py-3 border-t border-gray-100">
          <TouchableOpacity
            onPress={handleImagePicker}
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
          >
            <Ionicons name="image" size={20} color="#6B7280" />
          </TouchableOpacity>
          
          <View className="flex-1 max-h-24 bg-gray-100 rounded-2xl px-4 py-2">
            <TextInput
              value={message}
              onChangeText={handleTyping}
              placeholder="Напишите сообщение..."
              multiline
              className="text-gray-900 text-base"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!message.trim() || sendingMessage}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              message.trim() && !sendingMessage ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          >
            <Ionicons 
              name="send" 
              size={18} 
              color="white" 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}