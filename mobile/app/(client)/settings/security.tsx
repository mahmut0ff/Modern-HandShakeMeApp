import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

export default function SecuritySettingsPage() {
  const [settings, setSettings] = useState({
    biometric_login: false,
    two_factor_auth: false,
    login_notifications: true,
    auto_logout: true,
  })

  const handleSettingChange = (key: keyof typeof settings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleChangePassword = () => {
    Alert.alert(
      'Смена пароля',
      'Для смены пароля на ваш email будет отправлена ссылка для сброса.',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Отправить', onPress: () => {
          // Implement password reset logic
          Alert.alert('Успешно', 'Ссылка для смены пароля отправлена на ваш email')
        }}
      ]
    )
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      'Удаление аккаунта',
      'Вы уверены, что хотите удалить свой аккаунт? Это действие нельзя отменить.',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Удалить', style: 'destructive', onPress: () => {
          // Implement account deletion logic
          Alert.alert('Аккаунт удален', 'Ваш аккаунт был успешно удален')
        }}
      ]
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
          <Text className="text-xl font-bold text-gray-900 flex-1">Безопасность</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}>
        {/* Authentication Settings */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-4">Аутентификация</Text>
          
          <View className="flex flex-col gap-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3 flex-1">
                <Ionicons name="finger-print" size={20} color="#6B7280" />
                <View className="flex-1">
                  <Text className="text-gray-900 font-medium">Биометрический вход</Text>
                  <Text className="text-gray-500 text-sm">Вход по отпечатку пальца или Face ID</Text>
                </View>
              </View>
              <Switch
                value={settings.biometric_login}
                onValueChange={(value) => handleSettingChange('biometric_login', value)}
                trackColor={{ false: '#E5E7EB', true: '#0165FB' }}
                thumbColor="white"
              />
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3 flex-1">
                <Ionicons name="shield-checkmark" size={20} color="#6B7280" />
                <View className="flex-1">
                  <Text className="text-gray-900 font-medium">Двухфакторная аутентификация</Text>
                  <Text className="text-gray-500 text-sm">Дополнительная защита аккаунта</Text>
                </View>
              </View>
              <Switch
                value={settings.two_factor_auth}
                onValueChange={(value) => handleSettingChange('two_factor_auth', value)}
                trackColor={{ false: '#E5E7EB', true: '#0165FB' }}
                thumbColor="white"
              />
            </View>

            <TouchableOpacity
              onPress={handleChangePassword}
              className="flex-row items-center gap-3 py-2"
            >
              <Ionicons name="key" size={20} color="#6B7280" />
              <View className="flex-1">
                <Text className="text-gray-900 font-medium">Сменить пароль</Text>
                <Text className="text-gray-500 text-sm">Обновить пароль для входа</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Security Notifications */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-4">Уведомления безопасности</Text>
          
          <View className="flex flex-col gap-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3 flex-1">
                <Ionicons name="log-in" size={20} color="#6B7280" />
                <View className="flex-1">
                  <Text className="text-gray-900 font-medium">Уведомления о входе</Text>
                  <Text className="text-gray-500 text-sm">Получать SMS при входе в аккаунт</Text>
                </View>
              </View>
              <Switch
                value={settings.login_notifications}
                onValueChange={(value) => handleSettingChange('login_notifications', value)}
                trackColor={{ false: '#E5E7EB', true: '#0165FB' }}
                thumbColor="white"
              />
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3 flex-1">
                <Ionicons name="time" size={20} color="#6B7280" />
                <View className="flex-1">
                  <Text className="text-gray-900 font-medium">Автоматический выход</Text>
                  <Text className="text-gray-500 text-sm">Выход из аккаунта при неактивности</Text>
                </View>
              </View>
              <Switch
                value={settings.auto_logout}
                onValueChange={(value) => handleSettingChange('auto_logout', value)}
                trackColor={{ false: '#E5E7EB', true: '#0165FB' }}
                thumbColor="white"
              />
            </View>
          </View>
        </View>

        {/* Privacy Settings */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-4">Конфиденциальность</Text>
          
          <TouchableOpacity className="flex-row items-center gap-3 py-2 mb-3">
            <Ionicons name="eye" size={20} color="#6B7280" />
            <View className="flex-1">
              <Text className="text-gray-900 font-medium">Настройки приватности</Text>
              <Text className="text-gray-500 text-sm">Управление видимостью профиля</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center gap-3 py-2">
            <Ionicons name="download" size={20} color="#6B7280" />
            <View className="flex-1">
              <Text className="text-gray-900 font-medium">Скачать мои данные</Text>
              <Text className="text-gray-500 text-sm">Получить копию ваших данных</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-red-200 mb-6">
          <Text className="text-lg font-bold text-red-600 mb-4">Опасная зона</Text>
          
          <TouchableOpacity
            onPress={handleDeleteAccount}
            className="flex-row items-center gap-3 py-2"
          >
            <Ionicons name="trash" size={20} color="#DC2626" />
            <View className="flex-1">
              <Text className="text-red-600 font-medium">Удалить аккаунт</Text>
              <Text className="text-red-400 text-sm">Безвозвратно удалить ваш аккаунт</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}