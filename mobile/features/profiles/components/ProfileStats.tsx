/**
 * Profile Stats Component
 * Статистика профиля
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StatItem {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  value: string | number;
  label: string;
}

interface ProfileStatsProps {
  stats: StatItem[];
  columns?: 2 | 3 | 4;
}

export function ProfileStats({ stats, columns = 3 }: ProfileStatsProps) {
  const columnClass = {
    2: 'w-1/2',
    3: 'w-1/3',
    4: 'w-1/4',
  };

  return (
    <View className="bg-white p-4">
      <View className="flex-row flex-wrap">
        {stats.map((stat, index) => (
          <View
            key={index}
            className={`${columnClass[columns]} items-center py-2`}
          >
            <Ionicons name={stat.icon} size={24} color={stat.iconColor} />
            <Text className="text-lg font-bold text-gray-900 mt-1">
              {stat.value}
            </Text>
            <Text className="text-xs text-gray-500 text-center">
              {stat.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// Предустановленные статистики для мастера
export function MasterProfileStats({
  completedOrders,
  successRate,
  repeatClients,
  responseTime,
}: {
  completedOrders: number;
  successRate: string;
  repeatClients: number;
  responseTime?: string;
}) {
  const stats: StatItem[] = [
    {
      icon: 'checkmark-done-circle',
      iconColor: '#10B981',
      value: completedOrders,
      label: 'Выполнено',
    },
    {
      icon: 'trending-up',
      iconColor: '#3B82F6',
      value: `${successRate}%`,
      label: 'Успешность',
    },
    {
      icon: 'people',
      iconColor: '#8B5CF6',
      value: repeatClients,
      label: 'Повторных',
    },
  ];

  if (responseTime) {
    stats.push({
      icon: 'time',
      iconColor: '#F59E0B',
      value: responseTime,
      label: 'Ответ',
    });
  }

  return <ProfileStats stats={stats} columns={responseTime ? 4 : 3} />;
}

// Предустановленные статистики для клиента
export function ClientProfileStats({
  totalOrders,
  completedOrders,
  avgBudget,
}: {
  totalOrders: number;
  completedOrders: number;
  avgBudget: string;
}) {
  const stats: StatItem[] = [
    {
      icon: 'document-text',
      iconColor: '#3B82F6',
      value: totalOrders,
      label: 'Заказов',
    },
    {
      icon: 'checkmark-done-circle',
      iconColor: '#10B981',
      value: completedOrders,
      label: 'Завершено',
    },
    {
      icon: 'wallet',
      iconColor: '#F59E0B',
      value: avgBudget,
      label: 'Ср. бюджет',
    },
  ];

  return <ProfileStats stats={stats} columns={3} />;
}
