import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, Linking, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

export default function MasterAboutPage() {
  const appVersion = '1.0.0'
  const buildNumber = '1'

  const handleOpenLink = (url: string) => {
    Linking.openURL(url)
  }

  const handleRateApp = () => {
    // Open app store rating
    const storeUrl = Platform.OS === 'ios' 
      ? 'https://apps.apple.com/app/handshakeme'
      : 'https://play.google.com/store/apps/details?id=com.handshakeme'
    Linking.openURL(storeUrl)
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
          <Text className="text-xl font-bold text-gray-900 flex-1">О приложении</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}>
        {/* App Info */}
        <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-4 items-center">
          <View className="w-20 h-20 bg-[#0165FB] rounded-3xl items-center justify-center mb-4">
            <Text className="text-4xl">🤝</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2">HandShakeMe</Text>
          <Text className="text-gray-600 text-center mb-4">
            Платформа для поиска проверенных мастеров в Кыргызстане
          </Text>
          <View className="bg-gray-100 px-4 py-2 rounded-full">
            <Text className="text-gray-700 font-medium">Версия {appVersion} ({buildNumber})</Text>
          </View>
        </View>

        {/* Features */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-4">Возможности для мастеров</Text>
          
          <View className="space-y-4">
            {[
              { icon: 'briefcase', title: 'Поиск заказов', desc: 'Находите подходящие заказы в вашем городе' },
              { icon: 'shield-checkmark', title: 'Безопасные сделки', desc: 'Защищенные платежи через эскроу' },
              { icon: 'star', title: 'Система рейтингов', desc: 'Получайте отзывы и повышайте рейтинг' },
              { icon: 'chatbubbles', title: 'Встроенный чат', desc: 'Общение с клиентами в приложении' },
            ].map((feature, index) => (
              <View key={index} className="flex-row items-start gap-3">
                <View className="w-10 h-10 bg-[#0165FB]/10 rounded-xl items-center justify-center">
                  <Ionicons name={feature.icon as any} size={20} color="#0165FB" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-medium mb-1">{feature.title}</Text>
                  <Text className="text-gray-600 text-sm">{feature.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Company Info */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-4">О компании</Text>
          
          <Text className="text-gray-700 leading-relaxed mb-4">
            HandShakeMe - это инновационная платформа, которая объединяет клиентов и мастеров 
            в Кыргызстане. Мы стремимся сделать процесс поиска и найма специалистов 
            максимально простым, безопасным и прозрачным.
          </Text>

          <View className="space-y-3">
            <TouchableOpacity
              onPress={() => handleOpenLink('https://handshakeme.kg/privacy')}
              className="flex-row items-center justify-between py-2"
            >
              <Text className="text-gray-900 font-medium">Политика конфиденциальности</Text>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleOpenLink('https://handshakeme.kg/terms')}
              className="flex-row items-center justify-between py-2"
            >
              <Text className="text-gray-900 font-medium">Пользовательское соглашение</Text>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleRateApp}
              className="flex-row items-center justify-between py-2"
            >
              <Text className="text-gray-900 font-medium">Оценить приложение</Text>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Contact */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-4">Контакты</Text>
          
          <View className="space-y-3">
            <TouchableOpacity
              onPress={() => handleOpenLink('mailto:support@handshakeme.kg')}
              className="flex-row items-center gap-3"
            >
              <Ionicons name="mail" size={20} color="#6B7280" />
              <Text className="text-gray-900">support@handshakeme.kg</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleOpenLink('https://handshakeme.kg')}
              className="flex-row items-center gap-3"
            >
              <Ionicons name="globe" size={20} color="#6B7280" />
              <Text className="text-gray-900">handshakeme.kg</Text>
            </TouchableOpacity>

            <View className="flex-row items-center gap-3">
              <Ionicons name="location" size={20} color="#6B7280" />
              <Text className="text-gray-900">Бишкек, Кыргызстан</Text>
            </View>
          </View>
        </View>

        <View className="items-center pb-6">
          <Text className="text-gray-400 text-sm">
            © 2024 HandShakeMe. Все права защищены.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}