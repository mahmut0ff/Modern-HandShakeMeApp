import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { 
  useGetWalletQuery, 
  useGetTransactionsQuery,
  useGetWalletStatsQuery 
} from '../../../services/walletApi';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ErrorMessage } from '../../../components/ErrorMessage';
import { EmptyState } from '../../../components/EmptyState';
import { formatCurrency, formatDate, formatRelativeTime } from '../../../utils/format';

export default function MasterWalletPage() {
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // API queries
  const { 
    data: wallet, 
    isLoading: walletLoading, 
    error: walletError,
    refetch: refetchWallet 
  } = useGetWalletQuery();

  const { 
    data: transactionsData, 
    isLoading: transactionsLoading, 
    error: transactionsError,
    refetch: refetchTransactions 
  } = useGetTransactionsQuery({
    transaction_type: filter === 'all' ? undefined : filter,
    page_size: 20
  });

  const { 
    data: walletStats,
    refetch: refetchStats 
  } = useGetWalletStatsQuery({ period: 'month' });

  const transactions = transactionsData?.results || [];

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchWallet(),
        refetchTransactions(),
        refetchStats()
      ]);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (walletLoading && !wallet) {
    return <LoadingSpinner fullScreen text="Загрузка кошелька..." />;
  }

  if (walletError && !wallet) {
    return (
      <ErrorMessage
        fullScreen
        message="Не удалось загрузить кошелёк"
        onRetry={refetchWallet}
      />
    );
  }

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
      case 'deposit':
        return { name: 'add', color: '#059669', bg: 'bg-green-100' };
      case 'refund':
        return { name: 'refresh', color: '#3B82F6', bg: 'bg-blue-100' };
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
      case 'cancelled':
        return { style: 'bg-gray-100 text-gray-700', label: 'Отменено' };
      default:
        return { style: 'bg-gray-100 text-gray-700', label: status };
    }
  };

  const renderTransaction = ({ item }: { item: any }) => {
    const icon = getTransactionIcon(item.transaction_type);
    const statusBadge = getStatusBadge(item.status);
    const isPositive = parseFloat(item.amount) > 0;
    
    return (
      <TouchableOpacity 
        onPress={() => {
          if (item.related_object_type === 'project' && item.related_object_id) {
            router.push(`/(master)/projects/${item.related_object_id}`);
          } else if (item.transaction_type === 'withdrawal') {
            router.push('/(master)/wallet/withdraw');
          } else {
            router.push('/(master)/wallet/history');
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
                {formatRelativeTime(item.created_at)}
              </Text>
            </View>
          </View>
          
          <Text className={`font-bold text-lg ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {isPositive ? '+' : ''}{formatCurrency(item.amount)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="flex-row items-center gap-4 px-4 mb-4">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 bg-white rounded-2xl items-center justify-center shadow-sm border border-gray-100"
          >
            <Ionicons name="arrow-back" size={20} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">Кошелёк</Text>
        </View>

        {/* Balance Card */}
        <View className="bg-[#0165FB] mx-4 rounded-3xl p-6 shadow-lg mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-white/80 text-sm">Общий баланс</Text>
              <Text className="text-white text-3xl font-bold">
                {wallet ? formatCurrency(wallet.balance) : '0 сом'}
              </Text>
            </View>
            <View className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center">
              <Ionicons name="wallet" size={24} color="white" />
            </View>
          </View>
          
          <View className="flex-row justify-between mb-6">
            <View>
              <Text className="text-white/80 text-sm">Доступно</Text>
              <Text className="text-white text-lg font-semibold">
                {wallet ? formatCurrency(wallet.balance) : '0 сом'}
              </Text>
            </View>
            <View>
              <Text className="text-white/80 text-sm">Заморожено</Text>
              <Text className="text-white text-lg font-semibold">
                {wallet ? formatCurrency(wallet.pending_balance || '0') : '0 сом'}
              </Text>
            </View>
          </View>
          
          <View className="flex-row gap-3">
            <TouchableOpacity 
              onPress={() => router.push('/(master)/wallet/withdraw')}
              className="flex-1 bg-white/20 py-3 rounded-2xl"
            >
              <Text className="text-white font-semibold text-center">Вывести</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => router.push('/(master)/wallet/cards')}
              className="flex-1 bg-white/20 py-3 rounded-2xl"
            >
              <Text className="text-white font-semibold text-center">Карты</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pending Withdrawals */}
        {wallet?.pending_balance && parseFloat(wallet.pending_balance) > 0 && (
          <View className="mx-4 mb-4 bg-orange-50 border border-orange-200 rounded-3xl p-4">
            <View className="flex-row items-center gap-3">
              <Ionicons name="time" size={20} color="#F59E0B" />
              <View className="flex-1">
                <Text className="font-semibold text-orange-800">Выводы в обработке</Text>
                <Text className="text-sm text-orange-600">
                  {formatCurrency(wallet.pending_balance)} ожидают обработки
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View className="mx-4 mb-4 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <Text className="text-lg font-bold text-gray-900 mb-4">Быстрые действия</Text>
          
          <View className="flex-row justify-between">
            <TouchableOpacity 
              onPress={() => router.push('/(master)/wallet/withdraw')}
              className="items-center"
            >
              <View className="w-14 h-14 bg-green-100 rounded-2xl items-center justify-center mb-2">
                <Ionicons name="arrow-up" size={24} color="#10B981" />
              </View>
              <Text className="text-gray-700 text-sm font-medium">Вывести</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => router.push('/(master)/wallet/cards')}
              className="items-center"
            >
              <View className="w-14 h-14 bg-blue-100 rounded-2xl items-center justify-center mb-2">
                <Ionicons name="card" size={24} color="#3B82F6" />
              </View>
              <Text className="text-gray-700 text-sm font-medium">Карты</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => router.push('/(master)/wallet/history')}
              className="items-center"
            >
              <View className="w-14 h-14 bg-purple-100 rounded-2xl items-center justify-center mb-2">
                <Ionicons name="receipt" size={24} color="#8B5CF6" />
              </View>
              <Text className="text-gray-700 text-sm font-medium">История</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => router.push('/(master)/wallet/analytics')}
              className="items-center"
            >
              <View className="w-14 h-14 bg-orange-100 rounded-2xl items-center justify-center mb-2">
                <Ionicons name="analytics" size={24} color="#F97316" />
              </View>
              <Text className="text-gray-700 text-sm font-medium">Аналитика</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transactions */}
        <View className="mx-4 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-900">Последние операции</Text>
            <TouchableOpacity onPress={() => router.push('/(master)/wallet/history')}>
              <Text className="text-[#0165FB] font-medium">Все</Text>
            </TouchableOpacity>
          </View>

          {/* Filter Tabs */}
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
                      : 'bg-white border border-gray-200'
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

          {/* Transactions List */}
          {transactionsLoading && transactions.length === 0 ? (
            <LoadingSpinner text="Загрузка операций..." />
          ) : transactionsError ? (
            <ErrorMessage
              message="Не удалось загрузить операции"
              onRetry={refetchTransactions}
            />
          ) : transactions.length === 0 ? (
            <EmptyState
              icon="receipt-outline"
              title="Нет операций"
              description="История операций появится здесь"
            />
          ) : (
            <FlatList
              data={transactions}
              renderItem={renderTransaction}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}