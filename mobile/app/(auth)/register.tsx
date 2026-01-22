import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native'
import { Link, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useAppDispatch } from '../../hooks/redux'
import { setCredentials } from '../../features/auth/authSlice'
import { useRegisterMutation, useVerifyPhoneMutation, useResendVerificationMutation } from '../../services/authApi'

type Role = 'client' | 'master'

export default function RegisterPage() {
  const dispatch = useAppDispatch()
  const [formData, setFormData] = useState({
    phone: '+996',
    first_name: '',
    last_name: '',
    role: 'client' as Role,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [step, setStep] = useState<'phone' | 'verify'>('phone')
  const [verificationCode, setVerificationCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // RTK Query mutations
  const [register, { isLoading: isRegisterLoading }] = useRegisterMutation()
  const [verifyPhone, { isLoading: isVerifyLoading }] = useVerifyPhoneMutation()
  const [resendVerification, { isLoading: isResendLoading }] = useResendVerificationMutation()

  const handleChange = (name: string, value: string) => {
    if (name === 'phone') {
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
      setFormData({ ...formData, [name]: phoneValue })
    } else {
      setFormData({ ...formData, [name]: value })
    }
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' })
    }
    setGeneralError(null)
  }

  const handleRoleChange = (role: Role) => {
    setFormData({ ...formData, role })
  }

  const validatePhoneForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.phone || formData.phone === '+996') {
      newErrors.phone = 'Номер телефона обязателен'
    } else if (!/^\+996\d{9}$/.test(formData.phone)) {
      newErrors.phone = 'Неверный формат номера телефона КР (+996XXXXXXXXX)'
    }
    
    if (!formData.first_name) {
      newErrors.first_name = 'Имя обязательно'
    }
    
    if (!formData.last_name) {
      newErrors.last_name = 'Фамилия обязательна'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateVerificationCode = () => {
    const newErrors: Record<string, string> = {}
    
    if (!verificationCode) {
      newErrors.code = 'Код подтверждения обязателен'
    } else if (!/^\d{4}$/.test(verificationCode)) {
      newErrors.code = 'Код должен содержать 4 цифры'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    setGeneralError(null)
    setIsLoading(true)

    try {
      if (step === 'phone') {
        if (!validatePhoneForm()) return

        // Send registration request to API
        const result = await register({
          phone: formData.phone,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role
        }).unwrap()
        
        setStep('verify')
        Alert.alert('SMS отправлен', 'Введите код подтверждения из SMS')
      } else {
        if (!validateVerificationCode()) return

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

        if (formData.role === 'master') {
          router.replace('/(master)/dashboard')
        } else {
          router.replace('/(client)/dashboard')
        }
      }
    } catch (err: any) {
      console.error('Registration error:', err)
      if (err.data?.message) {
        setGeneralError(err.data.message)
      } else if (err.message) {
        setGeneralError(err.message)
      } else {
        setGeneralError('Произошла ошибка. Попробуйте позже.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    try {
      setIsLoading(true)
      await resendVerification({ phone: formData.phone }).unwrap()
      setGeneralError(null)
      Alert.alert('Успешно', 'Код отправлен повторно')
    } catch (err: any) {
      console.error('Resend error:', err)
      setGeneralError(err.data?.message || 'Ошибка повторной отправки SMS.')
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
              <Text className="text-3xl font-bold text-gray-900 mb-3 text-center">Подтверждение</Text>
              <Text className="text-gray-600 text-center">
                Мы отправили 4-значный код на номер{'\n'}
                <Text className="font-semibold text-blue-600">{formData.phone}</Text>
              </Text>
            </View>
            
            {generalError && (
              <View className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex-row items-center gap-3">
                <Ionicons name="alert-circle" size={20} color="#DC2626" />
                <Text className="text-red-600 text-sm flex-1">{generalError}</Text>
              </View>
            )}

            {errors.code && (
              <View className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex-row items-center gap-3">
                <Ionicons name="alert-circle" size={20} color="#DC2626" />
                <Text className="text-red-600 text-sm flex-1">{errors.code}</Text>
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
                  setErrors({ ...errors, code: '' })
                  setGeneralError(null)
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
              disabled={isLoading || isVerifyLoading}
              className={`w-full py-4 px-6 rounded-2xl mb-6 ${
                isLoading || isVerifyLoading ? 'bg-gray-400' : 'bg-blue-500'
              }`}
            >
              <View className="flex-row items-center justify-center gap-2">
                <Text className="text-white font-bold text-lg">
                  {isLoading || isVerifyLoading ? 'Проверка кода...' : 'Завершить регистрацию'}
                </Text>
                {!isLoading && !isVerifyLoading && <Ionicons name="checkmark-circle" size={20} color="white" />}
              </View>
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
              Уже есть аккаунт?{' '}
              <Link href="/(auth)/login" asChild>
                <Text className="text-blue-500 font-semibold">Войти</Text>
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
            <Text className="text-3xl font-bold text-gray-900 mb-3 text-center">Регистрация</Text>
            <Text className="text-gray-600 text-center">Создайте аккаунт для начала работы</Text>
          </View>
          
          {generalError && (
            <View className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex-row items-center gap-3">
              <Ionicons name="alert-circle" size={20} color="#DC2626" />
              <Text className="text-red-600 text-sm flex-1">{generalError}</Text>
            </View>
          )}

          {/* Role Selection */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-700 mb-3">
              Выберите роль
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => handleRoleChange('client')}
                className={`flex-1 p-4 rounded-2xl border-2 items-center ${
                  formData.role === 'client'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <Ionicons 
                  name="person" 
                  size={24} 
                  color={formData.role === 'client' ? '#3B82F6' : '#6B7280'} 
                />
                <Text className={`font-semibold text-sm mt-2 ${
                  formData.role === 'client' ? 'text-blue-500' : 'text-gray-700'
                }`}>
                  Клиент
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => handleRoleChange('master')}
                className={`flex-1 p-4 rounded-2xl border-2 items-center ${
                  formData.role === 'master'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <Ionicons 
                  name="construct" 
                  size={24} 
                  color={formData.role === 'master' ? '#3B82F6' : '#6B7280'} 
                />
                <Text className={`font-semibold text-sm mt-2 ${
                  formData.role === 'master' ? 'text-blue-500' : 'text-gray-700'
                }`}>
                  Мастер
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Phone Number */}
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
                onChangeText={(value) => handleChange('phone', value)}
                keyboardType="phone-pad"
                className={`w-full rounded-2xl border-2 bg-gray-50 pl-12 pr-4 py-4 text-gray-900 ${
                  errors.phone ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="+996XXXXXXXXX"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            {errors.phone && (
              <View className="mt-2 flex-row items-center gap-1">
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text className="text-sm text-red-600">{errors.phone}</Text>
              </View>
            )}
          </View>

          {/* First Name */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-700 mb-3">
              Имя
            </Text>
            <View className="relative">
              <View className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                <Ionicons name="person" size={20} color="#9CA3AF" />
              </View>
              <TextInput
                value={formData.first_name}
                onChangeText={(value) => handleChange('first_name', value)}
                className={`w-full rounded-2xl border-2 bg-gray-50 pl-12 pr-4 py-4 text-gray-900 ${
                  errors.first_name ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="Введите ваше имя"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            {errors.first_name && (
              <View className="mt-2 flex-row items-center gap-1">
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text className="text-sm text-red-600">{errors.first_name}</Text>
              </View>
            )}
          </View>

          {/* Last Name */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-700 mb-3">
              Фамилия
            </Text>
            <View className="relative">
              <View className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                <Ionicons name="person" size={20} color="#9CA3AF" />
              </View>
              <TextInput
                value={formData.last_name}
                onChangeText={(value) => handleChange('last_name', value)}
                className={`w-full rounded-2xl border-2 bg-gray-50 pl-12 pr-4 py-4 text-gray-900 ${
                  errors.last_name ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="Введите вашу фамилию"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            {errors.last_name && (
              <View className="mt-2 flex-row items-center gap-1">
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text className="text-sm text-red-600">{errors.last_name}</Text>
              </View>
            )}
          </View>

          {/* Terms Agreement */}
          <View className="flex-row items-start gap-3 mb-6">
            <TouchableOpacity
              onPress={() => setAgreeTerms(!agreeTerms)}
              className={`w-5 h-5 rounded border-2 items-center justify-center mt-1 ${
                agreeTerms ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
              }`}
            >
              {agreeTerms && <Ionicons name="checkmark" size={16} color="white" />}
            </TouchableOpacity>
            <Text className="text-sm text-gray-600 flex-1">
              Я согласен с{' '}
              <Text className="text-blue-500 font-semibold">условиями использования</Text>
              {' '}и{' '}
              <Text className="text-blue-500 font-semibold">политикой конфиденциальности</Text>
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading || isRegisterLoading || !agreeTerms}
            className={`w-full py-4 px-6 rounded-2xl mb-6 ${
              isLoading || isRegisterLoading || !agreeTerms ? 'bg-gray-400' : 'bg-blue-500'
            }`}
          >
            <View className="flex-row items-center justify-center gap-2">
              <Text className="text-white font-bold text-lg">
                {isLoading || isRegisterLoading ? 'Отправка SMS...' : 'Получить SMS код'}
              </Text>
              {!isLoading && !isRegisterLoading && <Ionicons name="arrow-forward" size={20} color="white" />}
            </View>
          </TouchableOpacity>

          <Text className="text-center text-sm text-gray-600">
            Уже есть аккаунт?{' '}
            <Link href="/(auth)/login" asChild>
              <Text className="text-blue-500 font-semibold">Войти</Text>
            </Link>
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}