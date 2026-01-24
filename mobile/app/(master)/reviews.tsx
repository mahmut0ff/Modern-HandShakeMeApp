import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useGetMyReviewsQuery,
  useMarkReviewHelpfulMutation,
  useRemoveReviewHelpfulMutation,
  useDeleteReviewResponseMutation,
  useReportReviewMutation,
  type Review as APIReview,
} from '../../services/reviewApi';
import { usePagination } from '../../hooks/usePagination';
import { ReviewList, Review, RatingDistribution, ReviewStats } from '../../features/reviews';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface Review {
  id: number;
  project: {
    id: number;
    order_title: string;
  };
  client: {
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

export default function MasterReviewsPage() {
  const [filter, setFilter] = useState<'all' | 'recent' | 'high' | 'low'>('all');
  const currentUser = useSelector((state: RootState) => state.auth.user);
  
  // Pagination
  const pagination = usePagination({ pageSize: 10 });

  // API queries
  const { 
    data: reviewsData, 
    isLoading: reviewsLoading, 
    error: reviewsError,
    refetch: refetchReviews 
  } = useGetMyReviewsQuery({
    role: 'master',
    page: pagination.state.currentPage,
    page_size: pagination.state.pageSize,
    ordering: filter === 'recent' ? '-created_at' : 
              filter === 'high' ? '-rating' :
              filter === 'low' ? 'rating' : undefined,
  });

  const [markHelpful] = useMarkReviewHelpfulMutation();
  const [removeHelpful] = useRemoveReviewHelpfulMutation();
  const [deleteResponse] = useDeleteReviewResponseMutation();
  const [reportReview] = useReportReviewMutation();

  const apiReviews = reviewsData?.results || [];
  const totalCount = reviewsData?.count || 0;

  // Update pagination when data changes
  React.useEffect(() => {
    pagination.actions.setTotalCount(totalCount);
  }, [totalCount]);

  // Convert API reviews to display format
  const reviews: Review[] = apiReviews.map((review: APIReview) => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment || '',
    createdAt: review.created_at,
    updatedAt: review.updated_at,
    isEdited: !!review.updated_at && review.updated_at !== review.created_at,
    reviewer: {
      id: review.client?.id || 0,
      name: review.is_anonymous ? 'Anonymous' : (review.client?.name || review.client_name || 'Client'),
      avatar: review.is_anonymous ? undefined : (review.client?.avatar || review.client_avatar),
    },
    master: {
      id: review.master?.id || 0,
      name: review.master?.name || review.master_name || 'You',
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

  // Calculate stats
  const reviewStats: ReviewStats = {
    averageRating: reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0,
    totalReviews: totalCount,
    distribution: {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    },
  };

  const handleRespond = (reviewId: number) => {
    router.push(`/(master)/reviews/respond/${reviewId}`);
  };

  const handleEditResponse = (reviewId: number) => {
    router.push(`/(master)/reviews/respond/${reviewId}?isEdit=true`);
  };

  const handleDeleteResponse = (reviewId: number) => {
    Alert.alert(
      'Delete Response',
      'Are you sure you want to delete your response?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteResponse(reviewId).unwrap();
              Alert.alert('Success', 'Response deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete response');
            }
          },
        },
      ]
    );
  };

  const handleReport = (reviewId: number) => {
    Alert.prompt(
      'Report Review',
      'Please provide a reason for reporting this review:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          onPress: async (reason) => {
            if (!reason || reason.trim().length === 0) {
              Alert.alert('Error', 'Please provide a reason');
              return;
            }
            try {
              await reportReview({ id: reviewId, reason: reason.trim() }).unwrap();
              Alert.alert('Success', 'Review reported successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to report review');
            }
          },
        },
      ],
      'plain-text'
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
      <ScrollView className="flex-1 px-4">
        {/* Header */}
        <View className="flex-row items-center gap-4 mb-6">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 bg-white rounded-2xl items-center justify-center shadow-sm border border-gray-100"
          >
            <Ionicons name="arrow-back" size={20} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">Отзывы обо мне</Text>
        </View>

        {/* Loading state */}
        {reviewsLoading && (
          <View className="bg-white rounded-3xl p-8 items-center shadow-sm border border-gray-100 mb-6">
            <ActivityIndicator size="large" color="#0165FB" />
            <Text className="text-gray-500 mt-2">Загрузка отзывов...</Text>
          </View>
        )}

        {/* Error state */}
        {reviewsError && (
          <View className="bg-white rounded-3xl p-8 items-center shadow-sm border border-gray-100 mb-6">
            <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="alert-circle" size={32} color="#EF4444" />
            </View>
            <Text className="text-gray-900 font-semibold mb-2">Ошибка загрузки</Text>
            <Text className="text-gray-500 text-center mb-4">
              Не удалось загрузить отзывы
            </Text>
            <TouchableOpacity 
              onPress={() => refetchReviews()}
              className="bg-[#0165FB] px-6 py-2 rounded-xl"
            >
              <Text className="text-white font-medium">Повторить</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Filter tabs */}
        {!reviewsLoading && !reviewsError && (
          <View className="flex-row bg-gray-100 p-0.5 rounded-xl mb-4">
            {[
              { key: 'all', label: 'Все' },
              { key: 'recent', label: 'Новые' },
              { key: 'high', label: 'Высокие' },
              { key: 'low', label: 'Низкие' },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => {
                  setFilter(tab.key as any);
                  pagination.actions.goToFirstPage();
                }}
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

        {/* Rating Summary */}
        {!reviewsLoading && !reviewsError && reviews.length > 0 && (
          <View className="mb-6">
            <RatingDistribution stats={reviewStats} />
          </View>
        )}

        {/* Reviews List */}
        {!reviewsLoading && !reviewsError && (
          <>
            {reviews.length === 0 ? (
              <View className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 items-center">
                <View className="w-20 h-20 bg-[#0165FB]/10 rounded-full items-center justify-center mb-4">
                  <Ionicons name="star-outline" size={40} color="#0165FB" />
                </View>
                <Text className="text-lg font-semibold text-gray-900 mb-2">Пока нет отзывов</Text>
                <Text className="text-gray-500 mb-6 text-center">
                  Завершите первый проект, чтобы получить отзыв от клиента
                </Text>
                <TouchableOpacity
                  onPress={() => router.push('/(master)/orders')}
                  className="flex-row items-center gap-2 px-6 py-3 bg-[#0165FB] rounded-2xl shadow-lg"
                >
                  <Ionicons name="search" size={16} color="white" />
                  <Text className="font-semibold text-white">Найти заказы</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <ReviewList
                  reviews={reviews}
                  currentUserId={currentUser?.id}
                  onRespond={handleRespond}
                  onReport={handleReport}
                  onMarkHelpful={handleMarkHelpful}
                />

                {/* Pagination */}
                {pagination.state.totalPages > 1 && (
                  <View className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 mb-4">
                    <View className="flex-row items-center justify-between">
                      <TouchableOpacity
                        onPress={pagination.actions.previousPage}
                        disabled={pagination.state.isFirstPage}
                        className={`px-4 py-2 rounded-xl ${
                          pagination.state.isFirstPage 
                            ? 'bg-gray-100' 
                            : 'bg-[#0165FB]'
                        }`}
                      >
                        <Text className={`font-medium ${
                          pagination.state.isFirstPage 
                            ? 'text-gray-400' 
                            : 'text-white'
                        }`}>
                          Назад
                        </Text>
                      </TouchableOpacity>

                      <Text className="text-gray-600">
                        Страница {pagination.state.currentPage} из {pagination.state.totalPages}
                      </Text>

                      <TouchableOpacity
                        onPress={pagination.actions.nextPage}
                        disabled={pagination.state.isLastPage}
                        className={`px-4 py-2 rounded-xl ${
                          pagination.state.isLastPage 
                            ? 'bg-gray-100' 
                            : 'bg-[#0165FB]'
                        }`}
                      >
                        <Text className={`font-medium ${
                          pagination.state.isLastPage 
                            ? 'text-gray-400' 
                            : 'text-white'
                        }`}>
                          Далее
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            )}
          </>
        )}

        {/* Tips */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
          <Text className="font-semibold text-gray-900 mb-3 flex-row items-center gap-2">
            <Ionicons name="bulb" size={20} color="#F59E0B" />
            Как получать хорошие отзывы
          </Text>
          <View className="space-y-2">
            <Text className="text-sm text-gray-600">• Выполняйте работу качественно и в срок</Text>
            <Text className="text-sm text-gray-600">• Поддерживайте связь с клиентом</Text>
            <Text className="text-sm text-gray-600">• Фотографируйте процесс работы</Text>
            <Text className="text-sm text-gray-600">• Убирайте за собой после работы</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}