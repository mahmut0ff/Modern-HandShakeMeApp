import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

export default function SupportPage() {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все поля')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      Alert.alert(
        'Сообщение отправлено',
        'Ваше обращение получено. Мы свяжемся с вами в ближайшее время.',
        [{ text: 'OK', onPress: () => router.back() }]
      )
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось отправить сообщение. Попробуйте позже.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-white px-4 py-4 border-b border-gray-100">
          <View className="flex-row items-center gap-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
            >
              <Ionicons name="arrow-back" size={20} color="#374151" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-900">Поддержка</Text>
          </View>
        </View>

        <View className="p-4">
          {/* Contact Options */}
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
            <Text className="text-lg font-bold text-gray-900 mb-4">Способы связи</Text>
            
            <TouchableOpacity className="flex-row items-center gap-4 py-3 border-b border-gray-100">
              <View className="w-12 h-12 bg-blue-100 rounded-2xl items-center justify-center">
                <Ionicons name="call" size={20} color="#0165FB" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">Телефон</Text>
                <Text className="text-gray-600">+996 (555) 123-456</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center gap-4 py-3 border-b border-gray-100">
              <View className="w-12 h-12 bg-green-100 rounded-2xl items-center justify-center">
                <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">WhatsApp</Text>
                <Text className="text-gray-600">+996 (555) 123-456</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center gap-4 py-3">
              <View className="w-12 h-12 bg-purple-100 rounded-2xl items-center justify-center">
                <Ionicons name="mail" size={20} color="#7C3AED" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">Email</Text>
                <Text className="text-gray-600">support@handshakeme.kg</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Contact Form */}
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <Text className="text-lg font-bold text-gray-900 mb-4">Написать нам</Text>
            
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Тема обращения</Text>
              <TextInput
                value={subject}
                onChangeText={setSubject}
                placeholder="Опишите проблему кратко"
                className="w-full p-4 bg-gray-50 rounded-2xl text-gray-900"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">Сообщение</Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Подробно опишите вашу проблему или вопрос"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                className="w-full p-4 bg-gray-50 rounded-2xl text-gray-900"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              className={`w-full py-4 rounded-2xl ${
                isSubmitting ? 'bg-gray-300' : 'bg-[#0165FB]'
              }`}
            >
              <Text className="text-center text-white font-semibold">
                {isSubmitting ? 'Отправляем...' : 'Отправить сообщение'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* FAQ */}
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mt-4">
            <Text className="text-lg font-bold text-gray-900 mb-4">Часто задаваемые вопросы</Text>
            
            <View className="space-y-3">
              <View className="border-b border-gray-100 pb-3">
                <Text className="font-semibold text-gray-900 mb-1">Как получить статус верифицированного мастера?</Text>
                <Text className="text-gray-600 text-sm">Загрузите документы в разделе "Верификация" и дождитесь проверки модераторами.</Text>
              </View>
              
              <View className="border-b border-gray-100 pb-3">
                <Text className="font-semibold text-gray-900 mb-1">Как вывести заработанные средства?</Text>
                <Text className="text-gray-600 text-sm">Перейдите в раздел "Кошелек" → "Вывод средств" и выберите способ получения.</Text>
              </View>
              
              <View>
                <Text className="font-semibold text-gray-900 mb-1">Что делать если клиент не отвечает?</Text>
                <Text className="text-gray-600 text-sm">Обратитесь в поддержку через данную форму, мы поможем решить проблему.</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}