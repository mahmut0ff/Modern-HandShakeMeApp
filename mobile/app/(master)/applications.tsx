import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { 
  useGetMyApplicationsQuery,
  useDeleteApplicationMutation,
  type Application 
} from '../../services/applicationApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { formatRelativeTime } from '../../utils/format';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидает',
  sent: 'Отправлен',
  viewed: 'Просмотрен',
  accepted: 'Принят',
  rejected: 'Отклонён',
  withdrawn: 'Отозван',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-orange-100 text-orange-700',
  sent: 'bg-blue-100 text-blue-700',
  viewed: 'bg-[#0165FB]/10 text-[#0165FB]',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  withdrawn: 'bg-gray-100 text-gray-700',
};

const STATUS_ICONS: Record<string, any> = {
  pending: 'time',
  sent: 'send',
  viewed: 'eye',
  accepted: 'checkmark-circle',
  rejected: 'close-circle',
  withdrawn: 'return-up-back',
};

export default function MyApplicationsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // API queries
  const { 
    data: applications = [], 
    isLoading, 
    error,
    refetch 
  } = useGetMyApplicationsQuery({ 
    status: statusFilter === 'all' ? undefined : statusFilter,
    ordering: '-created_at'
  });

  // Mutations
  const [deleteApplication] = useDeleteApplicationMutation();

  const handleWithdraw = async (id: number) => {
    Alert.alert(
      'Отозвать отклик',
      'Вы уверены, что хотите отозвать этот отклик?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Отозвать',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteApplication(id).unwrap();
              Alert.alert('Успешно', 'Отклик отозван');
            } catch (error) {
              console.error('Failed to withdraw application:', error);
              Alert.alert('Ошибка', 'Не удалось отозвать отклик');
            }
          }
        }
      ]
    );
  };

  const tabs = [
    { key: 'all', label: 'Все' },
    { key: 'pending', label: 'Ожидают' },
    { key: 'viewed', label: 'Просмотрены' },
    { key: 'accepted', label: 'Приняты' },
  ];

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Загрузка откликов..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        fullScreen
        message="Не удалось загрузить отклики"
        onRetry={refetch}
      />
    );
  }

  const renderApplication = ({ item }: { item: Application }) => (
    <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
      <View className="flex-row items-start justify-between mb-3">
        <TouchableOpacity
          onPress={() => router.push(`/master/orders/${item.order}`)}
          className="flex-1"
        >
          <Text className="font-semibold text-gray-900" numberOfLines={1}>
            {item.order_title || `Заказ #${item.order}`}
          </Text>
        </TouchableOpacity>
        <View className={`flex-row items-center gap-1 px-3 py-1 rounded-full ${STATUS_COLORS[item.status] || 'bg-gray-100'}`}>
          <Ionicons 
            name={STATUS_ICONS[item.status] || 'help-circle'} 
            size={12} 
            color={item.status === 'viewed' ? '#0165FB' : undefined}
          />
          <Text className="text-xs font-semibold">
            {STATUS_LABELS[item.status] || item.status}
          </Text>
        </View>
      </View>

      <Text className="text-sm text-gray-500 mb-3" numberOfLines={2}>
        {item.message}
      </Text>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-4 text-sm">
          <View className="flex-row items-center gap-1">
            <Ionicons name="card" size={14} color="#059669" />
            <Text className="font-semibold text-green-600">{item.proposed_price} сом</Text>
          </View>
          {item.estimated_duration && (
            <View className="flex-row items-center gap-1">
              <Ionicons name="calendar" size={14} color="#6B7280" />
              <Text className="text-gray-500">{item.estimated_duration}</Text>
            </View>
          )}
          <View className="flex-row items-center gap-1">
            <Ionicons name="time" size={14} color="#9CA3AF" />
            <Text className="text-gray-400">
              {formatRelativeTime(item.created_at)}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-2">
          {(item.status === 'pending' || item.status === 'viewed') && (
            <TouchableOpacity
              onPress={() => handleWithdraw(item.id)}
              className="px-4 py-2 bg-red-50 rounded-xl"
            >
              <Text className="text-sm font-medium text-red-600">Отозвать</Text>
            </TouchableOpacity>
          )}
          {item.status === 'accepted' && (
            <TouchableOpacity
              onPress={() => router.push('/(master)/projects')}
              className="px-4 py-2 bg-green-500 rounded-xl shadow-lg"
            >
              <Text className="text-sm font-medium text-white">К проекту</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8F7FC]">
        <View className="px-4 space-y-4">
          <View className="h-8 bg-gray-200 rounded-full w-1/3 animate-pulse" />
          {[1, 2, 3].map(i => (
            <View key={i} className="bg-white rounded-3xl p-5 animate-pulse">
              <View className="h-5 bg-gray-200 rounded-full w-3/4 mb-3" />
              <View className="h-4 bg-gray-200 rounded-full w-1/2" />
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}>
        {/* Header */}
        <View className="flex-row items-center gap-4 mb-4 pt-4 px-0">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 bg-white rounded-2xl items-center justify-center shadow-sm border border-gray-100"
          >
            <Ionicons name="arrow-back" size={20} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">Мои отклики</Text>
        </View>

        {/* Filter Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="mb-4 px-0"
        >
          <View className="flex-row gap-2">
            {tabs.map(tab => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setStatusFilter(tab.key)}
                className={`px-4 py-2.5 rounded-2xl ${
                  statusFilter === tab.key
                    ? 'bg-[#0165FB] shadow-lg'
                    : 'bg-white border border-gray-100'
                }`}
              >
                <Text className={`font-medium text-sm ${
                  statusFilter === tab.key ? 'text-white' : 'text-gray-600'
                }`}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Applications List */}
        {applications.length === 0 ? (
          <View className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 items-center mt-4">
            <View className="w-20 h-20 bg-[#0165FB]/10 rounded-full items-center justify-center mb-4">
              <Ionicons name="document" size={40} color="#0165FB" />
            </View>
            <Text className="text-lg font-semibold text-gray-900 mb-2">Нет откликов</Text>
            <Text className="text-gray-500 mb-6 text-center">
              Найдите подходящие заказы и откликнитесь на них
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(master)/orders')}
              className="flex-row items-center gap-2 px-6 py-3 bg-[#0165FB] rounded-2xl shadow-lg"
            >
              <Ionicons name="search" size={16} color="white" />
              <Text className="font-semibold text-white">Найти заказы</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={applications}
            renderItem={renderApplication}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}