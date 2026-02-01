import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getTimeTemplates,
  createTimeTemplate,
  deleteTimeTemplate,
  TimeTrackingTemplate,
  TaskType,
} from '../../../services/timeTrackingApi';

const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: 'WORK', label: 'Работа' },
  { value: 'PREPARATION', label: 'Подготовка' },
  { value: 'TRAVEL', label: 'Дорога' },
  { value: 'BREAK', label: 'Перерыв' },
  { value: 'CLEANUP', label: 'Уборка' },
  { value: 'DOCUMENTATION', label: 'Документация' },
  { value: 'OTHER', label: 'Другое' },
];

export default function TemplatesScreen() {
  const [templates, setTemplates] = useState<TimeTrackingTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await getTimeTemplates();
      setTemplates(data.templates);
    } catch (error: any) {
      console.error('Failed to load templates:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить шаблоны');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (template: TimeTrackingTemplate) => {
    Alert.alert(
      'Удалить шаблон',
      `Вы уверены, что хотите удалить шаблон "${template.name}"?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTimeTemplate(template.id);
              await loadTemplates();
              Alert.alert('Успешно', 'Шаблон удален');
            } catch (error: any) {
              Alert.alert('Ошибка', 'Не удалось удалить шаблон');
            }
          },
        },
      ]
    );
  };

  const getTaskTypeLabel = (taskType: string) => {
    return TASK_TYPES.find((t) => t.value === taskType)?.label || taskType;
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
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <View>
              <Text className="text-2xl font-bold text-gray-900">Шаблоны</Text>
              <Text className="text-sm text-gray-500 mt-1">
                Быстрый старт сессий
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            className="bg-blue-500 rounded-full p-3"
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1">
        <View className="p-6">
          {templates.length === 0 ? (
            <View className="bg-white rounded-2xl p-8 items-center">
              <Ionicons name="albums-outline" size={64} color="#D1D5DB" />
              <Text className="text-gray-500 text-center mt-4 mb-2">
                Нет шаблонов
              </Text>
              <Text className="text-gray-400 text-center text-sm">
                Создайте шаблон для быстрого начала отслеживания времени
              </Text>
              <TouchableOpacity
                onPress={() => setShowCreateModal(true)}
                className="bg-blue-500 rounded-xl px-6 py-3 mt-6"
              >
                <Text className="text-white font-semibold">Создать шаблон</Text>
              </TouchableOpacity>
            </View>
          ) : (
            templates.map((template) => (
              <View
                key={template.id}
                className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100"
              >
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text className="text-lg font-bold text-gray-900">
                        {template.name}
                      </Text>
                      {template.isDefault && (
                        <View className="bg-blue-100 rounded-full px-2 py-0.5 ml-2">
                          <Text className="text-xs font-medium text-blue-600">
                            По умолчанию
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-sm text-gray-500 mt-1">
                      {template.description}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDelete(template)}
                    className="p-2"
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                  <View className="flex-row items-center">
                    <View className="bg-blue-50 rounded-full px-3 py-1">
                      <Text className="text-xs font-medium text-blue-600">
                        {getTaskTypeLabel(template.taskType)}
                      </Text>
                    </View>
                  </View>

                  {template.defaultHourlyRate && (
                    <View className="flex-row items-center">
                      <Ionicons name="cash-outline" size={16} color="#10B981" />
                      <Text className="text-sm font-semibold text-green-600 ml-1">
                        {template.defaultHourlyRate} сом/час
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Create Template Modal */}
      <CreateTemplateModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          loadTemplates();
        }}
      />
    </SafeAreaView>
  );
}

interface CreateTemplateModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('WORK');
  const [hourlyRate, setHourlyRate] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Ошибка', 'Введите название шаблона');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Ошибка', 'Введите описание шаблона');
      return;
    }

    setLoading(true);
    try {
      await createTimeTemplate({
        name: name.trim(),
        description: description.trim(),
        taskType,
        defaultHourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
        isDefault,
      });

      Alert.alert('Успешно', 'Шаблон создан');
      onSuccess();
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось создать шаблон');
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
            <Text className="text-xl font-bold text-gray-900">Новый шаблон</Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-6">
            {/* Name */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Название *</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Например: Стандартная работа"
                className="bg-gray-50 rounded-xl p-4 text-base text-gray-900 border border-gray-200"
              />
            </View>

            {/* Description */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Описание *</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Краткое описание шаблона"
                multiline
                numberOfLines={2}
                className="bg-gray-50 rounded-xl p-4 text-base text-gray-900 border border-gray-200"
                style={{ textAlignVertical: 'top' }}
              />
            </View>

            {/* Task Type */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Тип задачи *</Text>
              <View className="flex-row flex-wrap -mx-1">
                {TASK_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    onPress={() => setTaskType(type.value)}
                    className="w-1/2 px-1 mb-2"
                  >
                    <View
                      className={`p-3 rounded-xl border-2 ${
                        taskType === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium text-center ${
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

            {/* Hourly Rate */}
            <View className="mb-4">
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
            </View>

            {/* Is Default */}
            <TouchableOpacity
              onPress={() => setIsDefault(!isDefault)}
              className="flex-row items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-200"
            >
              <Text className="text-sm font-medium text-gray-700">
                Использовать по умолчанию
              </Text>
              <View
                className={`w-12 h-6 rounded-full ${
                  isDefault ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <View
                  className={`w-5 h-5 rounded-full bg-white mt-0.5 ${
                    isDefault ? 'ml-6' : 'ml-0.5'
                  }`}
                />
              </View>
            </TouchableOpacity>
          </ScrollView>

          {/* Footer */}
          <View className="p-6 border-t border-gray-100">
            <TouchableOpacity
              onPress={handleCreate}
              disabled={loading}
              className="bg-blue-500 rounded-xl py-4 flex-row items-center justify-center"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="white" />
                  <Text className="text-white font-semibold text-base ml-2">
                    Создать шаблон
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
