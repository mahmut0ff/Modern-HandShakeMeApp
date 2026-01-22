import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface DisputeMessage {
  id: number;
  sender: 'client' | 'master' | 'admin';
  sender_name: string;
  message: string;
  created_at: string;
  attachments?: string[];
}

interface DisputeDetails {
  id: number;
  project: {
    id: number;
    title: string;
  };
  master: {
    id: number;
    name: string;
  };
  client: {
    id: number;
    name: string;
  };
  status: 'open' | 'under_review' | 'resolved' | 'closed';
  reason: string;
  description: string;
  amount: string;
  created_at: string;
  resolved_at?: string;
  admin_comment?: string;
  messages: DisputeMessage[];
}

const statusLabels: Record<string, string> = {
  open: 'Открыт',
  under_review: 'На рассмотрении',
  resolved: 'Решён',
  closed: 'Закрыт',
};

const statusColors: Record<string, string> = {
  open: 'bg-amber-100 text-amber-700 border-amber-200',
  under_review: 'bg-blue-100 text-blue-700 border-blue-200',
  resolved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  closed: 'bg-gray-100 text-gray-600 border-gray-200',
};

const statusIcons: Record<string, any> = {
  open: 'alert-circle',
  under_review: 'time',
  resolved: 'checkmark-circle',
  closed: 'close-circle',
};

