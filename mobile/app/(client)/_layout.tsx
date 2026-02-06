import { View } from 'react-native'
import { Stack } from 'expo-router'
import MobileBottomNav from '../../components/MobileBottomNav'

export default function ClientLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      <MobileBottomNav />
    </View>
  )
}
