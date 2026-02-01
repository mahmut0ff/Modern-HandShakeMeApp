/**
 * Calendar Settings Screen
 * Экран настроек синхронизации календаря
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useGetCalendarIntegrationsQuery,
  useUpdateCalendarSettingsMutation,
} from '../../services/calendarApi';
import { useTranslation } from '../../hooks/useTranslation';

const SYNC_FREQUENCIES = [
  { value: 'REAL_TIME', label: 'В реальном времени' },
  { value: 'HOURLY', label: 'Каждый час' },
  { value: 'DAILY', label: 'Раз в день' },
];

const SYNC_DIRECTIONS = [
  { value: 'BIDIRECTIONAL', label: 'Двусторонняя', icon: 'swap-horizontal' },
  { value: 'TO_EXTERNAL', label: 'Только экспорт', icon: 'arrow-forward' },
  { value: 'FROM_EXTERNAL', label: 'Только импорт', icon: 'arrow-back' },
];

const CONFLICT_RESOLUTIONS = [
  { value: 'MANUAL', label: 'Вручную', desc: 'Вы решаете каждый конфликт' },
  { value: 'EXTERNAL_WINS', label: 'Приоритет календарю', desc: 'Внешний календарь важнее' },
  { value: 'INTERNAL_WINS', label: 'Приоритет HandShakeMe', desc: 'Наша система важнее' },
];

export default function CalendarSettingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const provider = params.provider as string;

  const { data: integrations, isLoading } = useGetCalendarIntegrationsQuery();
  const [updateSettings, { isLoading: isUpdating }] = useUpdateCalendarSettingsMutation();

  const integration = integrations?.integrations.find(i => i.provider === provider);

  const [settings, setSettings] = useState(integration?.settings || {
    syncDirection: 'BIDIRECTIONAL',
    syncFrequency: 'REAL_TIME',
    syncBookings: true,
    syncAvailability: true,
    syncPersonalEvents: false,
    conflictResolution: 'MANUAL',
    includeClientInfo: false,
    includeLocation: true,
    eventPrefix: '[HandShakeMe]',
    reminderMinutes: [15, 60],
  });

  useEffect(() => {
    if (integration?.settings) {
      setSettings(integration.settings);
    }
  }, [integration]);

  const handleSave = async () => {
    try {
      await updateSettings({
        provider: provider as any,
        action: 'UPDATE_SETTINGS',
        settings,
      }).unwrap();

      Alert.alert(t('success'), t('calendar.settingsUpdated'));
      router.back();
    } catch (error: any) {
      Alert.alert(t('error'), error.message || t('calendar.updateFailed'));
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!integration) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text className="text-gray-600 mt-4">{t('calendar.notFound')}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">
            {t('calendar.settings')}
          </Text>
        </View>
        <TouchableOpacity onPress={handleSave} disabled={isUpdating}>
          {isUpdating ? (
            <ActivityIndicator size="small" color="#3B82F6" />
          ) : (
            <Text className="text-blue-500 font-semibold">{t('save')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4 space-y-4">
          {/* Sync Direction */}
          <View className="bg-white rounded-2xl p-4 border border-gray-200">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              {t('calendar.syncDirection')}
            </Text>
            {SYNC_DIRECTIONS.map((dir) => (
              <TouchableOpacity
                key={dir.value}
                className={`flex-row items-center p-3 rounded-xl mb-2 last:mb-0 ${
                  settings.syncDirection === dir.value ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                }`}
                onPress={() => setSettings({ ...settings, syncDirection: dir.value as any })}
              >
                <Ionicons
                  name={dir.icon as any}
                  size={24}
                  color={settings.syncDirection === dir.value ? '#3B82F6' : '#6B7280'}
                />
                <Text className={`ml-3 font-medium ${
                  settings.syncDirection === dir.value ? 'text-blue-700' : 'text-gray-700'
                }`}>
                  {dir.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sync Frequency */}
          <View className="bg-white rounded-2xl p-4 border border-gray-200">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              {t('calendar.syncFrequency')}
            </Text>
            {SYNC_FREQUENCIES.map((freq) => (
              <TouchableOpacity
                key={freq.value}
                className={`p-3 rounded-xl mb-2 last:mb-0 ${
                  settings.syncFrequency === freq.value ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                }`}
                onPress={() => setSettings({ ...settings, syncFrequency: freq.value as any })}
              >
                <Text className={`font-medium ${
                  settings.syncFrequency === freq.value ? 'text-blue-700' : 'text-gray-700'
                }`}>
                  {freq.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* What to Sync */}
          <View className="bg-white rounded-2xl p-4 border border-gray-200">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              {t('calendar.whatToSync')}
            </Text>
            <View className="space-y-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-900">{t('calendar.syncBookings')}</Text>
                <Switch
                  value={settings.syncBookings}
                  onValueChange={(value) => setSettings({ ...settings, syncBookings: value })}
                  trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                />
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-900">{t('calendar.syncAvailability')}</Text>
                <Switch
                  value={settings.syncAvailability}
                  onValueChange={(value) => setSettings({ ...settings, syncAvailability: value })}
                  trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                />
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-900">{t('calendar.syncPersonalEvents')}</Text>
                <Switch
                  value={settings.syncPersonalEvents}
                  onValueChange={(value) => setSettings({ ...settings, syncPersonalEvents: value })}
                  trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                />
              </View>
            </View>
          </View>

          {/* Conflict Resolution */}
          <View className="bg-white rounded-2xl p-4 border border-gray-200">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              {t('calendar.conflictResolution')}
            </Text>
            {CONFLICT_RESOLUTIONS.map((res) => (
              <TouchableOpacity
                key={res.value}
                className={`p-3 rounded-xl mb-2 last:mb-0 ${
                  settings.conflictResolution === res.value ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                }`}
                onPress={() => setSettings({ ...settings, conflictResolution: res.value as any })}
              >
                <Text className={`font-medium ${
                  settings.conflictResolution === res.value ? 'text-blue-700' : 'text-gray-700'
                }`}>
                  {res.label}
                </Text>
                <Text className="text-sm text-gray-500 mt-1">{res.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Privacy */}
          <View className="bg-white rounded-2xl p-4 border border-gray-200">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              {t('calendar.privacy')}
            </Text>
            <View className="space-y-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-900">{t('calendar.includeClientInfo')}</Text>
                <Switch
                  value={settings.includeClientInfo}
                  onValueChange={(value) => setSettings({ ...settings, includeClientInfo: value })}
                  trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                />
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-900">{t('calendar.includeLocation')}</Text>
                <Switch
                  value={settings.includeLocation}
                  onValueChange={(value) => setSettings({ ...settings, includeLocation: value })}
                  trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
