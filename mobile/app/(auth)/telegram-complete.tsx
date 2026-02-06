import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, FlatList } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useAppDispatch } from '../../hooks/redux'
import { setCredentials } from '../../features/auth/authSlice'
import { useTelegramCompleteMutation } from '../../services/authApi'

type Role = 'CLIENT' | 'MASTER'

const countries = [
  { code: 'KG', name: 'Кыргызстан', flag: '🇰🇬' },
  { code: 'RU', name: 'Россия', flag: '🇷🇺' },
  { code: 'KZ', name: 'Казахстан', flag: '🇰🇿' },
  { code: 'UZ', name: 'Узбекистан', flag: '🇺🇿' },
  { code: 'TJ', name: 'Таджикистан', flag: '🇹🇯' },
  { code: 'UA', name: 'Украина', flag: '🇺🇦' },
  { code: 'BY', name: 'Беларусь', flag: '🇧🇾' },
  { code: 'OTHER', name: 'Другое', flag: '🌍' },
]

export default function TelegramCompletePage() {
  const dispatch = useAppDispatch()
  const params = useLocalSearchParams()
  const [telegramComplete] = useTelegramCompleteMutation()
  
  const telegramData = params.telegramData ? JSON.parse(params.telegramData as string) : {}
  
  const [step, setStep] = useState(1) // 1: role, 2: details, 3: citizenship
  const [formData, setFormData] = useState({
    firstName: telegramData.firstName || '',
    lastName: telegramData.lastName || '',
    role: '' as Role | '',
    citizenship: '',
    city: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showCountryPicker, setShowCountryPicker] = useState(false)

  const selectedCountry = countries.find(c => c.code === formData.citizenship)

  const handleRoleSelect = (role: Role) => {
    setFormData({ ...formData, role })
    setStep(2)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.firstName.trim()) newErrors.firstName = 'Имя обязательно'
    if (!formData.lastName.trim()) newErrors.lastName = 'Фамилия обязательна'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextStep = () => {
    if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }

  const handleSubmit = async () => {
    if (!formData.citizenship) {
      setErrors({ citizenship: 'Выберите гражданство' })
      return
    }

    setIsLoading(true)

    try {
      if (!telegramData?.id) throw new Error('Telegram data not available')

      const result = await telegramComplete({
        telegram_id: telegramData.id,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        role: formData.role as Role,
        username: telegramData.username,
        photo_url: telegramData.photoUrl,
        citizenship: formData.citizenship,
        city: formData.city,
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
      setErrors({ general: err.data?.message || 'Произошла ошибка' })
    } finally {
      setIsLoading(false)
    }
  }

  // Step 1: Role Selection
  const renderRoleStep = () => (
    <View className="flex-1 justify-center">
      <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
        Кто вы?
      </Text>
      <Text className="text-gray-600 text-center mb-8">
        Выберите вашу роль в приложении
      </Text>

      <TouchableOpacity
        onPress={() => handleRoleSelect('CLIENT')}
        className="bg-white rounded-2xl p-6 mb-4 border-2 border-gray-100"
        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 }}
      >
        <View className="flex-row items-center">
          <View className="w-14 h-14 bg-blue-100 rounded-2xl items-center justify-center mr-4">
            <Ionicons name="person" size={28} color="#3B82F6" />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900">Клиент</Text>
            <Text className="text-gray-600 text-sm mt-1">
              Ищу мастеров для выполнения работ
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => handleRoleSelect('MASTER')}
        className="bg-white rounded-2xl p-6 border-2 border-gray-100"
        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 }}
      >
        <View className="flex-row items-center">
          <View className="w-14 h-14 bg-green-100 rounded-2xl items-center justify-center mr-4">
            <Ionicons name="construct" size={28} color="#10B981" />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900">Мастер</Text>
            <Text className="text-gray-600 text-sm mt-1">
              Предлагаю свои услуги и навыки
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
        </View>
      </TouchableOpacity>

      {formData.role === 'MASTER' && (
        <View className="mt-6 p-4 bg-amber-50 rounded-2xl flex-row items-start">
          <Ionicons name="information-circle" size={20} color="#F59E0B" />
          <Text className="text-amber-800 text-sm ml-2 flex-1">
            Мастерам потребуется пройти верификацию личности для получения заказов
          </Text>
        </View>
      )}
    </View>
  )

  // Step 2: Personal Details
  const renderDetailsStep = () => (
    <View className="flex-1">
      <View className="flex-row items-center mb-6">
        <TouchableOpacity onPress={handleBack} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <View>
          <Text className="text-xl font-bold text-gray-900">Личные данные</Text>
          <Text className="text-gray-600 text-sm">Шаг 2 из 3</Text>
        </View>
      </View>

      {errors.general && (
        <View className="mb-4 p-4 bg-red-50 rounded-2xl flex-row items-center">
          <Ionicons name="alert-circle" size={20} color="#DC2626" />
          <Text className="text-red-600 text-sm ml-2 flex-1">{errors.general}</Text>
        </View>
      )}

      <View className="bg-white rounded-2xl p-6 mb-4">
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Имя *</Text>
          <TextInput
            value={formData.firstName}
            onChangeText={(v) => { setFormData({...formData, firstName: v}); setErrors({...errors, firstName: ''}) }}
            className={`rounded-xl border-2 bg-gray-50 px-4 py-3 text-gray-900 ${errors.firstName ? 'border-red-300' : 'border-gray-200'}`}
            placeholder="Введите имя"
            placeholderTextColor="#9CA3AF"
          />
          {errors.firstName && <Text className="text-red-600 text-xs mt-1">{errors.firstName}</Text>}
        </View>

        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Фамилия *</Text>
          <TextInput
            value={formData.lastName}
            onChangeText={(v) => { setFormData({...formData, lastName: v}); setErrors({...errors, lastName: ''}) }}
            className={`rounded-xl border-2 bg-gray-50 px-4 py-3 text-gray-900 ${errors.lastName ? 'border-red-300' : 'border-gray-200'}`}
            placeholder="Введите фамилию"
            placeholderTextColor="#9CA3AF"
          />
          {errors.lastName && <Text className="text-red-600 text-xs mt-1">{errors.lastName}</Text>}
        </View>

        <View>
          <Text className="text-sm font-semibold text-gray-700 mb-2">Город</Text>
          <TextInput
            value={formData.city}
            onChangeText={(v) => setFormData({...formData, city: v})}
            className="rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-gray-900"
            placeholder="Например: Бишкек"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      <TouchableOpacity
        onPress={handleNextStep}
        className="bg-blue-500 py-4 rounded-2xl"
      >
        <Text className="text-white font-bold text-center text-base">Далее</Text>
      </TouchableOpacity>
    </View>
  )

  // Step 3: Citizenship
  const renderCitizenshipStep = () => (
    <View className="flex-1">
      <View className="flex-row items-center mb-6">
        <TouchableOpacity onPress={handleBack} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <View>
          <Text className="text-xl font-bold text-gray-900">Гражданство</Text>
          <Text className="text-gray-600 text-sm">Шаг 3 из 3</Text>
        </View>
      </View>

      <Text className="text-gray-600 mb-4">
        Выберите страну гражданства для правильного оформления документов
      </Text>

      <View className="bg-white rounded-2xl p-4 mb-4">
        {countries.map((country) => (
          <TouchableOpacity
            key={country.code}
            onPress={() => setFormData({...formData, citizenship: country.code})}
            className={`flex-row items-center p-3 rounded-xl mb-2 ${
              formData.citizenship === country.code ? 'bg-blue-50 border-2 border-blue-500' : 'bg-gray-50'
            }`}
          >
            <Text className="text-2xl mr-3">{country.flag}</Text>
            <Text className={`flex-1 font-medium ${
              formData.citizenship === country.code ? 'text-blue-700' : 'text-gray-900'
            }`}>
              {country.name}
            </Text>
            {formData.citizenship === country.code && (
              <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {errors.citizenship && (
        <Text className="text-red-600 text-sm mb-4">{errors.citizenship}</Text>
      )}

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={isLoading || !formData.citizenship}
        className={`py-4 rounded-2xl ${
          isLoading || !formData.citizenship ? 'bg-gray-400' : 'bg-blue-500'
        }`}
      >
        <Text className="text-white font-bold text-center text-base">
          {isLoading ? 'Регистрация...' : 'Завершить регистрацию'}
        </Text>
      </TouchableOpacity>

      <View className="mt-4 p-4 bg-blue-50 rounded-2xl flex-row items-start">
        <Ionicons name="shield-checkmark" size={20} color="#3B82F6" />
        <Text className="text-blue-800 text-sm ml-2 flex-1">
          Данные защищены и используются только для работы приложения
        </Text>
      </View>
    </View>
  )

  return (
    <View className="flex-1 bg-gray-100">
      <StatusBar style="dark" />
      
      <ScrollView 
        className="flex-1 px-4 pt-12" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Progress indicator */}
        <View className="flex-row mb-6">
          {[1, 2, 3].map((s) => (
            <View 
              key={s} 
              className={`flex-1 h-1 rounded-full mx-1 ${s <= step ? 'bg-blue-500' : 'bg-gray-300'}`} 
            />
          ))}
        </View>

        {step === 1 && renderRoleStep()}
        {step === 2 && renderDetailsStep()}
        {step === 3 && renderCitizenshipStep()}
      </ScrollView>
    </View>
  )
}
