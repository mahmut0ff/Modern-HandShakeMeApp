import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface BalanceCardProps {
  balance: string;
  availableBalance: string;
  pendingBalance: string;
  currency: string;
  userRole: 'client' | 'master';
  onDeposit?: () => void;
  onWithdraw?: () => void;
}

export function BalanceCard({
  balance,
  availableBalance,
  pendingBalance,
  currency,
  userRole,
  onDeposit,
  onWithdraw,
}: BalanceCardProps) {
  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    return num.toLocaleString('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  return (
    <View className="bg-[#0165FB] rounded-3xl p-6 shadow-lg">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text className="text-white/80 text-sm mb-1">Общий баланс</Text>
          <Text className="text-white text-3xl font-bold">
            {formatAmount(balance)} {currency}
          </Text>
        </View>
        <View className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center">
          <Ionicons name="wallet" size={24} color="white" />
        </View>
      </View>

      {/* Balance Details */}
      <View className="flex-row justify-between mb-6">
        <View>
          <Text className="text-white/80 text-sm">Доступно</Text>
          <Text className="text-white text-lg font-semibold">
            {formatAmount(availableBalance)} {currency}
          </Text>
        </View>
        <View>
          <Text className="text-white/80 text-sm">
            {userRole === 'master' ? 'В обработке' : 'Заморожено'}
          </Text>
          <Text className="text-white text-lg font-semibold">
            {formatAmount(pendingBalance)} {currency}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="flex-row gap-3">
        {userRole === 'client' && onDeposit && (
          <TouchableOpacity
            onPress={onDeposit}
            className="flex-1 bg-white/20 py-3 rounded-2xl"
            activeOpacity={0.8}
          >
            <Text className="text-white font-semibold text-center">Пополнить</Text>
          </TouchableOpacity>
        )}

        {onWithdraw && (
          <TouchableOpacity
            onPress={onWithdraw}
            className="flex-1 bg-white/20 py-3 rounded-2xl"
            activeOpacity={0.8}
          >
            <Text className="text-white font-semibold text-center">Вывести</Text>
          </TouchableOpacity>
        )}

        {userRole === 'master' && (
          <TouchableOpacity
            onPress={() => router.push('/(master)/wallet/cards')}
            className="flex-1 bg-white/20 py-3 rounded-2xl"
            activeOpacity={0.8}
          >
            <Text className="text-white font-semibold text-center">Карты</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
