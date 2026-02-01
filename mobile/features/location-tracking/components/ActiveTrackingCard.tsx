import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LocationTracking, TrackingStats } from '../../../services/locationTrackingApi';

interface ActiveTrackingCardProps {
  tracking: LocationTracking;
  stats?: TrackingStats;
  onStop: () => Promise<void>;
  onShare: () => void;
}

export const ActiveTrackingCard: React.FC<ActiveTrackingCardProps> = ({
  tracking,
  stats,
  onStop,
  onShare,
}) => {
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const startTime = new Date(tracking.startedAt).getTime();
    
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setDuration(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [tracking.startedAt]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)} м`;
    }
    return `${(meters / 1000).toFixed(2)} км`;
  };

  const formatSpeed = (metersPerSecond: number) => {
    const kmh = metersPerSecond * 3.6;
    return `${Math.round(kmh)} км/ч`;
  };

  const handleStop = () => {
    Alert.alert(
      'Остановить отслеживание',
      'Вы уверены, что хотите остановить отслеживание местоположения?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Остановить',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await onStop();
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось остановить отслеживание');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View className="bg-white rounded-2xl p-6 shadow-sm mb-4">
      {/* Status Badge */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center px-3 py-1.5 rounded-full bg-green-100">
          <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
          <Text className="text-sm font-semibold text-green-700">
            Отслеживание активно
          </Text>
        </View>
        <TouchableOpacity onPress={onShare} className="p-2">
          <Ionicons name="share-outline" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Duration Display */}
      <View className="items-center mb-6">
        <Text className="text-4xl font-bold text-gray-900 mb-2">
          {formatDuration(duration)}
        </Text>
        <Text className="text-sm text-gray-500">Время в пути</Text>
      </View>

      {/* Stats Grid */}
      {stats && (
        <View className="flex-row flex-wrap -mx-2 mb-6">
          <View className="w-1/2 px-2 mb-4">
            <View className="bg-blue-50 rounded-xl p-4">
              <View className="flex-row items-center mb-2">
                <Ionicons name="navigate-outline" size={20} color="#3B82F6" />
                <Text className="text-sm text-gray-600 ml-2">Расстояние</Text>
              </View>
              <Text className="text-xl font-bold text-blue-600">
                {formatDistance(stats.totalDistance)}
              </Text>
            </View>
          </View>

          <View className="w-1/2 px-2 mb-4">
            <View className="bg-purple-50 rounded-xl p-4">
              <View className="flex-row items-center mb-2">
                <Ionicons name="speedometer-outline" size={20} color="#8B5CF6" />
                <Text className="text-sm text-gray-600 ml-2">Средняя</Text>
              </View>
              <Text className="text-xl font-bold text-purple-600">
                {formatSpeed(stats.averageSpeed)}
              </Text>
            </View>
          </View>

          <View className="w-1/2 px-2">
            <View className="bg-orange-50 rounded-xl p-4">
              <View className="flex-row items-center mb-2">
                <Ionicons name="flash-outline" size={20} color="#F97316" />
                <Text className="text-sm text-gray-600 ml-2">Макс. скорость</Text>
              </View>
              <Text className="text-xl font-bold text-orange-600">
                {formatSpeed(stats.maxSpeed)}
              </Text>
            </View>
          </View>

          <View className="w-1/2 px-2">
            <View className="bg-green-50 rounded-xl p-4">
              <View className="flex-row items-center mb-2">
                <Ionicons name="location-outline" size={20} color="#10B981" />
                <Text className="text-sm text-gray-600 ml-2">Точек</Text>
              </View>
              <Text className="text-xl font-bold text-green-600">
                {stats.pointsCount}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Settings Info */}
      <View className="bg-gray-50 rounded-xl p-4 mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm text-gray-600">Интервал обновления</Text>
          <Text className="text-sm font-medium text-gray-900">
            {tracking.settings.updateInterval} сек
          </Text>
        </View>
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm text-gray-600">Высокая точность</Text>
          <Ionicons
            name={tracking.settings.highAccuracyMode ? 'checkmark-circle' : 'close-circle'}
            size={20}
            color={tracking.settings.highAccuracyMode ? '#10B981' : '#EF4444'}
          />
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-gray-600">Видно клиенту</Text>
          <Ionicons
            name={tracking.settings.shareWithClient ? 'checkmark-circle' : 'close-circle'}
            size={20}
            color={tracking.settings.shareWithClient ? '#10B981' : '#EF4444'}
          />
        </View>
      </View>

      {/* Stop Button */}
      <TouchableOpacity
        onPress={handleStop}
        disabled={loading}
        className="bg-red-500 rounded-xl py-4 flex-row items-center justify-center"
      >
        <Ionicons name="stop-circle" size={24} color="white" />
        <Text className="text-white font-semibold text-base ml-2">
          Остановить отслеживание
        </Text>
      </TouchableOpacity>
    </View>
  );
};
