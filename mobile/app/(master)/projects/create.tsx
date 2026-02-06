import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGetMyApplicationsQuery } from '../../../services/applicationApi';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { safeNavigate } from '../../../hooks/useNavigation';

interface AcceptedApplication {
  id: number;
  order: number;
  order_title?: string;
  client: { id: number; name: string; };
  client_name?: string;
  proposed_price: string;
}

export default function CreateProjectPage() {
  const [loading, setLoading] = useState(false);
  const [showOrderPicker, setShowOrderPicker] = useState(false);
  const [selectedApp, setSelectedApp] = useState<AcceptedApplication | null>(null);
  const [formData, setFormData] = useState({
    order_id: '',
    client_id: '',
    agreed_price: '',
    deadline: '',
    priority: 'medium',
    description: '',
    milestones: [{ title: '', description: '' }]
  });

  const { data: applications, isLoading: appsLoading } = useGetMyApplicationsQuery({ status: 'accepted' });
  const acceptedApps = applications?.filter(a => a.status === 'accepted') || [];

  const priorityOptions = [
    { value: 'low', label: 'Низкий', color: 'bg-gray-500' },
    { value: 'medium', label: 'Средний', color: 'bg-yellow-500' },
    { value: 'high', label: 'Высокий', color: 'bg-red-500' },
  ];

  const handleSelectApp = (app: AcceptedApplication) => {
    setSelectedApp(app);
    setFormData(prev => ({
      ...prev,
      order_id: String(app.order),
      client_id: String(app.client?.id || ''),
      agreed_price: app.proposed_price || '',
    }));
    setShowOrderPicker(false);
  };

  const handleAddMilestone = () => {
    setFormData(prev => ({ ...prev, milestones: [...prev.milestones, { title: '', description: '' }] }));
  };

  const handleRemoveMilestone = (index: number) => {
    if (formData.milestones.length > 1) {
      setFormData(prev => ({ ...prev, milestones: prev.milestones.filter((_, i) => i !== index) }));
    }
  };

  const handleMilestoneChange = (index: number, field: 'title' | 'description', value: string) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map((m, i) => i === index ? { ...m, [field]: value } : m)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.order_id) { Alert.alert('Ошибка', 'Выберите заказ'); return; }
    if (!formData.agreed_price) { Alert.alert('Ошибка', 'Укажите цену'); return; }
    if (!formData.deadline) { Alert.alert('Ошибка', 'Укажите дедлайн'); return; }
    const validMilestones = formData.milestones.filter(m => m.title.trim());
    if (!validMilestones.length) { Alert.alert('Ошибка', 'Добавьте хотя бы один этап'); return; }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api'}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: parseInt(formData.order_id),
          client_id: parseInt(formData.client_id),
          agreed_price: parseFloat(formData.agreed_price),
          deadline: formData.deadline,
          priority: formData.priority,
          description: formData.description,
          milestones: validMilestones.map((m, i) => ({ title: m.title, description: m.description, orderNum: i + 1 })),
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Ошибка'); }
      Alert.alert('Успех', 'Проект создан!', [{ text: 'OK', onPress: () => safeNavigate.back() }]);
    } catch (e: any) {
      Alert.alert('Ошибка', e.message || 'Не удалось создать проект');
    } finally { setLoading(false); }
  };


  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      {/* Order Picker Modal */}
      <Modal visible={showOrderPicker} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-5 max-h-[70%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900">Выберите заказ</Text>
              <TouchableOpacity onPress={() => setShowOrderPicker(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            {appsLoading ? (
              <LoadingSpinner text="Загрузка заказов..." />
            ) : acceptedApps.length === 0 ? (
              <View className="py-8 items-center">
                <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
                <Text className="text-gray-500 mt-2">Нет принятых заказов</Text>
              </View>
            ) : (
              <FlatList
                data={acceptedApps}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleSelectApp(item)}
                    className="p-4 border-b border-gray-100"
                  >
                    <Text className="font-medium text-gray-900">{item.order_title || `Заказ #${item.order}`}</Text>
                    <Text className="text-sm text-gray-500 mt-1">Клиент: {item.client?.name || item.client_name}</Text>
                    <Text className="text-sm text-[#0165FB] mt-1">{item.proposed_price} сом</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-white rounded-2xl items-center justify-center shadow-sm border border-gray-100">
            <Ionicons name="arrow-back" size={20} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Создать проект</Text>
          <TouchableOpacity onPress={handleSubmit} disabled={loading} className={`px-4 py-2 rounded-2xl ${loading ? 'bg-gray-400' : 'bg-[#0165FB]'}`}>
            <Text className="text-white font-semibold">{loading ? 'Создание...' : 'Создать'}</Text>
          </TouchableOpacity>
        </View>

        {/* Basic Info */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="font-semibold text-gray-900 mb-4">Основная информация</Text>
          <View className="flex flex-col gap-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Заказ *</Text>
              <TouchableOpacity onPress={() => setShowOrderPicker(true)} className="w-full px-4 py-3 bg-gray-50 rounded-2xl flex-row items-center justify-between">
                <Text className={selectedApp ? 'text-gray-900' : 'text-gray-500'} numberOfLines={1}>
                  {selectedApp ? (selectedApp.order_title || `Заказ #${selectedApp.order}`) : 'Выберите принятый заказ'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </TouchableOpacity>
              {selectedApp && <Text className="text-xs text-gray-500 mt-1">Клиент: {selectedApp.client?.name || selectedApp.client_name}</Text>}
            </View>
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Согласованная цена (сом) *</Text>
              <TextInput value={formData.agreed_price} onChangeText={(t) => setFormData(p => ({ ...p, agreed_price: t }))} placeholder="Введите цену" keyboardType="numeric" className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900" />
            </View>
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Дедлайн (ГГГГ-ММ-ДД) *</Text>
              <TextInput value={formData.deadline} onChangeText={(t) => setFormData(p => ({ ...p, deadline: t }))} placeholder="2024-12-31" className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900" />
            </View>
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Приоритет</Text>
              <View className="flex-row gap-2">
                {priorityOptions.map(opt => (
                  <TouchableOpacity key={opt.value} onPress={() => setFormData(p => ({ ...p, priority: opt.value }))} className={`flex-1 py-3 rounded-2xl border ${formData.priority === opt.value ? `${opt.color} border-transparent` : 'bg-gray-100 border-gray-200'}`}>
                    <Text className={`text-center font-medium ${formData.priority === opt.value ? 'text-white' : 'text-gray-700'}`}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>


        {/* Description */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="font-semibold text-gray-900 mb-4">Описание проекта</Text>
          <TextInput value={formData.description} onChangeText={(t) => setFormData(p => ({ ...p, description: t }))} placeholder="Опишите детали проекта..." multiline numberOfLines={4} textAlignVertical="top" className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900 min-h-[100px]" />
        </View>

        {/* Milestones */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="font-semibold text-gray-900">Этапы работы</Text>
            <TouchableOpacity onPress={handleAddMilestone} className="w-8 h-8 bg-[#0165FB] rounded-full items-center justify-center">
              <Ionicons name="add" size={16} color="white" />
            </TouchableOpacity>
          </View>
          <View className="flex flex-col gap-4">
            {formData.milestones.map((milestone, index) => (
              <View key={index} className="p-4 bg-gray-50 rounded-2xl">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="font-medium text-gray-900">Этап {index + 1}</Text>
                  {formData.milestones.length > 1 && (
                    <TouchableOpacity onPress={() => handleRemoveMilestone(index)} className="w-6 h-6 bg-red-500 rounded-full items-center justify-center">
                      <Ionicons name="close" size={12} color="white" />
                    </TouchableOpacity>
                  )}
                </View>
                <View className="flex flex-col gap-3">
                  <TextInput value={milestone.title} onChangeText={(t) => handleMilestoneChange(index, 'title', t)} placeholder="Название этапа" className="w-full px-3 py-2 bg-white rounded-xl text-gray-900" />
                  <TextInput value={milestone.description} onChangeText={(t) => handleMilestoneChange(index, 'description', t)} placeholder="Описание этапа" multiline numberOfLines={2} textAlignVertical="top" className="w-full px-3 py-2 bg-white rounded-xl text-gray-900" />
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
              <Text className="text-sm text-blue-700">После создания проекта вы сможете отслеживать прогресс, загружать файлы и общаться с клиентом.</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
