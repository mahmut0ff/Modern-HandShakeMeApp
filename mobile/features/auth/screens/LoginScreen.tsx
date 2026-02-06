import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authApiDirect } from '../../../services/authApi';
import { setCredentials } from '../authSlice';
import { LoadingSpinner } from '../../../components/LoadingSpinner';

export const LoginScreen: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();

  const formatPhone = (text: string) => {
    // Remove all non-digits
    const digits = text.replace(/\D/g, '');
    
    // Format as +996 XXX XXX XXX
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    } else if (digits.length <= 9) {
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    } else {
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9, 12)}`;
    }
  };

  const handlePhoneChange = (text: string) => {
    setPhone(formatPhone(text));
  };

  const handleSubmit = async () => {
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length < 9) {
      Alert.alert('Ошибка', 'Введите корректный номер телефона');
      return;
    }

    setLoading(true);
    try {
      const fullPhone = cleanPhone.startsWith('996') ? `+${cleanPhone}` : `+996${cleanPhone}`;
      await authApiDirect.requestCode(fullPhone);
      
      router.push({
        pathname: '/(auth)/verify',
        params: { phone: fullPhone }
      });
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось отправить код');
    } finally {
      setLoading(false);
    }
  };

  const handleTelegramLogin = async () => {
    // Open Telegram bot for authentication
    Alert.alert(
      'Вход через Telegram',
      'Откройте бота @HandShakeMeBot в Telegram и следуйте инструкциям',
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 px-6 justify-center">
          {/* Logo */}
          <View className="items-center mb-10">
            <View className="w-20 h-20 bg-blue-500 rounded-2xl items-center justify-center mb-4">
              <Ionicons name="hand-left" size={40} color="white" />
            </View>
            <Text className="text-3xl font-bold text-gray-900">HandShakeMe</Text>
            <Text className="text-gray-500 mt-2">Найдите мастера или станьте им</Text>
          </View>

          {/* Phone Input */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Номер телефона
            </Text>
            <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
              <Text className="text-lg text-gray-600 mr-2">+996</Text>
              <TextInput
                value={phone}
                onChangeText={handlePhoneChange}
                placeholder="XXX XXX XXX"
                keyboardType="phone-pad"
                maxLength={13}
                className="flex-1 text-lg text-gray-900"
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={phone.replace(/\D/g, '').length < 9}
            className={`py-4 rounded-xl items-center ${
              phone.replace(/\D/g, '').length >= 9 ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          >
            <Text className="text-white font-semibold text-lg">Получить код</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center my-8">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="mx-4 text-gray-500">или</Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          {/* Telegram Login */}
          <TouchableOpacity
            onPress={handleTelegramLogin}
            className="flex-row items-center justify-center py-4 rounded-xl bg-[#0088cc]"
          >
            <Ionicons name="paper-plane" size={24} color="white" />
            <Text className="text-white font-semibold text-lg ml-2">
              Войти через Telegram
            </Text>
          </TouchableOpacity>

          {/* Register Link */}
          <View className="flex-row justify-center mt-8">
            <Text className="text-gray-600">Нет аккаунта? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text className="text-blue-500 font-semibold">Зарегистрироваться</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
