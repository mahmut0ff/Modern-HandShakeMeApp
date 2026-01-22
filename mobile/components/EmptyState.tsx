import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface EmptyStateProps {
  icon: string
  title: string
  description: string
  actionText?: string
  onAction?: () => void
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  actionText, 
  onAction 
}: EmptyStateProps) {
  return (
    <View className="items-center justify-center py-12">
      <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
        <Ionicons name={icon as any} size={32} color="#9CA3AF" />
      </View>
      <Text className="text-gray-500 text-lg font-medium mb-2 text-center">{title}</Text>
      <Text className="text-gray-400 text-center mb-4 px-4">{description}</Text>
      {actionText && onAction && (
        <TouchableOpacity
          onPress={onAction}
          className="bg-blue-500 px-6 py-3 rounded-2xl"
        >
          <Text className="text-white font-semibold">{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}