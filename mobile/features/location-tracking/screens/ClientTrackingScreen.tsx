import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TrackingMap } from '../components/TrackingMap';
import {
  locationTrackingApi,
  LocationTracking,
  LocationCoordinates,
} from '../../../services/locationTrackingApi';

interface ClientTrackingScreenProps {
  bookingId?: string;
  projectId?: string;
  masterId?: string;
  onBack?: () => void;
}

export const ClientTrackingScreen: React.FC<ClientTrackingScreenProps> = ({
  bookingId,
  projectId,
  masterId,
  onBack,
}) => {
  const [tracking, setTracking] = useState<LocationTracking | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationCoordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadTracking();

    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      loadTracking();
    }, 10000);

    setRefreshInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [bookingId, projectId]);

  const loadTracking = async () => {
    try {
      setLoading(true);
      const response = await locationTrackingApi.getCurrentLocation({
        bookingId,
        projectId,
      });

      if (response.tracking) {
        setTracking(response.tracking);
        setIsLive(response.tracking.status === 'ACTIVE');
        
        if (response.location) {
          setCurrentLocation(response.location);
          setLastUpdate(new Date());
        }
      }
    } catch (error) {
      console.error('Error loading tracking:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInMaps = () => {
    if (!currentLocation) return;

    const url = `https://www.google.com/maps/dir/?api=1&destination=${currentLocation.latitude},${currentLocation.longitude}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Ошибка', 'Не удалось открыть карты');
    });
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Нет данных';

    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000);

    if (diff < 60) {
      return 'Только что';
    } else if (diff < 3600) {
      const minutes = Math.floor(diff / 60);
      return `${minutes} мин назад`;
    } else {
      return lastUpdate.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)} м`;
    }
    return `${(meters / 1000).toFixed(1)} км`;
  };

  if (loading && !tracking) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#0165FB" />
        <Text className="text-gray-600 mt-4">Загрузка...</Text>
      </SafeAreaView>
    );
  }

  if (!tracking || tracking.status !== 'ACTIVE') {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-white px-4 py-3 flex-row items-center border-b border-gray-200">
          {onBack && (
            <TouchableOpacity onPress={onBack} className="mr-3">
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
          )}
          <Text className="text-xl font-bold text-gray-900">
            Местоположение мастера
          </Text>
        </View>

        <View className="flex-1 items-center justify-center p-6">
          <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
            <Ionicons name="location-outline" size={40} color="#9CA3AF" />
          </View>
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            Отслеживание недоступно
          </Text>
          <Text className="text-center text-gray-600">
            Мастер еще не начал отслеживание местоположения для этого заказа
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            {onBack && (
              <TouchableOpacity onPress={onBack} className="mr-3">
                <Ionicons name="arrow-back" size={24} color="#1F2937" />
              </TouchableOpacity>
            )}
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900">
                Местоположение мастера
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
          <TouchableOpacity onPress={loadTracking} className="p-2">
            <Ionicons name="refresh" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Map */}
        <View className="h-96">
          <TrackingMap
            currentLocation={currentLocation || undefined}
            showRoute={false}
          />
        </View>

        {/* Content */}
        <View className="p-4">
          {/* Status Card */}
          <View className="bg-white rounded-2xl p-6 shadow-sm mb-4">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-full bg-green-100 items-center justify-center mr-3">
                  <Ionicons name="navigate" size={24} color="#10B981" />
                </View>
                <View>
                  <Text className="text-lg font-bold text-gray-900 mb-1">
                    Мастер в пути
                  </Text>
                  <Text className="text-sm text-gray-600">
                    Последнее обновление: {formatLastUpdate()}
                  </Text>
                </View>
              </View>
            </View>

            {currentLocation && (
              <View className="space-y-3">
                {currentLocation.speed !== undefined && currentLocation.speed > 0 && (
                  <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
                    <View className="flex-row items-center">
                      <Ionicons name="speedometer-outline" size={20} color="#6B7280" />
                      <Text className="text-sm text-gray-600 ml-2">Скорость</Text>
                    </View>
                    <Text className="text-sm font-medium text-gray-900">
                      {Math.round(currentLocation.speed * 3.6)} км/ч
                    </Text>
                  </View>
                )}

                {currentLocation.accuracy && (
                  <View className="flex-row items-center justify-between py-2">
                    <View className="flex-row items-center">
                      <Ionicons name="locate-outline" size={20} color="#6B7280" />
                      <Text className="text-sm text-gray-600 ml-2">Точность</Text>
                    </View>
                    <Text className="text-sm font-medium text-gray-900">
                      ±{Math.round(currentLocation.accuracy)} м
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Actions */}
          <View className="space-y-3">
            <TouchableOpacity
              onPress={handleOpenInMaps}
              disabled={!currentLocation}
              className="bg-blue-500 rounded-xl py-4 flex-row items-center justify-center"
            >
              <Ionicons name="map" size={24} color="white" />
              <Text className="text-white font-semibold text-base ml-2">
                Открыть в картах
              </Text>
            </TouchableOpacity>

            <View className="bg-blue-50 rounded-xl p-4 flex-row">
              <Ionicons name="information-circle" size={24} color="#3B82F6" />
              <View className="flex-1 ml-3">
                <Text className="text-sm font-medium text-blue-900 mb-1">
                  Автообновление
                </Text>
                <Text className="text-xs text-blue-700">
                  Местоположение обновляется автоматически каждые 10 секунд
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
