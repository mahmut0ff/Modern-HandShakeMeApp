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
import {
  useGetWalletQuery,
  useCreateWithdrawalMutation,
  useGetPaymentMethodsQuery,
} from '../../../services/walletApi';
import { AmountInput } from '../components/AmountInput';
import { PaymentMethodCard } from '../components/PaymentMethodCard';
import { LoadingSpinner } from '../../../components/LoadingSpinner';

export default function WithdrawScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState<number | null>(null);

  const { data: wallet } = useGetWalletQuery();
  const { data: paymentMethods, isLoading: methodsLoading } = useGetPaymentMethodsQuery();
  const [createWithdrawal, { isLoading: isWithdrawing }] = useCreateWithdrawalMutation();

  const availableBalance = parseFloat(wallet?.balance || '0');

  const handleWithdraw = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      Alert.alert('Ошибка', 'Введите сумму вывода');
      return;
    }

    if (numAmount < 500) {
      Alert.alert('Ошибка', 'Минимальная сумма вывода 500 сом');
      return;
    }

    if (numAmount > availableBalance) {
      Alert.alert('Ошибка', 'Недостаточно средств');
      return;
    }

    if (!selectedMethodId) {
      Alert.alert('Ошибка', 'Выберите способ вывода');
      return;
    }

    try {
      await createWithdrawal({
        amount: numAmount,
        payment_method_id: selectedMethodId,
      }).unwrap();

      Alert.alert('Успешно', 'Запрос на вывод создан. Средства поступят в течение 1-3 рабочих дней.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Ошибка', error?.data?.message || 'Не удалось создать запрос на вывод');
    }
  };

  const handleWithdrawAll = () => {
    setAmount(availableBalance.toString());
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Вывод средств</Text>
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        <View className="bg-green-50 rounded-2xl p-4 mb-4">
          <Text className="text-green-800 text-sm">Доступно для вывода</Text>
          <Text className="text-green-900 text-2xl font-bold">
            {availableBalance.toLocaleString('ru-RU')} {wallet?.currency || 'KGS'}
          </Text>
        </View>

        <View className="bg-white rounded-2xl p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-semibold text-gray-900">Сумма</Text>
            <TouchableOpacity onPress={handleWithdrawAll}>
              <Text className="text-blue-500">Вывести всё</Text>
            </TouchableOpacity>
          </View>
          <AmountInput
            value={amount}
            onChange={setAmount}
            currency="KGS"
            placeholder="0"
            maxValue={availableBalance}
          />
        </View>

        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">Куда вывести</Text>
          
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
              <Text className="text-gray-500 mb-2">Добавьте способ вывода</Text>
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

        <View className="bg-yellow-50 rounded-2xl p-4">
          <View className="flex-row items-start">
            <Ionicons name="warning" size={24} color="#F59E0B" />
            <View className="flex-1 ml-3">
              <Text className="text-yellow-900 font-semibold mb-1">Важно</Text>
              <Text className="text-yellow-800 text-sm">
                Минимальная сумма вывода: 500 сом{'\n'}
                Комиссия: 1%{'\n'}
                Срок зачисления: 1-3 рабочих дня
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="bg-white border-t border-gray-200 p-4">
        <TouchableOpacity
          className={`rounded-xl py-4 items-center ${isWithdrawing ? 'bg-gray-400' : 'bg-blue-500'}`}
          onPress={handleWithdraw}
          disabled={isWithdrawing}
        >
          {isWithdrawing ? (
            <LoadingSpinner size="small" />
          ) : (
            <Text className="text-white font-semibold text-base">Вывести</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
