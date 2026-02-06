/**
 * Order Budget Display Component
 * Отображает бюджет заказа в зависимости от типа
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BudgetType } from '../types';

interface OrderBudgetDisplayProps {
  budgetType: BudgetType;
  budgetMin: string | null;
  budgetMax: string | null;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
}

export function OrderBudgetDisplay({
  budgetType,
  budgetMin,
  budgetMax,
  size = 'medium',
  showIcon = true,
}: OrderBudgetDisplayProps) {
  const formatBudget = (value: string | null): string => {
    if (!value) return '0';
    const num = parseFloat(value);
    return num.toLocaleString('ru-RU');
  };

  const getBudgetText = (): string => {
    switch (budgetType) {
      case 'fixed':
        return `${formatBudget(budgetMin)} сом`;
      case 'range':
        return `${formatBudget(budgetMin)} - ${formatBudget(budgetMax)} сом`;
      case 'negotiable':
        return 'Договорная';
      default:
        return 'Не указан';
    }
  };

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };

  const iconSizes = {
    small: 16,
    medium: 20,
    large: 24,
  };

  return (
    <View className="flex-row items-center">
      {showIcon && (
        <Ionicons 
          name="wallet-outline" 
          size={iconSizes[size]} 
          color="#10B981" 
          style={{ marginRight: 6 }}
        />
      )}
      <Text className={`${textSizeClasses[size]} font-semibold text-gray-900`}>
        {getBudgetText()}
      </Text>
    </View>
  );
}
