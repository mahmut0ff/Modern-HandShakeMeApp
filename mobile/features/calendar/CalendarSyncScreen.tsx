/**
 * Calendar Sync Screen
 * Экран синхронизации календаря
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useGetCalendarIntegrationsQuery,
  useGetCalendarProvidersQuery,
  useSyncCalendarMutation,
  useDisconnectCalendarMutation,
} from '../../services/calendarApi';
import { useTranslation } from '../../hooks/useTranslation';

const PROVIDER_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  GOOGLE: 'logo-google',
  OUTLOOK: 'mail',
  APPLE: 'logo-apple',
  CALDAV: 'calendar',
};

const PROVIDER_COLORS: Record<string, string> = {
  GOOGLE: '#4285F4',
  OUTLOOK: '#0078D4',
  APPLE: '#000000',
  CALDAV: '#6B7280',
};

export default function CalendarSyncScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  
  const { data: integrations, isLoading, refetch } = useGetCalendarIntegrationsQuery();
  const { data: providers } = useGetCalendarProvidersQuery();
  const [syncCalendar, { isLoading: isSyncing }] = useSyncCalendarMutation();
  const [disconnectCalendar, { isLoading: isDisconnecting }] = useDisconnectCalendarMutation();

  const handleSync = async (provider: string) => {
    try {
      const result = await syncCalendar({
        provider: provider as any,
        action: 'SYNC',
      }).unwrap();

      Alert.alert(
        t('success'),
        `${t('calendar.synced')}\n${result.syncResult.eventsImported} ${t('calendar.eventsImported')}`
      );
      
      if (result.conflicts.length > 0) {
        Alert.alert(
          t('calendar.conflicts'),
          `${result.conflicts.length} ${t('calendar.conflictsFound')}`
        );
      }
    } catch (error: any) {
      Alert.alert(t('error'), error.message || t('calendar.syncFailed'));
    }
  };

  const handleDisconnect = (provider: string, calendarName: string) => {
    Alert.alert(
      t('calendar.disconnect'),
      `${t('calendar.disconnectConfirm')} ${calendarName}?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('disconnect'),
          style: 'destructive',
          onPress: async () => {
            try {
              await disconnectCalendar({
                provider: provider as any,
                action: 'DISCONNECT',
              }).unwrap();
              Alert.alert(t('success'), t('calendar.disconnected'));
              refetch();
            } catch (error: any) {
              Alert.alert(t('error'), error.message || t('calendar.disconnectFailed'));
            }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">
          {t('calendar.sync')}
        </Text>
      </View>

      <ScrollView className="flex-1">
        {isLoading ? (
          <View className="flex-1 items-center justify-center py-12">
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : (
          <View className="p-4 space-y-4">
            {/* Connected Calendars */}
            {integrations && integrations.integrations.length > 0 && (
              <View className="bg-white rounded-2xl p-4 border border-gray-200">
                <Text className="text-lg font-semibold text-gray-900 mb-4">
                  {t('calendar.connected')}
                </Text>

                {integrations.integrations.map((integration) => (
                  <View
                    key={integration.id}
                    className="mb-4 last:mb-0 p-4 bg-gray-50 rounded-xl"
                  >
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center flex-1">
                        <View
                          className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                          style={{ backgroundColor: `${PROVIDER_COLORS[integration.provider]}20` }}
                        >
                          <Ionicons
                            name={PROVIDER_ICONS[integration.provider]}
                            size={24}
                            color={PROVIDER_COLORS[integration.provider]}
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="text-gray-900 font-semibold">
                            {integration.calendarName}
                          </Text>
                          <Text className="text-sm text-gray-500">
                            {integration.provider}
                          </Text>
                        </View>
                      </View>
                      <View
                        className={`px-3 py-1 rounded-full ${
                          integration.isActive ? 'bg-green-100' : 'bg-gray-100'
                        }`}
                      >
                        <Text
                          className={`text-xs font-medium ${
                            integration.isActive ? 'text-green-700' : 'text-gray-700'
                          }`}
                        >
                          {integration.isActive ? t('calendar.active') : t('calendar.inactive')}
                        </Text>
                      </View>
                    </View>

                    {/* Sync Stats */}
                    {integration.syncStats && (
                      <View className="mb-3 p-3 bg-white rounded-lg">
                        <Text className="text-xs text-gray-600 mb-2">
                          {t('calendar.lastSync')}: {integration.lastSyncAt ? new Date(integration.lastSyncAt).toLocaleString('ru-RU') : t('calendar.never')}
                        </Text>
                        <View className="flex-row flex-wrap gap-2">
                          <View className="flex-row items-center">
                            <Ionicons name="arrow-down" size={12} color="#10B981" />
                            <Text className="text-xs text-gray-600 ml-1">
                              {integration.syncStats.eventsImported} {t('calendar.imported')}
                            </Text>
                          </View>
                          <View className="flex-row items-center">
                            <Ionicons name="arrow-up" size={12} color="#3B82F6" />
                            <Text className="text-xs text-gray-600 ml-1">
                              {integration.syncStats.eventsExported} {t('calendar.exported')}
                            </Text>
                          </View>
                          {integration.syncStats.conflictsFound > 0 && (
                            <View className="flex-row items-center">
                              <Ionicons name="alert-circle" size={12} color="#EF4444" />
                              <Text className="text-xs text-gray-600 ml-1">
                                {integration.syncStats.conflictsFound} {t('calendar.conflicts')}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    )}

                    {/* Actions */}
                    <View className="flex-row space-x-2">
                      <TouchableOpacity
                        className="flex-1 py-2 bg-blue-500 rounded-lg"
                        onPress={() => handleSync(integration.provider)}
                        disabled={isSyncing}
                      >
                        {isSyncing ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <Text className="text-white text-center font-medium">
                            {t('calendar.syncNow')}
                          </Text>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="flex-1 py-2 bg-gray-200 rounded-lg"
                        onPress={() => router.push({
                          pathname: '/(master)/calendar/settings',
                          params: { provider: integration.provider }
                        })}
                      >
                        <Text className="text-gray-700 text-center font-medium">
                          {t('calendar.settings')}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="px-4 py-2 bg-red-100 rounded-lg"
                        onPress={() => handleDisconnect(integration.provider, integration.calendarName)}
                        disabled={isDisconnecting}
                      >
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Available Providers */}
            <View className="bg-white rounded-2xl p-4 border border-gray-200">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                {t('calendar.addCalendar')}
              </Text>

              {providers?.providers.map((provider) => {
                const isConnected = integrations?.integrations.some(
                  (i) => i.provider === provider.id && i.isActive
                );

                return (
                  <TouchableOpacity
                    key={provider.id}
                    className={`mb-3 last:mb-0 p-4 rounded-xl border ${
                      isConnected ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'
                    }`}
                    onPress={() => {
                      if (!isConnected) {
                        router.push({
                          pathname: '/(master)/calendar/connect',
                          params: { provider: provider.id }
                        });
                      }
                    }}
                    disabled={isConnected || !provider.isSupported}
                  >
                    <View className="flex-row items-center">
                      <View
                        className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                        style={{ backgroundColor: `${PROVIDER_COLORS[provider.id]}20` }}
                      >
                        <Ionicons
                          name={PROVIDER_ICONS[provider.id]}
                          size={24}
                          color={PROVIDER_COLORS[provider.id]}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-900 font-semibold">{provider.name}</Text>
                        <Text className="text-sm text-gray-500">{provider.description}</Text>
                      </View>
                      {isConnected ? (
                        <View className="px-3 py-1 bg-green-100 rounded-full">
                          <Text className="text-xs font-medium text-green-700">
                            {t('calendar.connected')}
                          </Text>
                        </View>
                      ) : provider.isSupported ? (
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                      ) : (
                        <Text className="text-xs text-gray-400">{t('calendar.comingSoon')}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Info */}
            <View className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <View className="flex-row items-start">
                <Ionicons name="information-circle" size={24} color="#3B82F6" />
                <View className="flex-1 ml-3">
                  <Text className="text-blue-900 font-medium mb-1">
                    {t('calendar.syncInfo')}
                  </Text>
                  <Text className="text-blue-700 text-sm">
                    {t('calendar.syncDescription')}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
