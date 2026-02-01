import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatisticsCard } from '../../../features/time-tracking/components/StatisticsCard';
import { getTimeStatistics, exportTimeData, TimeStatistics } from '../../../services/timeTrackingApi';
import * as Linking from 'expo-linking';

export default function TimeTrackingStatisticsScreen() {
  const [statistics, setStatistics] = useState<TimeStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    loadStatistics();
  }, [period]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const data = await getTimeStatistics({ period });
      setStatistics(data);
    } catch (error: any) {
      console.error('Failed to load statistics:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить статистику');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'CSV' | 'PDF' | 'EXCEL') => {
    try {
      setExporting(true);
      const result = await exportTimeData({
        format,
        includeEntries: true,
      });

      Alert.alert(
        'Экспорт готов',
        'Файл успешно создан. Открыть?',
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Открыть',
            onPress: () => {
              Linking.openURL(result.exportUrl);
            },
          },
          {
            text: 'Поделиться',
            onPress: () => {
              Share.share({
                message: 'Отчет по учету времени',
                url: result.exportUrl,
              });
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Ошибка', 'Не удалось экспортировать данные');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8F7FC]">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0165FB" />
        </View>
      </SafeAreaView>
    );
  }

  if (!statistics) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8F7FC]">
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="stats-chart-outline" size={64} color="#D1D5DB" />
          <Text className="text-gray-500 text-center mt-4">
            Нет данных для отображения статистики
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <View>
              <Text className="text-2xl font-bold text-gray-900">Статистика</Text>
              <Text className="text-sm text-gray-500 mt-1">
                Анализ рабочего времени
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => {
              Alert.alert('Экспорт', 'Выберите формат', [
                { text: 'CSV', onPress: () => handleExport('CSV') },
                { text: 'PDF', onPress: () => handleExport('PDF') },
                { text: 'Excel', onPress: () => handleExport('EXCEL') },
                { text: 'Отмена', style: 'cancel' },
              ]);
            }}
            disabled={exporting}
            className="bg-blue-50 rounded-full p-3"
          >
            {exporting ? (
              <ActivityIndicator size="small" color="#0165FB" />
            ) : (
              <Ionicons name="download-outline" size={24} color="#0165FB" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1">
        <View className="p-6">
          {/* Period Filter */}
          <View className="flex-row mb-6">
            {(['week', 'month', 'quarter', 'year'] as const).map((p, index) => {
              const labels = {
                week: 'Неделя',
                month: 'Месяц',
                quarter: 'Квартал',
                year: 'Год',
              };

              const isFirst = index === 0;
              const isLast = index === 3;

              return (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPeriod(p)}
                  className={`flex-1 py-3 border ${
                    isFirst ? 'rounded-l-xl' : ''
                  } ${isLast ? 'rounded-r-xl' : ''} ${
                    period === p
                      ? 'bg-blue-500 border-blue-500'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <Text
                    className={`text-center font-medium text-sm ${
                      period === p ? 'text-white' : 'text-gray-600'
                    }`}
                  >
                    {labels[p]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Statistics Card */}
          <StatisticsCard statistics={statistics} />

          {/* Charts Section */}
          {statistics.dailyStats && statistics.dailyStats.length > 0 && (
            <View className="bg-white rounded-2xl p-6 shadow-sm mb-4">
              <Text className="text-xl font-bold text-gray-900 mb-4">
                Динамика по дням
              </Text>
              <View className="space-y-3">
                {statistics.dailyStats.slice(-7).map((day, index) => {
                  const maxHours = Math.max(...statistics.dailyStats.map((d) => d.hours));
                  const percentage = maxHours > 0 ? (day.hours / maxHours) * 100 : 0;

                  return (
                    <View key={index}>
                      <View className="flex-row justify-between items-center mb-1">
                        <Text className="text-sm text-gray-600">
                          {new Date(day.date).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </Text>
                        <Text className="text-sm font-medium text-gray-900">
                          {day.hours.toFixed(1)} ч
                        </Text>
                      </View>
                      <View className="bg-gray-200 rounded-full h-2">
                        <View
                          className="bg-blue-500 rounded-full h-2"
                          style={{ width: `${percentage}%` }}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Weekly Stats */}
          {statistics.weeklyStats && statistics.weeklyStats.length > 0 && (
            <View className="bg-white rounded-2xl p-6 shadow-sm mb-4">
              <Text className="text-xl font-bold text-gray-900 mb-4">
                По неделям
              </Text>
              {statistics.weeklyStats.slice(-4).map((week, index) => (
                <View
                  key={index}
                  className="flex-row justify-between items-center py-3 border-b border-gray-100 last:border-b-0"
                >
                  <View>
                    <Text className="text-sm font-medium text-gray-900">
                      Неделя {new Date(week.week).toLocaleDateString('ru-RU')}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-1">
                      {week.sessions} сессий
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-base font-semibold text-gray-900">
                      {week.hours.toFixed(1)} ч
                    </Text>
                    <Text className="text-sm text-green-600 mt-1">
                      {Math.round(week.earnings)} сом
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Monthly Stats */}
          {statistics.monthlyStats && statistics.monthlyStats.length > 0 && (
            <View className="bg-white rounded-2xl p-6 shadow-sm mb-4">
              <Text className="text-xl font-bold text-gray-900 mb-4">
                По месяцам
              </Text>
              {statistics.monthlyStats.slice(-6).map((month, index) => (
                <View
                  key={index}
                  className="flex-row justify-between items-center py-3 border-b border-gray-100 last:border-b-0"
                >
                  <View>
                    <Text className="text-sm font-medium text-gray-900">
                      {new Date(month.month + '-01').toLocaleDateString('ru-RU', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-1">
                      {month.sessions} сессий
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-base font-semibold text-gray-900">
                      {month.hours.toFixed(1)} ч
                    </Text>
                    <Text className="text-sm text-green-600 mt-1">
                      {Math.round(month.earnings)} сом
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
