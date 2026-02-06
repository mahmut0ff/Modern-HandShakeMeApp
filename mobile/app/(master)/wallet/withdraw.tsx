import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { safeNavigate } from '../../../hooks/useNavigation';
import { 
  useGetWalletQuery, 
  useGetPaymentMethodsQuery, 
  useCreateWithdrawalMutation 
} from '../../../services/walletApi';
import { LoadingSpinner } from '../../../components/LoadingSpinner';

export default function WithdrawPage() {
  const [amount, setAmount] = useState('');
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // API hooks
  const { data: wallet, isLoading: walletLoading } = useGetWalletQuery();
  const { data: paymentMethods, isLoading: methodsLoading } = useGetPaymentMethodsQuery();
  const [createWithdrawal] = useCreateWithdrawalMutation();

  const availableBalance = parseFloat(wallet?.balance || '0');
  const minWithdraw = 1000;

  // Filter only card payment methods
  const cards = (paymentMethods || []).filter(m => m.method_type === 'card');

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount);
    
    if (!amount || withdrawAmount <= 0) {
      Alert.alert('Ошибка', 'Введите сумму для вывода');
      return;
    }

    if (withdrawAmount < minWithdraw) {
      Alert.alert('Ошибка', `Минимальная сумма для вывода: ${minWithdraw} сом`);
      return;
    }

    if (withdrawAmount > availableBalance) {
      Alert.alert('Ошибка', 'Недостаточно средств');
      return;
    }

    if (!selectedCard) {
      Alert.alert('Ошибка', 'Выберите карту для вывода');
      return;
    }

    setLoading(true);
    try {
      await createWithdrawal({
        amount: withdrawAmount,
        payment_method_id: selectedCard,
        description: 'Вывод средств на карту',
      }).unwrap();
      
      Alert.alert('Успех', 'Заявка на вывод средств принята!', [
        { text: 'OK', onPress: () => safeNavigate.back() }
      ]);
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      Alert.alert('Ошибка', error.data?.message || 'Не удалось создать заявку на вывод');
    } finally {
      setLoading(false);
    }
  };

  if (walletLoading || methodsLoading) {
    return <LoadingSpinner fullScreen text="Загрузка..." />;
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}>
        {/* Header */}
        <View className="flex-row items-center gap-4 mb-6">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 bg-white rounded-2xl items-center justify-center shadow-sm border border-gray-100"
          >
            <Ionicons name="arrow-back" size={20} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Вывод средств</Text>
        </View>

        {/* Balance */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="text-sm text-gray-500 mb-2">Доступно для вывода</Text>
          <Text className="text-3xl font-bold text-gray-900">{availableBalance.toLocaleString()} сом</Text>
        </View>

        {/* Amount */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="font-semibold text-gray-900 mb-4">Сумма вывода</Text>
          
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="Введите сумму"
            keyboardType="numeric"
            className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900 text-lg"
          />
          
          <Text className="text-sm text-gray-500 mt-2">
            Минимальная сумма: {minWithdraw.toLocaleString()} сом
          </Text>
          
          <View className="flex-row gap-2 mt-3">
            {[5000, 10000, 20000].map(preset => (
              <TouchableOpacity
                key={preset}
                onPress={() => setAmount(preset.toString())}
                className="flex-1 py-2 bg-gray-100 rounded-xl"
              >
                <Text className="text-center text-gray-700 font-medium">
                  {preset.toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Cards */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="font-semibold text-gray-900 mb-4">Выберите карту</Text>
          
          <View className="flex flex-col gap-3">
            {cards.length > 0 ? cards.map(card => (
              <TouchableOpacity
                key={card.id}
                onPress={() => setSelectedCard(card.id)}
                className={`p-4 rounded-2xl border ${
                  selectedCard === card.id
                    ? 'bg-[#0165FB]/10 border-[#0165FB]'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <View className="flex-row items-center gap-3">
                  <View className={`w-12 h-12 rounded-2xl items-center justify-center ${
                    card.provider?.toLowerCase().includes('visa') ? 'bg-blue-500' : 'bg-red-500'
                  }`}>
                    <Ionicons name="card" size={24} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900">{card.name}</Text>
                    <Text className="text-sm text-gray-500">{card.provider}</Text>
                  </View>
                  {selectedCard === card.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#0165FB" />
                  )}
                </View>
              </TouchableOpacity>
            )) : (
              <Text className="text-gray-500 text-center py-4">Нет сохранённых карт</Text>
            )}
            
            <TouchableOpacity 
              onPress={() => router.push('/(master)/wallet/cards/add')}
              className="p-4 rounded-2xl border border-dashed border-gray-300 items-center"
            >
              <Ionicons name="add" size={24} color="#6B7280" />
              <Text className="text-gray-600 font-medium mt-2">Добавить карту</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info */}
        <View className="bg-yellow-50 rounded-3xl p-5 border border-yellow-100 mb-6">
          <View className="flex-row items-start gap-3">
            <Ionicons name="information-circle" size={20} color="#F59E0B" />
            <View className="flex-1">
              <Text className="font-semibold text-yellow-900 mb-2">Информация о выводе</Text>
              <Text className="text-sm text-yellow-700">
                • Обработка заявки: 1-3 рабочих дня{'\n'}
                • Комиссия: 2% (мин. 50 сом){'\n'}
                • Время поступления: до 24 часов
              </Text>
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleWithdraw}
          disabled={loading || !amount || !selectedCard}
          className={`py-4 rounded-2xl shadow-lg ${
            loading || !amount || !selectedCard ? 'bg-gray-400' : 'bg-[#0165FB]'
          }`}
        >
          <Text className="text-center font-semibold text-white text-lg">
            {loading ? 'Обработка...' : 'Подать заявку на вывод'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}