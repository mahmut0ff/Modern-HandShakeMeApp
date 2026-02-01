import { useEffect } from 'react'
import { router } from 'expo-router'

export default function LoginPage() {
  useEffect(() => {
    // Redirect to Telegram login since phone auth is removed
    router.replace('/(auth)/telegram-login')
  }, [])

  return null
}