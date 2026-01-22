import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Review {
  id: number;
  project: {
    id: number;
    order_title: string;
  };
  master: {
    id: number;
    name: string;
    avatar?: string;
  };
  quality_rating: number;
  communication_rating: number;
  punctuality_rating: number;
  professionalism_rating: number;
  overall_rating: number;
  comment: string;
  created_at: string;
}

export default function ClientReviewsPage() {
  const [loading, setLoading] = useState(false);

  // Mock data - replace with actual API calls
  const reviews: Review[] = [
    {
      id: 1,
      project: {
        id: 1,
        order_title: 'Ремонт ванной комнаты'
      },
      master: {
        id: 1,
        name: 'Иван Петров',
        avatar: undefined
      },
      quality_rating: 5,
      communication_rating: 4,
      punctuality_rating: 5,
      professionalism_rating: 5,
      overall_rating: 4.8,
      comment: 'Отличная работа! Мастер выполнил всё качественно и в срок. Рекомендую!',
      created_at: '2024-01-10T15:30:00Z'
    },
    {
      id: 2,
      project: {
        id: 2,
        order_title: 'Установка кондиционера'
      },
      master: {
        id: 2,
        name: 'Алексей Сидоров',
        avatar: undefined
      },
      quality_rating: 4,
      communication_rating: 5,
      punctuality_rating: 4,
      professionalism_rating: 4,
      overall_rating: 4.3,
      comment: 'Хорошая работа, но были небольшие задержки по времени.',
      created_at: '2024-01-05T12:15:00Z'
    }
  ];

  const renderStars = (rating: number) => {
    return (
      <View className="flex-row">
        {[1, 2, 3, 4, 5].map(star => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={16}
            color={star <= rating ? '#F59E0B' : '#D1D5DB'}
          />
        ))}
      </View>
    );
  };

  const renderReview = ({ item }: { item: Review }) => (
    <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <Text className="font-semibold text-gray-900" numberOfLines={1}>
            {item.project.order_title}
          </Text>
          <Text className="text-sm text-gray-500 mt-1">
            Мастер: {item.master.name}
          </Text>
        </View>
        <View className="items-end">
          <View className="flex-row items-center gap-1">
            <Text className="font-bold text-lg text-gray-900">
              {item.overall_rating.toFixed(1)}
            </Text>
            <Ionicons name="star" size={20} color="#F59E0B" />
          </View>
          <Text className="text-xs text-gray-400">
            {new Date(item.created_at).toLocaleDateString('ru-RU')}
          </Text>
        </View>
      </View>

      <View className="space-y-2 mb-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-gray-600">Качество работы</Text>
          {renderStars(item.quality_rating)}
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-gray-600">Общение</Text>
          {renderStars(item.communication_rating)}
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-gray-600">Пунктуальность</Text>
          {renderStars(item.punctuality_rating)}
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-gray-600">Профессионализм</Text>
          {renderStars(item.professionalism_rating)}
        </View>
      </View>

      {item.comment && (
        <View className="p-3 bg-gray-50 rounded-2xl">
          <Text className="text-gray-700">{item.comment}</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}>
        {/* Header */}
        <View className="flex-row items-center gap-4 mb-6">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 bg-white rounded-2xl items-center justify-center shadow-sm border border-gray-100"
          >
            <Ionicons name="arrow-back" size={20} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">Мои отзывы</Text>
        </View>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <View className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 items-center">
            <View className="w-20 h-20 bg-[#0165FB]/10 rounded-full items-center justify-center mb-4">
              <Ionicons name="star-outline" size={40} color="#0165FB" />
            </View>
            <Text className="text-lg font-semibold text-gray-900 mb-2">Нет отзывов</Text>
            <Text className="text-gray-500 mb-6 text-center">
              Завершите проект, чтобы оставить отзыв о мастере
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(client)/projects')}
              className="flex-row items-center gap-2 px-6 py-3 bg-[#0165FB] rounded-2xl shadow-lg"
            >
              <Ionicons name="folder" size={16} color="white" />
              <Text className="font-semibold text-white">Мои проекты</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={reviews}
            renderItem={renderReview}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}