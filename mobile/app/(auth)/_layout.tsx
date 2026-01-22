import { Stack, router } from 'expo-router'
import { useEffect } from 'react'
import { useAppSelector } from '../../hooks/redux'

export default function AuthLayout() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'master' || user.role === 'admin') {
        router.replace('/(master)/dashboard')
      } else {
        router.replace('/(client)/dashboard')
      }
    }
  }, [isAuthenticated, user])

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  )
}