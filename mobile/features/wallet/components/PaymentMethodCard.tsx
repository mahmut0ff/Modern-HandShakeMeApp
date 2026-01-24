import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PaymentMethod } from '../../../services/walletApi';

interface PaymentMethodCardProps {
  method: PaymentMethod;
  selected?: boolean;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export function PaymentMethodCard({
  method,
  selected = false,
  onPress,
  onEdit,
  onDelete,
  showActions = false,
}: PaymentMethodCardProps) {
  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'card':
        return { name: 'card', color: '#3B82F6' };
      case 'bank_account':
        return { name: 'business', color: '#10B981' };
      case 'mobile_money':
        return { name: 'phone-portrait', color: '#F59E0B' };
      case 'crypto':
        return { name: 'logo-bitcoin', color: '#8B5CF6' };
      default:
        return { name: 'wallet', color: '#6B7280' };
    }
  };

  const getMethodLabel = (type: string) => {
    switch (type) {
      case 'card':
        return 'Банковская карта';
      case 'bank_account':
        return 'Банковский счёт';
      case 'mobile_money':
        return 'Мобильные деньги';
      case 'crypto':
        return 'Криптовалюта';
      default:
        return 'Способ оплаты';
    }
  };

  const getMaskedDetails = () => {
    if (method.method_type === 'card' && method.details.last4) {
      return `**** **** **** ${method.details.last4}`;
    }
    if (method.method_type === 'bank_account' && method.details.account_number) {
      const account = method.details.account_number;
      return `****${account.slice(-4)}`;
    }
    if (method.method_type === 'mobile_money' && method.details.phone) {
      const phone = method.details.phone;
      return `+***${phone.slice(-4)}`;
    }
    return method.name;
  };

  const icon = getMethodIcon(method.method_type);

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`bg-white rounded-2xl p-4 shadow-sm border ${
        selected ? 'border-blue-500' : 'border-gray-100'
      } mb-3`}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View className="flex-row items-center gap-4">
        {/* Icon */}
        <View className="w-12 h-12 bg-gray-100 rounded-2xl items-center justify-center">
          <Ionicons name={icon.name as any} size={24} color={icon.color} />
        </View>

        {/* Content */}
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="font-semibold text-gray-900">
              {method.name}
            </Text>
            {method.is_default && (
              <View className="bg-blue-100 px-2 py-0.5 rounded-full">
                <Text className="text-xs font-medium text-blue-700">По умолчанию</Text>
              </View>
            )}
            {method.is_verified && (
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            )}
          </View>
          <Text className="text-sm text-gray-600">{getMaskedDetails()}</Text>
          <Text className="text-xs text-gray-400 mt-0.5">
            {getMethodLabel(method.method_type)} • {method.provider}
          </Text>
        </View>

        {/* Actions or Selection */}
        {showActions ? (
          <View className="flex-row gap-2">
            {onEdit && (
              <TouchableOpacity
                onPress={onEdit}
                className="w-8 h-8 items-center justify-center"
              >
                <Ionicons name="create-outline" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                onPress={onDelete}
                className="w-8 h-8 items-center justify-center"
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        ) : selected ? (
          <View className="w-6 h-6 bg-blue-500 rounded-full items-center justify-center">
            <Ionicons name="checkmark" size={16} color="white" />
          </View>
        ) : (
          <View className="w-6 h-6 border-2 border-gray-300 rounded-full" />
        )}
      </View>
    </TouchableOpacity>
  );
}
