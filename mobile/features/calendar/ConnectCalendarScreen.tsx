/**
 * Connect Calendar Screen
 * Экран подключения календаря
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useConnectCalendarMutation } from '../../services/calendarApi';
import { useTranslation } from '../../hooks/useTranslation';
import * as WebBrowser from 'expo-web-browser';

export default function ConnectCalendarScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const provider = params.provider as string;

  const [connectCalendar, { isLoading }] = useConnectCalendarMutation();

  // Settings
  const [syncBookings, setSyncBookings] = useState(true);
  const [syncAvailability, setSyncAvailability] = useState(true);
  const [syncPersonalEvents, setSyncPersonalEvents] = useState(false);
  const [includeClientInfo, setIncludeClientInfo] = useState(false);
  const [includeLocation, setIncludeLocation] = useState(true);

  // OAuth flow
  const handleOAuthConnect = async () => {
    try {
      // In production, this would open OAuth flow
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code&scope=https://www.googleapis.com/auth/calendar`;
      
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'handshakeme://oauth-callback'
      );

      if (result.type === 'success') {
        // Extract auth code from URL
        const code = new URL(result.url).searchParams.get('code');
        
        if (code) {
          await handleConnect(code);
        }
      }
    } catch (error) {
      Alert.alert(t('error'), t('calendar.authFailed'));
    }
  };

  const handleConnect = async (authCode?: string) => {
    try {
      const result = await connectCalendar({
        provider: provider as any,
        action: 'CONNECT',
        credentials: {
          accessToken: authCode || 'mock_token', // In production, exchange code for token
        },
        settings: {
          syncBookings,
          syncAvailability,
          syncPersonalEvents,
          includeClientInfo,
          includeLocation,
          syncDirection: 'BIDIRECTIONAL',
          syncFrequency: 'REAL_TIME',
          conflictResolution: 'MANUAL',
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          eventPrefix: '[HandShakeMe]',
          reminderMinutes: [15, 60],
        },
      }).unwrap();

      Alert.alert(
        t('success'),
        `${t('calendar.connected')}\n${result.syncResult.eventsImported} ${t('calendar.eventsImported')}`,
        [
          {
            text: t('ok'),
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(t('error'), error.message || t('calendar.connectFailed'));
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">
          {t('calendar.connect')} {provider}
        </Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4 space-y-4">
          {/* Instructions */}
          <View className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={24} color="#3B82F6" />
              <View className="flex-1 ml-3">
                <Text className="text-blue-900 font-medium mb-2">
                  {t('calendar.connectInstructions')}
                </Text>
                <Text className="text-blue-700 text-sm">
                  {provider === 'GOOGLE' && t('calendar.googleInstructions')}
                  {provider === 'OUTLOOK' && t('calendar.outlookInstructions')}
                  {provider === 'APPLE' && t('calendar.appleInstructions')}
                </Text>
              </View>
            </View>
          </View>

          {/* Sync Settings */}
          <View className="bg-white rounded-2xl p-4 border border-gray-200">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              {t('calendar.syncSettings')}
            </Text>

            <View className="space-y-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-gray-900 font-medium">
                    {t('calendar.syncBookings')}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    {t('calendar.syncBookingsDesc')}
                  </Text>
                </View>
                <Switch
                  value={syncBookings}
                  onValueChange={setSyncBookings}
                  trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                />
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-gray-900 font-medium">
                    {t('calendar.syncAvailability')}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    {t('calendar.syncAvailabilityDesc')}
                  </Text>
                </View>
                <Switch
                  value={syncAvailability}
                  onValueChange={setSyncAvailability}
                  trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                />
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-gray-900 font-medium">
                    {t('calendar.syncPersonalEvents')}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    {t('calendar.syncPersonalEventsDesc')}
                  </Text>
                </View>
                <Switch
                  value={syncPersonalEvents}
                  onValueChange={setSyncPersonalEvents}
                  trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                />
              </View>
            </View>
          </View>

          {/* Privacy Settings */}
          <View className="bg-white rounded-2xl p-4 border border-gray-200">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              {t('calendar.privacySettings')}
            </Text>

            <View className="space-y-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-gray-900 font-medium">
                    {t('calendar.includeClientInfo')}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    {t('calendar.includeClientInfoDesc')}
                  </Text>
                </View>
                <Switch
                  value={includeClientInfo}
                  onValueChange={setIncludeClientInfo}
                  trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                />
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-gray-900 font-medium">
                    {t('calendar.includeLocation')}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    {t('calendar.includeLocationDesc')}
                  </Text>
                </View>
                <Switch
                  value={includeLocation}
                  onValueChange={setIncludeLocation}
                  trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                />
              </View>
            </View>
          </View>

          {/* Warning */}
          <View className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
            <View className="flex-row items-start">
              <Ionicons name="warning" size={24} color="#F59E0B" />
              <View className="flex-1 ml-3">
                <Text className="text-yellow-900 font-medium mb-1">
                  {t('calendar.permissionsRequired')}
                </Text>
                <Text className="text-yellow-700 text-sm">
                  {t('calendar.permissionsDesc')}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Connect Button */}
      <View className="bg-white border-t border-gray-200 p-4">
        <TouchableOpacity
          className={`py-4 rounded-lg ${isLoading ? 'bg-blue-300' : 'bg-blue-500'}`}
          onPress={handleOAuthConnect}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-semibold text-lg">
              {t('calendar.connectButton')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
