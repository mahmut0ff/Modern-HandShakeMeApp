import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGetOrderQuery, useUpdateOrderMutation } from '../../../../services/orderApi';
import { LoadingSpinner } from '../../../../components/LoadingSpinner';
import { safeNavigate } from '../../../../hooks/useNavigation';

export default function EditOrderPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    city: '',
    budget_min: '',
    budget_max: '',
  });

  const { data: order, isLoading: orderLoading, error: orderError } = useGetOrderQuery(Number(id));
  const [updateOrder] = useUpdateOrderMutation();

  useEffect(() => {
    if (order) {
      setFormData({
        title: order.title || '',
        description: order.description || '',
        city: order.city || order.address || '',
        budget_min: order.budget_min ? String(order.budget_min) : '',
        budget_max: order.budget_max ? String(order.budget_max) : '',
      });
    }
  }, [order]);

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Ошибка', 'Введите название заказа');
      return;
    }

    setLoading(true);
    try {
      await updateOrder({
        id: Number(id),
        data: {
          title: formData.title,
          description: formData.description,
          city: formData.city,
          budget_min: formData.budget_min ? parseFloat(formData.budget_min) : undefined,
          budget_max: formData.budget_max ? parseFloat(formData.budget_max) : undefined,
        }
      }).unwrap();
      
      Alert.alert('Успех', 'Заказ успешно обновлен', [
        { text: 'OK', onPress: () => safeNavigate.push(`/(client)/orders/${id}`) }
      ]);
    } catch (error: any) {
      console.error('Update order error:', error);
      Alert.alert('Ошибка', error.data?.message || 'Не удалось обновить заказ');
    } finally {
      setLoading(false);
    }
  };

  if (orderLoading) {
    return <LoadingSpinner fullScreen text="Загрузка заказа..." />;
  }

  if (orderError || !order) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8F7FC] items-center justify-center px-4">
        <Ionicons name="alert-circle" size={64} color="#EF4444" />
        <Text className="text-gray-900 font-semibold mt-4">Заказ не найден</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 px-6 py-3 bg-[#0165FB] rounded-xl">
          <Text className="text-white font-semibold">Назад</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      <ScrollView className="flex-1 px-4">
        {/* Header */}
        <View className="flex-row items-center gap-4 mb-4 pt-2">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-white rounded-2xl items-center justify-center shadow-sm border border-gray-100">
            <Ionicons name="arrow-back" size={20} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Редактировать заказ</Text>
        </View>

        {/* Form */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Название *</Text>
            <TextInput value={formData.title} onChangeText={(text) => setFormData({ ...formData, title: text })} placeholder="Введите название заказа" className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-gray-900" />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Описание</Text>
            <TextInput value={formData.description} onChangeText={(text) => setFormData({ ...formData, description: text })} multiline numberOfLines={4} placeholder="Опишите детали заказа..." className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-gray-900 min-h-[100px]" textAlignVertical="top" />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Город</Text>
            <TextInput value={formData.city} onChangeText={(text) => setFormData({ ...formData, city: text })} placeholder="Введите город" className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-gray-900" />
          </View>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-2">Бюджет от (сом)</Text>
              <TextInput value={formData.budget_min} onChangeText={(text) => setFormData({ ...formData, budget_min: text })} keyboardType="numeric" placeholder="Мин." className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-gray-900" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-2">Бюджет до (сом)</Text>
              <TextInput value={formData.budget_max} onChangeText={(text) => setFormData({ ...formData, budget_max: text })} keyboardType="numeric" placeholder="Макс." className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-gray-900" />
            </View>
          </View>
        </View>

        {/* Actions */}
        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity onPress={() => router.back()} className="flex-1 py-3 bg-gray-100 rounded-2xl">
            <Text className="text-center font-medium text-gray-700">Отмена</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSubmit} disabled={loading} className={`flex-1 py-3 rounded-2xl ${loading ? 'bg-gray-400' : 'bg-[#0165FB]'}`}>
            <Text className="text-center font-medium text-white">{loading ? 'Сохранение...' : 'Сохранить'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
