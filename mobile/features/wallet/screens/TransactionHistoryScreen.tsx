import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useGetTransactionsQuery } from '../../../services/walletApi';
import { TransactionItem } from '../components/TransactionItem';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { EmptyState } from '../../../components/EmptyState';

type FilterType = 'all' | 'deposit' | 'withdrawal' | 'payment';

export default function TransactionHistoryScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('all');

  const { data, isLoading, isFetching, refetch } = useGetTransactionsQuery({
    transaction_type: filter === 'all' ? undefined : filter,
    page_size: 50,
  });

  const transactions = data?.results || [];

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'Все' },
    { key: 'deposit', label: 'Пополнения' },
    { key: 'withdrawal', label: 'Выводы' },
    { key: 'payment', label: 'Платежи' },
  ];

  const renderHeader = () => (
    <View className="bg-white border-b border-gray-200">
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">История операций</Text>
      </View>

      <View className="flex-row px-4 pb-3">
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            className={`px-4 py-2 rounded-full mr-2 ${
              filter === f.key ? 'bg-blue-500' : 'bg-gray-100'
            }`}
            onPress={() => setFilter(f.key)}
          >
            <Text className={filter === f.key ? 'text-white font-medium' : 'text-gray-700'}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        {renderHeader()}
        <LoadingSpinner fullScreen text="Загрузка истории..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <FlatList
        ListHeaderComponent={renderHeader}
        data={transactions}
        renderItem={({ item }) => <TransactionItem transaction={item} showDetails />}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="Нет операций"
            description="История операций пуста"
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor="#3B82F6"
          />
        }
      />
    </SafeAreaView>
  );
}
