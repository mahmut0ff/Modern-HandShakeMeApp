import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Dispute {
  id: number;
  project: {
    id: number;
    order_title: string;
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
}

const statusLabels: Record<string, string> = {
  open: 'Открыт',
  under_review: 'На рассмотрении',
  resolved: 'Решён',
  closed: 'Закрыт',
};

const statusColors: Record<string, string> = {
  open: 'bg-amber-100 text-amber-700',
  under_review: 'bg-blue-100 text-blue-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-gray-100 text-gray-600',
};

const statusIcons: Record<string, any> = {
  open: 'alert-circle',
  under_review: 'time',
  resolved: 'checkmark-circle',
  closed: 'close-circle',
};

export default function ClientDisputesPage() {
  const [loading, setLoading] = useState(false);

  // Mock data - replace with actual API calls
  const disputes: Dispute[] = [
    {
      id: 1,
      project: {
        id: 1,
        order_title: 'Ремонт ванной комнаты'
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
      description: 'Мастер выполнил работу не в соответствии с договорённостями. Плитка уложена неровно.',
      amount: '15000',
      created_at: '2024-01-10T14:30:00Z'
    },
    {
      id: 2,
      project: {
        id: 2,
        order_title: 'Установка кондиционера'
      },
      master: {
        id: 2,
        name: 'Алексей Сидоров'
      },
      client: {
        id: 2,
        name: 'Анна Сидорова'
      },
      status: 'resolved',
      reason: 'Задержка выполнения',
      description: 'Мастер не уложился в согласованные сроки.',
      amount: '5000',
      created_at: '2024-01-05T10:15:00Z',
      resolved_at: '2024-01-08T16:20:00Z',
      admin_comment: 'Спор решён в пользу клиента. Мастеру выдано предупреждение.'
    }
  ];

  const handleCreateDispute = () => {
    router.push('/(client)/disputes/create');
  };

  const renderDispute = ({ item }: { item: Dispute }) => (
    <TouchableOpacity
      onPress={() => router.push(`/(client)/disputes/${item.id}`)}
      className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4"
    >
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <Text className="font-semibold text-gray-900" numberOfLines={1}>
            {item.project.order_title}
          </Text>
          <Text className="text-sm text-gray-500 mt-1">
            Мастер: {item.master.name}
          </Text>
        </View>
        <View className={`flex-row items-center gap-1 px-3 py-1 rounded-full ${statusColors[item.status]}`}>
          <Ionicons 
            name={statusIcons[item.status]} 
            size={12} 
            color={item.status === 'resolved' ? '#059669' : item.status === 'open' ? '#D97706' : '#2563EB'}
          />
          <Text className="text-xs font-semibold">
            {statusLabels[item.status]}
          </Text>
        </View>
      </View>

      <View className="mb-3">
        <Text className="text-sm font-medium text-gray-700 mb-1">Причина спора:</Text>
        <Text className="text-sm text-gray-600">{item.reason}</Text>
      </View>

      <Text className="text-sm text-gray-600 mb-3" numberOfLines={2}>
        {item.description}
      </Text>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1">
          <Ionicons name="card" size={16} color="#DC2626" />
          <Text className="font-semibold text-red-600">{item.amount} сом</Text>
        </View>
        <Text className="text-xs text-gray-400">
          {new Date(item.created_at).toLocaleDateString('ru-RU')}
        </Text>
      </View>

      {item.status === 'resolved' && item.admin_comment && (
        <View className="mt-3 p-3 bg-green-50 rounded-2xl">
          <Text className="text-xs font-medium text-green-700 mb-1">Решение администрации:</Text>
          <Text className="text-sm text-green-600">{item.admin_comment}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

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
            <Text className="text-2xl font-bold text-gray-900">Споры</Text>
          </View>
          <TouchableOpacity
            onPress={handleCreateDispute}
            className="w-10 h-10 bg-[#0165FB] rounded-2xl items-center justify-center shadow-lg"
          >
            <Ionicons name="add" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View className="bg-purple-50 rounded-3xl p-5 border border-purple-100 mb-6">
          <View className="flex-row items-start gap-3">
            <View className="w-10 h-10 bg-purple-500 rounded-2xl items-center justify-center">
              <Ionicons name="shield-checkmark" size={20} color="white" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-purple-900 mb-2">Защита ваших интересов</Text>
              <Text className="text-sm text-purple-700">
                Если у вас возник конфликт с мастером, вы можете открыть спор. 
                Наша служба поддержки поможет решить проблему справедливо.
              </Text>
            </View>
          </View>
        </View>

        {/* Disputes List */}
        {disputes.length === 0 ? (
          <View className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 items-center">
            <View className="w-20 h-20 bg-purple-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="shield-checkmark" size={40} color="#8B5CF6" />
            </View>
            <Text className="text-lg font-semibold text-gray-900 mb-2">Нет споров</Text>
            <Text className="text-gray-500 mb-6 text-center">
              У вас пока нет открытых споров. Надеемся, что они не понадобятся!
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(client)/projects')}
              className="flex-row items-center gap-2 px-6 py-3 bg-purple-500 rounded-2xl shadow-lg"
            >
              <Ionicons name="folder" size={16} color="white" />
              <Text className="font-semibold text-white">Мои проекты</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={disputes}
            renderItem={renderDispute}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Help Section */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
          <View className="flex-row items-center gap-2 mb-3">
            <Ionicons name="help-circle" size={20} color="#0165FB" />
            <Text className="font-semibold text-gray-900">Нужна помощь?</Text>
          </View>
          <Text className="text-gray-600 mb-4">
            Если у вас есть вопросы о процедуре рассмотрения споров, обратитесь в службу поддержки.
          </Text>
          <TouchableOpacity className="flex-row items-center gap-2 px-4 py-3 bg-gray-50 rounded-2xl">
            <Ionicons name="chatbubble" size={16} color="#0165FB" />
            <Text className="font-medium text-[#0165FB]">Связаться с поддержкой</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}