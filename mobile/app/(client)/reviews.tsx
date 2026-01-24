import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { 
  useGetMyReviewsQuery, 
  useDeleteReviewMutation,
  useMarkReviewHelpfulMutation,
  useRemoveReviewHelpfulMutation,
  type Review as APIReview 
} from '../../services/reviewApi';
import { ReviewList, Review } from '../../features/reviews';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

export default function ClientReviewsPage() {
  const [filter, setFilter] = useState<'all' | 'recent' | 'high' | 'low'>('all');
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const { data, isLoading, error, refetch } = useGetMyReviewsQuery({
    role: 'client',
    ordering: filter === 'recent' ? '-created_at' : 
              filter === 'high' ? '-rating' :
              filter === 'low' ? 'rating' : undefined,
  });

  const [deleteReview] = useDeleteReviewMutation();
  const [markHelpful] = useMarkReviewHelpfulMutation();
  const [removeHelpful] = useRemoveReviewHelpfulMutation();

  const reviews: Review[] = (data?.results || []).map((review: APIReview) => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment || '',
    createdAt: review.created_at,
    updatedAt: review.updated_at,
    isEdited: !!review.updated_at && review.updated_at !== review.created_at,
    reviewer: {
      id: review.client?.id || 0,
      name: review.client?.name || review.client_name || 'You',
      avatar: review.client?.avatar || review.client_avatar,
    },
    master: {
      id: review.master?.id || 0,
      name: review.master?.name || review.master_name || 'Master',
      avatar: review.master?.avatar || review.master_avatar,
    },
    project: review.project,
    response: review.response ? {
      id: review.id,
      text: review.response,
      createdAt: review.responded_at || review.created_at,
    } : undefined,
    helpfulCount: review.helpful_count || 0,
    isHelpfulByMe: review.is_helpful || false,
  }));

  const handleEdit = (reviewId: number) => {
    router.push(`/(client)/reviews/edit/${reviewId}`);
  };

  const handleDelete = (reviewId: number) => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete this review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReview(reviewId).unwrap();
              Alert.alert('Success', 'Review deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete review');
            }
          },
        },
      ]
    );
  };

  const handleMarkHelpful = async (reviewId: number) => {
    const review = reviews.find(r => r.id === reviewId);
    try {
      if (review?.isHelpfulByMe) {
        await removeHelpful(reviewId).unwrap();
      } else {
        await markHelpful(reviewId).unwrap();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update helpful status');
    }
  };

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

        {/* Error State */}
        {error && (
          <View className="bg-white rounded-3xl p-8 items-center shadow-sm border border-gray-100 mb-6">
            <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="alert-circle" size={32} color="#EF4444" />
            </View>
            <Text className="text-gray-900 font-semibold mb-2">Ошибка загрузки</Text>
            <Text className="text-gray-500 text-center mb-4">
              Не удалось загрузить отзывы
            </Text>
            <TouchableOpacity 
              onPress={() => refetch()}
              className="bg-[#0165FB] px-6 py-2 rounded-xl"
            >
              <Text className="text-white font-medium">Повторить</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Filter Tabs */}
        {!isLoading && !error && (
          <View className="flex-row bg-gray-100 p-0.5 rounded-xl mb-4">
            {[
              { key: 'all', label: 'Все' },
              { key: 'recent', label: 'Новые' },
              { key: 'high', label: 'Высокие' },
              { key: 'low', label: 'Низкие' },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setFilter(tab.key as any)}
                className={`flex-1 py-2 px-3 rounded-lg ${
                  filter === tab.key ? 'bg-white shadow-sm' : ''
                }`}
              >
                <Text className={`text-xs font-medium text-center ${
                  filter === tab.key ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Reviews List */}
        {isLoading ? (
          <View className="bg-white rounded-3xl p-8 items-center shadow-sm border border-gray-100">
            <ActivityIndicator size="large" color="#0165FB" />
            <Text className="text-gray-500 mt-2">Загрузка отзывов...</Text>
          </View>
        ) : reviews.length === 0 ? (
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
          <ReviewList
            reviews={reviews}
            currentUserId={currentUser?.id}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onMarkHelpful={handleMarkHelpful}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}