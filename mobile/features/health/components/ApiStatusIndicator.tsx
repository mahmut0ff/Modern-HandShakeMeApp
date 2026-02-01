import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { healthApi } from '../../../services/healthApi';

interface ApiStatusIndicatorProps {
  onPress?: () => void;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export const ApiStatusIndicator: React.FC<ApiStatusIndicatorProps> = ({
  onPress,
  showLabel = true,
  size = 'medium',
  autoRefresh = true,
  refreshInterval = 60000, // 1 minute
}) => {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkHealth();

    if (autoRefresh) {
      const interval = setInterval(() => {
        checkHealth();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const checkHealth = async () => {
    try {
      const result = await healthApi.getSimpleHealth();
      setIsHealthy(result.healthy);
    } catch (error) {
      setIsHealthy(false);
    } finally {
      setLoading(false);
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: 'px-2 py-1',
          dot: 'w-2 h-2',
          icon: 12,
          text: 'text-xs',
        };
      case 'large':
        return {
          container: 'px-4 py-2',
          dot: 'w-3 h-3',
          icon: 20,
          text: 'text-base',
        };
      default:
        return {
          container: 'px-3 py-1.5',
          dot: 'w-2.5 h-2.5',
          icon: 16,
          text: 'text-sm',
        };
    }
  };

  const styles = getSizeStyles();

  const getStatusColor = () => {
    if (loading || isHealthy === null) return '#9CA3AF';
    return isHealthy ? '#10B981' : '#EF4444';
  };

  const getStatusLabel = () => {
    if (loading) return 'Проверка...';
    if (isHealthy === null) return 'Неизвестно';
    return isHealthy ? 'API работает' : 'API недоступен';
  };

  const content = (
    <View
      className={`flex-row items-center rounded-full bg-gray-100 ${styles.container}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getStatusColor()} />
      ) : (
        <View
          className={`rounded-full ${styles.dot}`}
          style={{ backgroundColor: getStatusColor() }}
        />
      )}
      {showLabel && (
        <Text
          className={`ml-2 font-medium ${styles.text}`}
          style={{ color: getStatusColor() }}
        >
          {getStatusLabel()}
        </Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};
