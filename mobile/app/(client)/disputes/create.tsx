import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Project {
  id: number;
  title: string;
  master_name: string;
  status: string;
  amount: string;
}

const disputeReasons = [
  'Некачественная работа',
  'Нарушение сроков',
  'Не соответствует договорённостям',
  'Мастер не выходит на связь',
  'Проблемы с оплатой',
  'Другое'
];

export default function CreateDisputePage() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  // Mock data - replace with actual API calls
  const projects: Project[] = [
    {
      id: 1,
      title: 'Ремонт ванной комнаты',
      master_name: 'Иван Петров',
      status: 'in_progress',
      amount: '28000'
    },
    {
      id: 2,
      title: 'Установка кондиционера',
      master_name: 'Алексей Сидоров',
      status: 'completed',
      amount: '15000'
    }
  ];

  const handleSubmit = async () => {
    if (!selectedProject) {
      Alert.alert('Ошибка', 'Выберите проект');
      return;
    }
    if (!selectedReason && !customReason) {
      Alert.alert('Ошибка', 'Укажите причину спора');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Ошибка', 'Опишите проблему');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      Alert.alert(
        'Спор создан',
        'Ваш спор отправлен на рассмотрение. Мы свяжемся с вами в течение 24 часов.',
        [{ text: 'OK', onPress: () => router.push('/(client)/disputes') }]
      );
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось создать спор');
    } finally {
      setLoading(false);
    }
  };

  const renderProject = ({ item }: { item: Project }) => (
    <TouchableOpacity
      onPress={() => setSelectedProject(item)}
      className={`p-4 rounded-2xl border-2 mb-3 ${
        selectedProject?.id === item.id
          ? 'border-[#0165FB] bg-[#0165FB]/5'
          : 'border-gray-200 bg-white'
      }`}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className={`font-semibold ${
          selectedProject?.id === item.id ? 'text-[#0165FB]' : 'text-gray-900'
        }`} numberOfLines={1}>
          {item.title}
        </Text>
        {selectedProject?.id === item.id && (
          <Ionicons name="checkmark-circle" size={20} color="#0165FB" />
        )}
      </View>
      <Text className="text-sm text-gray-600 mb-1">Мастер: {item.master_name}</Text>
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-medium text-green-600">{item.amount} сом</Text>
        <View className={`px-2 py-1 rounded-full ${
          item.status === 'completed' ? 'bg-green-100' : 'bg-orange-100'
        }`}>
          <Text className={`text-xs font-medium ${
            item.status === 'completed' ? 'text-green-700' : 'text-orange-700'
          }`}>
            {item.status === 'completed' ? 'Завершён' : 'В работе'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}>
        {/* Header */}
        <View className="flex-row items-center gap-4 mb-6">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 bg-white rounded-2xl items-center justify-center shadow-sm border border-gray-100"
          >
            <Ionicons name="arrow-back" size={20} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">Создать спор</Text>
        </View>

        {/* Info Card */}
        <View className="bg-red-50 rounded-3xl p-5 border border-red-100 mb-6">
          <View className="flex-row items-start gap-3">
            <View className="w-10 h-10 bg-red-500 rounded-2xl items-center justify-center">
              <Ionicons name="warning" size={20} color="white" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-red-900 mb-2">Важная информация</Text>
              <Text className="text-sm text-red-700">
                Спор следует открывать только в случае серьёзных проблем. 
                Сначала попробуйте решить вопрос напрямую с мастером.
              </Text>
            </View>
          </View>
        </View>

        {/* Select Project */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-4">
            <Ionicons name="folder" size={20} color="#0165FB" />
            {' '}Выберите проект
          </Text>
          <FlatList
            data={projects}
            renderItem={renderProject}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Select Reason */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-4">
            <Ionicons name="list" size={20} color="#0165FB" />
            {' '}Причина спора
          </Text>
          <View className="space-y-2">
            {disputeReasons.map((reason) => (
              <TouchableOpacity
                key={reason}
                onPress={() => {
                  setSelectedReason(reason);
                  setCustomReason('');
                }}
                className={`p-3 rounded-2xl border-2 ${
                  selectedReason === reason
                    ? 'border-[#0165FB] bg-[#0165FB]/5'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <Text className={`font-medium ${
                    selectedReason === reason ? 'text-[#0165FB]' : 'text-gray-700'
                  }`}>
                    {reason}
                  </Text>
                  {selectedReason === reason && (
                    <Ionicons name="checkmark-circle" size={20} color="#0165FB" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {selectedReason === 'Другое' && (
            <View className="mt-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Укажите причину:</Text>
              <TextInput
                value={customReason}
                onChangeText={setCustomReason}
                placeholder="Опишите причину спора..."
                className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-gray-900"
              />
            </View>
          )}
        </View>

        {/* Description */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-4">
            <Ionicons name="document-text" size={20} color="#0165FB" />
            {' '}Описание проблемы
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Подробно опишите суть проблемы, приложите доказательства если есть..."
            multiline
            numberOfLines={6}
            className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-gray-900"
            textAlignVertical="top"
          />
        </View>

        {/* Amount */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-4">
            <Ionicons name="card" size={20} color="#0165FB" />
            {' '}Спорная сумма
          </Text>
          <View className="flex-row items-center gap-3">
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              keyboardType="numeric"
              className="flex-1 px-4 py-3 bg-gray-100 rounded-2xl text-gray-900"
            />
            <Text className="text-gray-600 font-medium">сом</Text>
          </View>
          <Text className="text-sm text-gray-500 mt-2">
            Укажите сумму, которую хотите вернуть или получить компенсацию
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          className={`py-4 rounded-2xl shadow-lg ${
            loading ? 'bg-gray-400' : 'bg-red-500'
          }`}
        >
          <Text className="text-center font-bold text-white text-lg">
            {loading ? 'Создание спора...' : 'Создать спор'}
          </Text>
        </TouchableOpacity>

        {/* Help */}
        <View className="bg-gray-50 rounded-2xl p-4 mt-4">
          <Text className="text-sm text-gray-600 text-center">
            Нужна помощь? Свяжитесь с поддержкой через чат или по телефону
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}