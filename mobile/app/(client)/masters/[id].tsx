import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Image, Linking, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useGetMasterProfileQuery } from '../../../services/profileApi'

export default function MasterDetailPage() {
  const { id } = useLocalSearchParams()
  const [activeTab, setActiveTab] = useState<'about' | 'portfolio' | 'reviews'>('about')
  const { data: master, isLoading, error } = useGetMasterProfileQuery(Number(id))

  const handleCall = () => {
    const phone = master?.user?.phone || master?.user_phone;
    if (phone) {
      Linking.openURL(`tel:${phone}`)
    }
  }

  const handleMessage = () => {
    router.push(`/(client)/chat/${master?.id}`)
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Ionicons
        key={i}
        name={i < rating ? 'star' : 'star-outline'}
        size={16}
        color={i < rating ? '#F59E0B' : '#D1D5DB'}
      />
    ))
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8F7FC]">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0165FB" />
          <Text className="text-gray-500 mt-4">Загрузка профиля...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error || !master) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8F7FC]">
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="alert-circle" size={64} color="#EF4444" />
          <Text className="text-xl font-bold text-gray-900 mt-4">Мастер не найден</Text>
          <Text className="text-gray-500 mt-2 text-center">Возможно, профиль был удалён</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-6 px-6 py-3 bg-[#0165FB] rounded-2xl"
          >
            <Text className="text-white font-semibold">Назад</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const fullName = master.user?.full_name || master.user_full_name || 
                   `${master.user?.first_name || master.user_first_name || ''} ${master.user?.last_name || master.user_last_name || ''}`.trim();
  const avatar = master.user?.avatar || master.user_avatar;

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-white px-4 py-4 border-b border-gray-100">
          <View className="flex-row items-center gap-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
            >
              <Ionicons name="arrow-back" size={20} color="#374151" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-900 flex-1">Профиль мастера</Text>
          </View>
        </View>

        {/* Master Info */}
        <View className="bg-white p-6 border-b border-gray-100">
          <View className="flex-row items-start gap-4 mb-4">
            <View className="relative">
              <View className="w-20 h-20 bg-[#0165FB] rounded-full items-center justify-center overflow-hidden">
                {avatar ? (
                  <Image source={{ uri: avatar }} className="w-full h-full" />
                ) : (
                  <Ionicons name="person" size={40} color="white" />
                )}
              </View>
              {master.is_verified && (
                <View className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full items-center justify-center shadow">
                  <Ionicons name="checkmark-circle" size={24} color="#0165FB" />
                </View>
              )}
            </View>
            
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900 mb-1">
                {fullName}
              </Text>
              <View className="flex-row items-center gap-2 mb-2">
                <View className="flex-row items-center gap-1">
                  <Ionicons name="star" size={16} color="#F59E0B" />
                  <Text className="font-semibold">{master.rating}</Text>
                </View>
                <Text className="text-gray-400">•</Text>
                <Text className="text-gray-600">{master.completed_orders || 0} проектов</Text>
              </View>
              {master.city && (
                <View className="flex-row items-center gap-1">
                  <Ionicons name="location" size={14} color="#6B7280" />
                  <Text className="text-gray-600">{master.city}</Text>
                </View>
              )}
            </View>
            
            {master.hourly_rate && (
              <View className="items-end">
                <Text className="text-2xl font-bold text-[#0165FB]">
                  {master.hourly_rate}
                </Text>
                <Text className="text-sm text-gray-500">сом/час</Text>
              </View>
            )}
          </View>

          {/* Tags */}
          <View className="flex-row flex-wrap gap-2 mb-4">
            <View className="px-3 py-1 bg-green-100 rounded-full">
              <View className="flex-row items-center gap-1">
                <Ionicons name="time" size={12} color="#059669" />
                <Text className="text-xs font-medium text-green-700">
                  {master.experience_years || 0} лет опыта
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleCall}
              className="flex-1 bg-[#0165FB] py-3 rounded-2xl"
            >
              <View className="flex-row items-center justify-center gap-2">
                <Ionicons name="call" size={18} color="white" />
                <Text className="text-white font-semibold">Позвонить</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleMessage}
              className="flex-1 bg-gray-100 py-3 rounded-2xl"
            >
              <View className="flex-row items-center justify-center gap-2">
                <Ionicons name="chatbubble" size={18} color="#374151" />
                <Text className="text-gray-700 font-semibold">Написать</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View className="bg-white px-4 py-2 border-b border-gray-100">
          <View className="flex-row">
            {[
              { key: 'about', label: 'О мастере' },
              { key: 'portfolio', label: 'Портфолио' },
              { key: 'reviews', label: 'Отзывы' }
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-3 border-b-2 ${
                  activeTab === tab.key
                    ? 'border-[#0165FB]'
                    : 'border-transparent'
                }`}
              >
                <Text className={`text-center font-medium ${
                  activeTab === tab.key
                    ? 'text-[#0165FB]'
                    : 'text-gray-500'
                }`}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tab Content */}
        <View className="p-4 flex flex-col gap-4 mt-4">
          {activeTab === 'about' && (
            <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mt-4">
              <Text className="text-lg font-bold text-gray-900 mb-3">Описание</Text>
              <Text className="text-gray-700 leading-relaxed">
                {master.bio || 'Описание не указано'}
              </Text>
            </View>
          )}

          {activeTab === 'portfolio' && (
            <View className="flex flex-col gap-4">
              {master.portfolio_items && master.portfolio_items.length > 0 ? (
                master.portfolio_items.map((item) => {
                  const firstImage = item.images?.[0];
                  return (
                    <View key={item.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                      <Text className="text-lg font-semibold text-gray-900 mb-2">
                        {item.title}
                      </Text>
                      {item.description && (
                        <Text className="text-gray-600 mb-3">{item.description}</Text>
                      )}
                      {firstImage && (
                        <View className="w-full h-48 bg-gray-100 rounded-2xl overflow-hidden">
                          <Image 
                            source={{ uri: firstImage.image_url || firstImage.image }} 
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                        </View>
                      )}
                    </View>
                  );
                })
              ) : (
                <View className="bg-white rounded-3xl p-8 items-center shadow-sm border border-gray-100">
                  <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                    <Ionicons name="images" size={32} color="#9CA3AF" />
                  </View>
                  <Text className="text-gray-500">Портфолио пусто</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'reviews' && (
            <View className="flex flex-col gap-4">
              {master.reviews && master.reviews.length > 0 ? (
                master.reviews.map((review) => (
                  <View key={review.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                    <View className="flex-row items-center justify-between mb-3">
                      <Text className="font-semibold text-gray-900">{review.client_name}</Text>
                      <View className="flex-row items-center gap-1">
                        {renderStars(review.rating)}
                      </View>
                    </View>
                    <Text className="text-gray-700 mb-2">{review.comment}</Text>
                    <Text className="text-xs text-gray-400">
                      {new Date(review.created_at).toLocaleDateString('ru-RU')}
                    </Text>
                  </View>
                ))
              ) : (
                <View className="bg-white rounded-3xl p-8 items-center shadow-sm border border-gray-100">
                  <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                    <Ionicons name="star" size={32} color="#9CA3AF" />
                  </View>
                  <Text className="text-gray-500">Отзывов пока нет</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}