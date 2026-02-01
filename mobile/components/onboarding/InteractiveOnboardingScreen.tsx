import React, { useState, useRef } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Animated, Dimensions } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'

const { width } = Dimensions.get('window')

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: keyof typeof Ionicons.glyphMap
  color: string
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: '1',
    title: 'Найдите мастера',
    description: 'Выберите нужную услугу и найдите проверенного специалиста рядом с вами',
    icon: 'search-outline',
    color: '#0165FB'
  },
  {
    id: '2',
    title: 'Безопасная оплата',
    description: 'Оплачивайте услуги безопасно через приложение. Деньги переводятся мастеру после выполнения работы',
    icon: 'shield-checkmark-outline',
    color: '#10B981'
  },
  {
    id: '3',
    title: 'Оценивайте работу',
    description: 'Оставляйте отзывы и помогайте другим пользователям выбирать лучших мастеров',
    icon: 'star-outline',
    color: '#F59E0B'
  }
]

interface Props {
  onComplete: () => void
}

export function InteractiveOnboardingScreen({ onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(0)
  const scrollViewRef = useRef<ScrollView>(null)
  const fadeAnim = useRef(new Animated.Value(1)).current

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentStep(currentStep + 1)
        scrollViewRef.current?.scrollTo({ x: (currentStep + 1) * width, animated: true })
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start()
      })
    } else {
      onComplete()
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  const handleStepPress = (index: number) => {
    setCurrentStep(index)
    scrollViewRef.current?.scrollTo({ x: index * width, animated: true })
  }

  const currentStepData = onboardingSteps[currentStep]

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      {/* Skip Button */}
      <View className="absolute top-16 right-6 z-10">
        <TouchableOpacity onPress={handleSkip} className="px-4 py-2">
          <Text className="text-gray-500 font-medium">Пропустить</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View className="flex-1 items-center justify-center px-8">
        <Animated.View 
          style={{ opacity: fadeAnim }}
          className="items-center"
        >
          {/* Icon */}
          <View 
            className="w-24 h-24 rounded-full items-center justify-center mb-8"
            style={{ backgroundColor: `${currentStepData.color}20` }}
          >
            <Ionicons 
              name={currentStepData.icon} 
              size={48} 
              color={currentStepData.color} 
            />
          </View>

          {/* Title */}
          <Text className="text-3xl font-bold text-gray-900 text-center mb-4">
            {currentStepData.title}
          </Text>

          {/* Description */}
          <Text className="text-lg text-gray-600 text-center leading-relaxed mb-12">
            {currentStepData.description}
          </Text>
        </Animated.View>
      </View>

      {/* Bottom Section */}
      <View className="px-8 pb-12">
        {/* Step Indicators */}
        <View className="flex-row justify-center items-center mb-8">
          {onboardingSteps.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleStepPress(index)}
              className="mx-1"
            >
              <View
                className={`w-3 h-3 rounded-full ${
                  index === currentStep ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Next Button */}
        <TouchableOpacity
          onPress={handleNext}
          className="w-full bg-blue-500 py-4 rounded-2xl shadow-lg"
          style={{
            shadowColor: '#0165FB',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Text className="text-white font-bold text-lg text-center">
            {currentStep === onboardingSteps.length - 1 ? 'Начать' : 'Далее'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}