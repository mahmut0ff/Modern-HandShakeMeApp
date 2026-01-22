import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { 
  useGetTransactionsQuery, 
  useGetWalletStatsQuery,
  type Transaction as APITransaction 
} from '../../../services/walletApi';

// Map API transaction types to display types
const transactionTypeMap: Record<string, string> = {
  'deposit': 'payment',
  'payment': 'payment',
  'refund': 'payment',
  'bonus': 'bonus',
  'withdrawal': 'withdrawal',
  'commission': 'commission',
  'penalty': 'commission',
};

interface Transaction {
  id: number;
  type: 'payment' | 'withdrawal' | 'commission' | 'bonus';
  amount: string;
  currency: string;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
  project_id?: number;
  project_title?: string;
}

export default function WalletHistoryPage() {
  const [filter, setFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Calculate date range for API query
  const getDateRange = () => {
    const now = new Date();
    switch (dateFilter) {
      case 'today':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return {
          date_from: today.toISOString().split('T')[0],
          date_to: now.toISOString().split('T')[0],
        };
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return {
          date_from: weekAgo.toISOString().split('T')[0],
          date_to: now.toISOString().split('T')[0],
        };
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return {
          date_from: monthAgo.toISOString().split('T')[0],
          date_to: now.toISOString().split('T')[0],
        };
      default:
        return {};
    }
  };

  // API queries
  const { 
    data: transactionsData, 
    isLoading: transactionsLoading, 
    error: transactionsError,
    refetch: refetchTransactions 
  } = useGetTransactionsQuery({
    transaction_type: filter !== 'all' ? filter : undefined,
    ...getDateRange(),
    page,
    page_size: 20,
  });

  const { 
    data: statsData, 
    isLoading: statsLoading 
  } = useGetWalletStatsQuery({
    period: dateFilter === 'week' ? 'week' : dateFilter === 'month' ? 'month' : undefined
  });

  const transactions = transactionsData?.results || [];

  // Convert API transactions to display format
  const displayTransactions = useMemo(() => {
    return transactions.map((transaction: APITransaction): Transaction => {
      const displayType = transactionTypeMap[transaction.transaction_type] || 'payment';
      const isPositive = ['deposit', 'payment', 'refund', 'bonus'].includes(transaction.transaction_type);
      
      return {
        id: transaction.id,
        type: displayType as 'payment' | 'withdrawal' | 'commission' | 'bonus',
        amount: `${isPositive ? '+' : '-'}${Math.abs(parseFloat(transaction.amount)).toLocaleString('ru-RU')}`,
        currency: transaction.currency,
        description: transaction.description || getDefaultDescription(transaction.transaction_type),
        status: transaction.status as 'completed' | 'pending' | 'failed',
        created_at: transaction.created_at,
        project_id: transaction.related_object_type === 'project' ? transaction.related_object_id : undefined,
        project_title: transaction.related_object_type === 'project' ? `Проект #${transaction.related_object_id}` : undefined,
      };
    });
  }, [transactions]);

  const getDefaultDescription = (type: string): string => {
    switch (type) {
      case 'deposit': return 'Пополнение счета';
      case 'payment': return 'Оплата за проект';
      case 'withdrawal': return 'Вывод средств';
      case 'commission': return 'Комиссия платформы';
      case 'bonus': return 'Бонус';
      case 'refund': return 'Возврат средств';
      case 'penalty': return 'Штраф';
      default: return 'Операция';
    }
  };

  const filteredTransactions = displayTransactions.filter(t => {
    if (filter !== 'all' && t.type !== filter) return false;
    return true;
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return { name: 'arrow-down', color: '#059669', bg: 'bg-green-100' };
      case 'withdrawal':
        return { name: 'arrow-up', color: '#DC2626', bg: 'bg-red-100' };
      case 'commission':
        return { name: 'remove', color: '#F59E0B', bg: 'bg-yellow-100' };
      case 'bonus':
        return { name: 'gift', color: '#8B5CF6', bg: 'bg-purple-100' };
      default:
        return { name: 'swap-horizontal', color: '#6B7280', bg: 'bg-gray-100' };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return { style: 'bg-green-100 text-green-700', label: 'Завершено' };
      case 'pending':
        return { style: 'bg-orange-100 text-orange-700', label: 'В обработке' };
      case 'failed':
        return { style: 'bg-red-100 text-red-700', label: 'Ошибка' };
      default:
        return { style: 'bg-gray-100 text-gray-700', label: status };
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const icon = getTransactionIcon(item.type);
    const statusBadge = getStatusBadge(item.status);
    
    return (
      <TouchableOpacity 
        onPress={() => {
          if (item.project_id) {
            router.push(`/(master)/projects/${item.project_id}`);
          }
        }}
        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3"
      >
        <View className="flex-row items-center gap-4">
          <View className={`w-12 h-12 rounded-2xl items-center justify-center ${icon.bg}`}>
            <Ionicons name={icon.name as any} size={20} color={icon.color} />
          </View>
          
          <View className="flex-1">
            <Text className="font-semibold text-gray-900" numberOfLines={1}>
              {item.description}
            </Text>
            <View className="flex-row items-center gap-2 mt-1">
              <View className={`px-2 py-0.5 rounded-full ${statusBadge.style}`}>
                <Text className="text-xs font-medium">{statusBadge.label}</Text>
              </View>
              <Text className="text-xs text-gray-400">
                {new Date(item.created_at).toLocaleDateString('ru-RU')} {new Date(item.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            {item.project_title && (
              <Text className="text-xs text-blue-600 mt-1">
                Проект: {item.project_title}
              </Text>
            )}
          </View>
          
          <Text className={`font-bold text-lg ${
            item.amount.startsWith('+') ? 'text-green-600' : 'text-red-600'
          }`}>
            {item.amount} {item.currency}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}>
        {/* Header */}
        <View className="flex-row items-center gap-4 mb-6">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 bg-white rounded-2xl items-center justify-center shadow-sm border border-gray-100"
          >
            <Ionicons name="arrow-back" size={20} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">История операций</Text>
        </View>

        {/* Filters */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="font-semibold text-gray-900 mb-4">Фильтры</Text>
          
          {/* Type Filter */}
          <Text className="text-sm font-medium text-gray-700 mb-2">Тип операции</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            <View className="flex-row gap-2">
              {[
                { key: 'all', label: 'Все' },
                { key: 'payment', label: 'Поступления' },
                { key: 'withdrawal', label: 'Выводы' },
                { key: 'commission', label: 'Комиссии' },
                { key: 'bonus', label: 'Бонусы' },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setFilter(tab.key)}
                  className={`px-4 py-2 rounded-full ${
                    filter === tab.key 
                      ? 'bg-[#0165FB]' 
                      : 'bg-gray-100 border border-gray-200'
                  }`}
                >
                  <Text className={`font-medium ${
                    filter === tab.key ? 'text-white' : 'text-gray-600'
                  }`}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Date Filter */}
          <Text className="text-sm font-medium text-gray-700 mb-2">Период</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {[
                { key: 'all', label: 'Все время' },
                { key: 'today', label: 'Сегодня' },
                { key: 'week', label: 'Неделя' },
                { key: 'month', label: 'Месяц' },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setDateFilter(tab.key)}
                  className={`px-4 py-2 rounded-full ${
                    dateFilter === tab.key 
                      ? 'bg-green-500' 
                      : 'bg-gray-100 border border-gray-200'
                  }`}
                >
                  <Text className={`font-medium ${
                    dateFilter === tab.key ? 'text-white' : 'text-gray-600'
                  }`}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Statistics */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="font-semibold text-gray-900 mb-4">Статистика</Text>
          
          {statsLoading ? (
            <View className="items-center py-4">
              <ActivityIndicator size="small" color="#0165FB" />
              <Text className="text-gray-500 mt-2">Загрузка статистики...</Text>
            </View>
          ) : (
            <View className="flex-row justify-between">
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-green-600">
                  +{statsData?.total_earned ? parseFloat(statsData.total_earned).toLocaleString('ru-RU') : '0'}
                </Text>
                <Text className="text-sm text-gray-500">Поступления</Text>
              </View>
              <View className="w-px bg-gray-200" />
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-red-600">
                  -{statsData?.total_spent ? parseFloat(statsData.total_spent).toLocaleString('ru-RU') : '0'}
                </Text>
                <Text className="text-sm text-gray-500">Выводы</Text>
              </View>
              <View className="w-px bg-gray-200" />
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-gray-900">
                  {statsData?.transactions_count || filteredTransactions.length}
                </Text>
                <Text className="text-sm text-gray-500">Операций</Text>
              </View>
            </View>
          )}
        </View>

        {/* Loading state */}
        {transactionsLoading && (
          <View className="bg-white rounded-3xl p-8 items-center shadow-sm border border-gray-100 mb-6">
            <ActivityIndicator size="large" color="#0165FB" />
            <Text className="text-gray-500 mt-2">Загрузка операций...</Text>
          </View>
        )}

        {/* Error state */}
        {transactionsError && (
          <View className="bg-white rounded-3xl p-8 items-center shadow-sm border border-gray-100 mb-6">
            <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="alert-circle" size={32} color="#EF4444" />
            </View>
            <Text className="text-gray-900 font-semibold mb-2">Ошибка загрузки</Text>
            <Text className="text-gray-500 text-center mb-4">
              Не удалось загрузить историю операций
            </Text>
            <TouchableOpacity 
              onPress={() => refetchTransactions()}
              className="bg-[#0165FB] px-6 py-2 rounded-xl"
            >
              <Text className="text-white font-medium">Повторить</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Transactions List */}
        {!transactionsLoading && !transactionsError && (
          <View className="mb-6">
            {filteredTransactions.length === 0 ? (
              <View className="bg-white rounded-3xl p-8 items-center shadow-sm border border-gray-100">
                <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                  <Ionicons name="receipt-outline" size={32} color="#9CA3AF" />
                </View>
                <Text className="text-gray-500 text-lg font-medium mb-2">Нет операций</Text>
                <Text className="text-gray-400 text-center">
                  Операции по выбранным фильтрам не найдены
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredTransactions}
                renderItem={renderTransaction}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}