/**
 * Order Analytics Screen
 * Экран аналитики по заказам
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGetOrderAnalyticsQuery } from '../../services/analyticsApi';
import { useTranslation } from '../../hooks/useTranslation';

const PERIODS = [
  { key: 'week', label: 'Неделя', days: 7 },
  { key: 'month', label: 'Месяц', days: 30 },
  { key: 'quarter', label: 'Квартал', days: 90 },
];

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  accepted: '#3B82F6',
  in_progress: '#8B5CF6',
  completed: '#10B981',
  cancelled: '#EF4444',
};

export default function OrderAnalyticsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const period = PERIODS.find(p => p.key === selectedPeriod);
  const endDate = new Date().toISOString();
  const startDate = new Date(Date.now() - period!.days * 24 * 60 * 60 * 1000).toISOString();

  const { data: analytics, isLoading } = useGetOrderAnalyticsQuery({
    startDate,
    endDate,
  });

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">
          {t('analytics.orderAnalytics')}
        </Text>
      </View>

      <ScrollView className="flex-1">
        {/* Period Selector */}
        <View className="bg-white px-4 py-3 border-b border-gray-200">
          <View className="flex-row space-x-2">
            {PERIODS.map((p) => (
              <TouchableOpacity
                key={p.key}
                className={`flex-1 py-2 rounded-full ${
                  selectedPeriod === p.key ? 'bg-blue-500' : 'bg-gray-100'
                }`}
                onPress={() => setSelectedPeriod(p.key)}
              >
                <Text className={`text-center ${selectedPeriod === p.key ? 'text-white font-medium' : 'text-gray-700'}`}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center py-12">
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : analytics ? (
          <View className="p-4 space-y-4">
            {/* Summary */}
            <View className="bg-white rounded-2xl p-4 border border-gray-200">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                {t('analytics.summary')}
              </Text>

              <View className="flex-row flex-wrap -mx-2">
                <View className="w-1/2 px-2 mb-3">
                  <View className="bg-blue-50 rounded-xl p-3">
                    <Text className="text-sm text-gray-600">{t('analytics.totalOrders')}</Text>
                    <Text className="text-2xl font-bold text-gray-900 mt-1">
                      {analytics.summary.totalOrders}
                    </Text>
                  </View>
                </View>

                <View className="w-1/2 px-2 mb-3">
                  <View className="bg-green-50 rounded-xl p-3">
                    <Text className="text-sm text-gray-600">{t('analytics.completed')}</Text>
                    <Text className="text-2xl font-bold text-gray-900 mt-1">
                      {analytics.summary.completedOrders}
                    </Text>
                  </View>
                </View>

                <View className="w-1/2 px-2">
                  <View className="bg-purple-50 rounded-xl p-3">
                    <Text className="text-sm text-gray-600">{t('analytics.avgValue')}</Text>
                    <Text className="text-xl font-bold text-gray-900 mt-1">
                      {analytics.summary.averageOrderValue.toLocaleString()}
                    </Text>
                  </View>
                </View>

                <View className="w-1/2 px-2">
                  <View className="bg-yellow-50 rounded-xl p-3">
                    <Text className="text-sm text-gray-600">{t('analytics.revenue')}</Text>
                    <Text className="text-xl font-bold text-gray-900 mt-1">
                      {(analytics.summary.totalRevenue / 1000).toFixed(0)}K
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Trends */}
            <View className="bg-white rounded-2xl p-4 border border-gray-200">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                {t('analytics.trends')}
              </Text>

              <View className="space-y-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-700">{t('analytics.ordersGrowth')}</Text>
                  <View className="flex-row items-center">
                    <Ionicons
                      name={analytics.trends.ordersGrowth >= 0 ? 'trending-up' : 'trending-down'}
                      size={20}
                      color={analytics.trends.ordersGrowth >= 0 ? '#10B981' : '#EF4444'}
                    />
                    <Text className={`font-bold ml-1 ${analytics.trends.ordersGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {analytics.trends.ordersGrowth >= 0 ? '+' : ''}{analytics.trends.ordersGrowth.toFixed(1)}%
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-700">{t('analytics.revenueGrowth')}</Text>
                  <View className="flex-row items-center">
                    <Ionicons
                      name={analytics.trends.revenueGrowth >= 0 ? 'trending-up' : 'trending-down'}
                      size={20}
                      color={analytics.trends.revenueGrowth >= 0 ? '#10B981' : '#EF4444'}
                    />
                    <Text className={`font-bold ml-1 ${analytics.trends.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {analytics.trends.revenueGrowth >= 0 ? '+' : ''}{analytics.trends.revenueGrowth.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* By Status */}
            <View className="bg-white rounded-2xl p-4 border border-gray-200">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                {t('analytics.byStatus')}
              </Text>

              {analytics.byStatus.map((item, index) => (
                <View key={index} className="mb-3 last:mb-0">
                  <View className="flex-row items-center justify-between mb-1">
                    <View className="flex-row items-center">
                      <View
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: STATUS_COLORS[item.status] || '#9CA3AF' }}
                      />
                      <Text className="text-gray-700 capitalize">{item.status}</Text>
                    </View>
                    <Text className="text-gray-900 font-semibold">
                      {item.count} ({item.percentage.toFixed(1)}%)
                    </Text>
                  </View>
                  <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: STATUS_COLORS[item.status] || '#9CA3AF',
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* By Category */}
            <View className="bg-white rounded-2xl p-4 border border-gray-200">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                {t('analytics.byCategory')}
              </Text>

              {analytics.byCategory.map((item, index) => (
                <View key={index} className="flex-row items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <View className="flex-1">
                    <Text className="text-gray-900 font-medium">{item.category}</Text>
                    <Text className="text-sm text-gray-500 mt-1">
                      {item.orders} заказов • Средний чек: {item.avgValue.toLocaleString()} сом
                    </Text>
                  </View>
                  <Text className="text-lg font-bold text-gray-900 ml-3">
                    {item.revenue.toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>

            {/* Top Orders */}
            <View className="bg-white rounded-2xl p-4 border border-gray-200">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                {t('analytics.topOrders')}
              </Text>

              {analytics.topOrders.map((order, index) => (
                <View key={order.id} className="flex-row items-center py-3 border-b border-gray-100 last:border-0">
                  <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-3">
                    <Text className="text-blue-600 font-bold">{index + 1}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-medium">{order.title}</Text>
                    <Text className="text-sm text-gray-500 mt-1">
                      {new Date(order.date).toLocaleDateString('ru-RU')}
                    </Text>
                  </View>
                  <Text className="text-lg font-bold text-gray-900">
                    {order.revenue.toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
