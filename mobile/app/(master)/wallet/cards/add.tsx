import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

export default function AddCardPage() {
  const [cardNumber, setCardNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')
  const [cardholderName, setCardholderName] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formatCardNumber = (text: string) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '')
    // Add spaces every 4 digits
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ')
    return formatted.substring(0, 19) // Max 16 digits + 3 spaces
  }

  const formatExpiryDate = (text: string) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '')
    // Add slash after 2 digits
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4)
    }
    return cleaned
  }

  const handleSubmit = async () => {
    if (!cardNumber.trim() || !expiryDate.trim() || !cvv.trim() || !cardholderName.trim()) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все поля')
      return
    }

    if (cardNumber.replace(/\s/g, '').length !== 16) {
      Alert.alert('Ошибка', 'Номер карты должен содержать 16 цифр')
      return
    }

    if (cvv.length !== 3) {
      Alert.alert('Ошибка', 'CVV должен содержать 3 цифры')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      Alert.alert(
        'Успех',
        'Карта успешно добавлена',
        [{ text: 'OK', onPress: () => router.back() }]
      )
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось добавить карту. Попробуйте позже.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-white px-4 py-4 border-b border-gray-100">
          <View className="flex-row items-center gap-4 mb-6">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="w-10 h-10 bg-white rounded-2xl items-center justify-center shadow-sm border border-gray-100"
            >
              <Ionicons name="arrow-back" size={20} color="#374151" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-900">Добавить карту</Text>
          </View>
        </View>

        <View className="p-4">
          {/* Card Preview */}
          <View className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-6 mb-6">
            <View className="flex-row justify-between items-start mb-8">
              <View>
                <Text className="text-white/70 text-sm">Банковская карта</Text>
                <Text className="text-white font-bold text-lg">HandShakeMe</Text>
              </View>
              <Ionicons name="card" size={32} color="rgba(255,255,255,0.8)" />
            </View>
            
            <View className="mb-6">
              <Text className="text-white text-xl font-mono tracking-wider">
                {cardNumber || '•••• •••• •••• ••••'}
              </Text>
            </View>
            
            <View className="flex-row justify-between">
              <View>
                <Text className="text-white/70 text-xs">ВЛАДЕЛЕЦ КАРТЫ</Text>
                <Text className="text-white font-semibold">
                  {cardholderName || 'ИМЯ ФАМИЛИЯ'}
                </Text>
              </View>
              <View>
                <Text className="text-white/70 text-xs">ДЕЙСТВУЕТ ДО</Text>
                <Text className="text-white font-semibold">
                  {expiryDate || 'MM/YY'}
                </Text>
              </View>
            </View>
          </View>

          {/* Form */}
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <Text className="text-lg font-bold text-gray-900 mb-4">Данные карты</Text>
            
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Номер карты</Text>
              <TextInput
                value={cardNumber}
                onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                placeholder="1234 5678 9012 3456"
                keyboardType="numeric"
                maxLength={19}
                className="w-full p-4 bg-gray-50 rounded-2xl text-gray-900 font-mono"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-2">Срок действия</Text>
                <TextInput
                  value={expiryDate}
                  onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
                  placeholder="MM/YY"
                  keyboardType="numeric"
                  maxLength={5}
                  className="w-full p-4 bg-gray-50 rounded-2xl text-gray-900 font-mono"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-2">CVV</Text>
                <TextInput
                  value={cvv}
                  onChangeText={(text) => setCvv(text.replace(/\D/g, '').substring(0, 3))}
                  placeholder="123"
                  keyboardType="numeric"
                  maxLength={3}
                  secureTextEntry
                  className="w-full p-4 bg-gray-50 rounded-2xl text-gray-900 font-mono"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">Имя владельца</Text>
              <TextInput
                value={cardholderName}
                onChangeText={setCardholderName}
                placeholder="IVAN PETROV"
                autoCapitalize="characters"
                className="w-full p-4 bg-gray-50 rounded-2xl text-gray-900"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <TouchableOpacity
              onPress={() => setIsDefault(!isDefault)}
              className="flex-row items-center gap-3 mb-6"
            >
              <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                isDefault ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
              }`}>
                {isDefault && <Ionicons name="checkmark" size={14} color="white" />}
              </View>
              <Text className="text-gray-700">Сделать основной картой</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              className={`w-full py-4 rounded-2xl ${
                isSubmitting ? 'bg-gray-300' : 'bg-[#0165FB]'
              }`}
            >
              <Text className="text-center text-white font-semibold">
                {isSubmitting ? 'Добавляем...' : 'Добавить карту'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Security Info */}
          <View className="bg-blue-50 rounded-2xl p-4 mt-4">
            <View className="flex-row items-start gap-3">
              <Ionicons name="shield-checkmark" size={20} color="#0165FB" />
              <View className="flex-1">
                <Text className="font-semibold text-blue-900 mb-1">Безопасность</Text>
                <Text className="text-blue-700 text-sm">
                  Данные вашей карты защищены 256-битным шифрованием SSL и не передаются третьим лицам.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}