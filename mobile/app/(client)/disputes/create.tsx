import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCreateDisputeMutation } from '../../../services/disputeApi';
import { useGetMyProjectsQuery } from '../../../services/projectApi';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { safeNavigate } from '../../../hooks/useNavigation';

interface Project {
  id: number;
  title: string;
  master_name?: string;
  master?: { name?: string; full_name?: string };
  status: string;
  budget?: string;
  total_amount?: string;
}

const disputeReasons = [
  { value: 'quality', label: 'Некачественная работа' },
  { value: 'deadline', label: 'Нарушение сроков' },
  { value: 'scope', label: 'Не соответствует договорённостям' },
  { value: 'communication', label: 'Мастер не выходит на связь' },
  { value: 'payment', label: 'Проблемы с оплатой' },
  { value: 'other', label: 'Другое' }
];

export default function CreateDisputePage() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  // API hooks
  const { data: projectsData, isLoading: projectsLoading } = useGetMyProjectsQuery({ status: 'in_progress' });
  const [createDispute] = useCreateDisputeMutation();

  // Get projects from response
  const projects: Project[] = Array.isArray(projectsData) 
    ? projectsData 
    : (projectsData?.results || []);

  const handleSubmit = async () => {
    if (!selectedProject) {
      Alert.alert('Ошибка', 'Выберите проект');
      return;
    }
    if (!selectedReason) {
      Alert.alert('Ошибка', 'Укажите причину спора');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Ошибка', 'Опишите проблему');
      return;
    }

    setLoading(true);
    try {
      await createDispute({
        project: selectedProject.id,
        reason: selectedReason,
        description: selectedReason === 'other' && customReason 
          ? `${customReason}: ${description}` 
          : description,
        amount_disputed: amount ? parseFloat(amount) : undefined,
      }).unwrap();
      
      Alert.alert(
        'Спор создан',
        'Ваш спор отправлен на рассмотрение. Мы свяжемся с вами в течение 24 часов.',
        [{ text: 'OK', onPress: () => safeNavigate.push('/(client)/disputes') }]
      );
    } catch (error: any) {
      console.error('Create dispute error:', error);
      Alert.alert('Ошибка', error.data?.message || 'Не удалось создать спор');
    } finally {
      setLoading(false);
    }
  };

  const getMasterName = (project: Project) => {
    return project.master_name || project.master?.name || project.master?.full_name || 'Мастер';
  };

  const getProjectAmount = (project: Project) => {
    return project.budget || project.total_amount || '0';
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
      <Text className="text-sm text-gray-600 mb-1">Мастер: {getMasterName(item)}</Text>
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-medium text-green-600">{getProjectAmount(item)} сом</Text>
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

  if (projectsLoading) {
    return <LoadingSpinner fullScreen text="Загрузка проектов..." />;
  }

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
          <View className="flex-row items-center gap-2 mb-4">
            <Ionicons name="folder" size={20} color="#0165FB" />
            <Text className="text-lg font-bold text-gray-900">Выберите проект</Text>
          </View>
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
          <View className="flex-row items-center gap-2 mb-4">
            <Ionicons name="list" size={20} color="#0165FB" />
            <Text className="text-lg font-bold text-gray-900">Причина спора</Text>
          </View>
          <View className="flex flex-col gap-2">
            {disputeReasons.map((reason) => (
              <TouchableOpacity
                key={reason.value}
                onPress={() => {
                  setSelectedReason(reason.value);
                  if (reason.value !== 'other') {
                    setCustomReason('');
                  }
                }}
                className={`p-3 rounded-2xl border-2 ${
                  selectedReason === reason.value
                    ? 'border-[#0165FB] bg-[#0165FB]/5'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <Text className={`font-medium ${
                    selectedReason === reason.value ? 'text-[#0165FB]' : 'text-gray-700'
                  }`}>
                    {reason.label}
                  </Text>
                  {selectedReason === reason.value && (
                    <Ionicons name="checkmark-circle" size={20} color="#0165FB" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {selectedReason === 'other' && (
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
          <View className="flex-row items-center gap-2 mb-4">
            <Ionicons name="document-text" size={20} color="#0165FB" />
            <Text className="text-lg font-bold text-gray-900">Описание проблемы</Text>
          </View>
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
          <View className="flex-row items-center gap-2 mb-4">
            <Ionicons name="card" size={20} color="#0165FB" />
            <Text className="text-lg font-bold text-gray-900">Спорная сумма</Text>
          </View>
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