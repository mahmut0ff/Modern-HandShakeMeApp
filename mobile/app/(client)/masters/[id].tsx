import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Image, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

interface Master {
  id: number
  full_name: string
  first_name: string
  last_name: string
  company_name?: string
  avatar?: string
  city?: string
  rating?: string
  completed_projects_count: number
  hourly_rate?: string
  experience_years: number
  is_verified: boolean
  has_transport: boolean
  has_tools: boolean
  description?: string
  phone?: string
  portfolio?: PortfolioItem[]
  reviews?: Review[]
}

interface PortfolioItem {
  id: number
  title: string
  description?: string
  after_image?: string
  before_image?: string
  media?: { id: number; media_type: string; file_url: string }[]
}

interface Review {
  id: number
  rating: number
  comment: string
  client_name: string
  created_at: string
}

export default function MasterDetailPage() {
  const { id } = useLocalSearchParams()
  const [activeTab, setActiveTab] = useState<'about' | 'portfolio' | 'reviews'>('about')

  // Mock data - replace with actual API call
  const master: Master = {
    id: Number(id),
    full_name: 'Иван Петров',
    first_name: 'Иван',
    last_name: 'Петров',
    company_name: 'Ремонт Плюс',
    city: 'Бишкек',
    rating: '4.8',
    completed_projects_count: 45,
    hourly_rate: '1500',
    experience_years: 8,
    is_verified: true,
    has_transport: true,
    has_tools: true,
    description: 'Профессиональный мастер с 8-летним опытом работы. Специализируюсь на ремонте квартир, домов и офисов. Качественно выполняю все виды отделочных работ.',
    phone: '+996550308078',
    portfolio: [
      {
        id: 1,
        title: 'Ремонт ванной комнаты',
        description: 'Полный ремонт ванной комнаты с заменой сантехники',
        after_image: 'https://example.com/image1.jpg'
      },
      {
        id: 2,
        title: 'Кухня под ключ',
        description: 'Ремонт кухни с установкой мебели',
        after_image: 'https://example.com/image2.jpg'
      }
    ],
    reviews: [
      {
        id: 1,
        rating: 5,
        comment: 'Отличная работа! Все сделано качественно и в срок.',
        client_name: 'Анна К.',
        created_at: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        rating: 4,
        comment: 'Хороший мастер, рекомендую.',
        client_name: 'Петр С.',
        created_at: '2024-01-10T14:20:00Z'
      }
    ]
  }

  const handleCall = () => {
    if (master.phone) {
      Linking.openURL(`tel:${master.phone}`)
    }
  }

  const handleMessage = () => {
    router.push(`/(client)/chat/${master.id}`)
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
                {master.avatar ? (
                  <Image source={{ uri: master.avatar }} className="w-full h-full" />
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
                {master.full_name}
              </Text>
              {master.company_name && (
                <Text className="text-gray-600 mb-2">{master.company_name}</Text>
              )}
              <View className="flex-row items-center gap-2 mb-2">
                <View className="flex-row items-center gap-1">
                  <Ionicons name="star" size={16} color="#F59E0B" />
                  <Text className="font-semibold">{master.rating}</Text>
                </View>
                <Text className="text-gray-400">•</Text>
                <Text className="text-gray-600">{master.completed_projects_count} проектов</Text>
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
                  {master.experience_years} лет опыта
                </Text>
              </View>
            </View>
            {master.has_transport && (
              <View className="px-3 py-1 bg-blue-100 rounded-full">
                <View className="flex-row items-center gap-1">
                  <Ionicons name="car" size={12} color="#2563EB" />
                  <Text className="text-xs font-medium text-blue-700">Транспорт</Text>
                </View>
              </View>
            )}
            {master.has_tools && (
              <View className="px-3 py-1 bg-purple-100 rounded-full">
                <View className="flex-row items-center gap-1">
                  <Ionicons name="build" size={12} color="#7C3AED" />
                  <Text className="text-xs font-medium text-purple-700">Инструменты</Text>
                </View>
              </View>
            )}
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
                {master.description || 'Описание не указано'}
              </Text>
            </View>
          )}

          {activeTab === 'portfolio' && (
            <View className="flex flex-col gap-4">
              {master.portfolio && master.portfolio.length > 0 ? (
                master.portfolio.map((item) => (
                  <View key={item.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                    <Text className="text-lg font-semibold text-gray-900 mb-2">
                      {item.title}
                    </Text>
                    {item.description && (
                      <Text className="text-gray-600 mb-3">{item.description}</Text>
                    )}
                    {item.after_image && (
                      <View className="w-full h-48 bg-gray-100 rounded-2xl overflow-hidden">
                        <Image 
                          source={{ uri: item.after_image }} 
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      </View>
                    )}
                  </View>
                ))
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