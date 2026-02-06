import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface ErrorMessageProps {
  fullScreen?: boolean
  message: string
  onRetry?: () => void
  retryText?: string
}

export function ErrorMessage({ 
  fullScreen = false, 
  message, 
  onRetry, 
  retryText = 'Повторить' 
}: ErrorMessageProps) {
  const content = (
    <View className={`items-center justify-center ${fullScreen ? 'flex-1' : 'py-8'}`}>
      <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
        <Ionicons name="alert-circle" size={32} color="#DC2626" />
      </View>
      <Text className="text-gray-900 text-lg font-medium mb-2 text-center">Ошибка</Text>
      <Text className="text-gray-600 text-sm mb-4 text-center px-4">{message}</Text>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          className="bg-blue-500 px-6 py-3 rounded-2xl"
        >
          <Text className="text-white font-semibold">{retryText}</Text>
        </TouchableOpacity>
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


export default ErrorMessage;
