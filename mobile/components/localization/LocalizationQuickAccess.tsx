/**
 * Localization Quick Access Component
 * Компонент быстрого доступа к управлению переводами
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../../hooks/useTranslation';
import { useGetLocalizationStatsQuery } from '../../services/localizationApi';

export default function LocalizationQuickAccess() {
  const router = useRouter();
  const { t, currentLanguage } = useTranslation();
  const { data: stats } = useGetLocalizationStatsQuery();

  const currentLocaleStats = stats?.locales?.[currentLanguage];
  const completionPercentage = currentLocaleStats?.percentage || 0;

  return (
    <View className="bg-white rounded-lg p-4 border border-gray-200">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Ionicons name="language" size={24} color="#3B82F6" />
          <Text className="text-lg font-semibold text-gray-900 ml-2">
            {t('localization.management')}
          </Text>
        </View>
        {stats && (
          <View className="bg-blue-100 px-3 py-1 rounded-full">
            <Text className="text-blue-700 text-sm font-medium">
              {completionPercentage.toFixed(0)}%
            </Text>
          </View>
        )}
      </View>

      <View className="space-y-2">
        <TouchableOpacity
          className="flex-row items-center justify-between py-3 border-b border-gray-100"
          onPress={() => router.push('/(master)/localization')}
        >
          <View className="flex-row items-center">
            <Ionicons name="text-outline" size={20} color="#6B7280" />
            <Text className="text-gray-700 ml-3">{t('localization.translations')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center justify-between py-3 border-b border-gray-100"
          onPress={() => router.push('/(master)/localization-stats')}
        >
          <View className="flex-row items-center">
            <Ionicons name="stats-chart-outline" size={20} color="#6B7280" />
            <Text className="text-gray-700 ml-3">{t('localization.statistics')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center justify-between py-3"
          onPress={() => router.push('/(master)/localization-editor')}
        >
          <View className="flex-row items-center">
            <Ionicons name="add-circle-outline" size={20} color="#6B7280" />
            <Text className="text-gray-700 ml-3">{t('localization.newTranslation')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {stats && (
        <View className="mt-3 pt-3 border-t border-gray-100">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-gray-600">
              {t('localization.totalKeys')}: {stats.totalKeys}
            </Text>
            <Text className="text-sm text-gray-600">
              {Object.keys(stats.locales || {}).length} {t('localization.languages')}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
