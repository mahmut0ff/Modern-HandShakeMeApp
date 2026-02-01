import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProjectMilestone } from '../../services/projectApi';

interface MilestonePaymentCardProps {
  milestone: ProjectMilestone;
  onPayment?: (milestoneId: number) => void;
  canPay?: boolean;
}

export default function MilestonePaymentCard({
  milestone,
  onPayment,
  canPay = false,
}: MilestonePaymentCardProps) {
  const getStatusIcon = () => {
    switch (milestone.status) {
      case 'COMPLETED':
        return <Ionicons name="checkmark-circle" size={24} color="#10B981" />;
      case 'IN_PROGRESS':
        return <Ionicons name="time" size={24} color="#3B82F6" />;
      case 'PENDING':
        return <Ionicons name="ellipse-outline" size={24} color="#6B7280" />;
      case 'CANCELLED':
        return <Ionicons name="close-circle" size={24} color="#EF4444" />;
      default:
        return <Ionicons name="ellipse-outline" size={24} color="#6B7280" />;
    }
  };

  const getStatusText = () => {
    switch (milestone.status) {
      case 'COMPLETED':
        return 'Завершено';
      case 'IN_PROGRESS':
        return 'В работе';
      case 'PENDING':
        return 'Ожидает';
      case 'CANCELLED':
        return 'Отменено';
      default:
        return milestone.status;
    }
  };

  const handlePayment = () => {
    if (!onPayment) return;

    Alert.alert(
      'Оплата вехи',
      `Оплатить ${Number(milestone.amount).toLocaleString()} ₽ за "${milestone.title}"?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Оплатить',
          onPress: () => onPayment(milestone.id),
        },
      ]
    );
  };

  const isOverdue =
    milestone.dueDate &&
    milestone.status !== 'COMPLETED' &&
    new Date(milestone.dueDate) < new Date();

  return (
    <View className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-200">
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 mr-3">
          <Text className="font-semibold text-base mb-1">{milestone.title}</Text>
          {milestone.description && (
            <Text className="text-gray-600 text-sm" numberOfLines={2}>
              {milestone.description}
            </Text>
          )}
        </View>
        {getStatusIcon()}
      </View>

      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-sm text-gray-600">{getStatusText()}</Text>
        <Text className="text-lg font-bold text-blue-600">
          {Number(milestone.amount).toLocaleString()} ₽
        </Text>
      </View>

      {milestone.dueDate && (
        <View className="flex-row items-center mb-3">
          <Ionicons
            name="calendar-outline"
            size={16}
            color={isOverdue ? '#EF4444' : '#6B7280'}
          />
          <Text className={`text-sm ml-2 ${isOverdue ? 'text-red-500' : 'text-gray-600'}`}>
            Срок: {new Date(milestone.dueDate).toLocaleDateString('ru-RU')}
            {isOverdue && ' (просрочено)'}
          </Text>
        </View>
      )}

      {milestone.completedAt && (
        <View className="flex-row items-center mb-3">
          <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
          <Text className="text-sm text-green-600 ml-2">
            Завершено: {new Date(milestone.completedAt).toLocaleDateString('ru-RU')}
          </Text>
        </View>
      )}

      {canPay && milestone.status === 'COMPLETED' && (
        <TouchableOpacity
          className="bg-blue-600 rounded-lg py-3 items-center"
          onPress={handlePayment}
        >
          <Text className="text-white font-semibold">Оплатить веху</Text>
        </TouchableOpacity>
      )}

      {milestone.status === 'PENDING' && (
        <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <Text className="text-yellow-800 text-sm">
            Веха ожидает начала работ
          </Text>
        </View>
      )}
    </View>
  );
}
