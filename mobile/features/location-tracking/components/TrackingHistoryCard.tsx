import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LocationTracking } from '../../../services/locationTrackingApi';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface TrackingHistoryCardProps {
  tracking: LocationTracking;
  onPress: () => void;
}

export const TrackingHistoryCard: React.FC<TrackingHistoryCardProps> = ({
  tracking,
  onPress,
}) => {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-700',
      PAUSED: 'bg-yellow-100 text-yellow-700',
      COMPLETED: 'bg-blue-100 text-blue-700',
      CANCELLED: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      ACTIVE: 'Активно',
      PAUSED: 'На паузе',
      COMPLETED: 'Завершено',
      CANCELLED: 'Отменено',
    };
    return labels[status] || status;
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

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100"
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center flex-1">
          <View className="bg-blue-100 rounded-full p-2 mr-3">
            <Ionicons name="navigate" size={20} color="#3B82F6" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900">
              {tracking.bookingId ? 'Бронирование' : 'Проект'}
            </Text>
            <Text className="text-sm text-gray-500 mt-0.5">
              {format(new Date(tracking.startedAt), 'd MMMM yyyy, HH:mm', { locale: ru })}
            </Text>
          </View>
        </View>
        <View className={`px-2.5 py-1 rounded-full ${getStatusColor(tracking.status)}`}>
          <Text className={`text-xs font-medium ${getStatusColor(tracking.status).split(' ')[1]}`}>
            {getStatusLabel(tracking.status)}
          </Text>
        </View>
      </View>

      {/* Stats */}
      {tracking.stats && (
        <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={16} color="#6B7280" />
            <Text className="text-sm text-gray-600 ml-2">
              {formatDuration(tracking.stats.duration)}
            </Text>
          </View>

          <View className="flex-row items-center">
            <Ionicons name="navigate-outline" size={16} color="#6B7280" />
            <Text className="text-sm text-gray-600 ml-2">
              {formatDistance(tracking.stats.totalDistance)}
            </Text>
          </View>

          <View className="flex-row items-center">
            <Ionicons name="speedometer-outline" size={16} color="#6B7280" />
            <Text className="text-sm text-gray-600 ml-2">
              {Math.round(tracking.stats.averageSpeed * 3.6)} км/ч
            </Text>
          </View>
        </View>
      )}

      {/* Sharing Status */}
      {tracking.settings.shareWithClient && (
        <View className="mt-3 flex-row items-center">
          <Ionicons name="eye-outline" size={14} color="#10B981" />
          <Text className="text-xs text-green-600 ml-1">Видно клиенту</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
