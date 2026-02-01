import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TaskType, TimeTrackingTemplate } from '../../../services/timeTrackingApi';

interface StartSessionModalProps {
  visible: boolean;
  onClose: () => void;
  onStart: (data: any) => Promise<void>;
  projectId?: string;
  bookingId?: string;
  templates?: TimeTrackingTemplate[];
}

const TASK_TYPES: { value: TaskType; label: string; icon: string }[] = [
  { value: 'WORK', label: 'Работа', icon: 'hammer-outline' },
  { value: 'PREPARATION', label: 'Подготовка', icon: 'construct-outline' },
  { value: 'TRAVEL', label: 'Дорога', icon: 'car-outline' },
  { value: 'BREAK', label: 'Перерыв', icon: 'cafe-outline' },
  { value: 'CLEANUP', label: 'Уборка', icon: 'trash-outline' },
  { value: 'DOCUMENTATION', label: 'Документация', icon: 'document-text-outline' },
  { value: 'OTHER', label: 'Другое', icon: 'ellipsis-horizontal-outline' },
];

export const StartSessionModal: React.FC<StartSessionModalProps> = ({
  visible,
  onClose,
  onStart,
  projectId,
  bookingId,
  templates = [],
}) => {
  const [taskType, setTaskType] = useState<TaskType>('WORK');
  const [description, setDescription] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      // Reset form
      setTaskType('WORK');
      setDescription('');
      setHourlyRate('');
      setSelectedTemplate(null);

      // Apply default template if exists
      const defaultTemplate = templates.find((t) => t.isDefault);
      if (defaultTemplate) {
        applyTemplate(defaultTemplate);
      }
    }
  }, [visible, templates]);

  const applyTemplate = (template: TimeTrackingTemplate) => {
    setSelectedTemplate(template.id);
    setTaskType(template.taskType);
    setDescription(template.description);
    if (template.defaultHourlyRate) {
      setHourlyRate(template.defaultHourlyRate.toString());
    }
  };

  const handleStart = async () => {
    if (!taskType) {
      Alert.alert('Ошибка', 'Выберите тип задачи');
      return;
    }

    setLoading(true);
    try {
      await onStart({
        projectId,
        bookingId,
        taskType,
        description: description.trim() || undefined,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
      });
      onClose();
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось начать отслеживание');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl max-h-[90%]">
          {/* Header */}
          <View className="flex-row items-center justify-between p-6 border-b border-gray-100">
            <Text className="text-xl font-bold text-gray-900">Начать отслеживание</Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-6">
            {/* Templates */}
            {templates.length > 0 && (
              <View className="mb-6">
                <Text className="text-sm font-semibold text-gray-700 mb-3">Шаблоны</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {templates.map((template) => (
                    <TouchableOpacity
                      key={template.id}
                      onPress={() => applyTemplate(template)}
                      className={`mr-3 px-4 py-3 rounded-xl border-2 ${
                        selectedTemplate === template.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          selectedTemplate === template.id ? 'text-blue-600' : 'text-gray-700'
                        }`}
                      >
                        {template.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Task Type */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-3">Тип задачи *</Text>
              <View className="flex-row flex-wrap -mx-1">
                {TASK_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    onPress={() => setTaskType(type.value)}
                    className={`w-1/2 px-1 mb-2`}
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
              <Text className="text-sm font-semibold text-gray-700 mb-2">Описание</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Краткое описание задачи..."
                multiline
                numberOfLines={3}
                className="bg-gray-50 rounded-xl p-4 text-base text-gray-900 border border-gray-200"
                style={{ textAlignVertical: 'top' }}
              />
            </View>

            {/* Hourly Rate */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Ставка в час (необязательно)
              </Text>
              <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200">
                <TextInput
                  value={hourlyRate}
                  onChangeText={setHourlyRate}
                  placeholder="0"
                  keyboardType="numeric"
                  className="flex-1 p-4 text-base text-gray-900"
                />
                <Text className="text-gray-500 pr-4">сом/час</Text>
              </View>
              <Text className="text-xs text-gray-500 mt-2">
                Укажите ставку для автоматического расчета стоимости
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View className="p-6 border-t border-gray-100">
            <TouchableOpacity
              onPress={handleStart}
              disabled={loading}
              className="bg-blue-500 rounded-xl py-4 flex-row items-center justify-center"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="play" size={24} color="white" />
                  <Text className="text-white font-semibold text-base ml-2">
                    Начать отслеживание
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
