import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  Image,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { 
  useGetChatRoomQuery,
  useGetChatMessagesQuery,
  useSendMessageMutation,
  useSendImageMessageMutation,
  useSendFileMessageMutation,
  useEditMessageMutation,
  useDeleteMessageMutation,
  useMarkMessageReadMutation,
  useSetTypingMutation,
  type ChatMessage
} from '../../../services/chatApi';
import { useChatRoom } from '../../../hooks/useWebSocket';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ErrorMessage } from '../../../components/ErrorMessage';
import { useAppSelector } from '../../../hooks/redux';
import { MessageBubble } from '../../../features/chat/components/MessageBubble';
import { MessageInput } from '../../../features/chat/components/MessageInput';
import { TypingIndicator } from '../../../features/chat/components/TypingIndicator';
import { EmptyChatRoom } from '../../../features/chat/components/EmptyChatRoom';
import { ImageViewer } from '../../../features/chat/components/ImageViewer';

export default function ChatRoomPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = parseInt(id);
  const { user } = useAppSelector(state => state.auth);
  
  const [message, setMessage] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);

  // API queries
  const { 
    data: room, 
    isLoading: roomLoading, 
    error: roomError 
  } = useGetChatRoomQuery(roomId);

  const { 
    data: messagesData, 
    isLoading: messagesLoading,
    refetch: refetchMessages 
  } = useGetChatMessagesQuery({ roomId, page_size: 100 });

  // Mutations
  const [sendMessageMutation] = useSendMessageMutation();
  const [sendImageMessage] = useSendImageMessageMutation();
  const [sendFileMessage] = useSendFileMessageMutation();
  const [editMessage] = useEditMessageMutation();
  const [deleteMessage] = useDeleteMessageMutation();
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
  const allMessages = [...messages, ...realtimeMessages]
    .filter((msg, index, self) => 
      index === self.findIndex(m => m.id === msg.id)
    )
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  useEffect(() => {
    // Mark messages as read
    const unreadMessages = allMessages.filter(msg => 
      !msg.is_read && msg.sender.id !== user?.id
    );
    
    unreadMessages.forEach(msg => {
      markMessageRead({ messageId: msg.id, roomId });
      markRead(msg.id);
    });
  }, [allMessages.length, user?.id]);

  useEffect(() => {
    // Scroll to bottom on new messages
    if (allMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [allMessages.length]);

  const handleSendMessage = async () => {
    if (!message.trim() && !editingMessage) return;

    const messageText = message.trim();
    
    if (editingMessage) {
      // Edit existing message
      try {
        await editMessage({
          id: editingMessage.id,
          content: messageText,
          roomId
        }).unwrap();
        setMessage('');
        setEditingMessage(null);
      } catch (error) {
        console.error('Failed to edit message:', error);
        Alert.alert('Ошибка', 'Не удалось изменить сообщение');
      }
    } else {
      // Send new message
      setMessage('');
      const replyToId = replyTo?.id;
      setReplyTo(null);
      
      try {
        await sendMessageMutation({
          room: roomId,
          message_type: 'text',
          content: messageText,
          reply_to: replyToId
        }).unwrap();

        sendRealtimeMessage(messageText, replyToId);
      } catch (error) {
        console.error('Failed to send message:', error);
        Alert.alert('Ошибка', 'Не удалось отправить сообщение');
        setMessage(messageText);
      }
    }
  };

  const handleImagePick = async (uri: string, type: string, name: string) => {
    setUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append('image', {
        uri,
        type,
        name,
      } as any);

      if (replyTo) {
        formData.append('reply_to', replyTo.id.toString());
      }

      await sendImageMessage({ roomId, image: formData, reply_to: replyTo?.id }).unwrap();
      setReplyTo(null);
    } catch (error) {
      console.error('Failed to send image:', error);
      Alert.alert('Ошибка', 'Не удалось отправить изображение');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleFilePick = async (uri: string, type: string, name: string, size: number) => {
    setUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri,
        type,
        name,
      } as any);

      if (replyTo) {
        formData.append('reply_to', replyTo.id.toString());
      }

      await sendFileMessage({ roomId, file: formData, reply_to: replyTo?.id }).unwrap();
      setReplyTo(null);
    } catch (error) {
      console.error('Failed to send file:', error);
      Alert.alert('Ошибка', 'Не удалось отправить файл');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleTyping = (isTyping: boolean) => {
    updateTyping(isTyping);
    setTypingStatus({ roomId, isTyping });
  };

  const handleReply = (msg: ChatMessage) => {
    setReplyTo(msg);
    setEditingMessage(null);
  };

  const handleEdit = (msg: ChatMessage) => {
    setMessage(msg.content || '');
    setEditingMessage(msg);
    setReplyTo(null);
  };

  const handleDelete = async (messageId: number) => {
    try {
      await deleteMessage({ id: messageId, roomId }).unwrap();
    } catch (error) {
      console.error('Failed to delete message:', error);
      Alert.alert('Ошибка', 'Не удалось удалить сообщение');
    }
  };

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isOwnMessage = item.sender.id === user?.id;
    const showAvatar = !isOwnMessage && (
      index === 0 || 
      allMessages[index - 1]?.sender.id !== item.sender.id
    );

    return (
      <MessageBubble
        message={item}
        isOwnMessage={isOwnMessage}
        showAvatar={showAvatar}
        onReply={handleReply}
        onEdit={isOwnMessage ? handleEdit : undefined}
        onDelete={isOwnMessage ? handleDelete : undefined}
        onImagePress={setSelectedImage}
      />
    );
  };

  if (roomLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <LoadingSpinner fullScreen text="Загрузка чата..." />
      </SafeAreaView>
    );
  }

  if (roomError) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <ErrorMessage
          fullScreen
          message="Не удалось загрузить чат"
          onRetry={() => router.back()}
          retryText="Назад"
        />
      </SafeAreaView>
    );
  }

  const otherParticipant = room?.participants?.find(p => p.user?.role !== 'client');
  const participantName = otherParticipant?.user?.full_name || 'Пользователь';
  const participantAvatar = otherParticipant?.user?.avatar;
  const isParticipantOnline = otherParticipant?.is_online || false;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        className="flex-1" 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View className="flex-row items-center gap-3 px-4 py-3 border-b border-gray-100">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>

          <View className="relative">
            <View className="w-10 h-10 bg-[#0165FB] rounded-full items-center justify-center overflow-hidden">
              {participantAvatar ? (
                <Image source={{ uri: participantAvatar }} className="w-10 h-10" />
              ) : (
                <Ionicons name="person" size={20} color="white" />
              )}
            </View>
            {isParticipantOnline && (
              <View className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            )}
          </View>
          
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900">
              {participantName}
            </Text>
            {room?.order_title || room?.project_title ? (
              <Text className="text-xs text-[#0165FB]" numberOfLines={1}>
                {room.order_title || room.project_title}
              </Text>
            ) : (
              <View className="flex-row items-center gap-1">
                {!isConnected && (
                  <View className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                )}
                <Text className="text-xs text-gray-500">
                  {typingUsers.length > 0 
                    ? 'печатает...'
                    : isConnected ? 'В сети' : 'Не в сети'
                  }
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Messages */}
        {messagesLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#0165FB" />
          </View>
        ) : allMessages.length === 0 ? (
          <EmptyChatRoom />
        ) : (
          <FlatList
            ref={flatListRef}
            data={allMessages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListFooterComponent={
              typingUsers.length > 0 ? <TypingIndicator users={typingUsers} /> : null
            }
          />
        )}

        {/* Upload Progress */}
        {uploadingMedia && (
          <View className="px-4 py-2 bg-blue-50 border-t border-blue-100">
            <View className="flex-row items-center gap-2">
              <ActivityIndicator size="small" color="#0165FB" />
              <Text className="text-sm text-blue-600">Отправка...</Text>
            </View>
          </View>
        )}

        {/* Input */}
        <MessageInput
          value={message}
          onChangeText={setMessage}
          onSend={handleSendMessage}
          onImagePick={handleImagePick}
          onFilePick={handleFilePick}
          onTyping={handleTyping}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          editingMessage={editingMessage}
          onCancelEdit={() => {
            setEditingMessage(null);
            setMessage('');
          }}
          disabled={uploadingMedia}
        />
      </KeyboardAvoidingView>

      {/* Image Viewer */}
      <ImageViewer
        visible={!!selectedImage}
        imageUrl={selectedImage || ''}
        onClose={() => setSelectedImage(null)}
      />
    </SafeAreaView>
  );
}