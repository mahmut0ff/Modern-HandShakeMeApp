/**
 * Analytics Dashboard Screen
 * Дашборд аналитики для мастеров
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGetMasterAnalyticsQuery } from '../../services/analyticsApi';
import { useTranslation } from '../../hooks/useTranslation';

const PERIODS = [
  { key: 'week', label: 'Неделя', days: 7 },
  { key: 'month', label: 'Месяц', days: 30 },
  { key: 'quarter', label: 'Квартал', days: 90 },
  { key: 'year', label: 'Год', days: 365 },
];

export default function AnalyticsDashboardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const period = PERIODS.find(p => p.key === selectedPeriod);
  const endDate = new Date().toISOString();
  const startDate = new Date(Date.now() - period!.days * 24 * 60 * 60 * 1000).toISOString();

  const { data: analytics, isLoading, refetch } = useGetMasterAnalyticsQuery({
    startDate,
    endDate,
    granularity: 'DAY',
  });

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-bold text-gray-900">
            {t('analytics.dashboard')}
          </Text>
          <TouchableOpacity onPress={() => router.push('/(master)/analytics/reports')}>
            <Ionicons name="document-text-outline" size={24} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        {/* Period Selector */}
        <View className="bg-white px-4 py-3 border-b border-gray-200">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row space-x-2">
              {PERIODS.map((p) => (
                <TouchableOpacity
                  key={p.key}
                  className={`px-4 py-2 rounded-full ${
                    selectedPeriod === p.key ? 'bg-blue-500' : 'bg-gray-100'
                  }`}
                  onPress={() => setSelectedPeriod(p.key)}
                >
                  <Text className={selectedPeriod === p.key ? 'text-white font-medium' : 'text-gray-700'}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center py-12">
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : analytics ? (
          <View className="p-4 space-y-4">
            {/* Summary Cards */}
            <View className="flex-row space-x-3">
              <View className="flex-1 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="wallet" size={20} color="white" />
                  <Text className="text-white/80 text-sm ml-2">{t('analytics.revenue')}</Text>
                </View>
                <Text className="text-white text-2xl font-bold">
                  {analytics.summary.totalRevenue.toLocaleString()}
                </Text>
                <Text className="text-white/80 text-xs mt-1">сом</Text>
              </View>

              <View className="flex-1 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text className="text-white/80 text-sm ml-2">{t('analytics.orders')}</Text>
                </View>
                <Text className="text-white text-2xl font-bold">
                  {analytics.summary.completedOrders}
                </Text>
                <Text className="text-white/80 text-xs mt-1">
                  из {analytics.summary.totalOrders}
                </Text>
              </View>
            </View>

            {/* Performance Metrics */}
            <View className="bg-white rounded-2xl p-4 border border-gray-200">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                {t('analytics.performance')}
              </Text>
              
              <View className="space-y-3">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Ionicons name="star" size={20} color="#F59E0B" />
                    <Text className="text-gray-700 ml-2">{t('analytics.rating')}</Text>
                  </View>
                  <Text className="text-lg font-bold text-gray-900">
                    {analytics.summary.averageRating.toFixed(1)}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Ionicons name="trending-up" size={20} color="#10B981" />
                    <Text className="text-gray-700 ml-2">{t('analytics.completionRate')}</Text>
                  </View>
                  <Text className="text-lg font-bold text-gray-900">
                    {analytics.summary.completionRate.toFixed(1)}%
                  </Text>
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Ionicons name="time" size={20} color="#3B82F6" />
                    <Text className="text-gray-700 ml-2">{t('analytics.responseTime')}</Text>
                  </View>
                  <Text className="text-lg font-bold text-gray-900">
                    {analytics.summary.responseTime.toFixed(1)}ч
                  </Text>
                </View>
              </View>
            </View>

            {/* Revenue Chart */}
            <TouchableOpacity
              className="bg-white rounded-2xl p-4 border border-gray-200"
              onPress={() => router.push('/(master)/analytics/revenue')}
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-semibold text-gray-900">
                  {t('analytics.revenueChart')}
                </Text>
                <View className="flex-row items-center">
                  <Text className="text-green-600 font-semibold mr-1">
                    +{analytics.revenue.growth.toFixed(1)}%
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>
              </View>

              <View className="h-32 flex-row items-end justify-between">
                {analytics.revenue.byPeriod.slice(-5).map((item, index) => {
                  const maxValue = Math.max(...analytics.revenue.byPeriod.map(i => i.value));
                  const height = (item.value / maxValue) * 100;
                  
                  return (
                    <View key={index} className="flex-1 items-center mx-1">
                      <View
                        className="w-full bg-blue-500 rounded-t-lg"
                        style={{ height: `${height}%` }}
                      />
                      <Text className="text-xs text-gray-500 mt-2">{item.label}</Text>
                    </View>
                  );
                })}
              </View>
            </TouchableOpacity>

            {/* Categories */}
            <TouchableOpacity
              className="bg-white rounded-2xl p-4 border border-gray-200"
              onPress={() => router.push('/(master)/analytics/categories')}
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-semibold text-gray-900">
                  {t('analytics.topCategories')}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </View>

              {analytics.categories.slice(0, 3).map((cat, index) => (
                <View key={index} className="mb-3 last:mb-0">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-gray-700 font-medium">{cat.category}</Text>
                    <Text className="text-gray-900 font-semibold">
                      {cat.revenue.toLocaleString()} сом
                    </Text>
                  </View>
                  <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </View>
                </View>
              ))}
            </TouchableOpacity>

            {/* Quick Actions */}
            <View className="flex-row space-x-3">
              <TouchableOpacity
                className="flex-1 bg-white rounded-2xl p-4 border border-gray-200 items-center"
                onPress={() => router.push('/(master)/analytics/orders')}
              >
                <Ionicons name="list" size={32} color="#3B82F6" />
                <Text className="text-gray-700 font-medium mt-2 text-center">
                  {t('analytics.orderAnalytics')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 bg-white rounded-2xl p-4 border border-gray-200 items-center"
                onPress={() => router.push('/(master)/analytics/financial')}
              >
                <Ionicons name="cash" size={32} color="#10B981" />
                <Text className="text-gray-700 font-medium mt-2 text-center">
                  {t('analytics.financial')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
