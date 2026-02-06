import React from 'react';
import { View, Text } from 'react-native';
import { useGetUnreadCountQuery } from '../../../services/notificationApi';

interface NotificationBadgeProps {
  size?: 'small' | 'medium' | 'large';
  showZero?: boolean;
}

export function NotificationBadge({ size = 'medium', showZero = false }: NotificationBadgeProps) {
  const { data } = useGetUnreadCountQuery();
  const count = data?.count || 0;

  if (count === 0 && !showZero) {
    return null;
  }

  const sizeClasses = {
    small: 'min-w-4 h-4 text-xs',
    medium: 'min-w-5 h-5 text-xs',
    large: 'min-w-6 h-6 text-sm',
  };

  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <View
      className={`bg-red-500 rounded-full items-center justify-center px-1 ${sizeClasses[size]}`}
    >
      <Text className="text-white font-bold">{displayCount}</Text>
    </View>
  );
}
