import React from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface LoadingSpinnerProps {
  fullScreen?: boolean
  text?: string
  size?: 'small' | 'large'
  color?: string
}

export function LoadingSpinner({ fullScreen = false, text, size = 'large', color = '#0165FB' }: LoadingSpinnerProps) {
  const content = (
    <View className={`items-center justify-center ${fullScreen ? 'flex-1' : 'py-8'}`}>
      <ActivityIndicator size={size} color={color} />
      {text && (
        <Text className="text-gray-600 text-sm mt-3 text-center">{text}</Text>
      )}
    </View>
  )

  if (fullScreen) {
    return (
      <View className="flex-1 bg-gray-50">
        {content}
      </View>
    )
  }

  return content
}


export default LoadingSpinner;
