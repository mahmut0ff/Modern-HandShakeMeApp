import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTrackingStatistics } from '../../../services/locationTrackingApi';

export default function TrackingStatisticsScreen() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadStatistics();
  }, [period]);

  const loadStatistics = async () => {
    try {
      const data = await getTrackingStatistics({ period });
      setStats(data);
    } catch (error) {
      console.error('Failed to load statistics:', error);
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
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Статистика</Text>
        </View>
      </View>

      <ScrollView className="flex-1">
        <View className="p-6">
          {/* Period Filter */}
          <View className="flex-row mb-6">
            {(['week', 'month', 'year'] as const).map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setPeriod(p)}
                className={`flex-1 py-3 ${
                  p === 'week' ? 'rounded-l-xl' : p === 'year' ? 'rounded-r-xl' : ''
                } border ${
                  period === p ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-200'
                }`}
              >
                <Text
                  className={`text-center font-medium ${
                    period === p ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  {p === 'week' ? 'Неделя' : p === 'month' ? 'Месяц' : 'Год'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Stats Cards */}
          <View className="bg-white rounded-2xl p-6 shadow-sm mb-4">
            <Text className="text-lg font-bold text-gray-900 mb-4">Общая статистика</Text>
            <View className="space-y-3">
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Всего сессий</Text>
                <Text className="font-semibold text-gray-900">{stats?.totalSessions || 0}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Общее расстояние</Text>
                <Text className="font-semibold text-gray-900">
                  {((stats?.totalDistance || 0) / 1000).toFixed(2)} км
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Общее время</Text>
                <Text className="font-semibold text-gray-900">
                  {Math.floor((stats?.totalDuration || 0) / 60)} мин
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
