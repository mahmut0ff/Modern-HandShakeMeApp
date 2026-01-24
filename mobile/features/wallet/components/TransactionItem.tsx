import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatRelativeTime } from '../../../utils/format';
import type { Transaction } from '../../../services/walletApi';

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
}

export function TransactionItem({ transaction, onPress }: TransactionItemProps) {
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return { name: 'arrow-down', color: '#10B981', bg: '#D1FAE5' };
      case 'withdrawal':
        return { name: 'arrow-up', color: '#EF4444', bg: '#FEE2E2' };
      case 'payment':
        return { name: 'card', color: '#F59E0B', bg: '#FEF3C7' };
      case 'refund':
        return { name: 'refresh', color: '#3B82F6', bg: '#DBEAFE' };
      case 'commission':
        return { name: 'remove', color: '#F59E0B', bg: '#FEF3C7' };
      case 'bonus':
        return { name: 'gift', color: '#8B5CF6', bg: '#EDE9FE' };
      case 'penalty':
        return { name: 'warning', color: '#EF4444', bg: '#FEE2E2' };
      default:
        return { name: 'swap-horizontal', color: '#6B7280', bg: '#F3F4F6' };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return { style: 'bg-green-100', textStyle: 'text-green-700', label: 'Завершено' };
      case 'pending':
        return { style: 'bg-orange-100', textStyle: 'text-orange-700', label: 'В обработке' };
      case 'failed':
        return { style: 'bg-red-100', textStyle: 'text-red-700', label: 'Ошибка' };
      case 'cancelled':
        return { style: 'bg-gray-100', textStyle: 'text-gray-700', label: 'Отменено' };
      default:
        return { style: 'bg-gray-100', textStyle: 'text-gray-700', label: status };
    }
  };

  const getTransactionTitle = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Пополнение';
      case 'withdrawal':
        return 'Вывод средств';
      case 'payment':
        return 'Оплата';
      case 'refund':
        return 'Возврат';
      case 'commission':
        return 'Комиссия';
      case 'bonus':
        return 'Бонус';
      case 'penalty':
        return 'Штраф';
      default:
        return 'Транзакция';
    }
  };

  const icon = getTransactionIcon(transaction.transaction_type);
  const statusBadge = getStatusBadge(transaction.status);
  const isPositive = ['deposit', 'refund', 'bonus'].includes(transaction.transaction_type);
  
  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    return num.toLocaleString('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3"
      activeOpacity={0.7}
    >
      <View className="flex-row items-center gap-4">
        {/* Icon */}
        <View
          className="w-12 h-12 rounded-2xl items-center justify-center"
          style={{ backgroundColor: icon.bg }}
        >
          <Ionicons name={icon.name as any} size={20} color={icon.color} />
        </View>

        {/* Content */}
        <View className="flex-1">
          <Text className="font-semibold text-gray-900 mb-1" numberOfLines={1}>
            {transaction.description || getTransactionTitle(transaction.transaction_type)}
          </Text>
          <View className="flex-row items-center gap-2">
            <View className={`px-2 py-0.5 rounded-full ${statusBadge.style}`}>
              <Text className={`text-xs font-medium ${statusBadge.textStyle}`}>
                {statusBadge.label}
              </Text>
            </View>
            <Text className="text-xs text-gray-400">
              {formatRelativeTime(transaction.created_at)}
            </Text>
          </View>
        </View>

        {/* Amount */}
        <Text
          className={`font-bold text-lg ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {isPositive ? '+' : '-'}{formatAmount(transaction.amount)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
