import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authApiDirect } from '../../../services/authApi';
import { setCredentials } from '../authSlice';
import { LoadingSpinner } from '../../../components/LoadingSpinner';

const CODE_LENGTH = 6;

export const VerifyCodeScreen: React.FC = () => {
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const dispatch = useDispatch();
  const router = useRouter();
  const { phone, isRegistration } = useLocalSearchParams<{ phone: string; isRegistration?: string }>();

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    // Countdown timer for resend
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    
    // Handle paste
    if (text.length > 1) {
      const pastedCode = text.slice(0, CODE_LENGTH).split('');
      pastedCode.forEach((char, i) => {
        if (i < CODE_LENGTH) {
          newCode[i] = char;
        }
      });
      setCode(newCode);
      
      // Focus last filled input or submit
      const lastIndex = Math.min(pastedCode.length - 1, CODE_LENGTH - 1);
      if (pastedCode.length >= CODE_LENGTH) {
        handleSubmit(newCode.join(''));
      } else {
        inputRefs.current[lastIndex + 1]?.focus();
      }
      return;
    }

    // Handle single character
    newCode[index] = text;
    setCode(newCode);

    if (text && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (text && index === CODE_LENGTH - 1) {
      const fullCode = newCode.join('');
      if (fullCode.length === CODE_LENGTH) {
        handleSubmit(fullCode);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (submittedCode?: string) => {
    const codeToVerify = submittedCode || code.join('');
    
    if (codeToVerify.length !== CODE_LENGTH) {
      Alert.alert('Ошибка', 'Введите полный код');
      return;
    }

    setLoading(true);
    try {
      const response = await authApiDirect.verifyCode(phone!, codeToVerify);
      
      dispatch(setCredentials({
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken
      }));

      // Navigate based on user role
      if (response.user.role === 'MASTER') {
        router.replace('/(master)/home');
      } else {
        router.replace('/(client)/home');
      }
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Неверный код');
      setCode(Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;

    setLoading(true);
    try {
      await authApiDirect.requestCode(phone!);
      setResendTimer(60);
      Alert.alert('Успешно', 'Код отправлен повторно');
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось отправить код');
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
        <View className="flex-1 px-6 py-8">
          {/* Header */}
          <TouchableOpacity 
            onPress={() => router.back()}
            className="mb-6"
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>

          <Text className="text-3xl font-bold text-gray-900 mb-2">
            Введите код
          </Text>
          <Text className="text-gray-500 mb-8">
            Мы отправили SMS с кодом на номер{'\n'}
            <Text className="font-semibold text-gray-700">{phone}</Text>
          </Text>

          {/* Code Input */}
          <View className="flex-row justify-between mb-8">
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                value={digit}
                onChangeText={(text) => handleCodeChange(text.replace(/\D/g, ''), index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 ${
                  digit ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'
                }`}
              />
            ))}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={() => handleSubmit()}
            disabled={code.join('').length !== CODE_LENGTH}
            className={`py-4 rounded-xl items-center ${
              code.join('').length === CODE_LENGTH ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          >
            <Text className="text-white font-semibold text-lg">Подтвердить</Text>
          </TouchableOpacity>

          {/* Resend */}
          <View className="items-center mt-8">
            {resendTimer > 0 ? (
              <Text className="text-gray-500">
                Отправить повторно через {resendTimer} сек
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend}>
                <Text className="text-blue-500 font-semibold">
                  Отправить код повторно
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default VerifyCodeScreen;
