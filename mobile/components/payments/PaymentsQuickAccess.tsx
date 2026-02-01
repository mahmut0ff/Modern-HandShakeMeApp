/**
 * Payments Quick Access Component
 * Компонент быстрого доступа к платежам
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../../hooks/useTranslation';

export default function PaymentsQuickAccess() {
  const router = useRouter();
  const { t } = useTranslation();

  // Mock data - replace with actual API
  const stats = {
    activeHolds: 2,
    totalHeld: 40700,
    pendingReleases: 1,
  };

  return (
    <View className="bg-white rounded-2xl p-4 border border-gray-200">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <Ionicons name="shield-checkmark" size={24} color="#3B82F6" />
          <Text className="text-lg font-semibold text-gray-900 ml-2">
            {t('payments.escrow')}
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(master)/payments/history')}>
          <Ionicons name="time-outline" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View className="flex-row space-x-3 mb-4">
        <View className="flex-1 bg-blue-50 rounded-xl p-3">
          <Text className="text-xs text-blue-600 mb-1">{t('payments.totalHeld')}</Text>
          <Text className="text-lg font-bold text-blue-900">
            {(stats.totalHeld / 1000).toFixed(0)}K
          </Text>
        </View>
        <View className="flex-1 bg-green-50 rounded-xl p-3">
          <Text className="text-xs text-green-600 mb-1">{t('payments.activeHolds')}</Text>
          <Text className="text-lg font-bold text-green-900">
            {stats.activeHolds}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View className="flex-row space-x-2">
        <TouchableOpacity
          className="flex-1 py-3 bg-blue-500 rounded-xl"
          onPress={() => router.push('/(master)/payments/holds')}
        >
          <Text className="text-white text-center font-medium text-sm">
            {t('payments.holds')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 py-3 bg-gray-100 rounded-xl"
          onPress={() => router.push('/(master)/payments/escrow')}
        >
          <Text className="text-gray-700 text-center font-medium text-sm">
            {t('payments.escrow')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
