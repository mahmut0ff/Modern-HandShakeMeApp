import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const WITHDRAWAL_METHODS = [
  {
    id: 'card',
    name: 'На банковскую карту',
    icon: 'card',
    description: 'Visa, MasterCard, МИР',
    fee: '2%',
    minAmount: 500,
    processingTime: '1-3 рабочих дня'
  },
  {
    id: 'mobile',
    name: 'На мобильный счет',
    icon: 'phone-portrait',
    description: 'Beeline, Megacom, O!',
    fee: '3%',
    minAmount: 100,
    processingTime: 'До 30 минут'
  },
  {
    id: 'wallet',
    name: 'На электронный кошелек',
    icon: 'wallet',
    description: 'Элсом, Мбанк',
    fee: '1.5%',
    minAmount: 200,
    processingTime: 'До 1 часа'
  }
];

export default function WithdrawPage() {
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);

  // TODO: Replace with actual API call
  const availableBalance = 0;

  const selectedMethodData = WITHDRAWAL_METHODS.find(m => m.id === selectedMethod);

  const calculateFee = () => {
    if (!selectedMethodData || !amount) return 0;
    const feePercent = parseFloat(selectedMethodData.fee.replace('%', ''));
    return (parseFloat(amount) * feePercent) / 100;
  };

  const getReceiveAmount = () => {
    const baseAmount = parseFloat(amount) || 0;
    const fee = calculateFee();
    return baseAmount - fee;
  };

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Ошибка', 'Введите корректную сумму');
      return;
    }

    if (!selectedMethodData) return;

    if (parseFloat(amount) < selectedMethodData.minAmount) {
      Alert.alert('Ошибка', `Минимальная сумма вывода: ${selectedMethodData.minAmount} сом`);
      return;
    }

    if (parseFloat(amount) > availableBalance) {
      Alert.alert('Ошибка', 'Недостаточно средств на балансе');
      return;
    }

    if (!accountNumber.trim()) {
      Alert.alert('Ошибка', 'Введите номер счета/карты');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement withdrawal processing
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      Alert.alert(
        'Заявка принята',
        `Заявка на вывод ${amount} сом создана. Средства поступят в течение ${selectedMethodData.processingTime.toLowerCase()}`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось создать заявку на вывод');
    } finally {
      setLoading(false);
    }
  };

  const getAccountPlaceholder = () => {
    switch (selectedMethod) {
      case 'card':
        return '1234 5678 9012 3456';
      case 'mobile':
        return '+996 700 123 456';
      case 'wallet':
        return 'Номер кошелька';
      default:
        return 'Номер счета';
    }
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
          <Text className="text-2xl font-bold text-gray-900">Вывод средств</Text>
        </View>

        {/* Balance Info */}
        <View className="bg-[#0165FB] rounded-3xl p-5 text-white shadow-lg mb-4">
          <Text className="text-white/70 text-sm mb-1">Доступно для вывода</Text>
          <Text className="text-3xl font-bold text-white">{availableBalance.toLocaleString()} сом</Text>
        </View>

        {/* Withdrawal Methods */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-4">Способ вывода</Text>
          
          <View className="flex flex-col gap-2">
            {WITHDRAWAL_METHODS.map((method) => (
              <TouchableOpacity
                key={method.id}
                onPress={() => setSelectedMethod(method.id)}
                className={`p-4 rounded-2xl border-2 ${
                  selectedMethod === method.id
                    ? 'bg-[#0165FB]/5 border-[#0165FB]'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <View className="flex-row items-center gap-3">
                  <View className={`w-12 h-12 rounded-2xl items-center justify-center ${
                    selectedMethod === method.id ? 'bg-[#0165FB]' : 'bg-gray-300'
                  }`}>
                    <Ionicons 
                      name={method.icon as any} 
                      size={24} 
                      color={selectedMethod === method.id ? 'white' : '#6B7280'} 
                    />
                  </View>
                  <View className="flex-1">
                    <Text className={`font-semibold ${
                      selectedMethod === method.id ? 'text-[#0165FB]' : 'text-gray-900'
                    }`}>
                      {method.name}
                    </Text>
                    <Text className="text-sm text-gray-500">{method.description}</Text>
                    <Text className="text-xs text-gray-400 mt-1">{method.processingTime}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-sm font-medium text-orange-600">
                      Комиссия {method.fee}
                    </Text>
                    <Text className="text-xs text-gray-400">
                      Мин. {method.minAmount} сом
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Account Details */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-4">Реквизиты</Text>
          
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              {selectedMethod === 'card' ? 'Номер карты' : 
               selectedMethod === 'mobile' ? 'Номер телефона' : 
               'Номер кошелька'}
            </Text>
            <TextInput
              value={accountNumber}
              onChangeText={setAccountNumber}
              placeholder={getAccountPlaceholder()}
              keyboardType={selectedMethod === 'mobile' ? 'phone-pad' : 'default'}
              className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-gray-900"
            />
          </View>
        </View>

        {/* Amount Input */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-4">Сумма вывода</Text>
          
          <View className="relative mb-4">
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              keyboardType="numeric"
              className="text-3xl font-bold text-center text-gray-900 py-4"
            />
            <Text className="text-center text-gray-500 text-lg">сом</Text>
          </View>

          {selectedMethodData && (
            <Text className="text-sm text-gray-500 text-center">
              Минимальная сумма: {selectedMethodData.minAmount} сом
            </Text>
          )}
        </View>

        {/* Summary */}
        {amount && parseFloat(amount) > 0 && selectedMethodData && (
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
            <Text className="text-lg font-bold text-gray-900 mb-4">Детали операции</Text>
            
            <View className="flex flex-col gap-3">
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Сумма вывода:</Text>
                <Text className="font-semibold text-gray-900">{amount} сом</Text>
              </View>
              
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Комиссия ({selectedMethodData.fee}):</Text>
                <Text className="font-semibold text-red-600">-{calculateFee().toFixed(2)} сом</Text>
              </View>
              
              <View className="border-t border-gray-200 pt-3">
                <View className="flex-row justify-between">
                  <Text className="text-lg font-bold text-gray-900">К получению:</Text>
                  <Text className="text-lg font-bold text-[#0165FB]">{getReceiveAmount().toFixed(2)} сом</Text>
                </View>
              </View>
              
              <View className="bg-gray-50 p-3 rounded-2xl mt-3">
                <Text className="text-sm text-gray-600">
                  Время поступления: {selectedMethodData.processingTime}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Warning */}
        <View className="bg-amber-50 rounded-3xl p-5 border border-amber-200 mb-6">
          <View className="flex-row items-start gap-3">
            <Ionicons name="warning" size={24} color="#D97706" />
            <View className="flex-1">
              <Text className="font-semibold text-amber-900 mb-2">Важно</Text>
              <Text className="text-sm text-amber-800 leading-5">
                • Проверьте правильность введенных реквизитов{'\n'}
                • Операция не может быть отменена после подтверждения{'\n'}
                • Комиссия удерживается с суммы вывода{'\n'}
                • Время поступления зависит от выбранного способа
              </Text>
            </View>
          </View>
        </View>

        {/* Withdraw Button */}
        <TouchableOpacity
          onPress={handleWithdraw}
          disabled={
            !amount || 
            parseFloat(amount) <= 0 || 
            !accountNumber.trim() || 
            loading ||
            (selectedMethodData && parseFloat(amount) < selectedMethodData.minAmount) ||
            parseFloat(amount) > availableBalance
          }
          className={`py-4 rounded-2xl shadow-lg mb-6 ${
            !amount || 
            parseFloat(amount) <= 0 || 
            !accountNumber.trim() || 
            loading ||
            (selectedMethodData && parseFloat(amount) < selectedMethodData.minAmount) ||
            parseFloat(amount) > availableBalance
              ? 'bg-gray-300'
              : 'bg-[#0165FB]'
          }`}
        >
          <Text className="text-center font-semibold text-white text-lg">
            {loading ? 'Обработка...' : 'Создать заявку на вывод'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}