import { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import * as Linking from 'expo-linking'
import * as Clipboard from 'expo-clipboard'
import { useAppDispatch } from '../../hooks/redux'
import { setCredentials } from '../../features/auth/authSlice'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001'
const BOT_USERNAME = process.env.EXPO_PUBLIC_TELEGRAM_BOT || 'handshakeme_bot'

export default function TelegramLoginPage() {
  const dispatch = useAppDispatch()
  const [code, setCode] = useState<string | null>(null)
  const [visitorId, setVisitorId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const pollInterval = useRef<NodeJS.Timeout | null>(null)

  // Get auth code on mount
  useEffect(() => {
    getAuthCode()
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current)
    }
  }, [])

  // Start polling when we have visitorId
  useEffect(() => {
    if (visitorId) {
      pollInterval.current = setInterval(checkAuth, 2000)
    }
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current)
    }
  }, [visitorId])

  const POLLING_TIMEOUT = 5 * 60 * 1000 // 5 minutes
  const MAX_POLLING_ATTEMPTS = 150 // 5 minutes / 2 seconds
  let pollAttempts = 0

  const getAuthCode = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/telegram/code?visitorId=${Date.now()}`)

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }

      const data = await res.json()

      if (!data.code || !data.visitorId) {
        throw new Error('Invalid response: missing code or visitorId')
      }

      setCode(data.code)
      setVisitorId(data.visitorId)
      pollAttempts = 0
      setIsLoading(false)
    } catch (e) {
      console.error('Failed to get code:', e)
      Alert.alert('Ошибка', 'Не удалось получить код. Проверьте подключение.')
      setIsLoading(false)
    }
  }

  const checkAuth = async () => {
    if (!visitorId) return

    pollAttempts++

    // Check timeout
    if (pollAttempts > MAX_POLLING_ATTEMPTS) {
      if (pollInterval.current) clearInterval(pollInterval.current)
      Alert.alert('Ошибка', 'Превышено максимальное количество попыток.')
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch(`${API_URL}/auth/telegram/check?visitorId=${visitorId}`)

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }

      const data = await res.json()

      if (data.authenticated && data.user && data.tokens) {
        // Stop polling
        if (pollInterval.current) clearInterval(pollInterval.current)

        // Save to Redux
        dispatch(setCredentials({
          user: {
            id: data.user.id,
            phone: data.user.phone || '',
            role: (data.user.role || 'CLIENT').toUpperCase() as 'CLIENT' | 'MASTER',
            firstName: data.user.first_name,
            lastName: data.user.last_name
          },
          accessToken: data.tokens.access,
          refreshToken: data.tokens.refresh
        }))

        // Navigate based on role
        const route = data.user.role === 'MASTER' ? '/(master)/dashboard' : '/(client)/dashboard'
        router.replace(route)
      }
    } catch (e) {
      console.error('Check auth error:', e)
      // Continue polling on error
    }
  }

  const copyCode = async () => {
    if (code) {
      await Clipboard.setStringAsync(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const openTelegram = async () => {
    const url = `tg://resolve?domain=${BOT_USERNAME}`
    const canOpen = await Linking.canOpenURL(url)

    if (canOpen) {
      await Linking.openURL(url)
    } else {
      await Linking.openURL(`https://t.me/${BOT_USERNAME}`)
    }
  }

  const refreshCode = () => {
    setIsLoading(true)
    setCode(null)
    if (pollInterval.current) clearInterval(pollInterval.current)
    getAuthCode()
  }

  return (
    <View className="flex-1 bg-blue-500">
      <StatusBar style="light" />

      {/* Background */}
      <View className="absolute inset-0">
        <View className="absolute top-10 left-5 w-32 h-32 bg-white/10 rounded-full" />
        <View className="absolute top-32 right-12 w-24 h-24 bg-white/15 rounded-full" />
        <View className="absolute bottom-24 left-16 w-40 h-40 bg-white/8 rounded-full" />
      </View>

      <View className="flex-1 px-4 pt-16 justify-center">
        <View className="bg-white rounded-3xl p-8">
          {/* Logo */}
          <View className="items-center mb-6">
            <View className="w-16 h-16 bg-blue-500 rounded-2xl items-center justify-center mb-4">
              <Text className="text-3xl">🤝</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-900">Вход через Telegram</Text>
          </View>

          {isLoading ? (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className="text-gray-500 mt-4">Получаем код...</Text>
            </View>
          ) : (
            <>
              {/* Code Display */}
              <View className="bg-gray-100 rounded-2xl p-6 mb-6">
                <Text className="text-center text-gray-500 mb-2">Ваш код для входа:</Text>
                <TouchableOpacity onPress={copyCode} className="items-center">
                  <Text className="text-4xl font-bold text-gray-900 tracking-widest">{code}</Text>
                  <View className="flex-row items-center mt-2">
                    <Ionicons name={copied ? "checkmark" : "copy-outline"} size={16} color="#6B7280" />
                    <Text className="text-gray-500 text-sm ml-1">
                      {copied ? 'Скопировано!' : 'Нажмите чтобы скопировать'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Instructions */}
              <View className="mb-6">
                <View className="flex-row items-center mb-3">
                  <View className="w-6 h-6 bg-blue-100 rounded-full items-center justify-center mr-3">
                    <Text className="text-blue-600 font-bold text-sm">1</Text>
                  </View>
                  <Text className="text-gray-700 flex-1">Откройте Telegram бота</Text>
                </View>
                <View className="flex-row items-center mb-3">
                  <View className="w-6 h-6 bg-blue-100 rounded-full items-center justify-center mr-3">
                    <Text className="text-blue-600 font-bold text-sm">2</Text>
                  </View>
                  <Text className="text-gray-700 flex-1">Отправьте код боту</Text>
                </View>
                <View className="flex-row items-center">
                  <View className="w-6 h-6 bg-blue-100 rounded-full items-center justify-center mr-3">
                    <Text className="text-blue-600 font-bold text-sm">3</Text>
                  </View>
                  <Text className="text-gray-700 flex-1">Вход произойдёт автоматически</Text>
                </View>
              </View>

              {/* Open Telegram Button */}
              <TouchableOpacity
                onPress={openTelegram}
                className="w-full py-4 px-6 rounded-2xl bg-[#0088cc] mb-3"
              >
                <View className="flex-row items-center justify-center gap-3">
                  <Ionicons name="paper-plane" size={24} color="white" />
                  <Text className="text-white font-bold text-lg">Открыть Telegram</Text>
                </View>
              </TouchableOpacity>

              {/* Refresh Code */}
              <TouchableOpacity onPress={refreshCode} className="py-3">
                <Text className="text-center text-blue-500">Получить новый код</Text>
              </TouchableOpacity>

              {/* Waiting indicator */}
              <View className="flex-row items-center justify-center mt-4">
                <ActivityIndicator size="small" color="#9CA3AF" />
                <Text className="text-gray-400 text-sm ml-2">Ожидаем подтверждение...</Text>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  )
}
