import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGetMyPortfolioQuery } from '../../services/profileApi';

export default function MasterPortfolioPage() {
  const { data: portfolioItems = [], isLoading, refetch } = useGetMyPortfolioQuery();

  const renderPortfolioItem = ({ item }: { item: typeof portfolioItems[0] }) => {
    const firstImage = item.images?.[0];
    const mediaCount = item.images?.length || 0;
    
    return (
      <TouchableOpacity
        onPress={() => router.push(`/(master)/portfolio/${item.id}`)}
        className="bg-white rounded-3xl shadow-sm border border-gray-100 mb-4 overflow-hidden"
      >
        {/* Image Preview */}
        <View className="relative">
          {firstImage ? (
            <Image 
              source={{ uri: firstImage.image_url || firstImage.image }} 
              className="w-full h-48"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-48 bg-gray-100 items-center justify-center">
              <Ionicons name="image" size={48} color="#9CA3AF" />
            </View>
          )}
          
          {/* Media Count Badge */}
          {mediaCount > 0 && (
            <View className="absolute top-3 right-3 flex-row items-center gap-1 px-2 py-1 bg-black/50 rounded-full">
              <Ionicons name="images" size={12} color="white" />
              <Text className="text-white text-xs font-medium">{mediaCount}</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View className="p-4">
          <View className="flex-row items-start justify-between mb-2">
            <Text className="font-semibold text-gray-900 flex-1" numberOfLines={1}>
              {item.title}
            </Text>
            {item.category_name && (
              <View className="px-2 py-1 bg-purple-100 rounded-full">
                <Text className="text-xs font-medium text-purple-700">{item.category_name}</Text>
              </View>
            )}
          </View>
          
          {item.description && (
            <Text className="text-sm text-gray-600 mb-3" numberOfLines={2}>
              {item.description}
            </Text>
          )}
          
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-gray-400">
              {new Date(item.created_at).toLocaleDateString('ru-RU')}
            </Text>
            <View className="flex-row items-center gap-1">
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      <ScrollView className="flex-1 px-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center gap-4">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="w-10 h-10 bg-white rounded-2xl items-center justify-center shadow-sm border border-gray-100"
            >
              <Ionicons name="arrow-back" size={20} color="#6B7280" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-gray-900">Портфолио</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(master)/portfolio/create')}
            className="w-10 h-10 bg-[#0165FB] rounded-2xl items-center justify-center shadow-lg"
          >
            <Ionicons name="add" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Stats Card */}
        <View className="bg-purple-500 rounded-3xl p-5 mb-6">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white/70 text-sm">Всего работ</Text>
              <Text className="text-3xl font-bold text-white">{portfolioItems.length}</Text>
            </View>
            <View className="items-end">
              <Text className="text-white/70 text-sm">Фото и видео</Text>
              <Text className="text-2xl font-bold text-white">
                {portfolioItems.reduce((sum, item) => sum + (item.images?.length || 0), 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Loading */}
        {isLoading ? (
          <View className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 items-center">
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text className="text-gray-500 mt-4">Загрузка портфолио...</Text>
          </View>
        ) : portfolioItems.length === 0 ? (
          <View className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 items-center">
            <View className="w-20 h-20 bg-purple-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="images" size={40} color="#8B5CF6" />
            </View>
            <Text className="text-lg font-semibold text-gray-900 mb-2">Пустое портфолио</Text>
            <Text className="text-gray-500 mb-6 text-center">
              Добавьте свои работы, чтобы клиенты могли оценить ваши навыки
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(master)/portfolio/create')}
              className="flex-row items-center gap-2 px-6 py-3 bg-purple-500 rounded-2xl shadow-lg"
            >
              <Ionicons name="add" size={16} color="white" />
              <Text className="font-semibold text-white">Добавить работу</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={portfolioItems}
            renderItem={renderPortfolioItem}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Tips Card */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
          <View className="flex-row items-center gap-2 mb-3">
            <Ionicons name="bulb" size={20} color="#F59E0B" />
            <Text className="font-semibold text-gray-900">Советы по портфолио</Text>
          </View>
          <View className="flex flex-col gap-2">
            <Text className="text-sm text-gray-600">• Добавляйте фото "до" и "после"</Text>
            <Text className="text-sm text-gray-600">• Описывайте процесс работы</Text>
            <Text className="text-sm text-gray-600">• Указывайте использованные материалы</Text>
            <Text className="text-sm text-gray-600">• Добавляйте видео для сложных работ</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}