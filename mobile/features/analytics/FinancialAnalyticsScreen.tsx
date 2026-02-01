/**
 * Financial Analytics Screen
 * Экран финансовой аналитики
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
import { useGetFinancialAnalyticsQuery } from '../../services/analyticsApi';
import { useTranslation } from '../../hooks/useTranslation';

const PERIODS = [
  { key: 'month', label: 'Месяц', days: 30 },
  { key: 'quarter', label: 'Квартал', days: 90 },
  { key: 'year', label: 'Год', days: 365 },
];

export default function FinancialAnalyticsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const period = PERIODS.find(p => p.key === selectedPeriod);
  const endDate = new Date().toISOString();
  const startDate = new Date(Date.now() - period!.days * 24 * 60 * 60 * 1000).toISOString();

  const { data: analytics, isLoading } = useGetFinancialAnalyticsQuery({
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
          {t('analytics.financial')}
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
            {/* Main Balance */}
            <View className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6">
              <Text className="text-white/80 text-sm mb-2">{t('analytics.netIncome')}</Text>
              <Text className="text-white text-4xl font-bold mb-4">
                {analytics.summary.netIncome.toLocaleString()} сом
              </Text>
              <View className="flex-row items-center">
                <View className="flex-1 mr-2">
                  <Text className="text-white/80 text-xs">{t('analytics.available')}</Text>
                  <Text className="text-white text-lg font-semibold">
                    {analytics.summary.availableBalance.toLocaleString()}
                  </Text>
                </View>
                <View className="flex-1 ml-2">
                  <Text className="text-white/80 text-xs">{t('analytics.pending')}</Text>
                  <Text className="text-white text-lg font-semibold">
                    {analytics.summary.pendingPayments.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Summary Cards */}
            <View className="flex-row space-x-3">
              <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-200">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="trending-up" size={20} color="#10B981" />
                  <Text className="text-gray-600 text-sm ml-2">{t('analytics.earnings')}</Text>
                </View>
                <Text className="text-gray-900 text-xl font-bold">
                  {analytics.summary.totalEarnings.toLocaleString()}
                </Text>
              </View>

              <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-200">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="trending-down" size={20} color="#EF4444" />
                  <Text className="text-gray-600 text-sm ml-2">{t('analytics.withdrawals')}</Text>
                </View>
                <Text className="text-gray-900 text-xl font-bold">
                  {analytics.summary.totalWithdrawals.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Earnings Breakdown */}
            <View className="bg-white rounded-2xl p-4 border border-gray-200">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                {t('analytics.earningsBreakdown')}
              </Text>

              <View className="space-y-3">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                    <Text className="text-gray-700">{t('analytics.fromOrders')}</Text>
                  </View>
                  <Text className="text-gray-900 font-semibold">
                    {analytics.breakdown.earnings.fromOrders.toLocaleString()} сом
                  </Text>
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="w-2 h-2 bg-purple-500 rounded-full mr-2" />
                    <Text className="text-gray-700">{t('analytics.fromProjects')}</Text>
                  </View>
                  <Text className="text-gray-900 font-semibold">
                    {analytics.breakdown.earnings.fromProjects.toLocaleString()} сом
                  </Text>
                </View>
              </View>
            </View>

            {/* Deductions */}
            <View className="bg-white rounded-2xl p-4 border border-gray-200">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                {t('analytics.deductions')}
              </Text>

              <View className="space-y-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-700">{t('analytics.platformFee')}</Text>
                  <Text className="text-red-600 font-semibold">
                    -{analytics.breakdown.deductions.platformFee.toLocaleString()} сом
                  </Text>
                </View>

                {analytics.breakdown.deductions.taxes > 0 && (
                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-700">{t('analytics.taxes')}</Text>
                    <Text className="text-red-600 font-semibold">
                      -{analytics.breakdown.deductions.taxes.toLocaleString()} сом
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Cash Flow */}
            <View className="bg-white rounded-2xl p-4 border border-gray-200">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                {t('analytics.cashFlow')}
              </Text>

              <View className="h-40 flex-row items-end justify-between">
                {analytics.cashFlow.slice(-5).map((item, index) => {
                  const maxValue = Math.max(...analytics.cashFlow.map(i => i.net));
                  const height = (item.net / maxValue) * 100;
                  
                  return (
                    <View key={index} className="flex-1 items-center mx-1">
                      <View className="w-full items-center mb-2">
                        <Text className="text-xs font-semibold text-gray-900">
                          {(item.net / 1000).toFixed(0)}K
                        </Text>
                      </View>
                      <View
                        className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg"
                        style={{ height: `${height}%` }}
                      />
                      <Text className="text-xs text-gray-500 mt-2">
                        {item.date.split('-')[1]}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Projections */}
            <View className="bg-white rounded-2xl p-4 border border-gray-200">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                {t('analytics.projections')}
              </Text>

              <View className="space-y-4">
                <View className="bg-blue-50 rounded-xl p-4">
                  <Text className="text-sm text-gray-600 mb-2">{t('analytics.nextMonth')}</Text>
                  <Text className="text-2xl font-bold text-gray-900">
                    {analytics.projections.nextMonth.estimatedNet.toLocaleString()} сом
                  </Text>
                  <View className="flex-row items-center mt-2">
                    <View className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <View
                        className="h-full bg-blue-500"
                        style={{ width: `${analytics.projections.nextMonth.confidence * 100}%` }}
                      />
                    </View>
                    <Text className="text-xs text-gray-600 ml-2">
                      {(analytics.projections.nextMonth.confidence * 100).toFixed(0)}% уверенность
                    </Text>
                  </View>
                </View>

                <View className="bg-purple-50 rounded-xl p-4">
                  <Text className="text-sm text-gray-600 mb-2">{t('analytics.nextQuarter')}</Text>
                  <Text className="text-2xl font-bold text-gray-900">
                    {analytics.projections.nextQuarter.estimatedNet.toLocaleString()} сом
                  </Text>
                  <View className="flex-row items-center mt-2">
                    <View className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <View
                        className="h-full bg-purple-500"
                        style={{ width: `${analytics.projections.nextQuarter.confidence * 100}%` }}
                      />
                    </View>
                    <Text className="text-xs text-gray-600 ml-2">
                      {(analytics.projections.nextQuarter.confidence * 100).toFixed(0)}% уверенность
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Insights */}
            {analytics.insights.length > 0 && (
              <View className="bg-white rounded-2xl p-4 border border-gray-200">
                <Text className="text-lg font-semibold text-gray-900 mb-4">
                  {t('analytics.insights')}
                </Text>

                {analytics.insights.map((insight, index) => (
                  <View
                    key={index}
                    className={`p-3 rounded-xl mb-3 last:mb-0 ${
                      insight.impact === 'positive' ? 'bg-green-50' :
                      insight.impact === 'negative' ? 'bg-red-50' : 'bg-yellow-50'
                    }`}
                  >
                    <View className="flex-row items-start">
                      <Ionicons
                        name={
                          insight.type === 'opportunity' ? 'bulb' :
                          insight.type === 'warning' ? 'alert-circle' : 'information-circle'
                        }
                        size={20}
                        color={
                          insight.impact === 'positive' ? '#10B981' :
                          insight.impact === 'negative' ? '#EF4444' : '#F59E0B'
                        }
                      />
                      <View className="flex-1 ml-3">
                        <Text className="font-semibold text-gray-900 mb-1">
                          {insight.title}
                        </Text>
                        <Text className="text-sm text-gray-700">
                          {insight.description}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
