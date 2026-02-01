/**
 * Metric Card Component
 * Компонент карточки метрики
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  backgroundColor?: string;
  onPress?: () => void;
}

export default function MetricCard({
  title,
  value,
  subtitle,
  icon,
  iconColor = '#3B82F6',
  trend,
  backgroundColor = 'white',
  onPress,
}: MetricCardProps) {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      className={`rounded-2xl p-4 border border-gray-200`}
      style={{ backgroundColor }}
      onPress={onPress}
    >
      <View className="flex-row items-center justify-between mb-2">
        {icon && (
          <View
            className="w-10 h-10 rounded-xl items-center justify-center"
            style={{ backgroundColor: `${iconColor}20` }}
          >
            <Ionicons name={icon} size={20} color={iconColor} />
          </View>
        )}
        {trend && (
          <View className="flex-row items-center">
            <Ionicons
              name={trend.isPositive ? 'trending-up' : 'trending-down'}
              size={16}
              color={trend.isPositive ? '#10B981' : '#EF4444'}
            />
            <Text
              className={`text-sm font-semibold ml-1 ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.isPositive ? '+' : ''}{trend.value.toFixed(1)}%
            </Text>
          </View>
        )}
      </View>

      <Text className="text-sm text-gray-600 mb-1">{title}</Text>
      <Text className="text-2xl font-bold text-gray-900">{value}</Text>
      
      {subtitle && (
        <Text className="text-xs text-gray-500 mt-1">{subtitle}</Text>
      )}
    </Container>
  );
}
