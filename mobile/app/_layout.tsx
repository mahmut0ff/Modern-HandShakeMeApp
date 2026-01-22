import { Stack } from 'expo-router'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { StatusBar } from 'expo-status-bar'
import { View, Text } from 'react-native'
import { store, persistor } from '../store'
import { WebSocketProvider } from '../components/WebSocketProvider'
import '../global.css'

function LoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-[#F8F7FC]">
      <Text className="text-lg font-semibold text-gray-600">Загрузка...</Text>
    </View>
  )
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
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
      </PersistGate>
    </Provider>
  )
}