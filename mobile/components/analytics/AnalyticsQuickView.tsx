/**
 * Analytics Quick View Component
 * Компонент быстрого просмотра аналитики
 */

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGetMasterAnalyticsQuery } from '../../services/analyticsApi';
import { useTranslation } from '../../hooks/useTranslation';

export default function AnalyticsQuickView() {
  const router = useRouter();
  const { t } = useTranslation();

  const endDate = new Date().toISOString();
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: analytics, isLoading } = useGetMasterAnalyticsQuery({
    startDate,
    endDate,
    granularity: 'DAY',
  });

  if (isLoading) {
    return (
      <View className="bg-white rounded-2xl p-4 border border-gray-200 items-center justify-center h-32">
        <ActivityIndicator size="small" color="#3B82F6" />
      </View>
    );
  }

  if (!analytics) return null;

  return (
    <TouchableOpacity
      className="bg-white rounded-2xl p-4 border border-gray-200"
      onPress={() => router.push('/(master)/analytics')}
    >
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <Ionicons name="stats-chart" size={24} color="#3B82F6" />
          <Text className="text-lg font-semibold text-gray-900 ml-2">
            {t('analytics.dashboard')}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>

      <View className="flex-row space-x-3">
        <View className="flex-1 bg-blue-50 rounded-xl p-3">
          <Text className="text-xs text-gray-600 mb-1">{t('analytics.revenue')}</Text>
          <Text className="text-lg font-bold text-gray-900">
            {(analytics.summary.totalRevenue / 1000).toFixed(0)}K
          </Text>
          <View className="flex-row items-center mt-1">
            <Ionicons name="trending-up" size={12} color="#10B981" />
            <Text className="text-xs text-green-600 ml-1">
              +{analytics.revenue.growth.toFixed(1)}%
            </Text>
          </View>
        </View>

        <View className="flex-1 bg-green-50 rounded-xl p-3">
          <Text className="text-xs text-gray-600 mb-1">{t('analytics.orders')}</Text>
          <Text className="text-lg font-bold text-gray-900">
            {analytics.summary.completedOrders}
          </Text>
          <Text className="text-xs text-gray-500 mt-1">
            {analytics.summary.completionRate.toFixed(0)}% завершено
          </Text>
        </View>

        <View className="flex-1 bg-yellow-50 rounded-xl p-3">
          <Text className="text-xs text-gray-600 mb-1">{t('analytics.rating')}</Text>
          <Text className="text-lg font-bold text-gray-900">
            {analytics.summary.averageRating.toFixed(1)}
          </Text>
          <View className="flex-row items-center mt-1">
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text className="text-xs text-gray-500 ml-1">
              {analytics.performance.totalReviews} отзывов
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
