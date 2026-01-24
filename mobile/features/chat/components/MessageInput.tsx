import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import type { ChatMessage } from '../../../services/chatApi';
import { ReplyPreview } from './ReplyPreview';

interface MessageInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onImagePick: (uri: string, type: string, name: string) => void;
  onFilePick: (uri: string, type: string, name: string, size: number) => void;
  onTyping: (isTyping: boolean) => void;
  replyTo?: ChatMessage | null;
  onCancelReply?: () => void;
  editingMessage?: ChatMessage | null;
  onCancelEdit?: () => void;
  disabled?: boolean;
}

export function MessageInput({
  value,
  onChangeText,
  onSend,
  onImagePick,
  onFilePick,
  onTyping,
  replyTo,
  onCancelReply,
  editingMessage,
  onCancelEdit,
  disabled = false,
}: MessageInputProps) {
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (editingMessage) {
      inputRef.current?.focus();
    }
  }, [editingMessage]);

  const handleTextChange = (text: string) => {
    onChangeText(text);

    // Typing indicator logic
    if (!isTyping && text.length > 0) {
      setIsTyping(true);
      onTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        onTyping(false);
      }
    }, 2000);
  };

  const handleSend = () => {
    if (value.trim()) {
      onSend();
      setIsTyping(false);
      onTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleImagePick = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Требуется разрешение',
          'Пожалуйста, разрешите доступ к галерее в настройках'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        onImagePick(
          asset.uri,
          asset.type || 'image/jpeg',
          asset.fileName || `image-${Date.now()}.jpg`
        );
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Ошибка', 'Не удалось выбрать изображение');
    }
  };

  const handleCameraPick = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Требуется разрешение',
          'Пожалуйста, разрешите доступ к камере в настройках'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        onImagePick(
          asset.uri,
          'image/jpeg',
          `photo-${Date.now()}.jpg`
        );
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Ошибка', 'Не удалось сделать фото');
    }
  };

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        
        // Check file size (max 10MB)
        if (file.size && file.size > 10 * 1024 * 1024) {
          Alert.alert('Ошибка', 'Размер файла не должен превышать 10 МБ');
          return;
        }

        onFilePick(
          file.uri,
          file.mimeType || 'application/octet-stream',
          file.name,
          file.size || 0
        );
      }
    } catch (error) {
      console.error('File picker error:', error);
      Alert.alert('Ошибка', 'Не удалось выбрать файл');
    }
  };

  const showMediaOptions = () => {
    Alert.alert(
      'Выберите действие',
      '',
      [
        {
          text: 'Камера',
          onPress: handleCameraPick,
        },
        {
          text: 'Галерея',
          onPress: handleImagePick,
        },
        {
          text: 'Файл',
          onPress: handleFilePick,
        },
        {
          text: 'Отмена',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <View className="border-t border-gray-100 bg-white">
      {/* Reply/Edit Preview */}
      {(replyTo || editingMessage) && (
        <ReplyPreview
          message={replyTo || editingMessage}
          isEditing={!!editingMessage}
          onCancel={editingMessage ? onCancelEdit : onCancelReply}
        />
      )}

      {/* Input Area */}
      <View className="flex-row items-end gap-2 px-4 py-3">
        {/* Attachment Button */}
        <TouchableOpacity
          onPress={showMediaOptions}
          disabled={disabled}
          className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
        >
          <Ionicons name="add" size={24} color="#6B7280" />
        </TouchableOpacity>

        {/* Text Input */}
        <View className="flex-1 max-h-24 bg-gray-100 rounded-2xl px-4 py-2">
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={handleTextChange}
            placeholder={
              editingMessage 
                ? 'Редактировать сообщение...' 
                : 'Напишите сообщение...'
            }
            multiline
            maxLength={2000}
            className="text-gray-900 text-base min-h-[36px]"
            placeholderTextColor="#9CA3AF"
            editable={!disabled}
          />
        </View>

        {/* Send Button */}
        <TouchableOpacity
          onPress={handleSend}
          disabled={!value.trim() || disabled}
          className={`w-10 h-10 rounded-full items-center justify-center ${
            value.trim() && !disabled ? 'bg-blue-500' : 'bg-gray-300'
          }`}
        >
          <Ionicons
            name={editingMessage ? 'checkmark' : 'send'}
            size={18}
            color="white"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
