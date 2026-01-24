import React from 'react';
import { View, Text, TextInput } from 'react-native';

interface AmountInputProps {
  value: string;
  onChangeText: (text: string) => void;
  currency?: string;
  label?: string;
  placeholder?: string;
  minAmount?: number;
  maxAmount?: number;
  error?: string;
}

export function AmountInput({
  value,
  onChangeText,
  currency = 'KGS',
  label = 'Сумма',
  placeholder = '0',
  minAmount,
  maxAmount,
  error,
}: AmountInputProps) {
  const handleChange = (text: string) => {
    // Allow only numbers and one decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    
    if (parts.length > 2) {
      return; // Don't allow multiple decimal points
    }
    
    if (parts[1] && parts[1].length > 2) {
      return; // Don't allow more than 2 decimal places
    }
    
    onChangeText(cleaned);
  };

  return (
    <View className="mb-4">
      {label && (
        <Text className="text-gray-700 font-medium mb-2">{label}</Text>
      )}
      
      <View className={`flex-row items-center bg-gray-50 rounded-2xl px-4 py-3 border ${
        error ? 'border-red-300' : 'border-gray-200'
      }`}>
        <TextInput
          value={value}
          onChangeText={handleChange}
          placeholder={placeholder}
          keyboardType="decimal-pad"
          className="flex-1 text-2xl font-bold text-gray-900"
          placeholderTextColor="#9CA3AF"
        />
        <Text className="text-xl font-semibold text-gray-500 ml-2">
          {currency}
        </Text>
      </View>

      {(minAmount !== undefined || maxAmount !== undefined) && !error && (
        <Text className="text-sm text-gray-500 mt-1">
          {minAmount !== undefined && maxAmount !== undefined
            ? `Мин: ${minAmount} ${currency}  Макс: ${maxAmount.toLocaleString()} ${currency}`
            : minAmount !== undefined
            ? `Минимум: ${minAmount} ${currency}`
            : `Максимум: ${maxAmount?.toLocaleString()} ${currency}`
          }
        </Text>
      )}

      {error && (
        <Text className="text-sm text-red-600 mt-1">{error}</Text>
      )}
    </View>
  );
}
