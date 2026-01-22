import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Card {
  id: string;
  number: string;
  bank: string;
  type: 'visa' | 'mastercard';
  is_default: boolean;
  created_at: string;
}

export default function CardsPage() {
  const [cards, setCards] = useState<Card[]>([
    {
      id: '1',
      number: '**** **** **** 1234',
      bank: 'Оптима Банк',
      type: 'visa',
      is_default: true,
      created_at: '2024-01-10T10:00:00Z'
    },
    {
      id: '2',
      number: '**** **** **** 5678',
      bank: 'KICB',
      type: 'mastercard',
      is_default: false,
      created_at: '2024-01-15T14:30:00Z'
    }
  ]);

  const handleSetDefault = (cardId: string) => {
    setCards(prev => prev.map(card => ({
      ...card,
      is_default: card.id === cardId
    })));
  };

  const handleDeleteCard = (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    Alert.alert(
      'Удалить карту',
      `Вы уверены, что хотите удалить карту ${card.number}?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => {
            setCards(prev => prev.filter(c => c.id !== cardId));
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center gap-4">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="w-10 h-10 bg-white rounded-2xl items-center justify-center shadow-sm border border-gray-100"
            >
              <Ionicons name="arrow-back" size={20} color="#6B7280" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-900">Мои карты</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(master)/wallet/cards/add')}
            className="w-10 h-10 bg-[#0165FB] rounded-2xl items-center justify-center shadow-lg"
          >
            <Ionicons name="add" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Cards List */}
        {cards.length === 0 ? (
          <View className="bg-white rounded-3xl p-8 items-center shadow-sm border border-gray-100">
            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="card" size={40} color="#9CA3AF" />
            </View>
            <Text className="text-lg font-semibold text-gray-900 mb-2">Нет карт</Text>
            <Text className="text-gray-500 mb-6 text-center">
              Добавьте карту для вывода средств
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(master)/wallet/cards/add')}
              className="flex-row items-center gap-2 px-6 py-3 bg-[#0165FB] rounded-2xl shadow-lg"
            >
              <Ionicons name="add" size={16} color="white" />
              <Text className="font-semibold text-white">Добавить карту</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="space-y-4">
            {cards.map(card => (
              <View key={card.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                <View className="flex-row items-center gap-4 mb-4">
                  <View className={`w-16 h-16 rounded-2xl items-center justify-center ${
                    card.type === 'visa' ? 'bg-blue-500' : 'bg-red-500'
                  }`}>
                    <Ionicons name="card" size={32} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-900">{card.number}</Text>
                    <Text className="text-sm text-gray-500">{card.bank}</Text>
                    <Text className="text-xs text-gray-400 mt-1">
                      Добавлена: {new Date(card.created_at).toLocaleDateString('ru-RU')}
                    </Text>
                  </View>
                  {card.is_default && (
                    <View className="px-3 py-1 bg-green-100 rounded-full">
                      <Text className="text-xs font-semibold text-green-700">Основная</Text>
                    </View>
                  )}
                </View>

                <View className="flex-row gap-3">
                  {!card.is_default && (
                    <TouchableOpacity
                      onPress={() => handleSetDefault(card.id)}
                      className="flex-1 py-3 bg-gray-100 rounded-2xl"
                    >
                      <Text className="text-center font-medium text-gray-700">
                        Сделать основной
                      </Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    onPress={() => handleDeleteCard(card.id)}
                    className="flex-1 py-3 bg-red-50 rounded-2xl"
                  >
                    <Text className="text-center font-medium text-red-600">Удалить</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Info */}
        <View className="bg-blue-50 rounded-3xl p-5 border border-blue-100 mt-6">
          <View className="flex-row items-start gap-3">
            <Ionicons name="shield-checkmark" size={20} color="#0165FB" />
            <View className="flex-1">
              <Text className="font-semibold text-blue-900 mb-2">Безопасность</Text>
              <Text className="text-sm text-blue-700">
                Все данные карт шифруются и хранятся в соответствии с международными 
                стандартами безопасности PCI DSS.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}