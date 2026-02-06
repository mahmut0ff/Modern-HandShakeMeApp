/**
 * Application Status Badge Component
 * Отображает статус заявки с соответствующим цветом
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ApplicationStatus } from '../types';

interface ApplicationStatusBadgeProps {
  status: ApplicationStatus;
  size?: 'small' | 'medium' | 'large';
}

const STATUS_CONFIG: Record<ApplicationStatus, {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  bgColor: string;
  textColor: string;
  iconColor: string;
}> = {
  pending: {
    label: 'Ожидает',
    icon: 'time',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    iconColor: '#F59E0B',
  },
  viewed: {
    label: 'Просмотрена',
    icon: 'eye',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    iconColor: '#3B82F6',
  },
  accepted: {
    label: 'Принята',
    icon: 'checkmark-circle',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    iconColor: '#10B981',
  },
  rejected: {
    label: 'Отклонена',
    icon: 'close-circle',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    iconColor: '#EF4444',
  },
  cancelled: {
    label: 'Отменена',
    icon: 'ban',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    iconColor: '#6B7280',
  },
};

export function ApplicationStatusBadge({ status, size = 'medium' }: ApplicationStatusBadgeProps) {
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
