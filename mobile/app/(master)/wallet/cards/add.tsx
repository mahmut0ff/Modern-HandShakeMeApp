import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AddCardPage() {
  const [loading, setLoading] = useState(false);
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: '',
    bank: '',
    type: 'visa' as 'visa' | 'mastercard' | 'elcard'
  });

  const banks = [
    'Оптима Банк',
    'KICB',
    'Бакай Банк',
    'Айыл Банк',
    'Демир Банк',
    'Коммерческий банк Кыргызстан',
    'Другой банк'
  ];

  const formatCardNumber = (text: string) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    
    // Add spaces every 4 digits
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    
    // Limit to 19 characters (16 digits + 3 spaces)
    return formatted.substring(0, 19);
  };

  const formatExpiry = (text: string) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    
    // Add slash after 2 digits
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    
    return cleaned;
  };

  const detectCardType = (number: string) => {
    const cleaned = number.replace(/\s/g, '');
    
    if (cleaned.startsWith('4')) {
      return 'visa';
    } else if (cleaned.startsWith('5') || cleaned.startsWith('2')) {
      return 'mastercard';
    } else if (cleaned.startsWith('9')) {
      return 'elcard';
    }
    
    return 'visa';
  };

  const handleCardNumberChange = (text: string) => {
    const formatted = formatCardNumber(text);
    setCardData(prev => ({
      ...prev,
      number: formatted,
      type: detectCardType(formatted)
    }));
  };

  const handleExpiryChange = (text: string) => {
    const formatted = formatExpiry(text);
    setCardData(prev => ({ ...prev, expiry: formatted }));
  };

  const validateCard = () => {
    const cleanNumber = cardData.number.replace(/\s/g, '');
    
    if (cleanNumber.length < 16) {
      Alert.alert('Ошибка', 'Введите корректный номер карты');
      return false;
    }
    
    if (!cardData.expiry || cardData.expiry.length !== 5) {
      Alert.alert('Ошибка', 'Введите срок действия карты');
      return false;
    }
    
    if (!cardData.cvv || cardData.cvv.length < 3) {
      Alert.alert('Ошибка', 'Введите CVV код');
      return false;
    }
    
    if (!cardData.name.trim()) {
      Alert.alert('Ошибка', 'Введите имя держателя карты');
      return false;
    }
    
    // Validate expiry date
    const [month, year] = cardData.expiry.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    const cardYear = parseInt(year);
    const cardMonth = parseInt(month);
    
    if (cardMonth < 1 || cardMonth > 12) {
      Alert.alert('Ошибка', 'Неверный месяц');
      return false;
    }
    
    if (cardYear < currentYear || (cardYear === currentYear && cardMonth < currentMonth)) {
      Alert.alert('Ошибка', 'Карта просрочена');
      return false;
    }
    
    return true;
  };

  const handleAddCard = async () => {
    if (!validateCard()) {
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Успех',
        'Карта успешно добавлена',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось добавить карту');
    } finally {
      setLoading(false);
    }
  };

  const getCardIcon = () => {
    switch (cardData.type) {
      case 'visa':
        return { name: 'card', color: '#1A1F71' };
      case 'mastercard':
        return { name: 'card', color: '#EB001B' };
      case 'elcard':
        return { name: 'card', color: '#00A651' };
      default:
        return { name: 'card', color: '#6B7280' };
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
          <Text className="text-2xl font-bold text-gray-900">Добавить карту</Text>
        </View>

        {/* Card Preview */}
        <View className={`rounded-3xl p-6 mb-6 ${
          cardData.type === 'visa' ? 'bg-blue-600' :
          cardData.type === 'mastercard' ? 'bg-red-600' :
          cardData.type === 'elcard' ? 'bg-green-600' : 'bg-gray-600'
        }`}>
          <View className="flex-row justify-between items-start mb-8">
            <View className="w-12 h-8 bg-white/20 rounded"></View>
            <Text className="text-white font-bold text-lg">
              {cardData.type.toUpperCase()}
            </Text>
          </View>
          
          <Text className="text-white text-xl font-mono tracking-wider mb-6">
            {cardData.number || '•••• •••• •••• ••••'}
          </Text>
          
          <View className="flex-row justify-between items-end">
            <View>
              <Text className="text-white/70 text-xs mb-1">ВЛАДЕЛЕЦ КАРТЫ</Text>
              <Text className="text-white font-semibold">
                {cardData.name || 'ИМЯ ФАМИЛИЯ'}
              </Text>
            </View>
            <View>
              <Text className="text-white/70 text-xs mb-1">ДЕЙСТВУЕТ ДО</Text>
              <Text className="text-white font-semibold">
                {cardData.expiry || 'ММ/ГГ'}
              </Text>
            </View>
          </View>
        </View>

        {/* Form */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-4">Данные карты</Text>
          
          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Номер карты *</Text>
              <View className="relative">
                <TextInput
                  value={cardData.number}
                  onChangeText={handleCardNumberChange}
                  placeholder="1234 5678 9012 3456"
                  keyboardType="numeric"
                  maxLength={19}
                  className="w-full px-4 py-3 pr-12 bg-gray-50 rounded-2xl text-gray-900 font-mono"
                />
                <View className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Ionicons 
                    name={getCardIcon().name as any} 
                    size={24} 
                    color={getCardIcon().color} 
                  />
                </View>
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-2">Срок действия *</Text>
                <TextInput
                  value={cardData.expiry}
                  onChangeText={handleExpiryChange}
                  placeholder="ММ/ГГ"
                  keyboardType="numeric"
                  maxLength={5}
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900 font-mono"
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-2">CVV *</Text>
                <TextInput
                  value={cardData.cvv}
                  onChangeText={(text) => setCardData(prev => ({ ...prev, cvv: text.replace(/\D/g, '').substring(0, 4) }))}
                  placeholder="123"
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900 font-mono"
                />
              </View>
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Имя держателя карты *</Text>
              <TextInput
                value={cardData.name}
                onChangeText={(text) => setCardData(prev => ({ ...prev, name: text.toUpperCase() }))}
                placeholder="IVAN PETROV"
                autoCapitalize="characters"
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Банк</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {banks.map(bank => (
                    <TouchableOpacity
                      key={bank}
                      onPress={() => setCardData(prev => ({ ...prev, bank }))}
                      className={`px-4 py-2 rounded-full ${
                        cardData.bank === bank
                          ? 'bg-[#0165FB]'
                          : 'bg-gray-100'
                      }`}
                    >
                      <Text className={`text-sm font-medium ${
                        cardData.bank === bank ? 'text-white' : 'text-gray-700'
                      }`}>
                        {bank}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </View>

        {/* Security Info */}
        <View className="bg-yellow-50 rounded-3xl p-5 border border-yellow-100 mb-6">
          <View className="flex-row items-start gap-3">
            <Ionicons name="shield-checkmark" size={20} color="#F59E0B" />
            <View className="flex-1">
              <Text className="font-semibold text-yellow-900 mb-2">Безопасность</Text>
              <Text className="text-sm text-yellow-700">
                Данные вашей карты защищены 256-битным шифрованием и не передаются третьим лицам.
              </Text>
            </View>
          </View>
        </View>

        {/* Add Button */}
        <TouchableOpacity
          onPress={handleAddCard}
          disabled={loading}
          className={`py-4 rounded-2xl shadow-lg mb-6 ${
            loading ? 'bg-gray-400' : 'bg-[#0165FB]'
          }`}
        >
          <Text className="text-center font-semibold text-white text-lg">
            {loading ? 'Добавление...' : 'Добавить карту'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}