import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProjectMilestone } from '../../services/projectApi';

interface MilestoneProgressProps {
  milestones: ProjectMilestone[];
}

export default function MilestoneProgress({ milestones }: MilestoneProgressProps) {
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter((m) => m.status === 'COMPLETED').length;
  const inProgressMilestones = milestones.filter((m) => m.status === 'IN_PROGRESS').length;

  const totalAmount = milestones.reduce((sum, m) => sum + Number(m.amount || 0), 0);
  const completedAmount = milestones
    .filter((m) => m.status === 'COMPLETED')
    .reduce((sum, m) => sum + Number(m.amount || 0), 0);

  const progressPercentage = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;
  const paymentPercentage = totalAmount > 0 ? (completedAmount / totalAmount) * 100 : 0;

  return (
    <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
      <Text className="text-lg font-semibold mb-4">Прогресс по вехам</Text>

      {/* Milestone Progress */}
      <View className="mb-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-gray-600">Выполнено вех</Text>
          <Text className="font-semibold">
            {completedMilestones} / {totalMilestones}
          </Text>
        </View>
        <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <View
            className="h-full bg-blue-600 rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </View>
        <Text className="text-xs text-gray-500 mt-1">{progressPercentage.toFixed(0)}%</Text>
      </View>

      {/* Payment Progress */}
      <View className="mb-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-gray-600">Оплачено</Text>
          <Text className="font-semibold">
            {completedAmount.toLocaleString()} / {totalAmount.toLocaleString()} ₽
          </Text>
        </View>
        <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <View
            className="h-full bg-green-600 rounded-full"
            style={{ width: `${paymentPercentage}%` }}
          />
        </View>
        <Text className="text-xs text-gray-500 mt-1">{paymentPercentage.toFixed(0)}%</Text>
      </View>

      {/* Status Summary */}
      <View className="flex-row justify-between pt-3 border-t border-gray-200">
        <View className="flex-row items-center">
          <View className="w-3 h-3 rounded-full bg-green-500 mr-2" />
          <Text className="text-sm text-gray-600">Завершено: {completedMilestones}</Text>
        </View>
        <View className="flex-row items-center">
          <View className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
          <Text className="text-sm text-gray-600">В работе: {inProgressMilestones}</Text>
        </View>
      </View>
    </View>
  );
}
