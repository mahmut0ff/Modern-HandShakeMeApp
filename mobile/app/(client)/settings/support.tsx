import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, Linking, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

export default function SupportPage() {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [message, setMessage] = useState('')

  const supportCategories = [
    { id: 'technical', title: 'Техническая проблема', icon: 'bug' },
    { id: 'payment', title: 'Проблемы с оплатой', icon: 'card' },
    { id: 'account', title: 'Проблемы с аккаунтом', icon: 'person' },
    { id: 'master', title: 'Проблемы с мастером', icon: 'people' },
    { id: 'other', title: 'Другое', icon: 'help-circle' },
  ]

  const handleWhatsApp = () => {
    const phoneNumber = '+996550308078'
    const url = `whatsapp://send?phone=${phoneNumber}&text=Здравствуйте! У меня есть вопрос по приложению HandShakeMe.`
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url)
      } else {
        Alert.alert('Ошибка', 'WhatsApp не установлен на вашем устройстве')
      }
    })
  }

  const handleTelegram = () => {
    const username = 'AbdullohMahmutov'
    const url = `tg://resolve?domain=${username}`
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url)
      } else {
        // Fallback to web version
        Linking.openURL(`https://t.me/${username}`)
      }
    })
  }

  const handleSendMessage = () => {
    if (!selectedCategory || !message.trim()) {
      Alert.alert('Ошибка', 'Пожалуйста, выберите категорию и введите сообщение')
      return
    }

    // Here you would implement actual message sending logic
    Alert.alert(
      'Сообщение отправлено',
      'Ваше обращение получено. Мы свяжемся с вами в ближайшее время.',
      [{ text: 'OK', onPress: () => router.back() }]
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={20} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 flex-1">Помощь и поддержка</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}>
        {/* Quick Contact */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-4">Быстрая связь</Text>
          
          <View className="space-y-3">
            <TouchableOpacity
              onPress={handleWhatsApp}
              className="flex-row items-center gap-4 p-4 bg-green-50 rounded-2xl border border-green-200"
            >
              <View className="w-12 h-12 bg-green-500 rounded-full items-center justify-center">
                <Ionicons name="logo-whatsapp" size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-semibold">WhatsApp</Text>
                <Text className="text-gray-600 text-sm">+996 550 308 078</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#059669" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleTelegram}
              className="flex-row items-center gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-200"
            >
              <View className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center">
                <Ionicons name="send" size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-semibold">Telegram</Text>
                <Text className="text-gray-600 text-sm">@AbdullohMahmutov</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#2563EB" />
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-4">Часто задаваемые вопросы</Text>
          
          <View className="space-y-4">
            {[
              {
                question: 'Как найти мастера?',
                answer: 'Перейдите в раздел "Мастера", используйте поиск и фильтры для поиска подходящего специалиста.'
              },
              {
                question: 'Как работает оплата?',
                answer: 'Деньги блокируются на счете до завершения работы. После подтверждения выполнения средства переводятся мастеру.'
              },
              {
                question: 'Что делать если мастер не выполнил работу?',
                answer: 'Обратитесь в службу поддержки через приложение или напишите нам в WhatsApp/Telegram.'
              }
            ].map((faq, index) => (
              <View key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
                <Text className="text-gray-900 font-medium mb-2">{faq.question}</Text>
                <Text className="text-gray-600 text-sm leading-relaxed">{faq.answer}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Contact Form */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-4">Написать в поддержку</Text>
          
          <View className="space-y-4">
            <View>
              <Text className="text-gray-700 font-medium mb-2">Категория проблемы</Text>
              <View className="space-y-2">
                {supportCategories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    onPress={() => setSelectedCategory(category.id)}
                    className={`flex-row items-center gap-3 p-3 rounded-2xl border ${
                      selectedCategory === category.id
                        ? 'bg-[#0165FB]/10 border-[#0165FB]'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Ionicons 
                      name={category.icon as any} 
                      size={20} 
                      color={selectedCategory === category.id ? '#0165FB' : '#6B7280'} 
                    />
                    <Text className={`font-medium ${
                      selectedCategory === category.id ? 'text-[#0165FB]' : 'text-gray-700'
                    }`}>
                      {category.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Text className="text-gray-700 font-medium mb-2">Опишите проблему</Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Подробно опишите вашу проблему..."
                multiline
                numberOfLines={4}
                className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 text-gray-900"
                style={{ textAlignVertical: 'top' }}
              />
            </View>

            <TouchableOpacity
              onPress={handleSendMessage}
              className="bg-[#0165FB] py-4 rounded-2xl"
            >
              <Text className="text-white font-semibold text-center">Отправить сообщение</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Additional Info */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
          <View className="flex-row items-start gap-3">
            <Ionicons name="information-circle" size={20} color="#0165FB" />
            <View className="flex-1">
              <Text className="text-gray-900 font-medium mb-1">Время ответа</Text>
              <Text className="text-gray-600 text-sm leading-relaxed">
                Мы стараемся отвечать на все обращения в течение 24 часов. 
                Для срочных вопросов рекомендуем использовать WhatsApp или Telegram.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}