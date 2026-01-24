import { useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, Animated, Easing, Image } from 'react-native'
import { Link, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useAppSelector } from '../hooks/redux'

export default function WelcomePage() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideUpAnim = useRef(new Animated.Value(30)).current
  const phoneAnim = useRef(new Animated.Value(0)).current
  const floatAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Redirect if authenticated
    if (isAuthenticated && user) {
      if (user.role === 'master' || user.role === 'admin') {
        router.replace('/(master)/dashboard')
      } else {
        router.replace('/(client)/dashboard')
      }
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(phoneAnim, {
        toValue: 1,
        duration: 1000,
        delay: 200,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start()

    // Floating animation for phone
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [])

  if (isAuthenticated && user) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F8F7FC]">
        <Text className="text-lg font-semibold text-gray-600">Перенаправление...</Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-[#0165FB]">
      <StatusBar style="light" />
      
      {/* Decorative waves */}
      <View className="absolute inset-0 overflow-hidden">
        <View className="absolute -top-20 left-0 right-0 h-40 bg-white/5 rounded-b-[100px]" />
        <View className="absolute -top-10 left-0 right-0 h-40 bg-white/5 rounded-b-[80px]" />
      </View>
      
      <View className="flex-1 px-8 pt-16 pb-10 justify-between">
        {/* Phone Illustration */}
        <Animated.View 
          className="items-center justify-center flex-1"
          style={{
            opacity: phoneAnim,
            transform: [
              { 
                scale: phoneAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                })
              },
              {
                translateY: floatAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -10],
                })
              }
            ]
          }}
        >
          <Image 
            source={require('../assets/images/hand-phone.png')}
            style={{ width: 300, height: 300 }}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Content */}
        <Animated.View 
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }]
          }}
        >
          {/* Title */}
          <View className="mb-8">
            <Text className="text-white text-3xl font-bold text-center mb-3">
              Легче найти мастера{'\n'}с HandShakeMe
            </Text>
            <Text className="text-white/70 text-center text-base leading-relaxed px-4">
              Находите проверенных специалистов{'\n'}для любых задач
            </Text>
          </View>

          {/* Button */}
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity 
              className="w-full bg-white py-5 rounded-3xl shadow-lg mb-4"
              activeOpacity={0.9}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <Text className="text-[#0165FB] font-bold text-lg text-center">
                Начать
              </Text>
            </TouchableOpacity>
          </Link>

          {/* Register link */}
          <View className="flex-row items-center justify-center gap-2">
            <Text className="text-white/60 text-sm">Нет аккаунта?</Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity activeOpacity={0.7}>
                <Text className="text-white font-semibold text-sm underline">
                  Регистрация
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </Animated.View>
      </View>
    </View>
  )
}