import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useGetDisputeQuery, useSendDisputeMessageMutation } from '../../../services/disputeApi'
import { LoadingSpinner } from '../../../components/LoadingSpinner'
import { ErrorMessage } from '../../../components/ErrorMessage'
import { formatDate, formatCurrency } from '../../../utils/format'

export default function DisputeDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const disputeId = parseInt(id || '0')
  
  const [newMessage, setNewMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { 
    data: dispute, 
    isLoading, 
    error, 
    refetch 
  } = useGetDisputeQuery(disputeId)

  const [sendMessage] = useSendDisputeMessageMutation()

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    setIsSubmitting(true)
    try {
      await sendMessage({
        disputeId,
        data: { message: newMessage.trim() }
      }).unwrap()
      
      setNewMessage('')
      refetch()
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось отправить сообщение')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-800'
      case 'in_mediation': return 'bg-blue-100 text-blue-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Открыт'
      case 'in_mediation': return 'На медиации'
      case 'resolved': return 'Решён'
      case 'closed': return 'Закрыт'
      default: return status
    }
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Загрузка спора..." />
  }

  if (error || !dispute) {
    return (
      <ErrorMessage
        fullScreen
        message="Не удалось загрузить информацию о споре"
        onRetry={refetch}
      />
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={20} color="#374151" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900">Спор #{dispute.id}</Text>
            <Text className="text-gray-600">{dispute.project?.title || 'Проект'}</Text>
          </View>
          <View className={`px-3 py-1 rounded-full ${getStatusColor(dispute.status)}`}>
            <Text className="text-sm font-medium">{getStatusText(dispute.status)}</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4">
          {/* Dispute Info */}
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
            <Text className="text-lg font-bold text-gray-900 mb-4">Информация о споре</Text>
            
            <View className="space-y-3">
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Причина:</Text>
                <Text className="font-semibold text-gray-900">{dispute.reason}</Text>
              </View>
              
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Приоритет:</Text>
                <Text className="font-semibold text-gray-900">{dispute.priority}</Text>
              </View>
              
              {dispute.amount_disputed && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Спорная сумма:</Text>
                  <Text className="font-semibold text-gray-900">
                    {formatCurrency(dispute.amount_disputed)}
                  </Text>
                </View>
              )}
              
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Создан:</Text>
                <Text className="font-semibold text-gray-900">
                  {formatDate(dispute.created_at)}
                </Text>
              </View>
            </View>

            <View className="mt-4 pt-4 border-t border-gray-100">
              <Text className="text-sm font-medium text-gray-700 mb-2">Описание:</Text>
              <Text className="text-gray-900">{dispute.description}</Text>
            </View>
          </View>

          {/* Participants */}
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
            <Text className="text-lg font-bold text-gray-900 mb-4">Участники</Text>
            
            <View className="space-y-3">
              <View className="flex-row items-center gap-3">
                <View className="w-12 h-12 bg-red-100 rounded-2xl items-center justify-center">
                  <Ionicons name="person" size={20} color="#EF4444" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900">{dispute.initiator.name}</Text>
                  <Text className="text-gray-600">Инициатор спора • {dispute.initiator.role}</Text>
                </View>
              </View>
              
              <View className="flex-row items-center gap-3">
                <View className="w-12 h-12 bg-blue-100 rounded-2xl items-center justify-center">
                  <Ionicons name="person" size={20} color="#3B82F6" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900">{dispute.respondent.name}</Text>
                  <Text className="text-gray-600">Ответчик • {dispute.respondent.role}</Text>
                </View>
              </View>

              {dispute.mediator && (
                <View className="flex-row items-center gap-3">
                  <View className="w-12 h-12 bg-purple-100 rounded-2xl items-center justify-center">
                    <Ionicons name="shield-checkmark" size={20} color="#8B5CF6" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900">{dispute.mediator.name}</Text>
                    <Text className="text-gray-600">Медиатор</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Resolution */}
          {dispute.resolution && (
            <View className="bg-green-50 rounded-3xl p-5 border border-green-200 mb-4">
              <View className="flex-row items-center gap-3 mb-3">
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <Text className="text-lg font-bold text-green-900">Решение</Text>
              </View>
              <Text className="text-green-800">{dispute.resolution}</Text>
              {dispute.amount_resolved && (
                <Text className="text-green-800 font-semibold mt-2">
                  Сумма возмещения: {formatCurrency(dispute.amount_resolved)}
                </Text>
              )}
            </View>
          )}

          {/* Actions */}
          {dispute.status === 'open' && (
            <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
              <Text className="text-lg font-bold text-gray-900 mb-4">Действия</Text>
              
              <View className="flex-row gap-3">
                <TouchableOpacity className="flex-1 bg-blue-500 py-3 rounded-2xl">
                  <Text className="text-center text-white font-semibold">Запросить медиацию</Text>
                </TouchableOpacity>
                
                <TouchableOpacity className="flex-1 bg-gray-500 py-3 rounded-2xl">
                  <Text className="text-center text-white font-semibold">Закрыть спор</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Message Input */}
      {dispute.status !== 'closed' && (
        <View className="bg-white border-t border-gray-100 p-4">
          <View className="flex-row items-end gap-3">
            <TextInput
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Написать сообщение..."
              multiline
              maxLength={500}
              className="flex-1 max-h-24 p-3 bg-gray-50 rounded-2xl text-gray-900"
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={isSubmitting || !newMessage.trim()}
              className={`w-12 h-12 rounded-2xl items-center justify-center ${
                isSubmitting || !newMessage.trim() ? 'bg-gray-300' : 'bg-[#0165FB]'
              }`}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={isSubmitting || !newMessage.trim() ? '#9CA3AF' : 'white'} 
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  )
}