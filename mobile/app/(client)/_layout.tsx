import { Stack } from 'expo-router'
import { View } from 'react-native'
import MobileBottomNav from '../../components/MobileBottomNav'

export default function ClientLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="orders" />
        <Stack.Screen name="masters" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="profile" />
        
        {/* Nested routes */}
        <Stack.Screen name="masters/[id]" />
        <Stack.Screen name="orders/[id]" />
        <Stack.Screen name="orders/[id]/applications" />
        <Stack.Screen name="orders/[id]/edit" />
        <Stack.Screen name="projects" />
        <Stack.Screen name="projects/[id]" />
        <Stack.Screen name="projects/[id]/review" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="wallet" />
        <Stack.Screen name="wallet/deposit" />
        <Stack.Screen name="wallet/withdraw" />
        <Stack.Screen name="wallet/history" />
        <Stack.Screen name="create-order" />
        <Stack.Screen name="disputes" />
        <Stack.Screen name="disputes/create" />
        <Stack.Screen name="disputes/[id]" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="reviews" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="settings/language" />
        <Stack.Screen name="settings/security" />
        <Stack.Screen name="settings/about" />
        <Stack.Screen name="settings/support" />
      </Stack>
      
      <MobileBottomNav />
    </View>
  )
}