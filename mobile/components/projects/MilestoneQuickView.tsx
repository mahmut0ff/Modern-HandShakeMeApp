import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMilestones } from '../../hooks/useMilestones';
import { LoadingSpinner } from '../LoadingSpinner';

interface MilestoneQuickViewProps {
  projectId: number;
}

export default function MilestoneQuickView({ projectId }: MilestoneQuickViewProps) {
  const { stats, nextMilestone, overdueMilestones, isLoading } = useMilestones(projectId);

  if (isLoading) {
    return (
      <View className="bg-white rounded-lg p-4 mb-4">
        <LoadingSpinner />
      </View>
    );
  }

  if (stats.total === 0) {
    return null;
  }

  return (
    <TouchableOpacity
      className="bg-white rounded-lg p-4 mb-4 shadow-sm"
      onPress={() =>
        router.push({
          pathname: '/projects/milestones',
          params: { projectId },
        })
      }
    >
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-semibold">Вехи проекта</Text>
        <Ionicons name="chevron-forward" size={20} color="#6B7280" />
      </View>

      {/* Progress Bar */}
      <View className="mb-3">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-sm text-gray-600">Прогресс</Text>
          <Text className="text-sm font-medium">
            {stats.completed} / {stats.total}
          </Text>
        </View>
        <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <View
            className="h-full bg-blue-600 rounded-full"
            style={{ width: `${stats.progressPercentage}%` }}
          />
        </View>
      </View>

      {/* Stats Grid */}
      <View className="flex-row justify-between mb-3">
        <View className="flex-1">
          <Text className="text-xs text-gray-500 mb-1">Завершено</Text>
          <Text className="font-semibold text-green-600">{stats.completed}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs text-gray-500 mb-1">В работе</Text>
          <Text className="font-semibold text-blue-600">{stats.inProgress}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs text-gray-500 mb-1">Ожидает</Text>
          <Text className="font-semibold text-gray-600">{stats.pending}</Text>
        </View>
      </View>

      {/* Payment Info */}
      <View className="flex-row justify-between items-center pt-3 border-t border-gray-200">
        <Text className="text-sm text-gray-600">Оплачено</Text>
        <Text className="font-semibold text-green-600">
          {stats.completedAmount.toLocaleString()} / {stats.totalAmount.toLocaleString()} ₽
        </Text>
      </View>

      {/* Next Milestone */}
      {nextMilestone && (
        <View className="mt-3 pt-3 border-t border-gray-200">
          <Text className="text-xs text-gray-500 mb-1">Следующая веха</Text>
          <Text className="font-medium" numberOfLines={1}>
            {nextMilestone.title}
          </Text>
          {nextMilestone.dueDate && (
            <View className="flex-row items-center mt-1">
              <Ionicons name="calendar-outline" size={12} color="#6B7280" />
              <Text className="text-xs text-gray-500 ml-1">
                {new Date(nextMilestone.dueDate).toLocaleDateString('ru-RU')}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Overdue Warning */}
      {overdueMilestones.length > 0 && (
        <View className="mt-3 bg-red-50 border border-red-200 rounded-lg p-2 flex-row items-center">
          <Ionicons name="alert-circle" size={16} color="#EF4444" />
          <Text className="text-xs text-red-800 ml-2 flex-1">
            {overdueMilestones.length} {overdueMilestones.length === 1 ? 'веха' : 'вех'} просрочено
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
