import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useGetMyReviewsQuery,
  type Review as APIReview,
} from '../../services/reviewApi';
import { usePagination } from '../../hooks/usePagination';

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

  const reviews = reviewsData?.results || [];
  const totalCount = reviewsData?.count || 0;

  // Update pagination when data changes
  React.useEffect(() => {
    pagination.actions.setTotalCount(totalCount);
  }, [totalCount]);

  // Convert API reviews to display format
  const displayReviews: Review[] = reviews.map((review: APIReview) => ({
    id: review.id,
    project: {
      id: review.project?.id || 0,
      order_title: review.project_title || review.order_title || 'Проект'
    },
    client: {
      id: review.client?.id || 0,
      name: review.client?.name || review.client_name || 'Клиент',
      avatar: review.client?.avatar || review.client_avatar || undefined
    },
    quality_rating: review.rating,
    communication_rating: review.rating,
    punctuality_rating: review.rating,
    professionalism_rating: review.rating,
    overall_rating: review.rating,
    comment: review.comment || '',
    created_at: review.created_at
  }));

  const averageRating = displayReviews.length > 0 
    ? displayReviews.reduce((sum, review) => sum + review.overall_rating, 0) / displayReviews.length 
    : 0;

  const ratingDistribution = {
    5: displayReviews.filter(r => Math.round(r.overall_rating) === 5).length,
    4: displayReviews.filter(r => Math.round(r.overall_rating) === 4).length,
    3: displayReviews.filter(r => Math.round(r.overall_rating) === 3).length,
    2: displayReviews.filter(r => Math.round(r.overall_rating) === 2).length,
    1: displayReviews.filter(r => Math.round(r.overall_rating) === 1).length,
  };

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
          <Text className="font-semibold text-gray-900">{item.client.name}</Text>
          <Text className="text-sm text-gray-500 mt-1">{item.project.order_title}</Text>
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
        {!reviewsLoading && !reviewsError && displayReviews.length > 0 && (
          <View className="bg-[#0165FB] rounded-3xl p-5 mb-6">
            <View className="flex-row items-center justify-between">
              <View className="items-center">
                <Text className="text-4xl font-bold text-white mb-1">
                  {averageRating.toFixed(1)}
                </Text>
                <View className="flex-row mb-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Ionicons
                      key={star}
                      name={star <= Math.round(averageRating) ? 'star' : 'star-outline'}
                      size={20}
                      color="white"
                    />
                  ))}
                </View>
                <Text className="text-white/70 text-sm">{totalCount} отзывов</Text>
              </View>
              
              <View className="flex-1 ml-6">
                {[5, 4, 3, 2, 1].map(rating => (
                  <View key={rating} className="flex-row items-center gap-2 mb-1">
                    <Text className="text-white text-sm w-2">{rating}</Text>
                    <Ionicons name="star" size={12} color="white" />
                    <View className="flex-1 bg-white/20 rounded-full h-2">
                      <View 
                        className="bg-white h-2 rounded-full" 
                        style={{ 
                          width: displayReviews.length > 0 
                            ? `${(ratingDistribution[rating as keyof typeof ratingDistribution] / displayReviews.length) * 100}%` 
                            : '0%' 
                        }}
                      />
                    </View>
                    <Text className="text-white text-sm w-6">
                      {ratingDistribution[rating as keyof typeof ratingDistribution]}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Reviews List */}
        {!reviewsLoading && !reviewsError && (
          <>
            {displayReviews.length === 0 ? (
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
                <FlatList
                  data={displayReviews}
                  renderItem={renderReview}
                  keyExtractor={(item) => item.id.toString()}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
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