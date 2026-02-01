import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  healthApi,
  HealthCheckResult,
  HealthCheckDetail,
} from '../../../services/healthApi';

interface SystemStatusScreenProps {
  onBack?: () => void;
}

export const SystemStatusScreen: React.FC<SystemStatusScreenProps> = ({ onBack }) => {
  const [health, setHealth] = useState<HealthCheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHealthStatus();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadHealthStatus(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadHealthStatus = async (silent: boolean = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      const result = await healthApi.getHealthStatus();
      setHealth(result);
    } catch (err: any) {
      console.error('Health check error:', err);
      setError('Не удалось получить статус системы');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHealthStatus();
  };

  const renderCheckItem = (
    name: string,
    check: HealthCheckDetail,
    icon: string
  ) => {
    const statusColor = healthApi.getStatusColor(check.status);
    const statusIcon = healthApi.getStatusIcon(check.status);
    const statusLabel = healthApi.getStatusLabel(check.status);

    return (
      <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center flex-1">
            <View
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: `${statusColor}20` }}
            >
              <Ionicons name={icon as any} size={20} color={statusColor} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900">
                {name}
              </Text>
              {check.message && (
                <Text className="text-sm text-gray-600 mt-1">
                  {check.message}
                </Text>
              )}
            </View>
          </View>
          <View className="flex-row items-center">
            <Ionicons name={statusIcon as any} size={24} color={statusColor} />
          </View>
        </View>

        <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-gray-100">
          <Text className="text-xs text-gray-500">
            {new Date(check.lastChecked).toLocaleTimeString('ru-RU')}
          </Text>
          {check.responseTime && (
            <Text className="text-xs text-gray-500">
              {check.responseTime}ms
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (loading && !health) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#0165FB" />
        <Text className="text-gray-600 mt-4">Проверка системы...</Text>
      </SafeAreaView>
    );
  }

  if (error && !health) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="bg-white px-4 py-3 flex-row items-center border-b border-gray-200">
          {onBack && (
            <TouchableOpacity onPress={onBack} className="mr-3">
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
          )}
          <Text className="text-xl font-bold text-gray-900">Статус системы</Text>
        </View>

        <View className="flex-1 items-center justify-center p-6">
          <View className="w-20 h-20 rounded-full bg-red-100 items-center justify-center mb-4">
            <Ionicons name="alert-circle" size={40} color="#EF4444" />
          </View>
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            Ошибка подключения
          </Text>
          <Text className="text-center text-gray-600 mb-6">{error}</Text>
          <TouchableOpacity
            onPress={() => loadHealthStatus()}
            className="bg-blue-500 rounded-xl py-3 px-6"
          >
            <Text className="text-white font-semibold">Повторить</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!health) return null;

  const statusColor = healthApi.getStatusColor(health.status);
  const statusIcon = healthApi.getStatusIcon(health.status);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row items-center justify-between border-b border-gray-200">
        <View className="flex-row items-center flex-1">
          {onBack && (
            <TouchableOpacity onPress={onBack} className="mr-3">
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
          )}
          <Text className="text-xl font-bold text-gray-900">Статус системы</Text>
        </View>
        <TouchableOpacity onPress={() => loadHealthStatus()}>
          <Ionicons name="refresh" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="p-4">
          {/* Overall Status */}
          <View
            className="rounded-2xl p-6 mb-6"
            style={{ backgroundColor: `${statusColor}20` }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center flex-1">
                <View
                  className="w-16 h-16 rounded-full items-center justify-center mr-4"
                  style={{ backgroundColor: statusColor }}
                >
                  <Ionicons name={statusIcon as any} size={32} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-2xl font-bold text-gray-900 mb-1">
                    {healthApi.getStatusLabel(health.status)}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    Общий статус системы
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row items-center justify-between pt-4 border-t border-gray-200">
              <View className="flex-1">
                <Text className="text-xs text-gray-600 mb-1">Версия</Text>
                <Text className="text-sm font-medium text-gray-900">
                  {health.version}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-600 mb-1">Окружение</Text>
                <Text className="text-sm font-medium text-gray-900">
                  {health.environment}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-600 mb-1">Uptime</Text>
                <Text className="text-sm font-medium text-gray-900">
                  {healthApi.formatUptime(health.uptime)}
                </Text>
              </View>
            </View>
          </View>

          {/* Core Services */}
          <Text className="text-lg font-bold text-gray-900 mb-3">
            Основные сервисы
          </Text>

          {renderCheckItem('База данных', health.checks.database, 'server')}
          {renderCheckItem('Хранилище', health.checks.storage, 'cloud')}
          {renderCheckItem('Уведомления', health.checks.notifications, 'notifications')}
          {renderCheckItem('Память', health.checks.memory, 'hardware-chip')}
          {renderCheckItem('Конфигурация', health.checks.configuration, 'settings')}

          {/* External Services */}
          {health.checks.external && (
            <>
              <Text className="text-lg font-bold text-gray-900 mb-3 mt-4">
                Внешние сервисы
              </Text>

              {health.checks.external.telegram &&
                renderCheckItem(
                  'Telegram Bot',
                  health.checks.external.telegram,
                  'logo-telegram'
                )}

              {health.checks.external.yandexMaps &&
                renderCheckItem(
                  'Yandex Maps',
                  health.checks.external.yandexMaps,
                  'map'
                )}

              {health.checks.external.email &&
                renderCheckItem(
                  'Email сервис',
                  health.checks.external.email,
                  'mail'
                )}
            </>
          )}

          {/* Metadata */}
          {health.metadata && (
            <View className="bg-white rounded-xl p-4 mt-4 shadow-sm">
              <Text className="text-base font-semibold text-gray-900 mb-3">
                Метаданные
              </Text>
              <View className="space-y-2">
                {health.metadata.functionName && (
                  <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
                    <Text className="text-sm text-gray-600">Функция</Text>
                    <Text className="text-sm font-medium text-gray-900">
                      {health.metadata.functionName}
                    </Text>
                  </View>
                )}
                {health.metadata.lambdaMemoryLimit && (
                  <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
                    <Text className="text-sm text-gray-600">Лимит памяти</Text>
                    <Text className="text-sm font-medium text-gray-900">
                      {health.metadata.lambdaMemoryLimit} MB
                    </Text>
                  </View>
                )}
                {health.metadata.lambdaMemoryUsed && (
                  <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
                    <Text className="text-sm text-gray-600">Использовано памяти</Text>
                    <Text className="text-sm font-medium text-gray-900">
                      {Math.round(health.metadata.lambdaMemoryUsed)} MB
                    </Text>
                  </View>
                )}
                {health.metadata.nodeVersion && (
                  <View className="flex-row items-center justify-between py-2">
                    <Text className="text-sm text-gray-600">Node.js</Text>
                    <Text className="text-sm font-medium text-gray-900">
                      {health.metadata.nodeVersion}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Last Updated */}
          <Text className="text-xs text-gray-500 text-center mt-6 mb-4">
            Последнее обновление:{' '}
            {new Date(health.timestamp).toLocaleString('ru-RU')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
