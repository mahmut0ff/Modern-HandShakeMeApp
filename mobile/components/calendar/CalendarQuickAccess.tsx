/**
 * Calendar Quick Access Component
 * Компонент быстрого доступа к календарю
 */

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGetCalendarIntegrationsQuery } from '../../services/calendarApi';
import { useTranslation } from '../../hooks/useTranslation';

export default function CalendarQuickAccess() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: integrations, isLoading } = useGetCalendarIntegrationsQuery();

  const activeIntegrations = integrations?.integrations.filter(i => i.isActive) || [];
  const hasConnected = activeIntegrations.length > 0;

  return (
    <TouchableOpacity
      className="bg-white rounded-2xl p-4 border border-gray-200"
      onPress={() => router.push('/(master)/calendar/sync')}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Ionicons name="calendar" size={24} color="#3B82F6" />
          <Text className="text-lg font-semibold text-gray-900 ml-2">
            {t('calendar.sync')}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>

      {isLoading ? (
        <ActivityIndicator size="small" color="#3B82F6" />
      ) : hasConnected ? (
        <View className="space-y-2">
          {activeIntegrations.map((integration) => (
            <View key={integration.id} className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                <Text className="text-sm text-gray-700">{integration.calendarName}</Text>
              </View>
              {integration.lastSyncAt && (
                <Text className="text-xs text-gray-500">
                  {new Date(integration.lastSyncAt).toLocaleDateString('ru-RU')}
                </Text>
              )}
            </View>
          ))}
        </View>
      ) : (
        <View className="flex-row items-center">
          <Ionicons name="add-circle-outline" size={20} color="#3B82F6" />
          <Text className="text-sm text-blue-600 ml-2">
            {t('calendar.addCalendar')}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
