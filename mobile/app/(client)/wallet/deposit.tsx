import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCreateDepositMutation } from '../../../services/walletApi';
import { safeNavigate } from '../../../hooks/useNavigation';

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

const PAYMENT_METHODS = [
  {
    id: 'card',
    name: 'Банковская карта',
    icon: 'card',
    description: 'Visa, MasterCard, МИР',
    fee: '0%'
  },
  {
    id: 'mobile',
    name: 'Мобильный платеж',
    icon: 'phone-portrait',
    description: 'Beeline, Megacom, O!',
    fee: '2%'
  },
  {
    id: 'wallet',
    name: 'Электронный кошелек',
    icon: 'wallet',
    description: 'Элсом, Мбанк',
    fee: '1%'
  }
];

export default function DepositPage() {
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  
  const [createDeposit] = useCreateDepositMutation();

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
  };

  const calculateFee = () => {
    const method = PAYMENT_METHODS.find(m => m.id === selectedMethod);
    if (!method || !amount) return 0;
    
    const feePercent = parseFloat(method.fee.replace('%', ''));
    return (parseFloat(amount) * feePercent) / 100;
  };

  const getTotalAmount = () => {
    const baseAmount = parseFloat(amount) || 0;
    const fee = calculateFee();
    return baseAmount + fee;
  };

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Ошибка', 'Введите корректную сумму');
      return;
    }

    if (parseFloat(amount) < 100) {
      Alert.alert('Ошибка', 'Минимальная сумма пополнения 100 сом');
      return;
    }

    setLoading(true);
    try {
      const result = await createDeposit({
        amount: parseFloat(amount),
        payment_method_type: selectedMethod as 'card' | 'bank_account' | 'mobile_money',
        return_url: 'handshake://wallet',
      }).unwrap();
      
      // If payment URL is returned, open it
      if (result.payment_url) {
        await Linking.openURL(result.payment_url);
        Alert.alert(
          'Перенаправление',
          'Вы будете перенаправлены на страницу оплаты',
          [{ text: 'OK', onPress: () => safeNavigate.back() }]
        );
      } else {
        Alert.alert(
          'Успех',
          `Пополнение на сумму ${amount} сом успешно выполнено`,
          [{ text: 'OK', onPress: () => safeNavigate.back() }]
        );
      }
    } catch (error: any) {
      console.error('Deposit error:', error);
      Alert.alert('Ошибка', error.data?.message || 'Не удалось выполнить пополнение');
    } finally {
      setLoading(false);
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
          <Text className="text-2xl font-bold text-gray-900">Пополнить кошелёк</Text>
        </View>

        {/* Amount Input */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-4">Сумма пополнения</Text>
          
          <View className="relative mb-4">
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              keyboardType="numeric"
              className="text-4xl font-bold text-center text-gray-900 py-4"
            />
            <Text className="text-center text-gray-500 text-lg">сом</Text>
          </View>

          {/* Quick Amount Buttons */}
          <View className="flex-row flex-wrap gap-2">
            {QUICK_AMOUNTS.map((quickAmount) => (
              <TouchableOpacity
                key={quickAmount}
                onPress={() => handleQuickAmount(quickAmount)}
                className={`flex-1 min-w-[70px] py-3 rounded-2xl border-2 ${
                  amount === quickAmount.toString()
                    ? 'bg-[#0165FB]/10 border-[#0165FB]'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <Text className={`text-center font-medium ${
                  amount === quickAmount.toString() ? 'text-[#0165FB]' : 'text-gray-700'
                }`}>
                  {quickAmount}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Payment Methods */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-4">Способ оплаты</Text>
          
          <View className="flex flex-col gap-2">
            {PAYMENT_METHODS.map((method) => (
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
                  </View>
                  <View className="items-end">
                    <Text className={`text-sm font-medium ${
                      method.fee === '0%' ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {method.fee === '0%' ? 'Без комиссии' : `Комиссия ${method.fee}`}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary */}
        {amount && parseFloat(amount) > 0 && (
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
            <Text className="text-lg font-bold text-gray-900 mb-4">Итого</Text>
            
            <View className="flex flex-col gap-3">
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Сумма пополнения:</Text>
                <Text className="font-semibold text-gray-900">{amount} сом</Text>
              </View>
              
              {calculateFee() > 0 && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Комиссия:</Text>
                  <Text className="font-semibold text-orange-600">{calculateFee().toFixed(2)} сом</Text>
                </View>
              )}
              
              <View className="border-t border-gray-200 pt-3">
                <View className="flex-row justify-between">
                  <Text className="text-lg font-bold text-gray-900">К оплате:</Text>
                  <Text className="text-lg font-bold text-[#0165FB]">{getTotalAmount().toFixed(2)} сом</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Info */}
        <View className="bg-blue-50 rounded-3xl p-5 border border-blue-200 mb-6">
          <View className="flex-row items-start gap-3">
            <Ionicons name="information-circle" size={24} color="#2563EB" />
            <View className="flex-1">
              <Text className="font-semibold text-blue-900 mb-2">Информация</Text>
              <Text className="text-sm text-blue-700 leading-5">
                • Минимальная сумма пополнения: 100 сом{'\n'}
                • Максимальная сумма: 100,000 сом{'\n'}
                • Средства поступят на счет в течение 5 минут{'\n'}
                • Комиссия зависит от выбранного способа оплаты
              </Text>
            </View>
          </View>
        </View>

        {/* Deposit Button */}
        <TouchableOpacity
          onPress={handleDeposit}
          disabled={!amount || parseFloat(amount) <= 0 || loading}
          className={`py-4 rounded-2xl shadow-lg mb-6 ${
            !amount || parseFloat(amount) <= 0 || loading
              ? 'bg-gray-300'
              : 'bg-[#0165FB]'
          }`}
        >
          <Text className="text-center font-semibold text-white text-lg">
            {loading ? 'Обработка...' : `Пополнить на ${getTotalAmount().toFixed(2)} сом`}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}