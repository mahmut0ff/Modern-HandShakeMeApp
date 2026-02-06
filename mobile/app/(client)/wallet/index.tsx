import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useGetWalletQuery,
  useGetTransactionsQuery,
  useGetWalletStatsQuery,
} from '../../../services/walletApi';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ErrorMessage } from '../../../components/ErrorMessage';
import { BalanceCard } from '../../../features/wallet/components/BalanceCard';
import { TransactionItem } from '../../../features/wallet/components/TransactionItem';

export default function WalletPage() {
  const [filter, setFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  // API queries
  const {
    data: wallet,
    isLoading: walletLoading,
    error: walletError,
    refetch: refetchWallet,
  } = useGetWalletQuery();

  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useGetTransactionsQuery({
    transaction_type: filter === 'all' ? undefined : filter,
    page_size: 10,
  });

  const {
    data: walletStats,
    refetch: refetchStats,
  } = useGetWalletStatsQuery({ period: 'month' });

  const transactions = transactionsData?.results || [];

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchWallet(),
        refetchTransactions(),
        refetchStats(),
      ]);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (walletLoading && !wallet) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8F7FC]">
        <LoadingSpinner fullScreen text="Загрузка кошелька..." />
      </SafeAreaView>
    );
  }

  if (walletError && !wallet) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8F7FC]">
        <ErrorMessage
          fullScreen
          message="Не удалось загрузить кошелёк"
          onRetry={refetchWallet}
        />
      </SafeAreaView>
    );
  }

  const filteredTransactions = filter === 'all'
    ? transactions
    : transactions.filter(t => t.transaction_type === filter);

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0165FB" />
        }
      >
        {/* Header */}
        <View className="flex-row items-center gap-4 px-4 py-3 mb-4">
          <Text className="text-2xl font-bold text-gray-900 flex-1">Кошелёк</Text>
          <TouchableOpacity
            onPress={() => router.push('/(client)/wallet/history')}
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="time-outline" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View className="px-4 mb-6">
          <BalanceCard
            balance={wallet?.balance || '0'}
            availableBalance={wallet?.balance || '0'}
            pendingBalance={wallet?.pending_balance || '0'}
            currency={wallet?.currency || 'KGS'}
            userRole="client"
            onDeposit={() => router.push('/(client)/wallet/deposit')}
            onWithdraw={() => router.push('/(client)/wallet/withdraw')}
          />
        </View>

        {/* Statistics */}
        {walletStats && (
          <View className="mx-4 mb-4 bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <Text className="text-lg font-bold text-gray-900 mb-4">Статистика за месяц</Text>
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-2xl font-bold text-green-600">
                  {parseFloat(walletStats.this_month_earnings || '0').toLocaleString()}
                </Text>
                <Text className="text-sm text-gray-500">Пополнено</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-red-600">
                  {parseFloat(walletStats.this_month_spending || '0').toLocaleString()}
                </Text>
                <Text className="text-sm text-gray-500">Потрачено</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-blue-600">
                  {walletStats.transactions_count}
                </Text>
                <Text className="text-sm text-gray-500">Операций</Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View className="mx-4 mb-4 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <Text className="text-lg font-bold text-gray-900 mb-4">Быстрые действия</Text>

          <View className="flex-row justify-between">
            <TouchableOpacity
              onPress={() => router.push('/(client)/wallet/deposit')}
              className="items-center"
            >
              <View className="w-14 h-14 bg-green-100 rounded-2xl items-center justify-center mb-2">
                <Ionicons name="add" size={24} color="#10B981" />
              </View>
              <Text className="text-gray-700 text-sm font-medium">Пополнить</Text>
            </TouchableOpacity>

            <TouchableOpacity className="items-center">
              <View className="w-14 h-14 bg-blue-100 rounded-2xl items-center justify-center mb-2">
                <Ionicons name="card" size={24} color="#3B82F6" />
              </View>
              <Text className="text-gray-700 text-sm font-medium">Карты</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(client)/wallet/history')}
              className="items-center"
            >
              <View className="w-14 h-14 bg-purple-100 rounded-2xl items-center justify-center mb-2">
                <Ionicons name="receipt" size={24} color="#8B5CF6" />
              </View>
              <Text className="text-gray-700 text-sm font-medium">История</Text>
            </TouchableOpacity>

            <TouchableOpacity className="items-center">
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
            <TouchableOpacity onPress={() => router.push('/(client)/wallet/history')}>
              <Text className="text-blue-600 font-medium">Все</Text>
            </TouchableOpacity>
          </View>

          {/* Filter Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            <View className="flex-row gap-2">
              {[
                { key: 'all', label: 'Все' },
                { key: 'deposit', label: 'Пополнения' },
                { key: 'payment', label: 'Оплаты' },
                { key: 'refund', label: 'Возвраты' },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setFilter(tab.key)}
                  className={`px-4 py-2 rounded-full ${
                    filter === tab.key
                      ? 'bg-blue-500'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <Text
                    className={`font-medium ${
                      filter === tab.key ? 'text-white' : 'text-gray-600'
                    }`}
                  >
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
          ) : filteredTransactions.length === 0 ? (
            <View className="bg-white rounded-3xl p-8 items-center shadow-sm border border-gray-100">
              <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="receipt-outline" size={32} color="#9CA3AF" />
              </View>
              <Text className="text-gray-500 text-lg font-medium mb-2">Нет операций</Text>
              <Text className="text-gray-400 text-center">
                История операций появится здесь
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredTransactions}
              renderItem={({ item }) => (
                <TransactionItem
                  transaction={item}
                  onPress={() => {
                    // Navigate to transaction details
                    if (item.related_object_type === 'order' && item.related_object_id) {
                      router.push(`/(client)/orders/${item.related_object_id}`);
                    }
                  }}
                />
              )}
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