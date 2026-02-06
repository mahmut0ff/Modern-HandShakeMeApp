/**
 * Service Price Display Component
 * Отображение цены услуги
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ServiceUnit } from '../types';

interface ServicePriceDisplayProps {
  priceFrom: string;
  priceTo?: string;
  unit: ServiceUnit;
  unitDisplay?: string;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
}

const UNIT_LABELS: Record<ServiceUnit, string> = {
  hour: 'час',
  sqm: 'м²',
  piece: 'шт',
  project: 'проект',
  day: 'день',
};

export function ServicePriceDisplay({
  priceFrom,
  priceTo,
  unit,
  unitDisplay,
  size = 'medium',
  showIcon = true,
}: ServicePriceDisplayProps) {
  const formatPrice = (price: string): string => {
    const num = parseFloat(price);
    return num.toLocaleString('ru-RU');
  };

  const unitLabel = unitDisplay || UNIT_LABELS[unit];

  const getPriceText = (): string => {
    if (priceTo && parseFloat(priceTo) > parseFloat(priceFrom)) {
      return `${formatPrice(priceFrom)} - ${formatPrice(priceTo)} сом/${unitLabel}`;
    }
    return `от ${formatPrice(priceFrom)} сом/${unitLabel}`;
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
        {getPriceText()}
      </Text>
    </View>
  );
}
