import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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

  // Mock data - replace with actual API calls
  const portfolioItem: PortfolioItem = {
    id: Number(id),
    title: 'Ремонт ванной комнаты',
    description: 'Полный ремонт ванной комнаты площадью 6 кв.м. Включал демонтаж старой плитки, выравнивание стен, укладку новой плитки, замену сантехники и установку современного освещения.',
    category: 'Ремонт и отделка',
    before_image: 'https://example.com/before1.jpg',
    after_image: 'https://example.com/after1.jpg',
    video_url: 'https://example.com/video1.mp4',
    created_at: '2024-01-10T15:30:00Z',
    media: [
      {
        id: 1,
        media_type: 'image',
        file_url: 'https://example.com/progress1.jpg',
        description: 'Демонтаж старой плитки',
        created_at: '2024-01-10T10:00:00Z'
      },
      {
        id: 2,
        media_type: 'image',
        file_url: 'https://example.com/progress2.jpg',
        description: 'Выравнивание стен',
        created_at: '2024-01-11T14:00:00Z'
      },
      {
        id: 3,
        media_type: 'image',
        file_url: 'https://example.com/progress3.jpg',
        description: 'Укладка новой плитки',
        created_at: '2024-01-12T16:00:00Z'
      },
      {
        id: 4,
        media_type: 'video',
        file_url: 'https://example.com/process.mp4',
        description: 'Процесс укладки плитки',
        created_at: '2024-01-12T17:00:00Z'
      }
    ]
  };

  // Combine all media (before/after + additional media)
  const allMedia: Array<{ id: string | number; type: 'image' | 'video'; url: string; description?: string; isLegacy?: boolean }> = [];
  
  if (portfolioItem.before_image) {
    allMedia.push({ 
      id: 'before', 
      type: 'image', 
      url: portfolioItem.before_image, 
      description: 'До ремонта',
      isLegacy: true 
    });
  }
  
  if (portfolioItem.after_image) {
    allMedia.push({ 
      id: 'after', 
      type: 'image', 
      url: portfolioItem.after_image, 
      description: 'После ремонта',
      isLegacy: true 
    });
  }
  
  if (portfolioItem.video_url) {
    allMedia.push({ 
      id: 'video', 
      type: 'video', 
      url: portfolioItem.video_url, 
      description: 'Видео результата',
      isLegacy: true 
    });
  }
  
  portfolioItem.media.forEach(m => {
    allMedia.push({ 
      id: m.id, 
      type: m.media_type, 
      url: m.file_url, 
      description: m.description 
    });
  });

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
              // TODO: Implement API call
              await new Promise(resolve => setTimeout(resolve, 1000));
              router.back();
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось удалить работу');
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
        { text: 'Фото', onPress: () => {/* TODO: Open image picker */} },
        { text: 'Видео', onPress: () => {/* TODO: Open video picker */} }
      ]
    );
  };

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

  const currentMedia = allMedia[activeMediaIndex];

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
              onPress={() => router.push(`/master/portfolio/${id}/edit`)}
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
              onPress={() => router.push(`/master/portfolio/${id}/edit`)}
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