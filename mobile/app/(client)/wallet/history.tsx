import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Transaction {
  id: number;
  type: 'payment' | 'refund' | 'deposit' | 'commission';
  amount: string;
  currency: string;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
  project_id?: number;
  project_title?: string;
  master_name?: string;
}

export default function ClientWalletHistoryPage() {
  const [filter, setFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Mock data - replace with actual API calls
  const transactions: Transaction[] = [
    {
      id: 1,
      type: 'payment',
      amount: '-15,000',
      currency: 'сом',
      description: 'Оплата за ремонт ванной комнаты',
      status: 'completed',
      created_at: '2024-01-15T14:30:00Z',
      project_id: 123,
      project_title: 'Ремонт ванной комнаты',
      master_name: 'Алексей Петров'
    },
    {
      id: 2,
      type: 'deposit',
      amount: '+25,000',
      currency: 'сом',
      description: 'Пополнение кошелька',
      status: 'completed',
      created_at: '2024-01-14T10:15:00Z'
    },
    {
      id: 3,
      type: 'payment',
      amount: '-8,500',
      currency: 'сом',
      description: 'Оплата за установку кондиционера',
      status: 'completed',
      created_at: '2024-01-12T16:45:00Z',
      project_id: 124,
      project_title: 'Установка кондиционера',
      master_name: 'Иван Сидоров'
    },
    {
      id: 4,
      type: 'refund',
      amount: '+3,000',
      currency: 'сом',
      description: 'Возврат за отмененный заказ',
      status: 'completed',
      created_at: '2024-01-10T09:20:00Z',
      project_title: 'Покраска стен'
    },
    {
      id: 5,
      type: 'payment',
      amount: '-12,000',
      currency: 'сом',
      description: 'Оплата за электромонтажные работы',
      status: 'pending',
      created_at: '2024-01-08T11:30:00Z',
      project_id: 125,
      project_title: 'Электромонтажные работы',
      master_name: 'Сергей Козлов'
    }
  ];

  const filteredTransactions = transactions.filter(transaction => {
    const matchesType = filter === 'all' || transaction.type === filter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const transactionDate = new Date(transaction.created_at);
      const now = new Date();
      
      switch (dateFilter) {
        case 'today':
          matchesDate = transactionDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = transactionDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = transactionDate >= monthAgo;
          break;
      }
    }
    
    return matchesType && matchesDate;
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return { name: 'arrow-up', color: '#DC2626', bg: 'bg-red-100' };
      case 'deposit':
        return { name: 'arrow-down', color: '#059669', bg: 'bg-green-100' };
      case 'refund':
        return { name: 'refresh', color: '#8B5CF6', bg: 'bg-purple-100' };
      case 'commission':
        return { name: 'remove', color: '#F59E0B', bg: 'bg-yellow-100' };
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
            router.push(`/(client)/projects/${item.project_id}`);
          }
        }}
        className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4"
      >
        <View className="flex-row items-center gap-4">
          <View className={`w-12 h-12 rounded-2xl items-center justify-center ${icon.bg}`}>
            <Ionicons name={icon.name as any} size={20} color={icon.color} />
          </View>
          
          <View className="flex-1">
            <Text className="font-semibold text-gray-900" numberOfLines={1}>
              {item.description}
            </Text>
            {item.master_name && (
              <Text className="text-sm text-gray-500">Мастер: {item.master_name}</Text>
            )}
            <View className="flex-row items-center gap-2 mt-1">
              <View className={`px-2 py-0.5 rounded-full ${statusBadge.style}`}>
                <Text className="text-xs font-medium">{statusBadge.label}</Text>
              </View>
              <Text className="text-xs text-gray-400">
                {new Date(item.created_at).toLocaleDateString('ru-RU')} в {new Date(item.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
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
      <ScrollView className="flex-1 px-4">
        {/* Header */}
        <View className="flex-row items-center gap-4 mb-6">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 bg-white rounded-2xl items-center justify-center shadow-sm border border-gray-100"
          >
            <Ionicons name="arrow-back" size={20} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">История операций</Text>
        </View>

        {/* Summary */}
        <View className="bg-[#0165FB] rounded-3xl p-5 mb-6">
          <Text className="text-white/80 text-sm mb-2">Всего операций</Text>
          <Text className="text-white text-3xl font-bold mb-4">{transactions.length}</Text>
          
          <View className="flex-row justify-between">
            <View>
              <Text className="text-white/80 text-sm">Потрачено</Text>
              <Text className="text-white text-lg font-semibold">
                {transactions
                  .filter(t => t.type === 'payment' && t.status === 'completed')
                  .reduce((sum, t) => sum + Math.abs(parseInt(t.amount.replace(/[^\d]/g, ''))), 0)
                  .toLocaleString()} сом
              </Text>
            </View>
            <View>
              <Text className="text-white/80 text-sm">Пополнено</Text>
              <Text className="text-white text-lg font-semibold">
                {transactions
                  .filter(t => t.type === 'deposit' && t.status === 'completed')
                  .reduce((sum, t) => sum + parseInt(t.amount.replace(/[^\d]/g, '')), 0)
                  .toLocaleString()} сом
              </Text>
            </View>
          </View>
        </View>

        {/* Filters */}
        <View className="mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-3">Тип операций</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {[
                { key: 'all', label: 'Все' },
                { key: 'payment', label: 'Платежи' },
                { key: 'deposit', label: 'Пополнения' },
                { key: 'refund', label: 'Возвраты' },
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
        </View>

        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">Период</Text>
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
                      ? 'bg-[#0165FB]' 
                      : 'bg-white border border-gray-200'
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

        {/* Transactions List */}
        {filteredTransactions.length === 0 ? (
          <View className="bg-white rounded-3xl p-8 items-center shadow-sm border border-gray-100">
            <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="receipt-outline" size={32} color="#9CA3AF" />
            </View>
            <Text className="text-gray-500 text-lg font-medium mb-2">Нет операций</Text>
            <Text className="text-gray-400 text-center">
              История операций за выбранный период пуста
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
      </ScrollView>
    </SafeAreaView>
  );
}