import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Transaction {
  id: number;
  transaction_type: string;
  amount: string;
  description: string;
  status: string;
  created_at: string;
}

interface Wallet {
  balance: string;
  available: string;
  reserved: string;
  currency: string;
}

export default function WalletPage() {
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  // Mock data - replace with actual API calls
  const wallet: Wallet = {
    balance: '15,000',
    available: '12,000',
    reserved: '3,000',
    currency: 'KGS'
  };

  const transactions: Transaction[] = [
    {
      id: 1,
      transaction_type: 'deposit',
      amount: '5000',
      description: 'Пополнение через карту',
      status: 'completed',
      created_at: '2024-01-15T10:30:00Z'
    },
    {
      id: 2,
      transaction_type: 'payment',
      amount: '2500',
      description: 'Оплата заказа #123',
      status: 'completed',
      created_at: '2024-01-14T15:45:00Z'
    },
    {
      id: 3,
      transaction_type: 'withdrawal',
      amount: '1000',
      description: 'Вывод на карту',
      status: 'pending',
      created_at: '2024-01-13T09:20:00Z'
    },
    {
      id: 4,
      transaction_type: 'refund',
      amount: '1500',
      description: 'Возврат за заказ #120',
      status: 'completed',
      created_at: '2024-01-12T14:10:00Z'
    }
  ];

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return { name: 'arrow-down', color: '#10B981' };
      case 'withdrawal':
        return { name: 'arrow-up', color: '#EF4444' };
      case 'payment':
        return { name: 'card', color: '#F59E0B' };
      case 'refund':
        return { name: 'refresh', color: '#3B82F6' };
      default:
        return { name: 'swap-horizontal', color: '#6B7280' };
    }
  };

  const getTransactionTitle = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Пополнение';
      case 'withdrawal':
        return 'Вывод';
      case 'payment':
        return 'Оплата';
      case 'refund':
        return 'Возврат';
      default:
        return 'Транзакция';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Завершено';
      case 'pending':
        return 'В обработке';
      case 'failed':
        return 'Ошибка';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(t => t.transaction_type === filter);

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const icon = getTransactionIcon(item.transaction_type);
    const isIncoming = ['deposit', 'refund'].includes(item.transaction_type);
    
    return (
      <TouchableOpacity className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100">
        <View className="flex-row items-center gap-4">
          <View className={`w-12 h-12 rounded-full items-center justify-center`} 
                style={{ backgroundColor: `${icon.color}20` }}>
            <Ionicons name={icon.name as any} size={20} color={icon.color} />
          </View>
          
          <View className="flex-1">
            <Text className="font-semibold text-gray-900 mb-1">
              {getTransactionTitle(item.transaction_type)}
            </Text>
            <Text className="text-gray-600 text-sm mb-1">{item.description}</Text>
            <Text className="text-gray-400 text-xs">{formatDate(item.created_at)}</Text>
          </View>
          
          <View className="items-end">
            <Text className={`font-bold text-lg ${
              isIncoming ? 'text-green-600' : 'text-red-600'
            }`}>
              {isIncoming ? '+' : '-'}{item.amount} сом
            </Text>
            <Text className={`text-xs font-medium ${getStatusColor(item.status)}`}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center gap-4 px-4 py-3 bg-white">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900 flex-1">Кошелёк</Text>
        <TouchableOpacity className="w-10 h-10 items-center justify-center">
          <Ionicons name="ellipsis-vertical" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}>
        {/* Balance Card */}
        <View className="mx-4 mt-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl p-6 shadow-lg mb-4">
          <Text className="text-white/80 text-sm mb-2">Общий баланс</Text>
          <Text className="text-white text-3xl font-bold mb-4">
            {wallet.balance} {wallet.currency}
          </Text>
          
          <View className="flex-row justify-between mb-6">
            <View>
              <Text className="text-white/80 text-sm">Доступно</Text>
              <Text className="text-white text-lg font-semibold">
                {wallet.available} {wallet.currency}
              </Text>
            </View>
            <View>
              <Text className="text-white/80 text-sm">Заморожено</Text>
              <Text className="text-white text-lg font-semibold">
                {wallet.reserved} {wallet.currency}
              </Text>
            </View>
          </View>
          
          <View className="flex-row gap-3">
            <TouchableOpacity 
              onPress={() => router.push('/(client)/wallet/deposit')}
              className="flex-1 bg-white/20 py-3 rounded-2xl"
            >
              <Text className="text-white font-semibold text-center">Пополнить</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => router.push('/(client)/wallet/withdraw')}
              className="flex-1 bg-white/20 py-3 rounded-2xl"
            >
              <Text className="text-white font-semibold text-center">Вывести</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="mx-4 mt-4 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <Text className="text-lg font-bold text-gray-900 mb-4">Быстрые действия</Text>
          
          <View className="flex-row justify-between">
            <TouchableOpacity className="items-center">
              <View className="w-14 h-14 bg-blue-100 rounded-2xl items-center justify-center mb-2">
                <Ionicons name="card" size={24} color="#3B82F6" />
              </View>
              <Text className="text-gray-700 text-sm font-medium">Карты</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="items-center">
              <View className="w-14 h-14 bg-green-100 rounded-2xl items-center justify-center mb-2">
                <Ionicons name="receipt" size={24} color="#10B981" />
              </View>
              <Text className="text-gray-700 text-sm font-medium">Чеки</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="items-center">
              <View className="w-14 h-14 bg-purple-100 rounded-2xl items-center justify-center mb-2">
                <Ionicons name="analytics" size={24} color="#8B5CF6" />
              </View>
              <Text className="text-gray-700 text-sm font-medium">Статистика</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="items-center">
              <View className="w-14 h-14 bg-orange-100 rounded-2xl items-center justify-center mb-2">
                <Ionicons name="settings" size={24} color="#F97316" />
              </View>
              <Text className="text-gray-700 text-sm font-medium">Настройки</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transactions */}
        <View className="mx-4 mt-4 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-900">История операций</Text>
            <TouchableOpacity>
              <Text className="text-blue-600 font-medium">Все</Text>
            </TouchableOpacity>
          </View>

          {/* Filter Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            <View className="flex-row gap-2">
              {[
                { key: 'all', label: 'Все' },
                { key: 'deposit', label: 'Пополнения' },
                { key: 'withdrawal', label: 'Выводы' },
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
          {filteredTransactions.length === 0 ? (
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