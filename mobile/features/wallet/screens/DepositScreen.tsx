import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCreateDepositMutation, useGetPaymentMethodsQuery } from '../../../services/walletApi';
import { AmountInput } from '../components/AmountInput';
import { PaymentMethodCard } from '../components/PaymentMethodCard';
import { LoadingSpinner } from '../../../components/LoadingSpinner';

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000];

export default function DepositScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState<number | null>(null);

  const { data: paymentMethods, isLoading: methodsLoading } = useGetPaymentMethodsQuery();
  const [createDeposit, { isLoading: isDepositing }] = useCreateDepositMutation();

  const handleDeposit = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      Alert.alert('Ошибка', 'Введите сумму пополнения');
      return;
    }

    if (numAmount < 100) {
      Alert.alert('Ошибка', 'Минимальная сумма пополнения 100 сом');
      return;
    }

    try {
      const result = await createDeposit({
        amount: numAmount,
        payment_method_id: selectedMethodId || undefined,
      }).unwrap();

      if (result.payment_url) {
        // Open payment URL in browser
        Alert.alert('Успешно', 'Перейдите по ссылке для оплаты');
      } else {
        Alert.alert('Успешно', 'Запрос на пополнение создан', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error: any) {
      Alert.alert('Ошибка', error?.data?.message || 'Не удалось создать запрос на пополнение');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Пополнение</Text>
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">Сумма</Text>
          <AmountInput
            value={amount}
            onChange={setAmount}
            currency="KGS"
            placeholder="0"
          />

          <View className="flex-row flex-wrap mt-3">
            {QUICK_AMOUNTS.map((quickAmount) => (
              <TouchableOpacity
                key={quickAmount}
                className="bg-gray-100 rounded-full px-4 py-2 mr-2 mb-2"
                onPress={() => setAmount(quickAmount.toString())}
              >
                <Text className="text-gray-700">{quickAmount} сом</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">Способ оплаты</Text>
          
          {methodsLoading ? (
            <LoadingSpinner />
          ) : paymentMethods && paymentMethods.length > 0 ? (
            paymentMethods.map((method) => (
              <PaymentMethodCard
                key={method.id}
                method={method}
                selected={selectedMethodId === method.id}
                onSelect={() => setSelectedMethodId(method.id)}
              />
            ))
          ) : (
            <View className="py-4 items-center">
              <Text className="text-gray-500 mb-2">Нет сохраненных способов оплаты</Text>
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => router.push('/wallet/cards' as any)}
              >
                <Ionicons name="add-circle-outline" size={20} color="#3B82F6" />
                <Text className="text-blue-500 ml-1">Добавить карту</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View className="bg-blue-50 rounded-2xl p-4">
          <View className="flex-row items-start">
            <Ionicons name="information-circle" size={24} color="#3B82F6" />
            <View className="flex-1 ml-3">
              <Text className="text-blue-900 font-semibold mb-1">Информация</Text>
              <Text className="text-blue-800 text-sm">
                Минимальная сумма пополнения: 100 сом{'\n'}
                Комиссия: 0%{'\n'}
                Зачисление: мгновенно
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="bg-white border-t border-gray-200 p-4">
        <TouchableOpacity
          className={`rounded-xl py-4 items-center ${isDepositing ? 'bg-gray-400' : 'bg-green-500'}`}
          onPress={handleDeposit}
          disabled={isDepositing}
        >
          {isDepositing ? (
            <LoadingSpinner size="small" />
          ) : (
            <Text className="text-white font-semibold text-base">Пополнить</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
