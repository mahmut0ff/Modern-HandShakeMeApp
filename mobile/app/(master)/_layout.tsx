import { Stack } from 'expo-router'
import { View } from 'react-native'
import MobileBottomNav from '../../components/MobileBottomNav'

export default function MasterLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="projects" />
        <Stack.Screen name="orders" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="profile" />
        
        {/* Nested routes */}
        <Stack.Screen name="projects/[id]" />
        <Stack.Screen name="projects/create" />
        <Stack.Screen name="orders/[id]" />
        <Stack.Screen name="orders/[id]/apply" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="clients/[id]" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="applications" />
        <Stack.Screen name="kanban" />
        <Stack.Screen name="portfolio" />
        <Stack.Screen name="portfolio/[id]" />
        <Stack.Screen name="portfolio/create" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="reviews" />
        <Stack.Screen name="wallet" />
        <Stack.Screen name="wallet/withdraw" />
        <Stack.Screen name="wallet/cards" />
        <Stack.Screen name="wallet/cards/add" />
        <Stack.Screen name="wallet/history" />
        <Stack.Screen name="wallet/analytics" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="settings/language" />
        <Stack.Screen name="settings/security" />
        <Stack.Screen name="settings/about" />
        <Stack.Screen name="settings/support" />
        <Stack.Screen name="services" />
        <Stack.Screen name="availability" />
        <Stack.Screen name="verification" />
        <Stack.Screen name="profile-visibility" />
      </Stack>
      
      <MobileBottomNav />
    </View>
  )
}