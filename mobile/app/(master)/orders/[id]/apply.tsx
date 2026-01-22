import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Order {
  id: number;
  title: string;
  category_name: string;
  city: string;
  budget_display: string;
  start_date?: string;
  description: string;
}

export default function ApplicationFormPage() {
  const { id: orderId } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    proposed_price: '',
    proposed_duration_days: '',
    cover_letter: '',
  });
  const [error, setError] = useState('');

  // Mock order data - replace with actual API call
  const order: Order = {
    id: Number(orderId),
    title: 'Ремонт ванной комнаты',
    category_name: 'Ремонт и отделка',
    city: 'Москва',
    budget_display: '25,000 - 35,000 сом',
    start_date: '2024-02-01',
    description: 'Требуется полный ремонт ванной комнаты площадью 6 кв.м.'
  };

  const handleSubmit = async () => {
    setError('');

    if (!formData.proposed_price || !formData.proposed_duration_days || !formData.cover_letter) {
      setError('Заполните все обязательные поля');
      return;
    }

    if (formData.cover_letter.length < 50) {
      setError('Сообщение должно содержать минимум 50 символов');
      return;
    }

    if (parseFloat(formData.proposed_price) <= 0) {
      setError('Введите корректную цену');
      return;
    }

    if (parseInt(formData.proposed_duration_days) <= 0) {
      setError('Введите корректный срок выполнения');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement API call
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      Alert.alert(
        'Отклик отправлен',
        'Ваш отклик успешно отправлен клиенту',
        [{ text: 'OK', onPress: () => router.push('/(master)/orders') }]
      );
    } catch (err: any) {
      setError(err.message || 'Не удалось отправить отклик');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      <ScrollView className="flex-1 px-4">
        {/* Header */}
        <View className="bg-[#0165FB] -mx-4 pt-4 pb-6 px-4 mb-4">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="flex-row items-center gap-2 mb-4"
          >
            <Ionicons name="arrow-back" size={24} color="rgba(255,255,255,0.8)" />
            <Text className="text-white/80">Назад к заказам</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-white">Откликнуться на заказ</Text>
        </View>

        {/* Order Summary */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="font-semibold text-gray-900 mb-2">{order.title}</Text>
          <View className="flex-row items-center gap-2 mb-3">
            <View className="flex-row items-center gap-1">
              <Ionicons name="grid" size={16} color="#0165FB" />
              <Text className="text-sm text-gray-500">{order.category_name}</Text>
            </View>
            <Text className="text-gray-300">•</Text>
            <View className="flex-row items-center gap-1">
              <Ionicons name="location" size={16} color="#0165FB" />
              <Text className="text-sm text-gray-500">{order.city}</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-4 text-sm">
            <Text className="font-bold text-[#0165FB]">{order.budget_display}</Text>
            {order.start_date && (
              <View className="flex-row items-center gap-1">
                <Ionicons name="calendar" size={16} color="#0165FB" />
                <Text className="text-gray-500">
                  Начало: {new Date(order.start_date).toLocaleDateString('ru-RU')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Application Form */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-5">Ваше предложение</Text>
          
          <View className="mb-5">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Предложенная цена (сом) *
            </Text>
            <View className="relative">
              <Ionicons 
                name="card" 
                size={20} 
                color="#9CA3AF" 
                style={{ position: 'absolute', left: 16, top: 14, zIndex: 1 }}
              />
              <TextInput
                value={formData.proposed_price}
                onChangeText={(text) => setFormData({ ...formData, proposed_price: text })}
                placeholder="Введите вашу цену"
                keyboardType="numeric"
                className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-2xl text-gray-900"
              />
            </View>
            <Text className="text-xs text-gray-500 mt-1">
              Укажите стоимость ваших услуг за весь объём работ
            </Text>
          </View>

          <View className="mb-5">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Срок выполнения (дней) *
            </Text>
            <View className="relative">
              <Ionicons 
                name="time" 
                size={20} 
                color="#9CA3AF" 
                style={{ position: 'absolute', left: 16, top: 14, zIndex: 1 }}
              />
              <TextInput
                value={formData.proposed_duration_days}
                onChangeText={(text) => setFormData({ ...formData, proposed_duration_days: text })}
                placeholder="Количество дней"
                keyboardType="numeric"
                className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-2xl text-gray-900"
              />
            </View>
            <Text className="text-xs text-gray-500 mt-1">
              Количество дней, за которое вы готовы выполнить работу
            </Text>
          </View>

          <View className="mb-5">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Сопроводительное сообщение *
            </Text>
            <TextInput
              value={formData.cover_letter}
              onChangeText={(text) => setFormData({ ...formData, cover_letter: text })}
              multiline
              numberOfLines={5}
              placeholder="Расскажите о своём опыте выполнения подобных работ, почему клиент должен выбрать именно вас..."
              className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-gray-900"
              textAlignVertical="top"
            />
            <Text className="text-xs text-gray-500 mt-1">
              Минимум 50 символов. Текущая длина: {formData.cover_letter.length}
            </Text>
          </View>

          {error && (
            <View className="p-4 bg-red-50 border border-red-200 rounded-2xl mb-4">
              <View className="flex-row items-center gap-2">
                <Ionicons name="alert-circle" size={20} color="#DC2626" />
                <Text className="text-red-600 text-sm flex-1">{error}</Text>
              </View>
            </View>
          )}

          <View className="flex-row gap-3 pt-2">
            <TouchableOpacity
              onPress={() => router.back()}
              className="flex-1 py-4 border-2 border-gray-200 rounded-2xl"
            >
              <Text className="text-center font-semibold text-gray-600">Отмена</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              className={`flex-1 py-4 rounded-2xl shadow-lg ${
                loading ? 'bg-gray-400' : 'bg-[#0165FB]'
              }`}
            >
              <Text className="text-center font-semibold text-white">
                {loading ? 'Отправка...' : 'Отправить отклик'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tips */}
        <View className="bg-amber-50 border border-amber-200 rounded-3xl p-5 mb-6">
          <View className="flex-row items-start gap-3 mb-3">
            <Ionicons name="bulb" size={24} color="#D97706" />
            <Text className="font-semibold text-amber-800 flex-1">
              Советы для успешного отклика
            </Text>
          </View>
          <View className="space-y-2">
            {[
              'Укажите реалистичную цену и сроки',
              'Опишите ваш опыт в подобных проектах',
              'Задайте уточняющие вопросы, если нужно',
              'Будьте вежливы и профессиональны'
            ].map((tip, index) => (
              <View key={index} className="flex-row items-start gap-2">
                <Ionicons name="checkmark" size={16} color="#D97706" style={{ marginTop: 2 }} />
                <Text className="text-sm text-amber-700 flex-1">{tip}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}