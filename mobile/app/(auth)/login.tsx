import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Animated } from 'react-native'
import { Link, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useAppDispatch } from '../../hooks/redux'
import { setCredentials } from '../../features/auth/authSlice'
import { useLoginMutation, useVerifyPhoneMutation, useResendVerificationMutation } from '../../services/authApi'

export default function LoginPage() {
  const dispatch = useAppDispatch()
  const [formData, setFormData] = useState({
    phone: '+996',
  })
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'phone' | 'verify'>('phone')
  const [verificationCode, setVerificationCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // RTK Query mutations
  const [login, { isLoading: isLoginLoading }] = useLoginMutation()
  const [verifyPhone, { isLoading: isVerifyLoading }] = useVerifyPhoneMutation()
  const [resendVerification, { isLoading: isResendLoading }] = useResendVerificationMutation()

  const handlePhoneChange = (value: string) => {
    // Ensure phone always starts with +996
    let phoneValue = value
    if (!phoneValue.startsWith('+996')) {
      phoneValue = '+996' + phoneValue.replace(/^\+?996?/, '')
    }
    // Remove any non-digit characters except +
    phoneValue = '+996' + phoneValue.slice(4).replace(/\D/g, '')
    // Limit to +996 + 9 digits
    if (phoneValue.length > 13) {
      phoneValue = phoneValue.slice(0, 13)
    }
    setFormData({ ...formData, phone: phoneValue })
    setError(null)
  }

  const validatePhone = () => {
    if (!formData.phone || formData.phone === '+996') {
      setError('Номер телефона обязателен')
      return false
    }
    if (!/^\+996\d{9}$/.test(formData.phone)) {
      setError('Неверный формат номера телефона КР (+996XXXXXXXXX)')
      return false
    }
    return true
  }

  const validateCode = () => {
    if (!verificationCode) {
      setError('Код подтверждения обязателен')
      return false
    }
    if (!/^\d{4}$/.test(verificationCode)) {
      setError('Код должен содержать 4 цифры')
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    setError(null)
    setIsLoading(true)

    try {
      if (step === 'phone') {
        if (!validatePhone()) return

        // Send login request to API
        const result = await login({ phone: formData.phone }).unwrap()
        
        setStep('verify')
        Alert.alert(
          'SMS отправлен', 
          'Введите код подтверждения из SMS',
          [{ text: 'OK' }]
        )
      } else {
        if (!validateCode()) return

        // Verify phone with API
        const result = await verifyPhone({ 
          phone: formData.phone, 
          code: verificationCode 
        }).unwrap()
        
        dispatch(setCredentials({
          user: result.user,
          accessToken: result.tokens.access,
          refreshToken: result.tokens.refresh,
        }))

        // Navigate based on role
        if (result.user.role === 'master' || result.user.role === 'admin') {
          router.replace('/(master)/dashboard')
        } else {
          router.replace('/(client)/dashboard')
        }
      }
    } catch (err: any) {
      console.error('Login error:', err)
      if (err.data?.message) {
        setError(err.data.message)
      } else if (err.message) {
        setError(err.message)
      } else {
        setError('Произошла ошибка. Попробуйте позже.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    try {
      setIsLoading(true)
      await resendVerification({ phone: formData.phone }).unwrap()
      setError(null)
      Alert.alert('Успешно', 'Код отправлен повторно')
    } catch (err: any) {
      console.error('Resend error:', err)
      setError(err.data?.message || 'Ошибка повторной отправки SMS.')
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 'verify') {
    return (
      <View className="flex-1 bg-blue-500">
        <StatusBar style="light" />
        
        {/* Animated Background */}
        <View className="absolute inset-0">
          <View className="absolute top-10 left-5 w-32 h-32 bg-white/10 rounded-full" />
          <View className="absolute top-32 right-12 w-24 h-24 bg-white/15 rounded-full" />
          <View className="absolute bottom-24 left-16 w-40 h-40 bg-white/8 rounded-full" />
          <View className="absolute bottom-16 right-8 w-28 h-28 bg-white/12 rounded-full" />
        </View>
        
        <ScrollView className="flex-1 px-4 pt-16" showsVerticalScrollIndicator={false}>
          <View className="bg-white rounded-3xl p-8 mt-8">
            <View className="items-center mb-8">
              <View className="w-20 h-20 bg-blue-500 rounded-3xl items-center justify-center mb-6">
                <Ionicons name="chatbubble" size={32} color="white" />
              </View>
              <Text className="text-3xl font-bold text-gray-900 mb-3 text-center">Подтверждение входа</Text>
              <Text className="text-gray-600 text-center">
                Мы отправили 4-значный код на номер{'\n'}
                <Text className="font-semibold text-blue-600">{formData.phone}</Text>
              </Text>
            </View>
            
            {error && (
              <View className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex-row items-center gap-3">
                <Ionicons name="alert-circle" size={20} color="#DC2626" />
                <Text className="text-red-600 text-sm flex-1">{error}</Text>
              </View>
            )}

            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-3">
                Код подтверждения
              </Text>
              <TextInput
                value={verificationCode}
                onChangeText={(text) => {
                  setVerificationCode(text)
                  setError(null)
                }}
                maxLength={4}
                keyboardType="numeric"
                className="w-full rounded-2xl border-2 border-gray-200 bg-gray-50 px-6 py-4 text-gray-900 text-center text-3xl font-bold tracking-widest"
                placeholder="0000"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isLoading || isLoginLoading}
              className={`w-full py-4 px-6 rounded-2xl mb-6 ${
                isLoading || isLoginLoading ? 'bg-gray-400' : 'bg-blue-500'
              }`}
            >
              <Text className="text-white font-bold text-lg text-center">
                {isLoading || isLoginLoading ? 'Проверка кода...' : 'Войти'}
              </Text>
            </TouchableOpacity>

            <View className="items-center gap-4">
              <TouchableOpacity 
                onPress={handleResendCode}
                disabled={isResendLoading}
              >
                <Text className="text-blue-500 font-semibold text-sm">
                  {isResendLoading ? 'Отправка...' : 'Отправить код повторно'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setStep('phone')}>
                <Text className="text-gray-600 font-medium text-sm">
                  ← Изменить номер телефона
                </Text>
              </TouchableOpacity>
            </View>

            <Text className="mt-8 text-center text-sm text-gray-600">
              Нет аккаунта?{' '}
              <Link href="/(auth)/register" asChild>
                <Text className="text-blue-500 font-semibold">Зарегистрироваться</Text>
              </Link>
            </Text>
          </View>
        </ScrollView>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-blue-500">
      <StatusBar style="light" />
      
      {/* Animated Background */}
      <View className="absolute inset-0">
        <View className="absolute top-10 left-5 w-32 h-32 bg-white/10 rounded-full" />
        <View className="absolute top-32 right-12 w-24 h-24 bg-white/15 rounded-full" />
        <View className="absolute bottom-24 left-16 w-40 h-40 bg-white/8 rounded-full" />
        <View className="absolute bottom-16 right-8 w-28 h-28 bg-white/12 rounded-full" />
      </View>
      
      <ScrollView className="flex-1 px-4 pt-16" showsVerticalScrollIndicator={false}>
        <View className="bg-white rounded-3xl p-8 mt-8">
          {/* Logo */}
          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-blue-500 rounded-3xl items-center justify-center mb-6">
              <Text className="text-4xl">🤝</Text>
            </View>
            <Text className="text-3xl font-bold text-gray-900 mb-3 text-center">Добро пожаловать!</Text>
            <Text className="text-gray-600 text-center">Войдите по номеру телефона КР</Text>
          </View>
          
          {error && (
            <View className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex-row items-center gap-3">
              <Ionicons name="alert-circle" size={20} color="#DC2626" />
              <Text className="text-red-600 text-sm flex-1">{error}</Text>
            </View>
          )}

          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-700 mb-3">
              Номер телефона КР
            </Text>
            <View className="relative">
              <View className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                <Ionicons name="call" size={20} color="#9CA3AF" />
              </View>
              <TextInput
                value={formData.phone}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                className="w-full rounded-2xl border-2 border-gray-200 bg-gray-50 pl-12 pr-4 py-4 text-gray-900"
                placeholder="+996XXXXXXXXX"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading || isLoginLoading}
            className={`w-full py-4 px-6 rounded-2xl mb-6 ${
              isLoading || isLoginLoading ? 'bg-gray-400' : 'bg-blue-500'
            }`}
          >
            <View className="flex-row items-center justify-center gap-2">
              <Text className="text-white font-bold text-lg">
                {isLoading || isLoginLoading ? 'Отправка SMS...' : 'Получить SMS код'}
              </Text>
              {!isLoading && !isLoginLoading && <Ionicons name="arrow-forward" size={20} color="white" />}
            </View>
          </TouchableOpacity>

          <Text className="text-center text-sm text-gray-600">
            Нет аккаунта?{' '}
            <Link href="/(auth)/register" asChild>
              <Text className="text-blue-500 font-semibold">Зарегистрироваться</Text>
            </Link>
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}