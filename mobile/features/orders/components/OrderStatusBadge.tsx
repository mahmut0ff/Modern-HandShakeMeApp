/**
 * Order Status Badge Component
 * Отображает статус заказа с соответствующим цветом
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { OrderStatus } from '../types';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: 'small' | 'medium' | 'large';
}

const STATUS_CONFIG: Record<OrderStatus, {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  bgColor: string;
  textColor: string;
  iconColor: string;
}> = {
  draft: {
    label: 'Черновик',
    icon: 'document-outline',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    iconColor: '#6B7280',
  },
  active: {
    label: 'Активный',
    icon: 'checkmark-circle',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    iconColor: '#10B981',
  },
  in_progress: {
    label: 'В работе',
    icon: 'time',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    iconColor: '#3B82F6',
  },
  completed: {
    label: 'Завершен',
    icon: 'checkmark-done-circle',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    iconColor: '#8B5CF6',
  },
  cancelled: {
    label: 'Отменен',
    icon: 'close-circle',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    iconColor: '#EF4444',
  },
};

export function OrderStatusBadge({ status, size = 'medium' }: OrderStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  
  const sizeClasses = {
    small: 'px-2 py-1',
    medium: 'px-3 py-1.5',
    large: 'px-4 py-2',
  };

  const textSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
  };

  const iconSizes = {
    small: 12,
    medium: 16,
    large: 20,
  };

  return (
    <View className={`flex-row items-center ${config.bgColor} ${sizeClasses[size]} rounded-full`}>
      <Ionicons name={config.icon} size={iconSizes[size]} color={config.iconColor} />
      <Text className={`${config.textColor} ${textSizeClasses[size]} font-medium ml-1`}>
        {config.label}
      </Text>
    </View>
  );
}
