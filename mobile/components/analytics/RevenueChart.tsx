/**
 * Revenue Chart Component
 * Компонент графика доходов
 */

import React from 'react';
import { View, Text, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface DataPoint {
  timestamp: string;
  value: number;
  label: string;
}

interface RevenueChartProps {
  data: DataPoint[];
  height?: number;
  showLabels?: boolean;
  color?: string;
}

export default function RevenueChart({
  data,
  height = 200,
  showLabels = true,
  color = '#3B82F6',
}: RevenueChartProps) {
  if (!data || data.length === 0) {
    return (
      <View className="items-center justify-center" style={{ height }}>
        <Text className="text-gray-500">Нет данных для отображения</Text>
      </View>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;

  return (
    <View style={{ height }}>
      {/* Chart */}
      <View className="flex-1 flex-row items-end justify-between px-2">
        {data.map((item, index) => {
          const barHeight = range > 0 ? ((item.value - minValue) / range) * 100 : 50;
          
          return (
            <View key={index} className="flex-1 items-center mx-1">
              {/* Value Label */}
              {showLabels && (
                <Text className="text-xs font-semibold text-gray-700 mb-1">
                  {(item.value / 1000).toFixed(0)}K
                </Text>
              )}
              
              {/* Bar */}
              <View
                className="w-full rounded-t-lg"
                style={{
                  height: `${barHeight}%`,
                  backgroundColor: color,
                  minHeight: 20,
                }}
              />
              
              {/* Period Label */}
              <Text className="text-xs text-gray-500 mt-2">
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
