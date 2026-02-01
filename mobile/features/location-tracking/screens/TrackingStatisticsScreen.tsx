import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { locationTrackingApi } from '../../../services/locationTrackingApi';

interface TrackingStatisticsScreenProps {
  masterId?: string;
  onBack?: () => void;
}

interface Statistics {
  totalSessions: number;
  totalDistance: number;
  totalDuration: number;
  averageSessionDuration: number;
  sessionsThisWeek: number;
  sessionsThisMonth: number;
  topRoutes: any[];
  dailyStats: {
    date: string;
    sessions: number;
    distance: number;
    duration: number;
  }[];
}

export const TrackingStatisticsScreen: React.FC<TrackingStatisticsScreenProps> = ({
  masterId,
  onBack,
}) => {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');

  useEffect(() => {
    loadStatistics();
  }, [period]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const response = await locationTrackingApi.getTrackingStatistics({
        masterId,
        period,
      });
      setStatistics(response);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStatistics();
    setRefreshing(false);
  }, [period]);

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)} м`;
    }
    return `${(meters / 1000).toFixed(1)} км`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} ч ${minutes} мин`;
    }
    return `${minutes} мин`;
  };

  const screenWidth = Dimensions.get('window').width;

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(1, 101, 251, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#0165FB',
    },
  };

  if (loading && !statistics) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#0165FB" />
        <Text className="text-gray-600 mt-4">Загрузка статистики...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            {onBack && (
              <TouchableOpacity onPress={onBack} className="mr-3">
                <Ionicons name="arrow-back" size={24} color="#1F2937" />
              </TouchableOpacity>
            )}
            <Text className="text-xl font-bold text-gray-900">
              Статистика трекинга
            </Text>
          </View>
        </View>

        {/* Period Tabs */}
        <View className="flex-row space-x-2">
          <TouchableOpacity
            onPress={() => setPeriod('week')}
            className={`flex-1 py-2 rounded-lg ${
              period === 'week' ? 'bg-blue-500' : 'bg-gray-100'
            }`}
          >
            <Text
              className={`text-center text-sm font-medium ${
                period === 'week' ? 'text-white' : 'text-gray-600'
              }`}
            >
              Неделя
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPeriod('month')}
            className={`flex-1 py-2 rounded-lg ${
              period === 'month' ? 'bg-blue-500' : 'bg-gray-100'
            }`}
          >
            <Text
              className={`text-center text-sm font-medium ${
                period === 'month' ? 'text-white' : 'text-gray-600'
              }`}
            >
              Месяц
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPeriod('year')}
            className={`flex-1 py-2 rounded-lg ${
              period === 'year' ? 'bg-blue-500' : 'bg-gray-100'
            }`}
          >
            <Text
              className={`text-center text-sm font-medium ${
                period === 'year' ? 'text-white' : 'text-gray-600'
              }`}
            >
              Год
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {statistics && (
          <View className="p-4">
            {/* Summary Cards */}
            <View className="flex-row flex-wrap -mx-2 mb-4">
              <View className="w-1/2 px-2 mb-4">
                <View className="bg-white rounded-xl p-4 shadow-sm">
                  <View className="flex-row items-center mb-2">
                    <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                      <Ionicons name="calendar-outline" size={20} color="#0165FB" />
                    </View>
                    <Text className="text-sm text-gray-600">Всего сессий</Text>
                  </View>
                  <Text className="text-2xl font-bold text-gray-900">
                    {statistics.totalSessions}
                  </Text>
                </View>
              </View>

              <View className="w-1/2 px-2 mb-4">
                <View className="bg-white rounded-xl p-4 shadow-sm">
                  <View className="flex-row items-center mb-2">
                    <View className="w-10 h-10 rounded-full bg-purple-100 items-center justify-center mr-3">
                      <Ionicons name="navigate-outline" size={20} color="#8B5CF6" />
                    </View>
                    <Text className="text-sm text-gray-600">Расстояние</Text>
                  </View>
                  <Text className="text-2xl font-bold text-gray-900">
                    {formatDistance(statistics.totalDistance)}
                  </Text>
                </View>
              </View>

              <View className="w-1/2 px-2 mb-4">
                <View className="bg-white rounded-xl p-4 shadow-sm">
                  <View className="flex-row items-center mb-2">
                    <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-3">
                      <Ionicons name="time-outline" size={20} color="#10B981" />
                    </View>
                    <Text className="text-sm text-gray-600">Время в пути</Text>
                  </View>
                  <Text className="text-2xl font-bold text-gray-900">
                    {formatDuration(statistics.totalDuration)}
                  </Text>
                </View>
              </View>

              <View className="w-1/2 px-2 mb-4">
                <View className="bg-white rounded-xl p-4 shadow-sm">
                  <View className="flex-row items-center mb-2">
                    <View className="w-10 h-10 rounded-full bg-orange-100 items-center justify-center mr-3">
                      <Ionicons name="stats-chart-outline" size={20} color="#F97316" />
                    </View>
                    <Text className="text-sm text-gray-600">Средняя</Text>
                  </View>
                  <Text className="text-2xl font-bold text-gray-900">
                    {formatDuration(statistics.averageSessionDuration)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Period Stats */}
            <View className="bg-white rounded-xl p-4 shadow-sm mb-4">
              <Text className="text-lg font-bold text-gray-900 mb-4">
                За период
              </Text>
              <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
                <Text className="text-sm text-gray-600">Сессий на этой неделе</Text>
                <Text className="text-base font-semibold text-gray-900">
                  {statistics.sessionsThisWeek}
                </Text>
              </View>
              <View className="flex-row items-center justify-between py-3">
                <Text className="text-sm text-gray-600">Сессий в этом месяце</Text>
                <Text className="text-base font-semibold text-gray-900">
                  {statistics.sessionsThisMonth}
                </Text>
              </View>
            </View>

            {/* Daily Sessions Chart */}
            {statistics.dailyStats && statistics.dailyStats.length > 0 && (
              <View className="bg-white rounded-xl p-4 shadow-sm mb-4">
                <Text className="text-lg font-bold text-gray-900 mb-4">
                  Сессии по дням
                </Text>
                <BarChart
                  data={{
                    labels: statistics.dailyStats.map((stat) => {
                      const date = new Date(stat.date);
                      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
                    }),
                    datasets: [
                      {
                        data: statistics.dailyStats.map((stat) => stat.sessions),
                      },
                    ],
                  }}
                  width={screenWidth - 48}
                  height={220}
                  chartConfig={chartConfig}
                  style={{
                    borderRadius: 16,
                  }}
                  fromZero
                  showValuesOnTopOfBars
                />
              </View>
            )}

            {/* Distance Chart */}
            {statistics.dailyStats && statistics.dailyStats.length > 0 && (
              <View className="bg-white rounded-xl p-4 shadow-sm mb-4">
                <Text className="text-lg font-bold text-gray-900 mb-4">
                  Расстояние по дням (км)
                </Text>
                <LineChart
                  data={{
                    labels: statistics.dailyStats.map((stat) => {
                      const date = new Date(stat.date);
                      return date.toLocaleDateString('ru-RU', { day: 'numeric' });
                    }),
                    datasets: [
                      {
                        data: statistics.dailyStats.map((stat) => stat.distance / 1000),
                      },
                    ],
                  }}
                  width={screenWidth - 48}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={{
                    borderRadius: 16,
                  }}
                />
              </View>
            )}

            {/* Top Routes */}
            {statistics.topRoutes && statistics.topRoutes.length > 0 && (
              <View className="bg-white rounded-xl p-4 shadow-sm mb-4">
                <Text className="text-lg font-bold text-gray-900 mb-4">
                  Популярные маршруты
                </Text>
                {statistics.topRoutes.map((route, index) => (
                  <View
                    key={index}
                    className="flex-row items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                  >
                    <View className="flex-row items-center flex-1">
                      <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-3">
                        <Text className="text-sm font-bold text-blue-600">
                          {index + 1}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-medium text-gray-900 mb-1">
                          {route.name || `Маршрут ${index + 1}`}
                        </Text>
                        <Text className="text-xs text-gray-500">
                          {route.count} раз • {formatDistance(route.totalDistance)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Insights */}
            <View className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 shadow-sm">
              <View className="flex-row items-center mb-3">
                <Ionicons name="bulb" size={24} color="white" />
                <Text className="text-lg font-bold text-white ml-2">
                  Аналитика
                </Text>
              </View>
              <Text className="text-white text-sm leading-6">
                {statistics.totalSessions > 0
                  ? `В среднем вы проезжаете ${formatDistance(
                      statistics.totalDistance / statistics.totalSessions
                    )} за сессию. ${
                      statistics.sessionsThisWeek > statistics.sessionsThisMonth / 4
                        ? 'На этой неделе активность выше среднего!'
                        : 'Продолжайте в том же духе!'
                    }`
                  : 'Начните отслеживание, чтобы увидеть аналитику'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
