import React, { useState } from 'react';
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
import { useCreateProjectMilestoneMutation } from '../../services/projectApi';

export default function MilestoneCreateScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [createMilestone, { isLoading }] = useCreateProjectMilestoneMutation();

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
      await createMilestone({
        projectId: Number(projectId),
        data: {
          title: title.trim(),
          description: description.trim() || undefined,
          amount: Number(amount),
          dueDate: dueDate?.toISOString(),
        },
      }).unwrap();

      Alert.alert('Успешно', 'Веха создана', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Ошибка', err?.data?.error || 'Не удалось создать веху');
    }
  };

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
            <TouchableOpacity
              className="mt-2"
              onPress={() => setDueDate(null)}
            >
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
            isLoading ? 'bg-blue-400' : 'bg-blue-600'
          }`}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text className="text-white font-semibold text-base">
            {isLoading ? 'Создание...' : 'Создать веху'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
