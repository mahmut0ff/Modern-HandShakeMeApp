import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, FlatList, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { 
  useGetMyPortfolioQuery, 
  useDeletePortfolioItemMutation,
  useAddPortfolioImageMutation 
} from '../../../services/profileApi';
import { LoadingSpinner } from '../../../components/LoadingSpinner';

interface PortfolioItem {
  id: number;
  title: string;
  description: string;
  category: string;
  before_image?: string;
  after_image?: string;
  video_url?: string;
  created_at: string;
  media: MediaItem[];
}

interface MediaItem {
  id: number;
  media_type: 'image' | 'video';
  file_url: string;
  description?: string;
  created_at: string;
}

export default function PortfolioItemDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // API hooks
  const { data: portfolioItems, isLoading: portfolioLoading } = useGetMyPortfolioQuery();
  const [deletePortfolioItem] = useDeletePortfolioItemMutation();
  const [addPortfolioImage] = useAddPortfolioImageMutation();

  // Find the specific portfolio item
  const portfolioItem = portfolioItems?.find(item => item.id === Number(id));

  // Combine all media
  const allMedia: Array<{ id: string | number; type: 'image' | 'video'; url: string; description?: string }> = [];
  
  if (portfolioItem?.images) {
    portfolioItem.images.forEach(img => {
      allMedia.push({
        id: img.id,
        type: 'image',
        url: img.image_url || img.image,
        description: undefined,
      });
    });
  }

  const handleDelete = () => {
    Alert.alert(
      'Удалить работу',
      'Вы уверены, что хотите удалить эту работу из портфолио?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deletePortfolioItem(Number(id)).unwrap();
              router.back();
            } catch (error: any) {
              console.error('Delete portfolio item error:', error);
              Alert.alert('Ошибка', error.data?.message || 'Не удалось удалить работу');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleAddMedia = () => {
    Alert.alert(
      'Добавить медиа',
      'Выберите тип файла',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Фото', 
          onPress: async () => {
            try {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
              });
              
              if (!result.canceled && result.assets[0]) {
                const formData = new FormData();
                formData.append('image', {
                  uri: result.assets[0].uri,
                  type: 'image/jpeg',
                  name: 'portfolio-image.jpg',
                } as any);
                
                await addPortfolioImage({ itemId: Number(id), image: formData }).unwrap();
                Alert.alert('Успех', 'Фото добавлено');
              }
            } catch (error: any) {
              console.error('Add image error:', error);
              Alert.alert('Ошибка', 'Не удалось добавить фото');
            }
          }
        },
        { 
          text: 'Видео', 
          onPress: async () => {
            try {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                allowsEditing: true,
                quality: 0.8,
              });
              
              if (!result.canceled && result.assets[0]) {
                const formData = new FormData();
                formData.append('video', {
                  uri: result.assets[0].uri,
                  type: 'video/mp4',
                  name: 'portfolio-video.mp4',
                } as any);
                
                await addPortfolioImage({ itemId: Number(id), image: formData }).unwrap();
                Alert.alert('Успех', 'Видео добавлено');
              }
            } catch (error: any) {
              console.error('Add video error:', error);
              Alert.alert('Ошибка', 'Не удалось добавить видео');
            }
          }
        }
      ]
    );
  };

  if (portfolioLoading) {
    return <LoadingSpinner fullScreen text="Загрузка..." />;
  }

  if (!portfolioItem) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8F7FC] items-center justify-center">
        <Text className="text-gray-500">Работа не найдена</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 px-4 py-2 bg-[#0165FB] rounded-xl">
          <Text className="text-white">Назад</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const currentMedia = allMedia[activeMediaIndex];

  const renderMediaItem = ({ item, index }: { item: typeof allMedia[0]; index: number }) => (
    <TouchableOpacity
      onPress={() => setActiveMediaIndex(index)}
      className={`w-20 h-20 rounded-2xl overflow-hidden mr-2 ${
        activeMediaIndex === index ? 'border-2 border-[#0165FB]' : 'border border-gray-200'
      }`}
    >
      {item.type === 'image' ? (
        <Image source={{ uri: item.url }} className="w-full h-full" resizeMode="cover" />
      ) : (
        <View className="w-full h-full bg-gray-900 items-center justify-center">
          <Ionicons name="play" size={24} color="white" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 bg-white rounded-2xl items-center justify-center shadow-sm border border-gray-100"
          >
            <Ionicons name="arrow-back" size={20} color="#6B7280" />
          </TouchableOpacity>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => router.push(`/(master)/portfolio/create?edit=${id}`)}
              className="w-10 h-10 bg-white rounded-2xl items-center justify-center shadow-sm border border-gray-100"
            >
              <Ionicons name="create" size={20} color="#0165FB" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              disabled={loading}
              className="w-10 h-10 bg-white rounded-2xl items-center justify-center shadow-sm border border-gray-100"
            >
              <Ionicons name="trash" size={20} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Media Display */}
        <View className="px-4 mb-4">
          <View className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
            {currentMedia ? (
              <View className="relative">
                {currentMedia.type === 'image' ? (
                  <Image 
                    source={{ uri: currentMedia.url }} 
                    className="w-full h-80"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-80 bg-gray-900 items-center justify-center">
                    <TouchableOpacity className="w-16 h-16 bg-white/20 rounded-full items-center justify-center">
                      <Ionicons name="play" size={32} color="white" />
                    </TouchableOpacity>
                  </View>
                )}
                
                {/* Media Counter */}
                <View className="absolute top-4 right-4 px-3 py-1 bg-black/50 rounded-full">
                  <Text className="text-white text-sm font-medium">
                    {activeMediaIndex + 1} / {allMedia.length}
                  </Text>
                </View>
              </View>
            ) : (
              <View className="w-full h-80 bg-gray-100 items-center justify-center">
                <Ionicons name="image" size={64} color="#9CA3AF" />
                <Text className="text-gray-500 mt-2">Нет медиа</Text>
              </View>
            )}
            
            {/* Media Description */}
            {currentMedia?.description && (
              <View className="p-4">
                <Text className="text-gray-700">{currentMedia.description}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Media Thumbnails */}
        <View className="px-4 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="font-semibold text-gray-900">Медиа ({allMedia.length})</Text>
            <TouchableOpacity
              onPress={handleAddMedia}
              className="flex-row items-center gap-1 px-3 py-1 bg-[#0165FB] rounded-full"
            >
              <Ionicons name="add" size={16} color="white" />
              <Text className="text-white text-sm font-medium">Добавить</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={allMedia}
            renderItem={renderMediaItem}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        </View>

        {/* Portfolio Details */}
        <View className="px-4">
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
            <View className="flex-row items-start justify-between mb-3">
              <Text className="text-xl font-bold text-gray-900 flex-1">{portfolioItem.title}</Text>
              <View className="px-3 py-1 bg-purple-100 rounded-full">
                <Text className="text-sm font-medium text-purple-700">{portfolioItem.category}</Text>
              </View>
            </View>
            
            <Text className="text-gray-700 mb-4">{portfolioItem.description}</Text>
            
            <View className="flex-row items-center gap-2">
              <Ionicons name="calendar" size={16} color="#9CA3AF" />
              <Text className="text-sm text-gray-500">
                Добавлено: {new Date(portfolioItem.created_at).toLocaleDateString('ru-RU')}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View className="flex-row gap-3 mb-6">
            <TouchableOpacity
              onPress={() => router.push(`/(master)/portfolio/create?edit=${id}`)}
              className="flex-1 flex-row items-center justify-center gap-2 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm"
            >
              <Ionicons name="create" size={16} color="#0165FB" />
              <Text className="font-semibold text-[#0165FB]">Редактировать</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 flex-row items-center justify-center gap-2 py-4 bg-[#0165FB] rounded-2xl shadow-lg">
              <Ionicons name="share" size={16} color="white" />
              <Text className="font-semibold text-white">Поделиться</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}