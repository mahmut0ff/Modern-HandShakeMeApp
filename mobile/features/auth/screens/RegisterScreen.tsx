import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authApiDirect } from '../../../services/authApi';
import { LoadingSpinner } from '../../../components/LoadingSpinner';

type UserRole = 'CLIENT' | 'MASTER';

export const RegisterScreen: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<UserRole>('CLIENT');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const formatPhone = (text: string) => {
    const digits = text.replace(/\D/g, '');
    
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

  const isFormValid = () => {
    return (
      phone.replace(/\D/g, '').length >= 9 &&
      firstName.trim().length >= 2 &&
      lastName.trim().length >= 2
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      Alert.alert('Ошибка', 'Заполните все поля корректно');
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const fullPhone = cleanPhone.startsWith('996') ? `+${cleanPhone}` : `+996${cleanPhone}`;
      
      await authApiDirect.register({
        phone: fullPhone,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role
      });
      
      router.push({
        pathname: '/(auth)/verify',
        params: { phone: fullPhone, isRegistration: 'true' }
      });
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось зарегистрироваться');
    } finally {
      setLoading(false);
    }
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
        <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 px-6 py-8">
            {/* Header */}
            <TouchableOpacity 
              onPress={() => router.back()}
              className="mb-6"
            >
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>

            <Text className="text-3xl font-bold text-gray-900 mb-2">
              Регистрация
            </Text>
            <Text className="text-gray-500 mb-8">
              Создайте аккаунт для начала работы
            </Text>

            {/* Role Selection */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-3">
                Я хочу
              </Text>
              <View className="flex-row space-x-3">
                <TouchableOpacity
                  onPress={() => setRole('CLIENT')}
                  className={`flex-1 py-4 rounded-xl border-2 items-center ${
                    role === 'CLIENT' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <Ionicons 
                    name="search" 
                    size={28} 
                    color={role === 'CLIENT' ? '#3B82F6' : '#9CA3AF'} 
                  />
                  <Text className={`mt-2 font-medium ${
                    role === 'CLIENT' ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    Найти мастера
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setRole('MASTER')}
                  className={`flex-1 py-4 rounded-xl border-2 items-center ${
                    role === 'MASTER' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <Ionicons 
                    name="construct" 
                    size={28} 
                    color={role === 'MASTER' ? '#3B82F6' : '#9CA3AF'} 
                  />
                  <Text className={`mt-2 font-medium ${
                    role === 'MASTER' ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    Стать мастером
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Name Inputs */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Имя</Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Введите имя"
                className="bg-gray-100 rounded-xl px-4 py-3 text-lg text-gray-900"
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Фамилия</Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Введите фамилию"
                className="bg-gray-100 rounded-xl px-4 py-3 text-lg text-gray-900"
              />
            </View>

            {/* Phone Input */}
            <View className="mb-8">
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
              disabled={!isFormValid()}
              className={`py-4 rounded-xl items-center ${
                isFormValid() ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <Text className="text-white font-semibold text-lg">
                Зарегистрироваться
              </Text>
            </TouchableOpacity>

            {/* Login Link */}
            <View className="flex-row justify-center mt-6">
              <Text className="text-gray-600">Уже есть аккаунт? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text className="text-blue-500 font-semibold">Войти</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;
