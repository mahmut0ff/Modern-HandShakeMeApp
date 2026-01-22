import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Client {
  id: number;
  name: string;
  avatar?: string;
  phone: string;
  email?: string;
  rating: number;
  reviews_count: number;
  orders_count: number;
  joined_date: string;
  last_active: string;
  verified: boolean;
}

export default function ClientDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(false);

  // Mock data - replace with actual API calls
  const client: Client = {
    id: Number(id),
    name: 'Анна Петрова',
    avatar: undefined,
    phone: '+996700123456',
    email: 'anna.petrova@example.com',
    rating: 4.7,
    reviews_count: 23,
    orders_count: 15,
    joined_date: '2023-06-15',
    last_active: '2024-01-19T15:30:00Z',
    verified: true
  };

  const handleStartChat = () => {
    router.push(`/(master)/chat/${client.id}`);
  };

  const handleCall = () => {
    // TODO: Implement phone call functionality
    console.log('Calling:', client.phone);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      <ScrollView className="flex-1 px-4">
        {/* Header */}
        <View className="flex-row items-center gap-4 mb-6">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 bg-white rounded-2xl items-center justify-center shadow-sm border border-gray-100"
          >
            <Ionicons name="arrow-back" size={20} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">Профиль клиента</Text>
        </View>

        {/* Client Info Card */}
        <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
          <View className="flex-row items-center gap-4 mb-4">
            <View className="w-20 h-20 bg-[#0165FB] rounded-full items-center justify-center overflow-hidden">
              {client.avatar ? (
                <Image source={{ uri: client.avatar }} className="w-full h-full" />
              ) : (
                <Text className="text-white text-2xl font-bold">
                  {client.name.charAt(0)}
                </Text>
              )}
            </View>
            
            <View className="flex-1">
              <View className="flex-row items-center gap-2 mb-1">
                <Text className="text-xl font-bold text-gray-900">{client.name}</Text>
                {client.verified && (
                  <View className="w-6 h-6 bg-green-500 rounded-full items-center justify-center">
                    <Ionicons name="checkmark" size={14} color="white" />
                  </View>
                )}
              </View>
              
              <View className="flex-row items-center gap-1 mb-2">
                <Ionicons name="star" size={16} color="#F59E0B" />
                <Text className="font-semibold text-gray-900">{client.rating}</Text>
                <Text className="text-gray-500">({client.reviews_count} отзывов)</Text>
              </View>
              
              <Text className="text-gray-500 text-sm">
                Последняя активность: {new Date(client.last_active).toLocaleDateString('ru-RU')}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleStartChat}
              className="flex-1 bg-[#0165FB] py-3 rounded-2xl flex-row items-center justify-center gap-2"
            >
              <Ionicons name="chatbubble" size={18} color="white" />
              <Text className="text-white font-semibold">Написать</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleCall}
              className="flex-1 bg-green-500 py-3 rounded-2xl flex-row items-center justify-center gap-2"
            >
              <Ionicons name="call" size={18} color="white" />
              <Text className="text-white font-semibold">Позвонить</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Statistics */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-4">Статистика</Text>
          
          <View className="flex-row justify-between">
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-gray-900">{client.orders_count}</Text>
              <Text className="text-sm text-gray-500">Заказов</Text>
            </View>
            <View className="w-px bg-gray-200" />
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-gray-900">{client.reviews_count}</Text>
              <Text className="text-sm text-gray-500">Отзывов</Text>
            </View>
            <View className="w-px bg-gray-200" />
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-gray-900">
                {Math.round((new Date().getTime() - new Date(client.joined_date).getTime()) / (1000 * 60 * 60 * 24 * 30))}
              </Text>
              <Text className="text-sm text-gray-500">Месяцев с нами</Text>
            </View>
          </View>
        </View>

        {/* Contact Information */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-4">Контактная информация</Text>
          
          <View className="space-y-3">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-blue-100 rounded-2xl items-center justify-center">
                <Ionicons name="call" size={20} color="#0165FB" />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-gray-500">Телефон</Text>
                <Text className="font-semibold text-gray-900">{client.phone}</Text>
              </View>
              <TouchableOpacity
                onPress={handleCall}
                className="w-10 h-10 bg-green-100 rounded-2xl items-center justify-center"
              >
                <Ionicons name="call" size={16} color="#059669" />
              </TouchableOpacity>
            </View>

            {client.email && (
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-purple-100 rounded-2xl items-center justify-center">
                  <Ionicons name="mail" size={20} color="#8B5CF6" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-gray-500">Email</Text>
                  <Text className="font-semibold text-gray-900">{client.email}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Recent Activity */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-4">Последние заказы</Text>
          
          <View className="space-y-3">
            {/* Mock recent orders */}
            <View className="p-3 bg-gray-50 rounded-2xl">
              <Text className="font-semibold text-gray-900">Ремонт ванной комнаты</Text>
              <Text className="text-sm text-gray-500">Завершен • 15 января 2024</Text>
              <View className="flex-row items-center gap-1 mt-1">
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text className="text-sm text-gray-600">5.0 • Отличная работа!</Text>
              </View>
            </View>
            
            <View className="p-3 bg-gray-50 rounded-2xl">
              <Text className="font-semibold text-gray-900">Установка кондиционера</Text>
              <Text className="text-sm text-gray-500">Завершен • 8 января 2024</Text>
              <View className="flex-row items-center gap-1 mt-1">
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text className="text-sm text-gray-600">4.8 • Быстро и качественно</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Notes */}
        <View className="bg-yellow-50 rounded-3xl p-5 border border-yellow-100 mb-6">
          <View className="flex-row items-start gap-3">
            <Ionicons name="bulb" size={20} color="#F59E0B" />
            <View className="flex-1">
              <Text className="font-semibold text-yellow-900 mb-2">Заметки</Text>
              <Text className="text-sm text-yellow-700">
                Пунктуальный клиент, всегда четко формулирует требования. 
                Предпочитает работать в будние дни.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}