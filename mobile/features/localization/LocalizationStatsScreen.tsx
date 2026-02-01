/**
 * Localization Statistics Screen
 * Экран статистики локализации
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGetLocalizationStatsQuery } from '../../services/localizationApi';
import { useTranslation } from '../../hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const LOCALES = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ky', name: 'Кыргызча', flag: '🇰🇬' },
];

export default function LocalizationStatsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: stats, isLoading, refetch } = useGetLocalizationStatsQuery();

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!stats) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text className="text-gray-600 mt-4">{t('localization.statsLoadFailed')}</Text>
        <TouchableOpacity
          className="mt-4 px-6 py-3 bg-blue-500 rounded-lg"
          onPress={() => refetch()}
        >
          <Text className="text-white font-medium">{t('retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">
          {t('localization.statistics')}
        </Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4 space-y-4">
          {/* Overview Cards */}
          <View className="flex-row space-x-4">
            <View className="flex-1 bg-white rounded-lg p-4 border border-gray-200">
              <View className="flex-row items-center mb-2">
                <Ionicons name="key-outline" size={20} color="#3B82F6" />
                <Text className="text-sm text-gray-600 ml-2">{t('localization.totalKeys')}</Text>
              </View>
              <Text className="text-3xl font-bold text-gray-900">{stats.totalKeys}</Text>
            </View>

            <View className="flex-1 bg-white rounded-lg p-4 border border-gray-200">
              <View className="flex-row items-center mb-2">
                <Ionicons name="language-outline" size={20} color="#10B981" />
                <Text className="text-sm text-gray-600 ml-2">{t('localization.languages')}</Text>
              </View>
              <Text className="text-3xl font-bold text-gray-900">
                {Object.keys(stats.locales || {}).length}
              </Text>
            </View>
          </View>

          {/* Locale Progress */}
          <View className="bg-white rounded-lg p-4 border border-gray-200">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-gray-900">
                {t('localization.localeProgress')}
              </Text>
              <TouchableOpacity onPress={() => refetch()}>
                <Ionicons name="refresh-outline" size={20} color="#3B82F6" />
              </TouchableOpacity>
            </View>

            {Object.entries(stats.locales || {}).map(([locale, data]: [string, any]) => {
              const localeInfo = LOCALES.find(l => l.code === locale);
              const percentage = data.percentage || 0;
              const color = percentage >= 90 ? '#10B981' : percentage >= 70 ? '#F59E0B' : '#EF4444';

              return (
                <View key={locale} className="mb-6 last:mb-0">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center">
                      <Text className="text-2xl mr-2">{localeInfo?.flag || '🌐'}</Text>
                      <Text className="text-base font-medium text-gray-900">
                        {localeInfo?.name || locale}
                      </Text>
                    </View>
                    <Text className="text-lg font-bold" style={{ color }}>
                      {percentage.toFixed(1)}%
                    </Text>
                  </View>

                  {/* Progress Bar */}
                  <View className="h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
                    <View
                      className="h-full rounded-full"
                      style={{ width: `${percentage}%`, backgroundColor: color }}
                    />
                  </View>

                  {/* Stats */}
                  <View className="flex-row justify-between">
                    <View className="flex-row items-center">
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      <Text className="text-sm text-gray-600 ml-1">
                        {data.translated} {t('localization.translated')}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons name="alert-circle" size={16} color="#EF4444" />
                      <Text className="text-sm text-gray-600 ml-1">
                        {data.missing} {t('localization.missing')}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Categories */}
          {stats.categories && Object.keys(stats.categories).length > 0 && (
            <View className="bg-white rounded-lg p-4 border border-gray-200">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                {t('localization.categories')}
              </Text>

              {Object.entries(stats.categories).map(([category, data]: [string, any]) => (
                <View key={category} className="mb-4 last:mb-0">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-base font-medium text-gray-900 capitalize">
                      {category}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      {data.total} {t('localization.keys')}
                    </Text>
                  </View>

                  {/* Locale breakdown */}
                  <View className="flex-row flex-wrap gap-2">
                    {Object.entries(data.translated || {}).map(([locale, count]: [string, any]) => {
                      const localeInfo = LOCALES.find(l => l.code === locale);
                      const percentage = (count / data.total) * 100;
                      
                      return (
                        <View
                          key={locale}
                          className="flex-row items-center bg-gray-100 rounded-full px-3 py-1"
                        >
                          <Text className="text-xs mr-1">{localeInfo?.flag || '🌐'}</Text>
                          <Text className="text-xs text-gray-700">
                            {count}/{data.total} ({percentage.toFixed(0)}%)
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Completion Chart */}
          <View className="bg-white rounded-lg p-4 border border-gray-200">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              {t('localization.completionOverview')}
            </Text>

            <View className="items-center">
              {Object.entries(stats.locales || {}).map(([locale, data]: [string, any], index) => {
                const localeInfo = LOCALES.find(l => l.code === locale);
                const percentage = data.percentage || 0;
                const barWidth = (width - 80) * (percentage / 100);

                return (
                  <View key={locale} className="w-full mb-3">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-sm font-medium text-gray-700">
                        {localeInfo?.flag} {localeInfo?.name}
                      </Text>
                      <Text className="text-sm text-gray-600">{percentage.toFixed(1)}%</Text>
                    </View>
                    <View className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                      <View
                        className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg items-center justify-center"
                        style={{ width: barWidth }}
                      >
                        {percentage > 10 && (
                          <Text className="text-white text-xs font-medium">
                            {data.translated}/{stats.totalKeys}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
