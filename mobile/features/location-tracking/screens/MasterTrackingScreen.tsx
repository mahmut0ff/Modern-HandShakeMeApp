import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { TrackingMap } from '../components/TrackingMap';
import { ActiveTrackingCard } from '../components/ActiveTrackingCard';
import {
  locationTrackingApi,
  LocationTracking,
  LocationCoordinates,
  TrackingStats,
} from '../../../services/locationTrackingApi';

interface MasterTrackingScreenProps {
  bookingId?: string;
  projectId?: string;
  onBack?: () => void;
}

export const MasterTrackingScreen: React.FC<MasterTrackingScreenProps> = ({
  bookingId,
  projectId,
  onBack,
}) => {
  const [tracking, setTracking] = useState<LocationTracking | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationCoordinates | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationCoordinates[]>([]);
  const [stats, setStats] = useState<TrackingStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);

  useEffect(() => {
    checkActiveTracking();
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  const checkActiveTracking = async () => {
    try {
      setLoading(true);
      const response = await locationTrackingApi.getCurrentLocation({
        bookingId,
        projectId,
      });

      if (response.tracking && response.tracking.status === 'ACTIVE') {
        setTracking(response.tracking);
        if (response.location) {
          setCurrentLocation(response.location);
        }
        await loadTrackingHistory(response.tracking.id);
      }
    } catch (error) {
      console.error('Error checking active tracking:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTrackingHistory = async (trackingId: string) => {
    try {
      const response = await locationTrackingApi.getTrackingHistory({
        trackingId,
        bookingId,
        projectId,
      });
      setLocationHistory(response.locationHistory);
      setStats(response.routeStats);
    } catch (error) {
      console.error('Error loading tracking history:', error);
    }
  };

  const startTracking = async () => {
    try {
      setLoading(true);

      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Необходимо разрешение на доступ к местоположению');
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords: LocationCoordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        altitude: location.coords.altitude || undefined,
        heading: location.coords.heading || undefined,
        speed: location.coords.speed || undefined,
      };

      // Start tracking
      const response = await locationTrackingApi.startLocationTracking({
        bookingId,
        projectId,
        location: coords,
        trackingSettings: {
          updateInterval: 10,
          highAccuracyMode: true,
          shareWithClient: true,
          autoStopAfterCompletion: true,
          geofenceRadius: 100,
        },
      });

      setTracking(response.tracking);
      setCurrentLocation(coords);
      setLocationHistory([coords]);

      // Start location updates
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // 10 seconds
          distanceInterval: 10, // 10 meters
        },
        (location) => {
          handleLocationUpdate(location);
        }
      );

      setLocationSubscription(subscription);

      Alert.alert('Успешно', 'Отслеживание местоположения запущено');
    } catch (error: any) {
      console.error('Error starting tracking:', error);
      Alert.alert('Ошибка', error.message || 'Не удалось запустить отслеживание');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationUpdate = async (location: Location.LocationObject) => {
    const coords: LocationCoordinates = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy || undefined,
      altitude: location.coords.altitude || undefined,
      heading: location.coords.heading || undefined,
      speed: location.coords.speed || undefined,
    };

    setCurrentLocation(coords);
    setLocationHistory((prev) => [...prev, coords]);

    try {
      await locationTrackingApi.updateLocation({
        bookingId,
        projectId,
        location: coords,
      });
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const stopTracking = async () => {
    try {
      setLoading(true);

      if (locationSubscription) {
        locationSubscription.remove();
        setLocationSubscription(null);
      }

      const response = await locationTrackingApi.stopLocationTracking({
        bookingId,
        projectId,
      });

      setTracking(response.tracking);
      Alert.alert('Успешно', 'Отслеживание остановлено');
    } catch (error: any) {
      console.error('Error stopping tracking:', error);
      Alert.alert('Ошибка', error.message || 'Не удалось остановить отслеживание');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!tracking) return;

    try {
      const response = await locationTrackingApi.shareTrackingLink({
        trackingId: tracking.id,
        expirationHours: 24,
        allowAnonymous: true,
      });

      await Share.share({
        message: `Отслеживайте мое местоположение в реальном времени: ${response.trackingUrl}`,
        url: response.trackingUrl,
        title: 'Поделиться местоположением',
      });
    } catch (error: any) {
      if (error.message !== 'User did not share') {
        Alert.alert('Ошибка', 'Не удалось поделиться ссылкой');
      }
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await checkActiveTracking();
    setRefreshing(false);
  }, []);

  if (loading && !tracking) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#0165FB" />
        <Text className="text-gray-600 mt-4">Загрузка...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row items-center justify-between border-b border-gray-200">
        <View className="flex-row items-center">
          {onBack && (
            <TouchableOpacity onPress={onBack} className="mr-3">
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
          )}
          <Text className="text-xl font-bold text-gray-900">
            Отслеживание местоположения
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Map */}
        <View className="h-96">
          <TrackingMap
            currentLocation={currentLocation || undefined}
            locationHistory={locationHistory}
            showRoute={true}
          />
        </View>

        {/* Content */}
        <View className="p-4">
          {tracking && tracking.status === 'ACTIVE' ? (
            <ActiveTrackingCard
              tracking={tracking}
              stats={stats || undefined}
              onStop={stopTracking}
              onShare={handleShare}
            />
          ) : (
            <View className="bg-white rounded-2xl p-6 shadow-sm">
              <View className="items-center mb-6">
                <View className="w-20 h-20 rounded-full bg-blue-100 items-center justify-center mb-4">
                  <Ionicons name="navigate" size={40} color="#0165FB" />
                </View>
                <Text className="text-xl font-bold text-gray-900 mb-2">
                  Отслеживание не активно
                </Text>
                <Text className="text-center text-gray-600">
                  Запустите отслеживание, чтобы клиент мог видеть ваше местоположение в реальном времени
                </Text>
              </View>

              <TouchableOpacity
                onPress={startTracking}
                disabled={loading}
                className="bg-blue-500 rounded-xl py-4 flex-row items-center justify-center"
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="play-circle" size={24} color="white" />
                    <Text className="text-white font-semibold text-base ml-2">
                      Начать отслеживание
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Info Cards */}
          <View className="mt-4 space-y-3">
            <View className="bg-blue-50 rounded-xl p-4 flex-row">
              <Ionicons name="information-circle" size={24} color="#3B82F6" />
              <View className="flex-1 ml-3">
                <Text className="text-sm font-medium text-blue-900 mb-1">
                  Экономия батареи
                </Text>
                <Text className="text-xs text-blue-700">
                  Отслеживание оптимизировано для минимального расхода батареи
                </Text>
              </View>
            </View>

            <View className="bg-green-50 rounded-xl p-4 flex-row">
              <Ionicons name="shield-checkmark" size={24} color="#10B981" />
              <View className="flex-1 ml-3">
                <Text className="text-sm font-medium text-green-900 mb-1">
                  Конфиденциальность
                </Text>
                <Text className="text-xs text-green-700">
                  Местоположение видно только клиенту текущего заказа
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
