import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TrackingMap } from '../components/TrackingMap';
import { TrackingHistoryCard } from '../components/TrackingHistoryCard';
import {
  locationTrackingApi,
  LocationTracking,
  LocationCoordinates,
  TrackingStats,
} from '../../../services/locationTrackingApi';

interface TrackingHistoryScreenProps {
  masterId?: string;
  onBack?: () => void;
}

interface TrackingSession {
  tracking: LocationTracking;
  locationHistory: LocationCoordinates[];
  stats: TrackingStats;
}

export const TrackingHistoryScreen: React.FC<TrackingHistoryScreenProps> = ({
  masterId,
  onBack,
}) => {
  const [sessions, setSessions] = useState<TrackingSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<TrackingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'week' | 'month'>('week');

  useEffect(() => {
    loadHistory();
  }, [filter]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      
      // Get active sessions first
      const activeResponse = await locationTrackingApi.getActiveSessions({
        masterId,
      });

      const sessionsData: TrackingSession[] = [];

      // Load history for each session
      for (const tracking of activeResponse.sessions) {
        try {
          const historyResponse = await locationTrackingApi.getTrackingHistory({
            trackingId: tracking.id,
          });

          sessionsData.push({
            tracking,
            locationHistory: historyResponse.locationHistory,
            stats: historyResponse.routeStats,
          });
        } catch (error) {
          console.error('Error loading session history:', error);
        }
      }

      // Sort by date (newest first)
      sessionsData.sort((a, b) => 
        new Date(b.tracking.startedAt).getTime() - new Date(a.tracking.startedAt).getTime()
      );

      setSessions(sessionsData);
    } catch (error) {
      console.error('Error loading tracking history:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  }, [filter]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Сегодня, ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Вчера, ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} ч ${minutes} мин`;
    }
    return `${minutes} мин`;
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)} м`;
    }
    return `${(meters / 1000).toFixed(2)} км`;
  };

  const renderSessionItem = ({ item }: { item: TrackingSession }) => (
    <TouchableOpacity
      onPress={() => setSelectedSession(item)}
      className="bg-white rounded-xl p-4 mb-3 shadow-sm"
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center flex-1">
          <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
            <Ionicons name="navigate" size={20} color="#0165FB" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900 mb-1">
              {formatDate(item.tracking.startedAt)}
            </Text>
            <View className="flex-row items-center">
              <View
                className={`px-2 py-0.5 rounded ${
                  item.tracking.status === 'COMPLETED'
                    ? 'bg-green-100'
                    : item.tracking.status === 'ACTIVE'
                    ? 'bg-blue-100'
                    : 'bg-gray-100'
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    item.tracking.status === 'COMPLETED'
                      ? 'text-green-700'
                      : item.tracking.status === 'ACTIVE'
                      ? 'text-blue-700'
                      : 'text-gray-700'
                  }`}
                >
                  {item.tracking.status === 'COMPLETED'
                    ? 'Завершено'
                    : item.tracking.status === 'ACTIVE'
                    ? 'Активно'
                    : 'Отменено'}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-2">
          <View className="flex-row items-center mb-1">
            <Ionicons name="time-outline" size={16} color="#6B7280" />
            <Text className="text-sm text-gray-600 ml-1">
              {formatDuration(item.stats.duration)}
            </Text>
          </View>
        </View>
        <View className="flex-1 mr-2">
          <View className="flex-row items-center mb-1">
            <Ionicons name="navigate-outline" size={16} color="#6B7280" />
            <Text className="text-sm text-gray-600 ml-1">
              {formatDistance(item.stats.totalDistance)}
            </Text>
          </View>
        </View>
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <Text className="text-sm text-gray-600 ml-1">
              {item.stats.pointsCount} точек
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (selectedSession) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-white px-4 py-3 flex-row items-center justify-between border-b border-gray-200">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity onPress={() => setSelectedSession(null)} className="mr-3">
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-900">
              Детали маршрута
            </Text>
          </View>
        </View>

        <ScrollView className="flex-1">
          {/* Map */}
          <View className="h-96">
            <TrackingMap
              locationHistory={selectedSession.locationHistory}
              showRoute={true}
            />
          </View>

          {/* Details */}
          <View className="p-4">
            <View className="bg-white rounded-2xl p-6 shadow-sm mb-4">
              <Text className="text-lg font-bold text-gray-900 mb-4">
                Информация о маршруте
              </Text>

              <View className="space-y-3">
                <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
                  <Text className="text-sm text-gray-600">Начало</Text>
                  <Text className="text-sm font-medium text-gray-900">
                    {formatDate(selectedSession.tracking.startedAt)}
                  </Text>
                </View>

                {selectedSession.tracking.endedAt && (
                  <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
                    <Text className="text-sm text-gray-600">Окончание</Text>
                    <Text className="text-sm font-medium text-gray-900">
                      {formatDate(selectedSession.tracking.endedAt)}
                    </Text>
                  </View>
                )}

                <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
                  <Text className="text-sm text-gray-600">Длительность</Text>
                  <Text className="text-sm font-medium text-gray-900">
                    {formatDuration(selectedSession.stats.duration)}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
                  <Text className="text-sm text-gray-600">Расстояние</Text>
                  <Text className="text-sm font-medium text-gray-900">
                    {formatDistance(selectedSession.stats.totalDistance)}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
                  <Text className="text-sm text-gray-600">Средняя скорость</Text>
                  <Text className="text-sm font-medium text-gray-900">
                    {Math.round(selectedSession.stats.averageSpeed * 3.6)} км/ч
                  </Text>
                </View>

                <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
                  <Text className="text-sm text-gray-600">Макс. скорость</Text>
                  <Text className="text-sm font-medium text-gray-900">
                    {Math.round(selectedSession.stats.maxSpeed * 3.6)} км/ч
                  </Text>
                </View>

                <View className="flex-row items-center justify-between py-2">
                  <Text className="text-sm text-gray-600">Точек маршрута</Text>
                  <Text className="text-sm font-medium text-gray-900">
                    {selectedSession.stats.pointsCount}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
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
              История перемещений
            </Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View className="flex-row space-x-2">
          <TouchableOpacity
            onPress={() => setFilter('week')}
            className={`flex-1 py-2 rounded-lg ${
              filter === 'week' ? 'bg-blue-500' : 'bg-gray-100'
            }`}
          >
            <Text
              className={`text-center text-sm font-medium ${
                filter === 'week' ? 'text-white' : 'text-gray-600'
              }`}
            >
              Неделя
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilter('month')}
            className={`flex-1 py-2 rounded-lg ${
              filter === 'month' ? 'bg-blue-500' : 'bg-gray-100'
            }`}
          >
            <Text
              className={`text-center text-sm font-medium ${
                filter === 'month' ? 'text-white' : 'text-gray-600'
              }`}
            >
              Месяц
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilter('all')}
            className={`flex-1 py-2 rounded-lg ${
              filter === 'all' ? 'bg-blue-500' : 'bg-gray-100'
            }`}
          >
            <Text
              className={`text-center text-sm font-medium ${
                filter === 'all' ? 'text-white' : 'text-gray-600'
              }`}
            >
              Все
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0165FB" />
          <Text className="text-gray-600 mt-4">Загрузка истории...</Text>
        </View>
      ) : sessions.length === 0 ? (
        <View className="flex-1 items-center justify-center p-6">
          <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
            <Ionicons name="map-outline" size={40} color="#9CA3AF" />
          </View>
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            История пуста
          </Text>
          <Text className="text-center text-gray-600">
            Здесь будут отображаться ваши маршруты после начала отслеживания
          </Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderSessionItem}
          keyExtractor={(item) => item.tracking.id}
          contentContainerClassName="p-4"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
};
