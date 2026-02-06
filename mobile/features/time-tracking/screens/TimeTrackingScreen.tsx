import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { timeTrackingApi, TimeTrackingSession } from '../../../services/timeTrackingApi';
import { ActiveTimer, SessionCard, StatisticsCard, StartSessionModal } from '../components';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ErrorMessage } from '../../../components/ErrorMessage';

interface TimeStats {
  totalHours: number;
  totalEarnings: number;
  sessionsCount: number;
  averageSessionDuration: number;
}

export const TimeTrackingScreen: React.FC = () => {
  const [activeSession, setActiveSession] = useState<TimeTrackingSession | null>(null);
  const [recentSessions, setRecentSessions] = useState<TimeTrackingSession[]>([]);
  const [stats, setStats] = useState<TimeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [elapsedTime, setElapsedTime] = useState({ hours: 0, minutes: 0, seconds: 0 });

  const { accessToken } = useSelector((state: RootState) => state.auth);

  const loadData = useCallback(async () => {
    if (!accessToken) return;

    try {
      setError(null);
      
      // Load active session
      const sessions = await timeTrackingApi.getSessions(accessToken, { status: 'ACTIVE' });
      const active = sessions.find(s => s.status === 'ACTIVE' || s.status === 'PAUSED');
      setActiveSession(active || null);

      if (active) {
        // Calculate elapsed time
        const startTime = new Date(active.startTime).getTime();
        const now = Date.now();
        const totalPausedMs = (active.totalPausedDuration || 0) * 1000;
        const elapsedMs = now - startTime - totalPausedMs;
        
        const hours = Math.floor(elapsedMs / (1000 * 60 * 60));
        const minutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((elapsedMs % (1000 * 60)) / 1000);
        
        setElapsedTime({ hours, minutes, seconds });
      }

      // Load recent sessions
      const recent = await timeTrackingApi.getSessions(accessToken, { 
        status: 'COMPLETED',
        limit: 10 
      });
      setRecentSessions(recent);

      // Calculate stats
      const completedSessions = recent.filter(s => s.status === 'COMPLETED');
      const totalMinutes = completedSessions.reduce((sum, s) => sum + (s.totalDuration || 0), 0);
      const totalEarnings = completedSessions.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
      
      setStats({
        totalHours: Math.round(totalMinutes / 60 * 10) / 10,
        totalEarnings,
        sessionsCount: completedSessions.length,
        averageSessionDuration: completedSessions.length > 0 
          ? Math.round(totalMinutes / completedSessions.length) 
          : 0
      });

    } catch (err: any) {
      setError(err.message || 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleStartSession = async (data: any) => {
    if (!accessToken) return;

    try {
      const session = await timeTrackingApi.startSession(accessToken, data);
      setActiveSession(session);
      setElapsedTime({ hours: 0, minutes: 0, seconds: 0 });
      setShowStartModal(false);
    } catch (err: any) {
      Alert.alert('Ошибка', err.message || 'Не удалось начать сессию');
    }
  };

  const handlePauseSession = async (location?: any) => {
    if (!accessToken || !activeSession) return;

    try {
      const updated = await timeTrackingApi.pauseSession(accessToken, activeSession.id, location);
      setActiveSession(updated);
    } catch (err: any) {
      throw err;
    }
  };

  const handleResumeSession = async (location?: any) => {
    if (!accessToken || !activeSession) return;

    try {
      const updated = await timeTrackingApi.resumeSession(accessToken, activeSession.id, location);
      setActiveSession(updated);
    } catch (err: any) {
      throw err;
    }
  };

  const handleStopSession = async (data: any) => {
    if (!accessToken || !activeSession) return;

    try {
      await timeTrackingApi.stopSession(accessToken, activeSession.id, data);
      setActiveSession(null);
      loadData();
    } catch (err: any) {
      throw err;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View className="p-4">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-2xl font-bold text-gray-900">Учет времени</Text>
            {!activeSession && (
              <TouchableOpacity
                onPress={() => setShowStartModal(true)}
                className="bg-blue-500 rounded-full p-3"
              >
                <Ionicons name="play" size={24} color="white" />
              </TouchableOpacity>
            )}
          </View>

          {error && <ErrorMessage message={error} onRetry={loadData} />}

          {/* Active Session */}
          {activeSession && (
            <ActiveTimer
              session={activeSession}
              elapsedTime={elapsedTime}
              onPause={handlePauseSession}
              onResume={handleResumeSession}
              onStop={handleStopSession}
            />
          )}

          {/* Statistics */}
          {stats && (
            <StatisticsCard
              totalHours={stats.totalHours}
              totalEarnings={stats.totalEarnings}
              sessionsCount={stats.sessionsCount}
              averageSessionDuration={stats.averageSessionDuration}
            />
          )}

          {/* Recent Sessions */}
          <View className="mt-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Последние сессии
            </Text>
            {recentSessions.length === 0 ? (
              <View className="bg-white rounded-xl p-6 items-center">
                <Ionicons name="time-outline" size={48} color="#9CA3AF" />
                <Text className="text-gray-500 mt-2 text-center">
                  Нет завершенных сессий
                </Text>
              </View>
            ) : (
              recentSessions.map((session) => (
                <SessionCard key={session.id} session={session} />
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
      />
    </SafeAreaView>
  );
};

export default TimeTrackingScreen;
