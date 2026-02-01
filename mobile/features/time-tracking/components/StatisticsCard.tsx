import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TimeStatistics } from '../../../services/timeTrackingApi';

interface StatisticsCardProps {
  statistics: TimeStatistics;
}

export const StatisticsCard: React.FC<StatisticsCardProps> = ({ statistics }) => {
  const formatHours = (hours: number) => {
    return hours.toFixed(1);
  };

  const formatCurrency = (amount: number) => {
    return Math.round(amount).toLocaleString('ru-RU');
  };

  return (
    <View className="bg-white rounded-2xl p-6 shadow-sm mb-4">
      <Text className="text-xl font-bold text-gray-900 mb-6">Статистика</Text>

      {/* Quick Stats Grid */}
      <View className="flex-row flex-wrap -mx-2 mb-6">
        <View className="w-1/2 px-2 mb-4">
          <View className="bg-blue-50 rounded-xl p-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="time-outline" size={20} color="#3B82F6" />
              <Text className="text-sm text-gray-600 ml-2">Всего часов</Text>
            </View>
            <Text className="text-2xl font-bold text-blue-600">
              {formatHours(statistics.totalHours)}
            </Text>
          </View>
        </View>

        <View className="w-1/2 px-2 mb-4">
          <View className="bg-green-50 rounded-xl p-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="cash-outline" size={20} color="#10B981" />
              <Text className="text-sm text-gray-600 ml-2">Заработано</Text>
            </View>
            <Text className="text-2xl font-bold text-green-600">
              {formatCurrency(statistics.totalEarnings)}
            </Text>
          </View>
        </View>

        <View className="w-1/2 px-2 mb-4">
          <View className="bg-purple-50 rounded-xl p-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="calendar-outline" size={20} color="#8B5CF6" />
              <Text className="text-sm text-gray-600 ml-2">Сессий</Text>
            </View>
            <Text className="text-2xl font-bold text-purple-600">
              {statistics.totalSessions}
            </Text>
          </View>
        </View>

        <View className="w-1/2 px-2 mb-4">
          <View className="bg-orange-50 rounded-xl p-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="trending-up-outline" size={20} color="#F97316" />
              <Text className="text-sm text-gray-600 ml-2">Средняя</Text>
            </View>
            <Text className="text-2xl font-bold text-orange-600">
              {formatHours(statistics.averageSessionDuration)}
            </Text>
          </View>
        </View>
      </View>

      {/* This Week/Month */}
      <View className="border-t border-gray-100 pt-4 mb-4">
        <Text className="text-base font-semibold text-gray-900 mb-3">За период</Text>
        
        <View className="flex-row justify-between mb-3">
          <Text className="text-sm text-gray-600">Эта неделя</Text>
          <View className="flex-row items-center">
            <Text className="text-sm font-medium text-gray-900 mr-3">
              {formatHours(statistics.hoursThisWeek)} ч
            </Text>
            <Text className="text-sm font-semibold text-green-600">
              {formatCurrency(statistics.earningsThisWeek)} сом
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between">
          <Text className="text-sm text-gray-600">Этот месяц</Text>
          <View className="flex-row items-center">
            <Text className="text-sm font-medium text-gray-900 mr-3">
              {formatHours(statistics.hoursThisMonth)} ч
            </Text>
            <Text className="text-sm font-semibold text-green-600">
              {formatCurrency(statistics.earningsThisMonth)} сом
            </Text>
          </View>
        </View>
      </View>

      {/* Task Type Breakdown */}
      {statistics.taskTypeBreakdown && statistics.taskTypeBreakdown.length > 0 && (
        <View className="border-t border-gray-100 pt-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">По типам задач</Text>
          {statistics.taskTypeBreakdown.slice(0, 3).map((item, index) => (
            <View key={index} className="mb-3">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-sm text-gray-600">{getTaskTypeLabel(item.taskType)}</Text>
                <Text className="text-sm font-medium text-gray-900">
                  {formatHours(item.hours)} ч ({item.percentage.toFixed(0)}%)
                </Text>
              </View>
              <View className="bg-gray-200 rounded-full h-2">
                <View
                  className="bg-blue-500 rounded-full h-2"
                  style={{ width: `${item.percentage}%` }}
                />
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Most Productive Day */}
      {statistics.mostProductiveDay && (
        <View className="border-t border-gray-100 pt-4 mt-2">
          <View className="flex-row items-center">
            <Ionicons name="trophy-outline" size={20} color="#F59E0B" />
            <Text className="text-sm text-gray-600 ml-2">
              Самый продуктивный день:{' '}
              <Text className="font-semibold text-gray-900">
                {new Date(statistics.mostProductiveDay).toLocaleDateString('ru-RU')}
              </Text>
            </Text>
          </View>
        </View>
      )}
    </View>
  );
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
