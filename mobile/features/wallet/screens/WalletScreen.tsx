import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useGetWalletQuery, useGetTransactionsQuery } from '../../../services/walletApi';
import { BalanceCard } from '../components/BalanceCard';
import { TransactionItem } from '../components/TransactionItem';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { EmptyState } from '../../../components/EmptyState';

export default function WalletScreen() {
  const router = useRouter();
  const { data: wallet, isLoading: walletLoading, refetch: refetchWallet } = useGetWalletQuery();
  const { data: transactionsData, isLoading: transactionsLoading, refetch: refetchTransactions } = useGetTransactionsQuery({ page_size: 10 });

  const isLoading = walletLoading || transactionsLoading;
  const transactions = transactionsData?.results || [];

  const handleRefresh = () => {
    refetchWallet();
    refetchTransactions();
  };

  if (isLoading && !wallet) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <LoadingSpinner fullScreen text="Загрузка кошелька..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor="#3B82F6" />
        }
      >
        <View className="bg-white border-b border-gray-200 px-4 py-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-gray-900">Кошелек</Text>
            <TouchableOpacity onPress={() => router.push('/wallet/history' as any)}>
              <Ionicons name="time-outline" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="p-4">
          <BalanceCard
            balance={wallet?.balance || '0'}
            pendingBalance={wallet?.pending_balance || '0'}
            currency={wallet?.currency || 'KGS'}
          />

          <View className="flex-row mt-4 space-x-3">
            <TouchableOpacity
              className="flex-1 bg-green-500 rounded-xl py-4 items-center"
              onPress={() => router.push('/wallet/deposit' as any)}
            >
              <Ionicons name="add-circle" size={24} color="white" />
              <Text className="text-white font-semibold mt-1">Пополнить</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-blue-500 rounded-xl py-4 items-center"
              onPress={() => router.push('/wallet/withdraw' as any)}
            >
              <Ionicons name="arrow-up-circle" size={24} color="white" />
              <Text className="text-white font-semibold mt-1">Вывести</Text>
            </TouchableOpacity>
          </View>

          <View className="mt-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-semibold text-gray-900">Последние операции</Text>
              <TouchableOpacity onPress={() => router.push('/wallet/history' as any)}>
                <Text className="text-blue-500">Все</Text>
              </TouchableOpacity>
            </View>

            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <TransactionItem key={transaction.id} transaction={transaction} />
              ))
            ) : (
              <EmptyState
                icon="wallet-outline"
                title="Нет операций"
                description="Здесь будет история ваших операций"
              />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
