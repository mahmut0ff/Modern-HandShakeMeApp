import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Network from 'expo-network';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { healthApi } from '../../../services/healthApi';

interface DiagnosticsScreenProps {
  onBack?: () => void;
}

interface DiagnosticResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: string;
  icon: string;
}

export const DiagnosticsScreen: React.FC<DiagnosticsScreenProps> = ({ onBack }) => {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);

  const runDiagnostics = async () => {
    setRunning(true);
    const diagnosticResults: DiagnosticResult[] = [];

    try {
      // 1. Check network connectivity
      try {
        const networkState = await Network.getNetworkStateAsync();
        diagnosticResults.push({
          name: 'Подключение к интернету',
          status: networkState.isConnected ? 'pass' : 'fail',
          message: networkState.isConnected
            ? 'Подключено'
            : 'Нет подключения к интернету',
          details: `Тип: ${networkState.type}`,
          icon: 'wifi',
        });
      } catch (error) {
        diagnosticResults.push({
          name: 'Подключение к интернету',
          status: 'warn',
          message: 'Не удалось проверить',
          icon: 'wifi',
        });
      }

      // 2. Check API connectivity
      try {
        const isConnected = await healthApi.checkApiConnection();
        diagnosticResults.push({
          name: 'Подключение к API',
          status: isConnected ? 'pass' : 'fail',
          message: isConnected
            ? 'API доступен'
            : 'API недоступен',
          details: process.env.EXPO_PUBLIC_API_URL,
          icon: 'server',
        });
      } catch (error) {
        diagnosticResults.push({
          name: 'Подключение к API',
          status: 'fail',
          message: 'Ошибка подключения к API',
          details: error instanceof Error ? error.message : 'Unknown error',
          icon: 'server',
        });
      }

      // 3. Check API health
      try {
        const health = await healthApi.getHealthStatus();
        diagnosticResults.push({
          name: 'Здоровье API',
          status: health.status === 'healthy' ? 'pass' : health.status === 'degraded' ? 'warn' : 'fail',
          message: healthApi.getStatusLabel(health.status),
          details: `Версия: ${health.version}`,
          icon: 'heart',
        });
      } catch (error) {
        diagnosticResults.push({
          name: 'Здоровье API',
          status: 'fail',
          message: 'Не удалось получить статус',
          icon: 'heart',
        });
      }

      // 4. Check device info
      try {
        diagnosticResults.push({
          name: 'Информация об устройстве',
          status: 'pass',
          message: `${Device.brand} ${Device.modelName}`,
          details: `OS: ${Device.osName} ${Device.osVersion}`,
          icon: 'phone-portrait',
        });
      } catch (error) {
        diagnosticResults.push({
          name: 'Информация об устройстве',
          status: 'warn',
          message: 'Не удалось получить информацию',
          icon: 'phone-portrait',
        });
      }

      // 5. Check app version
      try {
        diagnosticResults.push({
          name: 'Версия приложения',
          status: 'pass',
          message: Constants.expoConfig?.version || 'Unknown',
          details: `Build: ${Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || 'N/A'}`,
          icon: 'information-circle',
        });
      } catch (error) {
        diagnosticResults.push({
          name: 'Версия приложения',
          status: 'warn',
          message: 'Не удалось получить версию',
          icon: 'information-circle',
        });
      }

      // 6. Check storage
      try {
        // Simple check - if we can access AsyncStorage
        const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
        await AsyncStorage.getItem('test');
        diagnosticResults.push({
          name: 'Локальное хранилище',
          status: 'pass',
          message: 'Доступно',
          icon: 'save',
        });
      } catch (error) {
        diagnosticResults.push({
          name: 'Локальное хранилище',
          status: 'fail',
          message: 'Недоступно',
          details: error instanceof Error ? error.message : 'Unknown error',
          icon: 'save',
        });
      }

      setResults(diagnosticResults);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось выполнить диагностику');
    } finally {
      setRunning(false);
    }
  };

  const getStatusColor = (status: 'pass' | 'fail' | 'warn') => {
    switch (status) {
      case 'pass':
        return '#10B981';
      case 'warn':
        return '#F59E0B';
      case 'fail':
        return '#EF4444';
    }
  };

  const getStatusIcon = (status: 'pass' | 'fail' | 'warn') => {
    switch (status) {
      case 'pass':
        return 'checkmark-circle';
      case 'warn':
        return 'warning';
      case 'fail':
        return 'close-circle';
    }
  };

  const getOverallStatus = () => {
    if (results.length === 0) return null;
    
    const hasFailures = results.some(r => r.status === 'fail');
    const hasWarnings = results.some(r => r.status === 'warn');
    
    if (hasFailures) return 'fail';
    if (hasWarnings) return 'warn';
    return 'pass';
  };

  const overallStatus = getOverallStatus();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row items-center border-b border-gray-200">
        {onBack && (
          <TouchableOpacity onPress={onBack} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
        )}
        <Text className="text-xl font-bold text-gray-900">Диагностика</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4">
          {/* Info Card */}
          <View className="bg-blue-50 rounded-xl p-4 mb-6 flex-row">
            <Ionicons name="information-circle" size={24} color="#3B82F6" />
            <View className="flex-1 ml-3">
              <Text className="text-sm font-medium text-blue-900 mb-1">
                Диагностика системы
              </Text>
              <Text className="text-xs text-blue-700">
                Проверка подключения и работоспособности всех компонентов приложения
              </Text>
            </View>
          </View>

          {/* Run Diagnostics Button */}
          {results.length === 0 && (
            <TouchableOpacity
              onPress={runDiagnostics}
              disabled={running}
              className="bg-blue-500 rounded-xl py-4 flex-row items-center justify-center shadow-sm mb-6"
            >
              {running ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="play-circle" size={24} color="white" />
                  <Text className="text-white font-semibold text-base ml-2">
                    Запустить диагностику
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Overall Status */}
          {overallStatus && (
            <View
              className="rounded-xl p-4 mb-4"
              style={{ backgroundColor: `${getStatusColor(overallStatus)}20` }}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name={getStatusIcon(overallStatus) as any}
                  size={32}
                  color={getStatusColor(overallStatus)}
                />
                <View className="ml-3 flex-1">
                  <Text className="text-lg font-bold text-gray-900">
                    {overallStatus === 'pass'
                      ? 'Все работает'
                      : overallStatus === 'warn'
                      ? 'Есть предупреждения'
                      : 'Обнаружены проблемы'}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {results.filter(r => r.status === 'pass').length} из {results.length} проверок пройдено
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Results */}
          {results.map((result, index) => (
            <View key={index} className="bg-white rounded-xl p-4 mb-3 shadow-sm">
              <View className="flex-row items-start">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: `${getStatusColor(result.status)}20` }}
                >
                  <Ionicons
                    name={result.icon as any}
                    size={20}
                    color={getStatusColor(result.status)}
                  />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-base font-semibold text-gray-900 flex-1">
                      {result.name}
                    </Text>
                    <Ionicons
                      name={getStatusIcon(result.status) as any}
                      size={20}
                      color={getStatusColor(result.status)}
                    />
                  </View>
                  <Text className="text-sm text-gray-600 mb-1">
                    {result.message}
                  </Text>
                  {result.details && (
                    <Text className="text-xs text-gray-500">
                      {result.details}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ))}

          {/* Rerun Button */}
          {results.length > 0 && (
            <TouchableOpacity
              onPress={runDiagnostics}
              disabled={running}
              className="bg-gray-100 rounded-xl py-4 flex-row items-center justify-center mt-4"
            >
              {running ? (
                <ActivityIndicator color="#6B7280" />
              ) : (
                <>
                  <Ionicons name="refresh" size={24} color="#6B7280" />
                  <Text className="text-gray-700 font-semibold text-base ml-2">
                    Повторить диагностику
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Troubleshooting Tips */}
          {results.some(r => r.status === 'fail') && (
            <View className="bg-yellow-50 rounded-xl p-4 mt-6">
              <View className="flex-row items-start mb-3">
                <Ionicons name="bulb" size={24} color="#F59E0B" />
                <Text className="text-base font-semibold text-gray-900 ml-2">
                  Советы по устранению проблем
                </Text>
              </View>
              <View className="space-y-2">
                {results.find(r => r.name === 'Подключение к интернету' && r.status === 'fail') && (
                  <Text className="text-sm text-gray-700 mb-2">
                    • Проверьте подключение к Wi-Fi или мобильным данным
                  </Text>
                )}
                {results.find(r => r.name === 'Подключение к API' && r.status === 'fail') && (
                  <Text className="text-sm text-gray-700 mb-2">
                    • Убедитесь, что сервер доступен
                  </Text>
                )}
                {results.find(r => r.name === 'Локальное хранилище' && r.status === 'fail') && (
                  <Text className="text-sm text-gray-700 mb-2">
                    • Попробуйте переустановить приложение
                  </Text>
                )}
                <Text className="text-sm text-gray-700">
                  • Если проблема сохраняется, обратитесь в поддержку
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
