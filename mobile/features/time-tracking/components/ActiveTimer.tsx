import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { TimeTrackingSession } from '../../../services/timeTrackingApi';

interface ActiveTimerProps {
  session: TimeTrackingSession;
  elapsedTime: { hours: number; minutes: number; seconds: number };
  onPause: (location?: any) => Promise<void>;
  onResume: (location?: any) => Promise<void>;
  onStop: (data: any) => Promise<void>;
}

export const ActiveTimer: React.FC<ActiveTimerProps> = ({
  session,
  elapsedTime: initialElapsedTime,
  onPause,
  onResume,
  onStop,
}) => {
  const [elapsedTime, setElapsedTime] = useState(initialElapsedTime);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session.status === 'ACTIVE') {
      const interval = setInterval(() => {
        setElapsedTime((prev) => {
          let seconds = prev.seconds + 1;
          let minutes = prev.minutes;
          let hours = prev.hours;

          if (seconds >= 60) {
            seconds = 0;
            minutes += 1;
          }
          if (minutes >= 60) {
            minutes = 0;
            hours += 1;
          }

          return { hours, minutes, seconds };
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [session.status]);

  const formatTime = (time: { hours: number; minutes: number; seconds: number }) => {
    const h = String(time.hours).padStart(2, '0');
    const m = String(time.minutes).padStart(2, '0');
    const s = String(time.seconds).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return undefined;
      }

      const location = await Location.getCurrentPositionAsync({});
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Failed to get location:', error);
      return undefined;
    }
  };

  const handlePause = async () => {
    setLoading(true);
    try {
      const location = await getLocation();
      await onPause(location);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось приостановить таймер');
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async () => {
    setLoading(true);
    try {
      const location = await getLocation();
      await onResume(location);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось возобновить таймер');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = () => {
    Alert.alert(
      'Завершить сессию',
      'Вы уверены, что хотите завершить отслеживание времени?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Завершить',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const location = await getLocation();
              await onStop({ location });
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось завершить сессию');
            } finally {
              setLoading(false);
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

  return (
    <View className="bg-white rounded-2xl p-6 shadow-sm mb-4">
      {/* Status Badge */}
      <View className="flex-row items-center justify-between mb-4">
        <View
          className={`flex-row items-center px-3 py-1.5 rounded-full ${
            session.status === 'ACTIVE' ? 'bg-green-100' : 'bg-yellow-100'
          }`}
        >
          <View
            className={`w-2 h-2 rounded-full mr-2 ${
              session.status === 'ACTIVE' ? 'bg-green-500' : 'bg-yellow-500'
            }`}
          />
          <Text
            className={`text-sm font-semibold ${
              session.status === 'ACTIVE' ? 'text-green-700' : 'text-yellow-700'
            }`}
          >
            {session.status === 'ACTIVE' ? 'Активно' : 'На паузе'}
          </Text>
        </View>
        <Text className="text-sm text-gray-500">{getTaskTypeLabel(session.taskType)}</Text>
      </View>

      {/* Timer Display */}
      <View className="items-center mb-6">
        <Text className="text-5xl font-bold text-gray-900 mb-2">{formatTime(elapsedTime)}</Text>
        {session.description && (
          <Text className="text-base text-gray-600 text-center">{session.description}</Text>
        )}
      </View>

      {/* Billing Info */}
      {session.hourlyRate && (
        <View className="bg-blue-50 rounded-xl p-4 mb-6">
          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-gray-600">Ставка в час</Text>
            <Text className="text-lg font-semibold text-blue-600">
              {session.hourlyRate} сом/час
            </Text>
          </View>
          <View className="flex-row justify-between items-center mt-2">
            <Text className="text-sm text-gray-600">Текущая стоимость</Text>
            <Text className="text-lg font-semibold text-blue-600">
              {Math.round((elapsedTime.hours + elapsedTime.minutes / 60) * session.hourlyRate)} сом
            </Text>
          </View>
        </View>
      )}

      {/* Control Buttons */}
      <View className="flex-row space-x-3">
        {session.status === 'ACTIVE' ? (
          <TouchableOpacity
            onPress={handlePause}
            disabled={loading}
            className="flex-1 bg-yellow-500 rounded-xl py-4 flex-row items-center justify-center"
          >
            <Ionicons name="pause" size={24} color="white" />
            <Text className="text-white font-semibold text-base ml-2">Пауза</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleResume}
            disabled={loading}
            className="flex-1 bg-green-500 rounded-xl py-4 flex-row items-center justify-center"
          >
            <Ionicons name="play" size={24} color="white" />
            <Text className="text-white font-semibold text-base ml-2">Продолжить</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={handleStop}
          disabled={loading}
          className="flex-1 bg-red-500 rounded-xl py-4 flex-row items-center justify-center"
        >
          <Ionicons name="stop" size={24} color="white" />
          <Text className="text-white font-semibold text-base ml-2">Завершить</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
