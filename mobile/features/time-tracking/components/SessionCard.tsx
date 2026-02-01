import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TimeTrackingSession } from '../../../services/timeTrackingApi';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface SessionCardProps {
  session: TimeTrackingSession;
  onPress: () => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({ session, onPress }) => {
  const getTaskTypeIcon = (taskType: string) => {
    const icons: Record<string, any> = {
      PREPARATION: 'construct-outline',
      TRAVEL: 'car-outline',
      WORK: 'hammer-outline',
      BREAK: 'cafe-outline',
      CLEANUP: 'trash-outline',
      DOCUMENTATION: 'document-text-outline',
      OTHER: 'ellipsis-horizontal-outline',
    };
    return icons[taskType] || 'time-outline';
  };

  const getTaskTypeLabel = (taskType: string) => {
    const labels: Record<string, string> = {
      PREPARATION: 'Подготовка',
      TRAVEL: 'Дорога',
      WORK: 'Работа',
      BREAK: 'Перерыв',
      CLEANUP: 'Уборка',
      DOCUMENTATION: 'Документация',
      OTHER: 'Другое',
    };
    return labels[taskType] || taskType;
  };

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

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '0 мин';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours} ч ${mins} мин`;
    }
    return `${mins} мин`;
  };

  const calculateEarnings = () => {
    if (session.billableHours && session.hourlyRate) {
      return Math.round(session.billableHours * session.hourlyRate);
    }
    return 0;
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
            <Ionicons name={getTaskTypeIcon(session.taskType)} size={20} color="#3B82F6" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900">
              {getTaskTypeLabel(session.taskType)}
            </Text>
            {session.description && (
              <Text className="text-sm text-gray-500 mt-0.5" numberOfLines={1}>
                {session.description}
              </Text>
            )}
          </View>
        </View>
        <View className={`px-2.5 py-1 rounded-full ${getStatusColor(session.status)}`}>
          <Text className={`text-xs font-medium ${getStatusColor(session.status).split(' ')[1]}`}>
            {getStatusLabel(session.status)}
          </Text>
        </View>
      </View>

      {/* Time Info */}
      <View className="flex-row items-center mb-3">
        <Ionicons name="calendar-outline" size={16} color="#6B7280" />
        <Text className="text-sm text-gray-600 ml-2">
          {format(new Date(session.startTime), 'd MMMM yyyy, HH:mm', { locale: ru })}
        </Text>
        {session.endTime && (
          <>
            <Text className="text-sm text-gray-400 mx-2">→</Text>
            <Text className="text-sm text-gray-600">
              {format(new Date(session.endTime), 'HH:mm')}
            </Text>
          </>
        )}
      </View>

      {/* Duration and Earnings */}
      <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
        <View className="flex-row items-center">
          <Ionicons name="time-outline" size={16} color="#6B7280" />
          <Text className="text-sm text-gray-600 ml-2">
            {formatDuration(session.totalMinutes)}
          </Text>
          {session.billableHours && session.billableHours !== (session.totalMinutes || 0) / 60 && (
            <Text className="text-xs text-gray-400 ml-2">
              (оплачиваемых: {session.billableHours.toFixed(1)} ч)
            </Text>
          )}
        </View>

        {session.hourlyRate && (
          <View className="flex-row items-center">
            <Ionicons name="cash-outline" size={16} color="#10B981" />
            <Text className="text-sm font-semibold text-green-600 ml-2">
              {calculateEarnings()} сом
            </Text>
          </View>
        )}
      </View>

      {/* Manual Entry Badge */}
      {session.isManualEntry && (
        <View className="mt-2 flex-row items-center">
          <Ionicons name="create-outline" size={14} color="#6B7280" />
          <Text className="text-xs text-gray-500 ml-1">Ручная запись</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
