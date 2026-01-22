import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

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

  useEffect(() => {
    // TODO: Load order data from API
    setFormData({
      title: 'Ремонт ванной комнаты',
      description: 'Требуется полный ремонт ванной комнаты площадью 6 кв.м.',
      city: 'Москва',
      budget_min: '25000',
      budget_max: '35000',
    });
  }, [id]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      Alert.alert('Успех', 'Заказ успешно обновлен', [
        { text: 'OK', onPress: () => router.push(`/(client)/orders/${id}`) }
      ]);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось обновить заказ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      <ScrollView className="flex-1 px-4">
        {/* Header */}
        <View className="flex-row items-center gap-4 mb-4">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 bg-white rounded-2xl items-center justify-center shadow-sm border border-gray-100"
          >
            <Ionicons name="arrow-back" size={20} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Редактировать заказ</Text>
        </View>

        {/* Form */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Название</Text>
            <TextInput
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-gray-900"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Описание</Text>
            <TextInput
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={4}
              className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-gray-900"
              textAlignVertical="top"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Город</Text>
            <TextInput
              value={formData.city}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
              className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-gray-900"
            />
          </View>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-2">Бюджет от (сом)</Text>
              <TextInput
                value={formData.budget_min}
                onChangeText={(text) => setFormData({ ...formData, budget_min: text })}
                keyboardType="numeric"
                className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-gray-900"
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-2">Бюджет до (сом)</Text>
              <TextInput
                value={formData.budget_max}
                onChangeText={(text) => setFormData({ ...formData, budget_max: text })}
                keyboardType="numeric"
                className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-gray-900"
              />
            </View>
          </View>
        </View>

        {/* Actions */}
        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-1 py-3 bg-gray-100 rounded-2xl"
          >
            <Text className="text-center font-medium text-gray-700">Отмена</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className={`flex-1 py-3 rounded-2xl ${loading ? 'bg-gray-400' : 'bg-[#0165FB]'}`}
          >
            <Text className="text-center font-medium text-white">
              {loading ? 'Сохранение...' : 'Сохранить'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}