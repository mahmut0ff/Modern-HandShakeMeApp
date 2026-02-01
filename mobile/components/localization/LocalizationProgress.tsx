/**
 * Localization Progress Component
 * Компонент отображения прогресса локализации
 */

import React from 'react';
import { View, Text } from 'react-native';
import { useGetLocalizationStatsQuery } from '../../services/localizationApi';
import { useTranslation } from '../../hooks/useTranslation';

interface LocalizationProgressProps {
  locale?: string;
  showDetails?: boolean;
}

export default function LocalizationProgress({ 
  locale, 
  showDetails = false 
}: LocalizationProgressProps) {
  const { currentLanguage } = useTranslation();
  const { data: stats, isLoading } = useGetLocalizationStatsQuery();

  const targetLocale = locale || currentLanguage;
  const localeStats = stats?.locales?.[targetLocale];

  if (isLoading || !localeStats) {
    return null;
  }

  const percentage = localeStats.percentage || 0;
  const color = percentage >= 90 ? '#10B981' : percentage >= 70 ? '#F59E0B' : '#EF4444';

  return (
    <View className="w-full">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm font-medium text-gray-700">
          {targetLocale.toUpperCase()}
        </Text>
        <Text className="text-sm font-semibold" style={{ color }}>
          {percentage.toFixed(1)}%
        </Text>
      </View>

      <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </View>

      {showDetails && (
        <View className="flex-row justify-between mt-1">
          <Text className="text-xs text-gray-500">
            ✓ {localeStats.translated}
          </Text>
          <Text className="text-xs text-gray-500">
            ✗ {localeStats.missing}
          </Text>
        </View>
      )}
    </View>
  );
}
