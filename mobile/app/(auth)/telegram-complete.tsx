import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useAppDispatch } from '../../hooks/redux'
import { setCredentials } from '../../features/auth/authSlice'
import { useTelegramCompleteMutation } from '../../services/authApi'

type Role = 'CLIENT' | 'MASTER'

export default function TelegramCompletePage() {
  const dispatch = useAppDispatch()
  const params = useLocalSearchParams()
  const [telegramComplete] = useTelegramCompleteMutation()
  
  // Telegram data from previous screen
  const telegramData = params.telegramData ? JSON.parse(params.telegramData as string) : {}
  
  const [formData, setFormData] = useState({
    firstName: telegramData.firstName || '',
    lastName: telegramData.lastName || '',
    role: 'CLIENT' as Role,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleRoleChange = (role: Role) => {
    setFormData({ ...formData, role })
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Имя обязательно'
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Фамилия обязательна'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsLoading(true)

    try {
      if (!telegramData?.id) {
        throw new Error('Telegram data not available')
      }

      const result = await telegramComplete({
        telegram_id: telegramData.id,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        role: formData.role,
        username: telegramData.username || undefined,
        photo_url: telegramData.photoUrl || undefined,
      }).unwrap()

      dispatch(setCredentials({
        user: {
          id: result.user.id,
          phone: result.user.phone || '',
          role: result.user.role,
          firstName: result.user.firstName,
          lastName: result.user.lastName
        },
        accessToken: result.tokens.access,
        refreshToken: result.tokens.refresh,
      }))

      const route = formData.role === 'MASTER' ? '/(master)/dashboard' : '/(client)/dashboard'
      router.replace(route)
    } catch (err: any) {
      console.error('Registration error:', err)
      setErrors({ 
        general: err.data?.message || err.message || 'Произошла ошибка. Попробуйте позже.' 
      })
    } finally {
      setIsLoading(false)
    }
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
      
      <ScrollView 
        className="flex-1 px-4 pt-12" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="bg-white rounded-3xl p-6 mt-4 mb-8">
          {/* Logo */}
          <View className="items-center mb-6">
            <View className="w-16 h-16 bg-blue-500 rounded-3xl items-center justify-center mb-4">
              <Ionicons name="person-add" size={28} color="white" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">Завершение регистрации</Text>
            <Text className="text-gray-600 text-center text-sm">Подтвердите ваши данные</Text>
          </View>
          
          {errors.general && (
            <View className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex-row items-center gap-3">
              <Ionicons name="alert-circle" size={20} color="#DC2626" />
              <Text className="text-red-600 text-sm flex-1">{errors.general}</Text>
            </View>
          )}

          {/* Role Selection */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Выберите роль
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => handleRoleChange('CLIENT')}
                className={`flex-1 p-3 rounded-2xl border-2 items-center ${
                  formData.role === 'CLIENT'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <Ionicons 
                  name="person" 
                  size={20} 
                  color={formData.role === 'CLIENT' ? '#3B82F6' : '#6B7280'} 
                />
                <Text className={`font-semibold text-xs mt-1 ${
                  formData.role === 'CLIENT' ? 'text-blue-500' : 'text-gray-700'
                }`}>
                  Клиент
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => handleRoleChange('MASTER')}
                className={`flex-1 p-3 rounded-2xl border-2 items-center ${
                  formData.role === 'MASTER'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <Ionicons 
                  name="construct" 
                  size={20} 
                  color={formData.role === 'MASTER' ? '#3B82F6' : '#6B7280'} 
                />
                <Text className={`font-semibold text-xs mt-1 ${
                  formData.role === 'MASTER' ? 'text-blue-500' : 'text-gray-700'
                }`}>
                  Мастер
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* First Name */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Имя
            </Text>
            <View className="relative">
              <View className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                <Ionicons name="person" size={20} color="#9CA3AF" />
              </View>
              <TextInput
                value={formData.firstName}
                onChangeText={(value) => {
                  setFormData({ ...formData, firstName: value })
                  setErrors({ ...errors, firstName: '' })
                }}
                className={`w-full rounded-2xl border-2 bg-gray-50 pl-12 pr-4 py-3 text-gray-900 ${
                  errors.firstName ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="Введите ваше имя"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            {errors.firstName && (
              <View className="mt-1 flex-row items-center gap-1">
                <Ionicons name="alert-circle" size={14} color="#DC2626" />
                <Text className="text-xs text-red-600">{errors.firstName}</Text>
              </View>
            )}
          </View>

          {/* Last Name */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Фамилия
            </Text>
            <View className="relative">
              <View className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                <Ionicons name="person" size={20} color="#9CA3AF" />
              </View>
              <TextInput
                value={formData.lastName}
                onChangeText={(value) => {
                  setFormData({ ...formData, lastName: value })
                  setErrors({ ...errors, lastName: '' })
                }}
                className={`w-full rounded-2xl border-2 bg-gray-50 pl-12 pr-4 py-3 text-gray-900 ${
                  errors.lastName ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="Введите вашу фамилию"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            {errors.lastName && (
              <View className="mt-1 flex-row items-center gap-1">
                <Ionicons name="alert-circle" size={14} color="#DC2626" />
                <Text className="text-xs text-red-600">{errors.lastName}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            className={`w-full py-3.5 px-6 rounded-2xl mb-4 ${
              isLoading ? 'bg-gray-400' : 'bg-blue-500'
            }`}
          >
            <View className="flex-row items-center justify-center gap-2">
              <Text className="text-white font-bold text-base">
                {isLoading ? 'Завершаем регистрацию...' : 'Завершить регистрацию'}
              </Text>
              {!isLoading && <Ionicons name="checkmark-circle" size={20} color="white" />}
            </View>
          </TouchableOpacity>

          {/* Info */}
          <View className="mt-4 p-4 bg-blue-50 rounded-2xl">
            <View className="flex-row items-start gap-3">
              <Ionicons name="shield-checkmark" size={20} color="#0165FB" />
              <Text className="text-blue-900 text-xs flex-1">
                Ваши данные защищены и используются только для работы приложения
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
