import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  getSessionEntries,
  deleteTimeSession,
  TimeTrackingSession,
  TimeEntry,
} from '../../../services/timeTrackingApi';

export default function SessionDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<TimeTrackingSession | null>(null);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadSessionDetails();
    }
  }, [id]);

  const loadSessionDetails = async () => {
    try {
      setLoading(true);
      const data = await getSessionEntries(id);
      setSession(data.session);
      setEntries(data.entries);
      setTimeline(data.timeline);
    } catch (error: any) {
      console.error('Failed to load session details:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить детали сессии');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Удалить сессию',
      'Вы уверены, что хотите удалить эту сессию? Это действие нельзя отменить.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTimeSession(id);
              Alert.alert('Успешно', 'Сессия удалена');
              router.back();
            } catch (error: any) {
              Alert.alert('Ошибка', 'Не удалось удалить сессию');
            }
          },
        },
      ]
    );
  };

  const getTaskTypeLabel = (taskType: string) => {
    const labels: Record<string, string> = {
      PREPARATION: 'Подготовка',
      TRAVEL: 'Дорога',
      WORK: 'Работа',
      BREAK: 'Перерыв',
      CLEANUP: 'Уборка',
      DOCUMENTATION: 'Документация',
      OTHER: 'Другое',
    };
    return labels[taskType] || taskType;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      ACTIVE: 'Активно',
      PAUSED: 'На паузе',
      COMPLETED: 'Завершено',
      CANCELLED: 'Отменено',
    };
    return labels[status] || status;
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '0 мин';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours} ч ${mins} мин`;
    }
    return `${mins} мин`;
  };

  const getEntryIcon = (type: string) => {
    const icons: Record<string, any> = {
      START: 'play-circle',
      PAUSE: 'pause-circle',
      RESUME: 'play-circle',
      STOP: 'stop-circle',
    };
    return icons[type] || 'radio-button-on';
  };

  const getEntryColor = (type: string) => {
    const colors: Record<string, string> = {
      START: 'text-green-600',
      PAUSE: 'text-yellow-600',
      RESUME: 'text-blue-600',
      STOP: 'text-red-600',
    };
    return colors[type] || 'text-gray-600';
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

  if (!session) {
    return null;
  }

  const earnings = session.billableHours && session.hourlyRate
    ? Math.round(session.billableHours * session.hourlyRate)
    : 0;

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900">
                {getTaskTypeLabel(session.taskType)}
              </Text>
              <Text className="text-sm text-gray-500 mt-1">
                {getStatusLabel(session.status)}
              </Text>
            </View>
          </View>
          {session.status === 'COMPLETED' && (
            <TouchableOpacity onPress={handleDelete} className="p-2">
              <Ionicons name="trash-outline" size={24} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView className="flex-1">
        <View className="p-6">
          {/* Summary Card */}
          <View className="bg-white rounded-2xl p-6 shadow-sm mb-4">
            <Text className="text-lg font-bold text-gray-900 mb-4">Сводка</Text>

            {session.description && (
              <View className="mb-4">
                <Text className="text-sm text-gray-500 mb-1">Описание</Text>
                <Text className="text-base text-gray-900">{session.description}</Text>
              </View>
            )}

            <View className="space-y-3">
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-600">Начало</Text>
                <Text className="text-sm font-medium text-gray-900">
                  {format(new Date(session.startTime), 'd MMMM yyyy, HH:mm', { locale: ru })}
                </Text>
              </View>

              {session.endTime && (
                <View className="flex-row justify-between">
                  <Text className="text-sm text-gray-600">Окончание</Text>
                  <Text className="text-sm font-medium text-gray-900">
                    {format(new Date(session.endTime), 'd MMMM yyyy, HH:mm', { locale: ru })}
                  </Text>
                </View>
              )}

              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-600">Общее время</Text>
                <Text className="text-sm font-medium text-gray-900">
                  {formatDuration(session.totalMinutes)}
                </Text>
              </View>

              {session.billableHours && (
                <View className="flex-row justify-between">
                  <Text className="text-sm text-gray-600">Оплачиваемое время</Text>
                  <Text className="text-sm font-medium text-gray-900">
                    {session.billableHours.toFixed(1)} ч
                  </Text>
                </View>
              )}

              {session.hourlyRate && (
                <>
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-gray-600">Ставка в час</Text>
                    <Text className="text-sm font-medium text-gray-900">
                      {session.hourlyRate} сом/час
                    </Text>
                  </View>

                  <View className="flex-row justify-between pt-3 border-t border-gray-100">
                    <Text className="text-base font-semibold text-gray-900">Стоимость</Text>
                    <Text className="text-lg font-bold text-green-600">
                      {earnings} сом
                    </Text>
                  </View>
                </>
              )}
            </View>

            {session.finalNotes && (
              <View className="mt-4 pt-4 border-t border-gray-100">
                <Text className="text-sm text-gray-500 mb-1">Заметки</Text>
                <Text className="text-base text-gray-900">{session.finalNotes}</Text>
              </View>
            )}

            {session.isManualEntry && (
              <View className="mt-4 pt-4 border-t border-gray-100">
                <View className="flex-row items-center">
                  <Ionicons name="create-outline" size={16} color="#6B7280" />
                  <Text className="text-sm text-gray-500 ml-2">Ручная запись</Text>
                </View>
              </View>
            )}
          </View>

          {/* Timeline */}
          {timeline.length > 0 && (
            <View className="bg-white rounded-2xl p-6 shadow-sm mb-4">
              <Text className="text-lg font-bold text-gray-900 mb-4">Хронология</Text>

              <View className="space-y-4">
                {timeline.map((item, index) => (
                  <View key={index} className="flex-row">
                    <View className="items-center mr-4">
                      <Ionicons
                        name={getEntryIcon(item.type)}
                        size={24}
                        className={getEntryColor(item.type)}
                      />
                      {index < timeline.length - 1 && (
                        <View className="w-0.5 h-full bg-gray-200 mt-2" />
                      )}
                    </View>

                    <View className="flex-1 pb-4">
                      <Text className="text-base font-medium text-gray-900">
                        {item.description}
                      </Text>
                      <Text className="text-sm text-gray-500 mt-1">
                        {format(new Date(item.timestamp), 'HH:mm:ss')}
                      </Text>
                      {item.duration !== undefined && (
                        <Text className="text-sm text-blue-600 mt-1">
                          Длительность: {item.duration} мин
                        </Text>
                      )}
                      {item.notes && (
                        <Text className="text-sm text-gray-600 mt-2">{item.notes}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Attachments */}
          {session.attachments && session.attachments.length > 0 && (
            <View className="bg-white rounded-2xl p-6 shadow-sm mb-4">
              <Text className="text-lg font-bold text-gray-900 mb-4">Вложения</Text>
              {session.attachments.map((attachment, index) => (
                <View
                  key={index}
                  className="flex-row items-center p-3 bg-gray-50 rounded-xl mb-2"
                >
                  <Ionicons name="document-attach-outline" size={24} color="#6B7280" />
                  <View className="flex-1 ml-3">
                    <Text className="text-sm font-medium text-gray-900">
                      {attachment.fileName}
                    </Text>
                    {attachment.description && (
                      <Text className="text-xs text-gray-500 mt-1">
                        {attachment.description}
                      </Text>
                    )}
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