export default function DisputeDetailsPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Mock data - replace with actual API calls
  const dispute: DisputeDetails = {
    id: Number(id),
    project: {
      id: 1,
      title: 'Ремонт ванной комнаты'
    },
    master: {
      id: 1,
      name: 'Иван Петров'
    },
    client: {
      id: 2,
      name: 'Анна Сидорова'
    },
    status: 'under_review',
    reason: 'Некачественная работа',
    description: 'Мастер выполнил работу не в соответствии с договорённостями. Плитка уложена неровно, есть сколы.',
    amount: '15000',
    created_at: '2024-01-10T14:30:00Z',
    admin_comment: undefined,
    messages: [
      {
        id: 1,
        sender: 'client',
        sender_name: 'Анна Сидорова',
        message: 'Здравствуйте! Мастер выполнил работу некачественно. Плитка уложена криво, видны большие швы.',
        created_at: '2024-01-10T14:30:00Z'
      },
      {
        id: 2,
        sender: 'admin',
        sender_name: 'Поддержка HandShakeMe',
        message: 'Здравствуйте! Мы рассматриваем ваш спор. Пожалуйста, предоставьте фотографии выполненной работы.',
        created_at: '2024-01-10T16:15:00Z'
      },
      {
        id: 3,
        sender: 'master',
        sender_name: 'Иван Петров',
        message: 'Работа выполнена согласно техническому заданию. Клиент не предоставил точные размеры.',
        created_at: '2024-01-11T09:20:00Z'
      }
    ]
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      // TODO: Implement API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setNewMessage('');
      Alert.alert('Успех', 'Сообщение отправлено');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось отправить сообщение');
    } finally {
      setLoading(false);
    }
  };

  const getSenderColor = (sender: string) => {
    switch (sender) {
      case 'admin':
        return 'bg-purple-500';
      case 'master':
        return 'bg-green-500';
      default:
        return 'bg-[#0165FB]';
    }
  };

  const renderMessage = ({ item }: { item: DisputeMessage }) => (
    <View className={`mb-4 ${item.sender === 'client' ? 'items-end' : 'items-start'}`}>
      <View className={`max-w-[80%] p-4 rounded-2xl ${
        item.sender === 'client' 
          ? 'bg-[#0165FB] rounded-br-md' 
          : item.sender === 'admin'
          ? 'bg-purple-50 border border-purple-200 rounded-bl-md'
          : 'bg-gray-100 rounded-bl-md'
      }`}>
        <View className="flex-row items-center gap-2 mb-2">
          <View className={`w-6 h-6 rounded-full items-center justify-center ${getSenderColor(item.sender)}`}>
            <Ionicons 
              name={item.sender === 'admin' ? 'shield' : item.sender === 'master' ? 'build' : 'person'} 
              size={12} 
              color="white" 
            />
          </View>
          <Text className={`text-xs font-medium ${
            item.sender === 'client' ? 'text-white/70' : 'text-gray-500'
          }`}>
            {item.sender_name}
          </Text>
        </View>
        <Text className={`text-sm leading-5 ${
          item.sender === 'client' ? 'text-white' : 'text-gray-900'
        }`}>
          {item.message}
        </Text>
        <Text className={`text-xs mt-2 ${
          item.sender === 'client' ? 'text-white/50' : 'text-gray-400'
        }`}>
          {new Date(item.created_at).toLocaleString('ru-RU')}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 pb-4">
          <View className="flex-row items-center gap-4 mb-4">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="w-10 h-10 bg-white rounded-2xl items-center justify-center shadow-sm border border-gray-100"
            >
              <Ionicons name="arrow-back" size={20} color="#6B7280" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900">Спор #{dispute.id}</Text>
              <Text className="text-sm text-gray-500">{dispute.project.title}</Text>
            </View>
            <View className={`flex-row items-center gap-1 px-3 py-1 rounded-full border ${statusColors[dispute.status]}`}>
              <Ionicons 
                name={statusIcons[dispute.status]} 
                size={12} 
                color={dispute.status === 'resolved' ? '#059669' : dispute.status === 'open' ? '#D97706' : '#2563EB'}
              />
              <Text className="text-xs font-semibold">
                {statusLabels[dispute.status]}
              </Text>
            </View>
          </View>

          {/* Dispute Info */}
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="font-semibold text-gray-900">Информация о споре</Text>
              <View className="flex-row items-center gap-1">
                <Ionicons name="card" size={16} color="#DC2626" />
                <Text className="font-bold text-red-600">{dispute.amount} сом</Text>
              </View>
            </View>
            
            <View className="space-y-2">
              <View className="flex-row">
                <Text className="text-sm text-gray-500 w-20">Причина:</Text>
                <Text className="text-sm text-gray-900 flex-1">{dispute.reason}</Text>
              </View>
              <View className="flex-row">
                <Text className="text-sm text-gray-500 w-20">Мастер:</Text>
                <Text className="text-sm text-gray-900 flex-1">{dispute.master.name}</Text>
              </View>
              <View className="flex-row">
                <Text className="text-sm text-gray-500 w-20">Создан:</Text>
                <Text className="text-sm text-gray-900 flex-1">
                  {new Date(dispute.created_at).toLocaleDateString('ru-RU')}
                </Text>
              </View>
            </View>

            <View className="mt-3 pt-3 border-t border-gray-100">
              <Text className="text-sm text-gray-600">{dispute.description}</Text>
            </View>

            {dispute.admin_comment && (
              <View className="mt-3 p-3 bg-green-50 rounded-2xl border border-green-200">
                <Text className="text-xs font-medium text-green-700 mb-1">Решение администрации:</Text>
                <Text className="text-sm text-green-600">{dispute.admin_comment}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Messages */}
        <View className="flex-1 px-4">
          <Text className="text-lg font-bold text-gray-900 mb-4">Переписка</Text>
          <FlatList
            data={dispute.messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </View>

        {/* Message Input */}
        {dispute.status !== 'closed' && dispute.status !== 'resolved' && (
          <View className="px-4 pb-4">
            <View className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
              <View className="flex-row items-end gap-3">
                <TextInput
                  value={newMessage}
                  onChangeText={setNewMessage}
                  placeholder="Напишите сообщение..."
                  multiline
                  maxLength={500}
                  className="flex-1 max-h-20 px-3 py-2 bg-gray-100 rounded-xl text-gray-900"
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  onPress={handleSendMessage}
                  disabled={loading || !newMessage.trim()}
                  className={`w-10 h-10 rounded-xl items-center justify-center ${
                    loading || !newMessage.trim() ? 'bg-gray-300' : 'bg-[#0165FB]'
                  }`}
                >
                  <Ionicons 
                    name={loading ? 'hourglass' : 'send'} 
                    size={16} 
                    color="white" 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}