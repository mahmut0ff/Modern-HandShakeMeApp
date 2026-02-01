import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrackingMap } from '../../../features/location-tracking/components/TrackingMap';
import { getTrackingHistory, LocationCoordinates, TrackingStats } from '../../../services/locationTrackingApi';

export default function TrackingHistoryScreen() {
  const [locationHistory, setLocationHistory] = useState<LocationCoordinates[]>([]);
  const [stats, setStats] = useState<TrackingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      // For demo, using mock booking ID
      const data = await getTrackingHistory({ bookingId: 'demo-booking-id' });
      setLocationHistory(data.locationHistory);
      setStats(data.routeStats);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8F7FC]">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0165FB" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-[#F8F7FC]">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 py-4 bg-white border-b border-gray-100">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-900">История маршрута</Text>
          </View>
        </View>

        {/* Map */}
        <View className="flex-1">
          <TrackingMap
            locationHistory={locationHistory}
            showRoute={true}
          />
        </View>

        {/* Stats */}
        {stats && (
          <View className="bg-white p-6 border-t border-gray-100">
            <View className="flex-row flex-wrap -mx-2">
              <View className="w-1/2 px-2 mb-4">
                <Text className="text-sm text-gray-600">Расстояние</Text>
                <Text className="text-xl font-bold text-gray-900">
                  {(stats.totalDistance / 1000).toFixed(2)} км
                </Text>
              </View>
              <View className="w-1/2 px-2 mb-4">
                <Text className="text-sm text-gray-600">Длительность</Text>
                <Text className="text-xl font-bold text-gray-900">
                  {Math.floor(stats.duration / 60)} мин
                </Text>
              </View>
              <View className="w-1/2 px-2">
                <Text className="text-sm text-gray-600">Средняя скорость</Text>
                <Text className="text-xl font-bold text-gray-900">
                  {Math.round(stats.averageSpeed * 3.6)} км/ч
                </Text>
              </View>
              <View className="w-1/2 px-2">
                <Text className="text-sm text-gray-600">Точек</Text>
                <Text className="text-xl font-bold text-gray-900">
                  {stats.pointsCount}
                </Text>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}
