import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Share as RNShare,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TrackingMap } from '../components/TrackingMap';
import {
  locationTrackingApi,
  LocationTracking,
  LocationCoordinates,
} from '../../../services/locationTrackingApi';

interface SharedTrackingScreenProps {
  shareCode?: string;
  trackingId?: string;
  onBack?: () => void;
}

export const SharedTrackingScreen: React.FC<SharedTrackingScreenProps> = ({
  shareCode,
  trackingId,
  onBack,
}) => {
  const [tracking, setTracking] = useState<LocationTracking | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationCoordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [permissions, setPermissions] = useState({
    canViewHistory: false,
    canViewRealTime: false,
    canViewStats: false,
  });
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (shareCode && trackingId) {
      loadSharedTracking();
      
      // Auto-refresh every 10 seconds if live
      const interval = setInterval(() => {
        if (isLive) {
          loadSharedTracking();
        }
      }, 10000);
      
      setRefreshInterval(interval);

      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    }
  }, [shareCode, trackingId, isLive]);

  const loadSharedTracking = async () => {
    if (!shareCode || !trackingId) return;

    try {
      setLoading(true);
      const response = await locationTrackingApi.getSharedTracking({
        shareCode,
        trackingId,
      });

      setTracking(response.tracking);
      setCurrentLocation(response.location);
      setIsLive(response.isLive);
      setPermissions(response.permissions);
    } catch (error: any) {
      console.error('Error loading shared tracking:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить отслеживание');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!shareCode || !trackingId) return;

    const url = `${process.env.EXPO_PUBLIC_WEB_URL}/tracking/${trackingId}?code=${shareCode}`;

    try {
      await RNShare.share({
        message: `Отслеживайте мое местоположение в реальном времени: ${url}`,
        url,
        title: 'Поделиться местоположением',
      });
    } catch (error: any) {
      if (error.message !== 'User did not share') {
        Alert.alert('Ошибка', 'Не удалось поделиться ссылкой');
      }
    }
  };

  const handleCopyLink = () => {
    if (!shareCode || !trackingId) return;

    const url = `${process.env.EXPO_PUBLIC_WEB_URL}/tracking/${trackingId}?code=${shareCode}`;
    Clipboard.setString(url);
    Alert.alert('Успешно', 'Ссылка скопирована в буфер обмена');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#0165FB" />
        <Text className="text-gray-600 mt-4">Загрузка...</Text>
      </SafeAreaView>
    );
  }

  if (!tracking) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center p-6">
          <View className="w-20 h-20 rounded-full bg-red-100 items-center justify-center mb-4">
            <Ionicons name="alert-circle" size={40} color="#EF4444" />
          </View>
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            Отслеживание недоступно
          </Text>
          <Text className="text-center text-gray-600 mb-6">
            Ссылка может быть недействительной или срок ее действия истек
          </Text>
          {onBack && (
            <TouchableOpacity
              onPress={onBack}
              className="bg-blue-500 rounded-xl py-3 px-6"
            >
              <Text className="text-white font-semibold">Назад</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row items-center justify-between border-b border-gray-200">
        <View className="flex-row items-center flex-1">
          {onBack && (
            <TouchableOpacity onPress={onBack} className="mr-3">
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
          )}
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900">
              Отслеживание
            </Text>
            {isLive && (
              <View className="flex-row items-center mt-1">
                <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                <Text className="text-xs text-green-600 font-medium">
                  В реальном времени
                </Text>
              </View>
            )}
          </View>
        </View>
        <View className="flex-row space-x-2">
          <TouchableOpacity onPress={handleCopyLink} className="p-2">
            <Ionicons name="copy-outline" size={24} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} className="p-2">
            <Ionicons name="share-outline" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Map */}
        {permissions.canViewRealTime && currentLocation && (
          <View className="h-96">
            <TrackingMap
              currentLocation={currentLocation}
              showRoute={false}
            />
          </View>
        )}

        {/* Content */}
        <View className="p-4">
          {/* Status Card */}
          <View className="bg-white rounded-2xl p-6 shadow-sm mb-4">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <View
                  className={`px-3 py-1.5 rounded-full ${
                    tracking.status === 'ACTIVE'
                      ? 'bg-green-100'
                      : tracking.status === 'COMPLETED'
                      ? 'bg-blue-100'
                      : 'bg-gray-100'
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      tracking.status === 'ACTIVE'
                        ? 'text-green-700'
                        : tracking.status === 'COMPLETED'
                        ? 'text-blue-700'
                        : 'text-gray-700'
                    }`}
                  >
                    {tracking.status === 'ACTIVE'
                      ? 'Активно'
                      : tracking.status === 'COMPLETED'
                      ? 'Завершено'
                      : 'Остановлено'}
                  </Text>
                </View>
              </View>
            </View>

            <View className="space-y-3">
              <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
                <Text className="text-sm text-gray-600">Начало</Text>
                <Text className="text-sm font-medium text-gray-900">
                  {formatDate(tracking.startedAt)}
                </Text>
              </View>

              {tracking.endedAt && (
                <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
                  <Text className="text-sm text-gray-600">Окончание</Text>
                  <Text className="text-sm font-medium text-gray-900">
                    {formatDate(tracking.endedAt)}
                  </Text>
                </View>
              )}

              {tracking.lastUpdateAt && (
                <View className="flex-row items-center justify-between py-2">
                  <Text className="text-sm text-gray-600">Последнее обновление</Text>
                  <Text className="text-sm font-medium text-gray-900">
                    {formatDate(tracking.lastUpdateAt)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Location Info */}
          {permissions.canViewRealTime && currentLocation && (
            <View className="bg-white rounded-2xl p-6 shadow-sm mb-4">
              <Text className="text-lg font-bold text-gray-900 mb-4">
                Текущее местоположение
              </Text>
              <View className="space-y-3">
                <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
                  <Text className="text-sm text-gray-600">Широта</Text>
                  <Text className="text-sm font-medium text-gray-900">
                    {currentLocation.latitude.toFixed(6)}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
                  <Text className="text-sm text-gray-600">Долгота</Text>
                  <Text className="text-sm font-medium text-gray-900">
                    {currentLocation.longitude.toFixed(6)}
                  </Text>
                </View>
                {currentLocation.accuracy && (
                  <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
                    <Text className="text-sm text-gray-600">Точность</Text>
                    <Text className="text-sm font-medium text-gray-900">
                      ±{Math.round(currentLocation.accuracy)} м
                    </Text>
                  </View>
                )}
                {currentLocation.speed !== undefined && currentLocation.speed > 0 && (
                  <View className="flex-row items-center justify-between py-2">
                    <Text className="text-sm text-gray-600">Скорость</Text>
                    <Text className="text-sm font-medium text-gray-900">
                      {Math.round(currentLocation.speed * 3.6)} км/ч
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Permissions Info */}
          <View className="bg-blue-50 rounded-xl p-4 flex-row">
            <Ionicons name="information-circle" size={24} color="#3B82F6" />
            <View className="flex-1 ml-3">
              <Text className="text-sm font-medium text-blue-900 mb-1">
                Доступ к данным
              </Text>
              <Text className="text-xs text-blue-700">
                {permissions.canViewRealTime && 'Местоположение в реальном времени'}
                {permissions.canViewHistory && ' • История перемещений'}
                {permissions.canViewStats && ' • Статистика'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Refresh Button */}
      {isLive && (
        <View className="absolute bottom-6 right-6">
          <TouchableOpacity
            onPress={loadSharedTracking}
            className="w-14 h-14 rounded-full bg-blue-500 items-center justify-center shadow-lg"
          >
            <Ionicons name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};
