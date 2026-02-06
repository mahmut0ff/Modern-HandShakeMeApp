/**
 * Order Files List Component
 * Список файлов заказа с возможностью просмотра и удаления
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { OrderFile } from '../../../services/orderApi';

interface OrderFilesListProps {
  files: OrderFile[];
  onFilePress?: (file: OrderFile) => void;
  onFileDelete?: (fileId: number) => void;
  editable?: boolean;
}

export function OrderFilesList({
  files,
  onFilePress,
  onFileDelete,
  editable = false,
}: OrderFilesListProps) {
  const handleDelete = (file: OrderFile) => {
    Alert.alert(
      'Удалить файл?',
      'Вы уверены, что хотите удалить этот файл?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => onFileDelete?.(file.id),
        },
      ]
    );
  };

  const renderFile = ({ item }: { item: OrderFile }) => {
    const isImage = item.file_type === 'photo';
    const isVideo = item.file_type === 'video';
    const isDocument = item.file_type === 'document';

    return (
      <TouchableOpacity
        className="mr-3 mb-3"
        onPress={() => onFilePress?.(item)}
        activeOpacity={0.7}
      >
        <View className="relative">
          {isImage && (
            <Image
              source={{ uri: item.file_url }}
              className="w-24 h-24 rounded-xl"
              resizeMode="cover"
            />
          )}

          {isVideo && (
            <View className="w-24 h-24 rounded-xl bg-gray-200 items-center justify-center">
              <Ionicons name="play-circle" size={40} color="#3B82F6" />
            </View>
          )}

          {isDocument && (
            <View className="w-24 h-24 rounded-xl bg-gray-200 items-center justify-center">
              <Ionicons name="document-text" size={40} color="#6B7280" />
            </View>
          )}

          {/* File Type Badge */}
          <View className="absolute top-2 left-2 bg-black/50 px-2 py-1 rounded-md">
            <Text className="text-white text-xs font-medium uppercase">
              {item.file_type === 'photo' && 'Фото'}
              {item.file_type === 'video' && 'Видео'}
              {item.file_type === 'document' && 'Док'}
            </Text>
          </View>

          {/* Delete Button */}
          {editable && (
            <TouchableOpacity
              className="absolute top-2 right-2 bg-red-500 rounded-full p-1"
              onPress={() => handleDelete(item)}
            >
              <Ionicons name="close" size={16} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (!files || files.length === 0) {
    return (
      <View className="bg-gray-100 rounded-xl p-6 items-center">
        <Ionicons name="images-outline" size={40} color="#9CA3AF" />
        <Text className="text-gray-500 text-sm mt-2">Файлы не прикреплены</Text>
      </View>
    );
  }

  return (
    <View>
      <Text className="text-base font-semibold text-gray-900 mb-3">
        Файлы ({files.length})
      </Text>
      <FlatList
        data={files}
        renderItem={renderFile}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}
