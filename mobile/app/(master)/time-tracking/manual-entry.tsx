import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addManualTimeEntry, TaskType } from '../../../services/timeTrackingApi';

const TASK_TYPES: { value: TaskType; label: string; icon: string }[] = [
  { value: 'WORK', label: 'Работа', icon: 'hammer-outline' },
  { value: 'PREPARATION', label: 'Подготовка', icon: 'construct-outline' },
  { value: 'TRAVEL', label: 'Дорога', icon: 'car-outline' },
  { value: 'BREAK', label: 'Перерыв', icon: 'cafe-outline' },
  { value: 'CLEANUP', label: 'Уборка', icon: 'trash-outline' },
  { value: 'DOCUMENTATION', label: 'Документация', icon: 'document-text-outline' },
  { value: 'OTHER', label: 'Другое', icon: 'ellipsis-horizontal-outline' },
];

export default function ManualEntryScreen() {
  const [taskType, setTaskType] = useState<TaskType>('WORK');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 60 * 60 * 1000)); // +1 hour
  const [hourlyRate, setHourlyRate] = useState('');
  const [notes, setNotes] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const calculateDuration = () => {
    const durationMs = endDate.getTime() - startDate.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return { hours, minutes, total: durationMs / (1000 * 60 * 60) };
  };

  const calculateCost = () => {
    if (!hourlyRate) return 0;
    const duration = calculateDuration();
    return Math.round(duration.total * parseFloat(hourlyRate));
  };

  const handleSubmit = async () => {
    if (startDate >= endDate) {
      Alert.alert('Ошибка', 'Время окончания должно быть позже времени начала');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Ошибка', 'Введите описание задачи');
      return;
    }

    setLoading(true);
    try {
      await addManualTimeEntry({
        taskType,
        description: description.trim(),
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
        notes: notes.trim() || undefined,
      });

      Alert.alert('Успешно', 'Запись добавлена', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось добавить запись');
    } finally {
      setLoading(false);
    }
  };

  const duration = calculateDuration();
  const cost = calculateCost();

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View>
            <Text className="text-2xl font-bold text-gray-900">Ручная запись</Text>
            <Text className="text-sm text-gray-500 mt-1">
              Добавить время вручную
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1">
        <View className="p-6">
          {/* Task Type */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-700 mb-3">Тип задачи *</Text>
            <View className="flex-row flex-wrap -mx-1">
              {TASK_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  onPress={() => setTaskType(type.value)}
                  className="w-1/2 px-1 mb-2"
                >
                  <View
                    className={`flex-row items-center p-3 rounded-xl border-2 ${
                      taskType === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <Ionicons
                      name={type.icon as any}
                      size={20}
                      color={taskType === type.value ? '#3B82F6' : '#6B7280'}
                    />
                    <Text
                      className={`text-sm font-medium ml-2 ${
                        taskType === type.value ? 'text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      {type.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Описание *</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Что вы делали?"
              multiline
              numberOfLines={3}
              className="bg-white rounded-xl p-4 text-base text-gray-900 border border-gray-200"
              style={{ textAlignVertical: 'top' }}
            />
          </View>

          {/* Time Range */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-700 mb-3">Время *</Text>

            <View className="bg-white rounded-xl border border-gray-200 p-4 mb-3">
              <Text className="text-xs text-gray-500 mb-2">Начало</Text>
              <TouchableOpacity
                onPress={() => setShowStartPicker(true)}
                className="flex-row items-center justify-between"
              >
                <Text className="text-base text-gray-900">
                  {startDate.toLocaleString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View className="bg-white rounded-xl border border-gray-200 p-4">
              <Text className="text-xs text-gray-500 mb-2">Окончание</Text>
              <TouchableOpacity
                onPress={() => setShowEndPicker(true)}
                className="flex-row items-center justify-between"
              >
                <Text className="text-base text-gray-900">
                  {endDate.toLocaleString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Duration Display */}
            <View className="bg-blue-50 rounded-xl p-4 mt-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-600">Длительность</Text>
                <Text className="text-lg font-semibold text-blue-600">
                  {duration.hours} ч {duration.minutes} мин
                </Text>
              </View>
            </View>
          </View>

          {/* Hourly Rate */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Ставка в час (необязательно)
            </Text>
            <View className="flex-row items-center bg-white rounded-xl border border-gray-200">
              <TextInput
                value={hourlyRate}
                onChangeText={setHourlyRate}
                placeholder="0"
                keyboardType="numeric"
                className="flex-1 p-4 text-base text-gray-900"
              />
              <Text className="text-gray-500 pr-4">сом/час</Text>
            </View>

            {hourlyRate && (
              <View className="bg-green-50 rounded-xl p-4 mt-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-gray-600">Стоимость</Text>
                  <Text className="text-lg font-semibold text-green-600">
                    {cost} сом
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Notes */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Заметки (необязательно)
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Дополнительная информация..."
              multiline
              numberOfLines={4}
              className="bg-white rounded-xl p-4 text-base text-gray-900 border border-gray-200"
              style={{ textAlignVertical: 'top' }}
            />
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View className="p-6 bg-white border-t border-gray-100">
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          className="bg-blue-500 rounded-xl py-4 flex-row items-center justify-center"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="white" />
              <Text className="text-white font-semibold text-base ml-2">
                Добавить запись
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Date Time Pickers */}
      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="datetime"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowStartPicker(Platform.OS === 'ios');
            if (selectedDate) {
              setStartDate(selectedDate);
            }
          }}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="datetime"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowEndPicker(Platform.OS === 'ios');
            if (selectedDate) {
              setEndDate(selectedDate);
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}
