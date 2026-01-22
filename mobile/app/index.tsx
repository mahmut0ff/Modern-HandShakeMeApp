import { useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, Animated, Easing } from 'react-native'
import { Link, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useAppSelector } from '../hooks/redux'

export default function WelcomePage() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current
  const logoBreathAnim = useRef(new Animated.Value(1)).current
  const featuresAnim = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]).current
  const buttonsAnim = useRef(new Animated.Value(0)).current
  const backgroundAnim = useRef(new Animated.Value(0)).current

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
    // Start animations sequence
    const startAnimations = () => {
      // Background animation
      Animated.timing(backgroundAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start()

      // Logo and title animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          delay: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          delay: 200,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(logoScaleAnim, {
          toValue: 1,
          duration: 800,
          delay: 300,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]).start()

      // Features animation (staggered)
      featuresAnim.forEach((anim, index) => {
        Animated.timing(anim, {
          toValue: 1,
          duration: 600,
          delay: 600 + (index * 150),
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start()
      })

      // Buttons animation
      Animated.timing(buttonsAnim, {
        toValue: 1,
        duration: 600,
        delay: 1200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start()
    }

    startAnimations()

    // Continuous pulsing animation for background circles
    const createPulseAnimation = () => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(backgroundAnim, {
            toValue: 1.1,
            duration: 3000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(backgroundAnim, {
            toValue: 1,
            duration: 3000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      )
    }

    // Start pulse animation after initial animation
    const pulseTimeout = setTimeout(() => {
      createPulseAnimation().start()
    }, 2000)

    // Logo breathing animation
    const logoBreathTimeout = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(logoBreathAnim, {
            toValue: 1.05,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(logoBreathAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start()
    }, 1500)

    return () => {
      clearTimeout(pulseTimeout)
      clearTimeout(logoBreathTimeout)
    }
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
      
      {/* Animated Background */}
      <Animated.View 
        className="absolute inset-0"
        style={{
          opacity: backgroundAnim,
        }}
      >
        <Animated.View 
          className="absolute top-10 left-5 w-32 h-32 bg-white/10 rounded-full"
          style={{
            transform: [{
              scale: backgroundAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1],
              })
            }]
          }}
        />
        <Animated.View 
          className="absolute top-32 right-12 w-24 h-24 bg-white/15 rounded-full"
          style={{
            transform: [{
              scale: backgroundAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1],
              })
            }]
          }}
        />
        <Animated.View 
          className="absolute bottom-24 left-16 w-40 h-40 bg-white/8 rounded-full"
          style={{
            transform: [{
              scale: backgroundAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.7, 1],
              })
            }]
          }}
        />
        <Animated.View 
          className="absolute bottom-16 right-8 w-28 h-28 bg-white/12 rounded-full"
          style={{
            transform: [{
              scale: backgroundAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.4, 1],
              })
            }]
          }}
        />
      </Animated.View>
      
      <View className="flex-1 px-6 pt-20 pb-12 justify-between">
        {/* Header */}
        <Animated.View 
          className="items-center"
          style={{
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: logoScaleAnim }
            ]
          }}
        >
          <Animated.View 
            className="w-24 h-24 bg-white rounded-3xl items-center justify-center mb-8 shadow-lg"
            style={{
              transform: [{ scale: logoBreathAnim }],
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 12,
            }}
          >
            <Text className="text-4xl">🤝</Text>
          </Animated.View>
          
          <Text className="text-4xl font-bold text-white text-center mb-4">
            HandShakeMe
          </Text>
          
          <Text className="text-xl text-white/90 text-center mb-4">
            Добро пожаловать!
          </Text>
          
          <Text className="text-white/70 text-center text-lg leading-relaxed max-w-sm px-2">
            Платформа для поиска проверенных мастеров в Кыргызстане
          </Text>
        </Animated.View>

        {/* Features */}
        <View className="space-y-8 py-8">
          {[
            { icon: 'search', title: 'Найдите мастера', desc: 'Более 1000 проверенных специалистов' },
            { icon: 'shield-checkmark', title: 'Безопасные сделки', desc: 'Деньги защищены до завершения работы' },
            { icon: 'star', title: 'Честные отзывы', desc: 'Рейтинги от реальных клиентов' }
          ].map((feature, index) => (
            <Animated.View 
              key={index}
              className="flex-row items-center gap-5"
              style={{
                opacity: featuresAnim[index],
                transform: [{
                  translateX: featuresAnim[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50, 0],
                  })
                }]
              }}
            >
              <View 
                className="w-14 h-14 bg-white/20 rounded-2xl items-center justify-center"
                style={{
                  shadowColor: '#fff',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                <Ionicons name={feature.icon as any} size={26} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold text-lg mb-2">{feature.title}</Text>
                <Text className="text-white/70 text-base leading-relaxed">{feature.desc}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Action Buttons */}
        <Animated.View 
          className="space-y-4"
          style={{
            opacity: buttonsAnim,
            transform: [{
              translateY: buttonsAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              })
            }]
          }}
        >
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity 
              className="w-full bg-white py-5 px-6 rounded-2xl shadow-lg"
              activeOpacity={0.9}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Text className="text-[#0165FB] font-bold text-lg text-center">Войти</Text>
            </TouchableOpacity>
          </Link>
          
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity 
              className="w-full border-2 border-white py-5 px-6 rounded-2xl"
              activeOpacity={0.9}
              style={{
                backgroundColor: 'transparent',
                borderColor: 'white',
              }}
            >
              <Text className="text-white font-bold text-lg text-center">Регистрация</Text>
            </TouchableOpacity>
          </Link>
          
          <View className="pt-4">
            <Text className="text-white/60 text-center text-base leading-relaxed px-4">
              Создавайте заказы или предлагайте свои услуги
            </Text>
          </View>
        </Animated.View>
      </View>
    </View>
  )
}