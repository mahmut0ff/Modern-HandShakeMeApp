import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

interface Language {
  code: string
  name: string
  nativeName: string
  flag: string
}

export default function MasterLanguageSettingsPage() {
  const [selectedLanguage, setSelectedLanguage] = useState('ru')

  const languages: Language[] = [
    { code: 'ru', name: 'Русский', nativeName: 'Русский', flag: '🇷🇺' },
    { code: 'ky', name: 'Кыргызский', nativeName: 'Кыргызча', flag: '🇰🇬' },
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  ]

  const handleLanguageSelect = (languageCode: string) => {
    setSelectedLanguage(languageCode)
    // Here you would implement actual language change logic
    // For example: i18n.changeLanguage(languageCode)
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
          <Text className="text-xl font-bold text-gray-900 flex-1">Язык приложения</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}>
        <View className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-4">
          {languages.map((language, index) => (
            <TouchableOpacity
              key={language.code}
              onPress={() => handleLanguageSelect(language.code)}
              className={`flex-row items-center justify-between p-4 ${
                index < languages.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <View className="flex-row items-center gap-4">
                <Text className="text-2xl">{language.flag}</Text>
                <View>
                  <Text className="text-gray-900 font-medium">{language.name}</Text>
                  <Text className="text-gray-500 text-sm">{language.nativeName}</Text>
                </View>
              </View>
              
              {selectedLanguage === language.code && (
                <Ionicons name="checkmark-circle" size={24} color="#0165FB" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mt-4">
          <View className="flex-row items-start gap-3">
            <Ionicons name="information-circle" size={20} color="#0165FB" />
            <View className="flex-1">
              <Text className="text-gray-900 font-medium mb-1">Информация</Text>
              <Text className="text-gray-600 text-sm leading-relaxed">
                Изменение языка применится после перезапуска приложения. 
                Некоторые элементы интерфейса могут остаться на текущем языке.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}