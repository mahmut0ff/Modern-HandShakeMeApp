import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActiveTimer } from '../../features/time-tracking/components/ActiveTimer';
import { SessionCard } from '../../features/time-tracking/components/SessionCard';
import { StartSessionModal } from '../../features/time-tracking/components/StartSessionModal';
import {
  getActiveSession,
  getTimeSessions,
  pauseTimeSession,
  resumeTimeSession,
  stopTimeSession,
  startTimeSession,
  getTimeTemplates,
  TimeTrackingSession,
  TimeTrackingTemplate,
} from '../../services/timeTrackingApi';

export default function TimeTrackingScreen() {
  const [activeSession, setActiveSession] = useState<TimeTrackingSession | null>(null);
  const [elapsedTime, setElapsedTime] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [sessions, setSessions] = useState<TimeTrackingSession[]>([]);
  const [templates, setTemplates] = useState<TimeTrackingTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'week' | 'month'>('week');

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load active session
      const activeData = await getActiveSession();
      setActiveSession(activeData.session);
      if (activeData.elapsedTime) {
        setElapsedTime(activeData.elapsedTime);
      }

      // Load sessions
      const now = new Date();
      let startDate: string | undefined;

      if (filter === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (filter === 'month') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      }

      const sessionsData = await getTimeSessions({
        startDate,
        limit: 50,
      });
      setSessions(sessionsData.sessions);

      // Load templates
      const templatesData = await getTimeTemplates();
      setTemplates(templatesData.templates);
    } catch (error: any) {
      console.error('Failed to load time tracking data:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [filter]);

  const handleStartSession = async (data: any) => {
    try {
      await startTimeSession(data);
      await loadData();
    } catch (error: any) {
      throw error;
    }
  };

  const handlePauseSession = async (location?: any) => {
    try {
      await pauseTimeSession(activeSession?.id, location);
      await loadData();
    } catch (error: any) {
      Alert.alert('Ошибка', 'Не удалось приостановить сессию');
    }
  };

  const handleResumeSession = async (location?: any) => {
    try {
      if (activeSession) {
        await resumeTimeSession(activeSession.id, location);
        await loadData();
      }
    } catch (error: any) {
      Alert.alert('Ошибка', 'Не удалось возобновить сессию');
    }
  };

  const handleStopSession = async (data: any) => {
    try {
      await stopTimeSession({
        sessionId: activeSession?.id,
        ...data,
      });
      await loadData();
      Alert.alert('Успешно', 'Сессия завершена');
    } catch (error: any) {
      Alert.alert('Ошибка', 'Не удалось завершить сессию');
    }
  };

  const handleSessionPress = (session: TimeTrackingSession) => {
    router.push(`/(master)/time-tracking/${session.id}`);
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

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-gray-900">Учет времени</Text>
            <Text className="text-sm text-gray-500 mt-1">
              Отслеживайте рабочее время
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(master)/time-tracking/statistics')}
            className="bg-blue-50 rounded-full p-3"
          >
            <Ionicons name="stats-chart" size={24} color="#0165FB" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="p-6">
          {/* Active Session */}
          {activeSession ? (
            <ActiveTimer
              session={activeSession}
              elapsedTime={elapsedTime}
              onPause={handlePauseSession}
              onResume={handleResumeSession}
              onStop={handleStopSession}
            />
          ) : (
            <TouchableOpacity
              onPress={() => setShowStartModal(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 mb-4 shadow-lg"
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="play-circle" size={32} color="white" />
                <Text className="text-white font-bold text-lg ml-3">
                  Начать отслеживание времени
                </Text>
              </View>
              <Text className="text-white/80 text-center mt-2">
                Отслеживайте время работы над проектами
              </Text>
            </TouchableOpacity>
          )}

          {/* Quick Actions */}
          <View className="flex-row space-x-3 mb-6">
            <TouchableOpacity
              onPress={() => router.push('/(master)/time-tracking/manual-entry')}
              className="flex-1 bg-white rounded-xl p-4 flex-row items-center border border-gray-200"
            >
              <Ionicons name="create-outline" size={24} color="#6B7280" />
              <Text className="text-sm font-medium text-gray-700 ml-2">Ручная запись</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(master)/time-tracking/templates')}
              className="flex-1 bg-white rounded-xl p-4 flex-row items-center border border-gray-200"
            >
              <Ionicons name="albums-outline" size={24} color="#6B7280" />
              <Text className="text-sm font-medium text-gray-700 ml-2">Шаблоны</Text>
            </TouchableOpacity>
          </View>

          {/* Filter */}
          <View className="flex-row mb-4">
            <TouchableOpacity
              onPress={() => setFilter('week')}
              className={`flex-1 py-3 rounded-l-xl border ${
                filter === 'week'
                  ? 'bg-blue-500 border-blue-500'
                  : 'bg-white border-gray-200'
              }`}
            >
              <Text
                className={`text-center font-medium ${
                  filter === 'week' ? 'text-white' : 'text-gray-600'
                }`}
              >
                Неделя
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setFilter('month')}
              className={`flex-1 py-3 border-t border-b ${
                filter === 'month'
                  ? 'bg-blue-500 border-blue-500'
                  : 'bg-white border-gray-200'
              }`}
            >
              <Text
                className={`text-center font-medium ${
                  filter === 'month' ? 'text-white' : 'text-gray-600'
                }`}
              >
                Месяц
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setFilter('all')}
              className={`flex-1 py-3 rounded-r-xl border ${
                filter === 'all'
                  ? 'bg-blue-500 border-blue-500'
                  : 'bg-white border-gray-200'
              }`}
            >
              <Text
                className={`text-center font-medium ${
                  filter === 'all' ? 'text-white' : 'text-gray-600'
                }`}
              >
                Все
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sessions List */}
          <View className="mb-4">
            <Text className="text-lg font-bold text-gray-900 mb-3">История сессий</Text>
            {sessions.length === 0 ? (
              <View className="bg-white rounded-2xl p-8 items-center">
                <Ionicons name="time-outline" size={48} color="#D1D5DB" />
                <Text className="text-gray-500 text-center mt-4">
                  Нет записей за выбранный период
                </Text>
              </View>
            ) : (
              sessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onPress={() => handleSessionPress(session)}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Start Session Modal */}
      <StartSessionModal
        visible={showStartModal}
        onClose={() => setShowStartModal(false)}
        onStart={handleStartSession}
        templates={templates}
      />
    </SafeAreaView>
  );
}
