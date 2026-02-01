import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import {
  useGetProjectMilestonesQuery,
  useUpdateProjectMilestoneMutation,
} from '../../services/projectApi';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function MilestoneEditScreen() {
  const { projectId, milestoneId } = useLocalSearchParams<{
    projectId: string;
    milestoneId: string;
  }>();

  const { data: milestones, isLoading: loadingMilestones } = useGetProjectMilestonesQuery(
    Number(projectId)
  );
  const [updateMilestone, { isLoading: updating }] = useUpdateProjectMilestoneMutation();

  const milestone = milestones?.find((m) => m.id === Number(milestoneId));

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'>(
    'PENDING'
  );
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (milestone) {
      setTitle(milestone.title);
      setDescription(milestone.description || '');
      setAmount(String(milestone.amount));
      setStatus(milestone.status);
      if (milestone.dueDate) {
        setDueDate(new Date(milestone.dueDate));
      }
    }
  }, [milestone]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Ошибка', 'Введите название вехи');
      return;
    }

    if (!amount || Number(amount) <= 0) {
      Alert.alert('Ошибка', 'Введите корректную сумму');
      return;
    }

    try {
      await updateMilestone({
        id: Number(milestoneId),
        projectId: Number(projectId),
        data: {
          title: title.trim(),
          description: description.trim() || undefined,
          amount: Number(amount),
          status,
          dueDate: dueDate?.toISOString(),
        },
      }).unwrap();

      Alert.alert('Успешно', 'Веха обновлена', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Ошибка', err?.data?.error || 'Не удалось обновить веху');
    }
  };

  if (loadingMilestones) {
    return <LoadingSpinner />;
  }

  if (!milestone) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-500">Веха не найдена</Text>
      </View>
    );
  }

  const statusOptions = [
    { value: 'PENDING', label: 'Ожидает' },
    { value: 'IN_PROGRESS', label: 'В работе' },
    { value: 'COMPLETED', label: 'Завершено' },
    { value: 'CANCELLED', label: 'Отменено' },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Title */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">
            Название <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className="bg-white border border-gray-300 rounded-lg px-4 py-3"
            placeholder="Например: Первый этап работ"
            value={title}
            onChangeText={setTitle}
            maxLength={200}
          />
        </View>

        {/* Description */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">Описание</Text>
          <TextInput
            className="bg-white border border-gray-300 rounded-lg px-4 py-3"
            placeholder="Опишите что входит в эту веху"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={2000}
          />
        </View>

        {/* Amount */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">
            Сумма (₽) <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className="bg-white border border-gray-300 rounded-lg px-4 py-3"
            placeholder="0"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
        </View>

        {/* Status */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">Статус</Text>
          <View className="flex-row flex-wrap">
            {statusOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                className={`mr-2 mb-2 px-4 py-2 rounded-full border ${
                  status === option.value
                    ? 'bg-blue-600 border-blue-600'
                    : 'bg-white border-gray-300'
                }`}
                onPress={() => setStatus(option.value as any)}
              >
                <Text
                  className={status === option.value ? 'text-white font-medium' : 'text-gray-700'}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Due Date */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">Срок выполнения</Text>
          <TouchableOpacity
            className="bg-white border border-gray-300 rounded-lg px-4 py-3 flex-row items-center justify-between"
            onPress={() => setShowDatePicker(true)}
          >
            <Text className={dueDate ? 'text-gray-900' : 'text-gray-400'}>
              {dueDate ? dueDate.toLocaleDateString('ru-RU') : 'Выберите дату'}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
          </TouchableOpacity>

          {dueDate && (
            <TouchableOpacity className="mt-2" onPress={() => setDueDate(null)}>
              <Text className="text-red-500 text-sm">Очистить дату</Text>
            </TouchableOpacity>
          )}
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={dueDate || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                setDueDate(selectedDate);
              }
            }}
            minimumDate={new Date()}
          />
        )}

        {/* Submit Button */}
        <TouchableOpacity
          className={`rounded-lg py-4 items-center mt-6 ${
            updating ? 'bg-blue-400' : 'bg-blue-600'
          }`}
          onPress={handleSubmit}
          disabled={updating}
        >
          <Text className="text-white font-semibold text-base">
            {updating ? 'Сохранение...' : 'Сохранить изменения'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
