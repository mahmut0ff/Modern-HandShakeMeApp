import { Stack, router } from 'expo-router'
import { Provider, useDispatch } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { StatusBar } from 'expo-status-bar'
import { View, Text, Platform } from 'react-native'
import { useEffect, useState } from 'react'
import * as Linking from 'expo-linking'
import { store, persistor } from '../store'
import { WebSocketProvider } from '../components/WebSocketProvider'
import ErrorBoundary from '../components/ErrorBoundary'
import { pushNotificationService } from '../services/pushNotifications'
import { useRegisterPushTokenMutation } from '../services/notificationApi'
import { initializeI18n } from '../i18n'
import { useOnboarding } from '../hooks/useOnboarding'
import { InteractiveOnboardingScreen } from '../components/onboarding'
import { setTokens } from '../features/auth/authSlice'
import { initializeErrorMonitoring, setupGlobalErrorHandlers, ErrorMonitoringService } from '../services/errorMonitoring'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import '../global.css'

function LoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-[#F8F7FC]">
      <Text className="text-lg font-semibold text-gray-600">Загрузка...</Text>
    </View>
  )
}

function AppContent() {
  const [registerPushToken] = useRegisterPushTokenMutation()
  const [i18nInitialized, setI18nInitialized] = useState(false)
  const { isLoading: onboardingLoading, showOnboarding, completeOnboarding } = useOnboarding()
  const dispatch = useDispatch()

  // Handle deep links (not used for Telegram auth - that uses polling)
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const { url } = event
      console.log('Deep link received:', url)

      // Skip expo dev URLs
      if (url.startsWith('exp://')) return

      // Handle other types of deep links here if needed
      // Telegram auth is handled via polling in telegram-login.tsx
    }

    // Handle initial URL (app opened via deep link)
    Linking.getInitialURL().then((url) => {
      if (url && !url.startsWith('exp://')) {
        handleDeepLink({ url })
      }
    })

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', handleDeepLink)

    return () => {
      subscription.remove()
    }
  }, [dispatch])

  useEffect(() => {
    // Initialize i18n
    const initI18n = async () => {
      await initializeI18n()
      setI18nInitialized(true)
    }

    initI18n()
  }, [])

  useEffect(() => {
    // Initialize push notifications
    const initPushNotifications = async () => {
      const token = await pushNotificationService.initialize()

      if (token) {
        // Register token with backend
        try {
          await registerPushToken({
            token,
            device_type: Platform.OS as 'ios' | 'android',
          }).unwrap()
          console.log('Push token registered successfully')
        } catch (error) {
          console.error('Failed to register push token:', error)
        }
      }

      // Setup notification listeners
      pushNotificationService.setupListeners(
        (notification) => {
          console.log('Notification received:', notification)
        },
        (response) => {
          console.log('Notification tapped:', response)
          // Handle navigation based on notification data
        }
      )
    }

    initPushNotifications()

    // Cleanup - only remove listeners if they exist
    return () => {
      try {
        pushNotificationService.removeListeners()
      } catch (error) {
        // Ignore cleanup errors in Expo Go
        console.log('Cleanup skipped (Expo Go)')
      }
    }
  }, [registerPushToken])

  if (!i18nInitialized || onboardingLoading) {
    return <LoadingScreen />
  }

  if (showOnboarding) {
    return <InteractiveOnboardingScreen onComplete={completeOnboarding} />
  }

  return (
    <ErrorBoundary>
      <WebSocketProvider>
        <StatusBar style="auto" />
        <View className="flex-1 bg-[#F8F7FC]">
          <Stack screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#F8F7FC' }
          }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(master)" />
            <Stack.Screen name="(client)" />
          </Stack>
        </View>
      </WebSocketProvider>
    </ErrorBoundary>
  )
}

export default function RootLayout() {
  // Инициализация мониторинга ошибок
  useEffect(() => {
    initializeErrorMonitoring();
    setupGlobalErrorHandlers();

    // Проверка здоровья приложения при запуске
    ErrorMonitoringService.checkAppHealth();
    ErrorMonitoringService.addBreadcrumb('App Started', 'lifecycle');
  }, []);

  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <PersistGate loading={<LoadingScreen />} persistor={persistor}>
          <AppContent />
        </PersistGate>
      </Provider>
    </SafeAreaProvider>
  )
}