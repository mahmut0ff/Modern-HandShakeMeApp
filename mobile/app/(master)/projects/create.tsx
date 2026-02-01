import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CreateProjectPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    order_id: '',
    client_id: '',
    agreed_price: '',
    deadline: '',
    priority: 'medium',
    description: '',
    milestones: [
      { title: '', description: '' }
    ]
  });

  const priorityOptions = [
    { value: 'low', label: 'Низкий', color: 'bg-gray-500' },
    { value: 'medium', label: 'Средний', color: 'bg-yellow-500' },
    { value: 'high', label: 'Высокий', color: 'bg-red-500' },
  ];

  const handleAddMilestone = () => {
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, { title: '', description: '' }]
    }));
  };

  const handleRemoveMilestone = (index: number) => {
    if (formData.milestones.length > 1) {
      setFormData(prev => ({
        ...prev,
        milestones: prev.milestones.filter((_, i) => i !== index)
      }));
    }
  };

  const handleMilestoneChange = (index: number, field: 'title' | 'description', value: string) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map((milestone, i) => 
        i === index ? { ...milestone, [field]: value } : milestone
      )
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.order_id.trim()) {
      Alert.alert('Ошибка', 'Выберите заказ');
      return;
    }

    if (!formData.agreed_price.trim()) {
      Alert.alert('Ошибка', 'Укажите согласованную цену');
      return;
    }

    if (!formData.deadline.trim()) {
      Alert.alert('Ошибка', 'Укажите дедлайн');
      return;
    }

    // Check milestones
    const validMilestones = formData.milestones.filter(m => m.title.trim());
    if (validMilestones.length === 0) {
      Alert.alert('Ошибка', 'Добавьте хотя бы один этап работы');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      Alert.alert('Успех', 'Проект создан!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось создать проект');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 bg-white rounded-2xl items-center justify-center shadow-sm border border-gray-100"
          >
            <Ionicons name="arrow-back" size={20} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Создать проект</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className={`px-4 py-2 rounded-2xl ${loading ? 'bg-gray-400' : 'bg-[#0165FB]'}`}
          >
            <Text className="text-white font-semibold">
              {loading ? 'Создание...' : 'Создать'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Basic Info */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="font-semibold text-gray-900 mb-4">Основная информация</Text>
          
          <View className="flex flex-col gap-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Заказ *</Text>
              <TouchableOpacity 
                onPress={() => {
                  // TODO: Open order selection modal
                  Alert.alert('Выбор заказа', 'Здесь будет список ваших принятых заказов');
                }}
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl flex-row items-center justify-between"
              >
                <Text className={formData.order_id ? 'text-gray-900' : 'text-gray-500'}>
                  {formData.order_id || 'Выберите заказ'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Согласованная цена (сом) *</Text>
              <TextInput
                value={formData.agreed_price}
                onChangeText={(text) => setFormData(prev => ({ ...prev, agreed_price: text }))}
                placeholder="Введите согласованную цену"
                keyboardType="numeric"
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900"
              />
            </View>
            
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Дедлайн *</Text>
              <TouchableOpacity 
                onPress={() => {
                  // TODO: Open date picker
                  Alert.alert('Выбор даты', 'Здесь будет календарь для выбора даты');
                }}
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl flex-row items-center justify-between"
              >
                <Text className={formData.deadline ? 'text-gray-900' : 'text-gray-500'}>
                  {formData.deadline || 'Выберите дату'}
                </Text>
                <Ionicons name="calendar" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Приоритет</Text>
              <View className="flex-row gap-2">
                {priorityOptions.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setFormData(prev => ({ ...prev, priority: option.value }))}
                    className={`flex-1 py-3 rounded-2xl border ${
                      formData.priority === option.value
                        ? `${option.color} border-transparent`
                        : 'bg-gray-100 border-gray-200'
                    }`}
                  >
                    <Text className={`text-center font-medium ${
                      formData.priority === option.value ? 'text-white' : 'text-gray-700'
                    }`}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Description */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="font-semibold text-gray-900 mb-4">Описание проекта</Text>
          
          <TextInput
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            placeholder="Опишите детали проекта, особенности выполнения..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900 min-h-[100px]"
          />
        </View>

        {/* Milestones */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="font-semibold text-gray-900">Этапы работы</Text>
            <TouchableOpacity
              onPress={handleAddMilestone}
              className="w-8 h-8 bg-[#0165FB] rounded-full items-center justify-center"
            >
              <Ionicons name="add" size={16} color="white" />
            </TouchableOpacity>
          </View>
          
          <View className="flex flex-col gap-4">
            {formData.milestones.map((milestone, index) => (
              <View key={index} className="p-4 bg-gray-50 rounded-2xl">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="font-medium text-gray-900">Этап {index + 1}</Text>
                  {formData.milestones.length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleRemoveMilestone(index)}
                      className="w-6 h-6 bg-red-500 rounded-full items-center justify-center"
                    >
                      <Ionicons name="close" size={12} color="white" />
                    </TouchableOpacity>
                  )}
                </View>
                
                <View className="flex flex-col gap-3">
                  <TextInput
                    value={milestone.title}
                    onChangeText={(text) => handleMilestoneChange(index, 'title', text)}
                    placeholder="Название этапа"
                    className="w-full px-3 py-2 bg-white rounded-xl text-gray-900"
                  />
                  
                  <TextInput
                    value={milestone.description}
                    onChangeText={(text) => handleMilestoneChange(index, 'description', text)}
                    placeholder="Описание этапа"
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                    className="w-full px-3 py-2 bg-white rounded-xl text-gray-900"
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Info */}
        <View className="bg-blue-50 rounded-3xl p-5 border border-blue-100 mb-6">
          <View className="flex-row items-start gap-3">
            <Ionicons name="information-circle" size={20} color="#0165FB" />
            <View className="flex-1">
              <Text className="font-semibold text-blue-900 mb-2">Информация</Text>
              <Text className="text-sm text-blue-700">
                После создания проекта вы сможете отслеживать прогресс, загружать файлы 
                и общаться с клиентом. Проект будет автоматически связан с выбранным заказом.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}