import { View, Text, TouchableOpacity, ScrollView, RefreshControl, Dimensions } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useState, useEffect, useRef } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { Animated, Easing } from 'react-native'
import { useAuth } from '../../hooks/useAuth'
import { useGetClientDashboardStatsQuery } from '../../services/profileApi'
import { useGetCategoriesQuery } from '../../services/orderApi'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'

const { width } = Dimensions.get('window')
const GRADIENTS = [
  ['#0165FB', '#0147B3'], ['#10B981', '#059669'], ['#8B5CF6', '#7C3AED'],
  ['#F59E0B', '#D97706'], ['#EC4899', '#DB2777'], ['#06B6D4', '#0891B2'],
]

function CategoryCard({ category, index, onPress }: any) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current
  const opacityAnim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 1, duration: 400, delay: index * 80, easing: Easing.out(Easing.back(1.3)), useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, delay: index * 80, useNativeDriver: true }),
    ]).start()
  }, [])
  return (
    <Animated.View style={{ opacity: opacityAnim, transform: [{ scale: scaleAnim }], width: (width - 60) / 2 }}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <LinearGradient colors={GRADIENTS[index % GRADIENTS.length]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          className="p-5 rounded-3xl items-center" style={{ shadowColor: GRADIENTS[index % GRADIENTS.length][0], shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 6 }}>
          <View className="w-14 h-14 bg-white/20 rounded-2xl items-center justify-center mb-3">
            <Ionicons name={(category.icon || 'briefcase-outline') as any} size={28} color="white" />
          </View>
          <Text className="font-semibold text-white text-center" numberOfLines={2}>{category.name}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  )
}

function QuickActionButton({ icon, label, sublabel, color, bgColor, onPress }: any) {
  return (
    <TouchableOpacity onPress={onPress} className="flex-row items-center p-4 rounded-2xl mb-3" style={{ backgroundColor: bgColor }} activeOpacity={0.8}>
      <View className="w-12 h-12 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: color }}>
        <Ionicons name={icon} size={22} color="white" />
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-gray-900 text-base">{label}</Text>
        {sublabel && <Text className="text-gray-500 text-sm mt-0.5">{sublabel}</Text>}
      </View>
      <View className="w-8 h-8 bg-white/60 rounded-full items-center justify-center">
        <Ionicons name="chevron-forward" size={18} color="#6B7280" />
      </View>
    </TouchableOpacity>
  )
}


export default function ClientDashboard() {
  const { user, logout } = useAuth()
  const accessToken = useSelector((state: RootState) => state.auth.accessToken)
  const [refreshing, setRefreshing] = useState(false)
  const [greeting, setGreeting] = useState('')
  
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useGetClientDashboardStatsQuery(undefined, { skip: !accessToken })
  const { data: categoriesData, isLoading: categoriesLoading, refetch: refetchCategories } = useGetCategoriesQuery(undefined, { skip: !accessToken })
  const categories = Array.isArray(categoriesData) ? categoriesData.slice(0, 6) : []

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Доброе утро')
    else if (hour < 18) setGreeting('Добрый день')
    else setGreeting('Добрый вечер')
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await Promise.all([refetchStats(), refetchCategories()])
    setRefreshing(false)
  }

  if (statsLoading || categoriesLoading) return <LoadingSpinner fullScreen />

  return (
    <View className="flex-1 bg-[#F8F7FC]">
      <StatusBar style="light" />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0165FB" />}>
        
        <LinearGradient colors={['#0165FB', '#0147B3']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          className="pt-16 pb-10 px-6" style={{ borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}>
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-1">
              <Text className="text-white/70 text-base">{greeting},</Text>
              <Text className="text-white text-2xl font-bold mt-1">{user?.firstName || 'Пользователь'}! 👋</Text>
            </View>
            <View className="flex-row items-center gap-3">
              <TouchableOpacity onPress={() => router.push('/(client)/notifications')} className="w-11 h-11 bg-white/20 rounded-2xl items-center justify-center">
                <Ionicons name="notifications-outline" size={22} color="white" />
              </TouchableOpacity>
              <TouchableOpacity onPress={logout} className="w-11 h-11 bg-white/20 rounded-2xl items-center justify-center">
                <Ionicons name="log-out-outline" size={22} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity onPress={() => router.push('/(client)/masters')} className="bg-white rounded-2xl p-4 shadow-lg"
            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 }} activeOpacity={0.9}>
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-blue-50 rounded-xl items-center justify-center">
                <Ionicons name="search" size={20} color="#0165FB" />
              </View>
              <Text className="text-gray-400 ml-3 flex-1 text-base">Что нужно сделать?</Text>
              <View className="w-10 h-10 bg-gray-50 rounded-xl items-center justify-center">
                <Ionicons name="mic-outline" size={20} color="#6B7280" />
              </View>
            </View>
          </TouchableOpacity>
        </LinearGradient>

        <View className="px-6 -mt-4">
          {/* Order Stats */}
          {stats && (stats.active_orders > 0 || stats.completed_orders > 0) && (
            <View className="bg-white rounded-3xl p-5 mb-6 shadow-sm">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-bold text-gray-900">Мои заказы</Text>
                <TouchableOpacity onPress={() => router.push('/(client)/orders')}>
                  <Text className="text-[#0165FB] font-semibold">Все заказы</Text>
                </TouchableOpacity>
              </View>
              <View className="flex-row gap-3">
                <TouchableOpacity onPress={() => router.push('/(client)/orders?status=active')} className="flex-1 p-4 rounded-2xl bg-blue-50" activeOpacity={0.8}>
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="w-10 h-10 rounded-xl items-center justify-center bg-[#0165FB]">
                      <Ionicons name="time" size={20} color="white" />
                    </View>
                    <Text className="text-2xl font-bold text-gray-900">{stats.active_orders || 0}</Text>
                  </View>
                  <Text className="text-gray-600 text-sm">Активные</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/(client)/orders?status=completed')} className="flex-1 p-4 rounded-2xl bg-green-50" activeOpacity={0.8}>
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="w-10 h-10 rounded-xl items-center justify-center bg-green-500">
                      <Ionicons name="checkmark-circle" size={20} color="white" />
                    </View>
                    <Text className="text-2xl font-bold text-gray-900">{stats.completed_orders || 0}</Text>
                  </View>
                  <Text className="text-gray-600 text-sm">Завершённые</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}


          {/* Categories */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900">Популярные категории</Text>
              <TouchableOpacity onPress={() => router.push('/(client)/categories')}>
                <Text className="text-[#0165FB] font-semibold">Все</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row flex-wrap gap-4">
              {categories.map((category: any, index: number) => (
                <CategoryCard key={category.id} category={category} index={index}
                  onPress={() => router.push(`/(client)/masters?category=${category.id}`)} />
              ))}
            </View>
          </View>

          {/* Empty state for new users */}
          {(!stats || (stats.active_orders === 0 && stats.completed_orders === 0)) && (
            <View className="bg-white rounded-3xl p-6 mb-6 shadow-sm items-center">
              <LinearGradient colors={['#EFF6FF', '#DBEAFE']} className="w-20 h-20 rounded-full items-center justify-center mb-4">
                <Ionicons name="document-text-outline" size={36} color="#0165FB" />
              </LinearGradient>
              <Text className="text-lg font-bold text-gray-900 mb-2">Нет активных заказов</Text>
              <Text className="text-gray-500 text-center mb-4">Создайте первый заказ и найдите мастера для любой задачи</Text>
              <TouchableOpacity onPress={() => router.push('/(client)/create-order')} activeOpacity={0.9}>
                <LinearGradient colors={['#0165FB', '#0147B3']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  className="px-8 py-4 rounded-2xl">
                  <Text className="text-white font-bold text-base">Создать заказ</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Quick Actions */}
          <View className="bg-white rounded-3xl p-6 shadow-sm mb-8">
            <Text className="text-lg font-bold text-gray-900 mb-4">Быстрые действия</Text>
            <QuickActionButton icon="add-outline" label="Создать заказ" sublabel="Опишите что нужно сделать"
              color="#0165FB" bgColor="#EFF6FF" onPress={() => router.push('/(client)/create-order')} />
            <QuickActionButton icon="people-outline" label="Найти мастера" sublabel="Поиск по категориям"
              color="#10B981" bgColor="#ECFDF5" onPress={() => router.push('/(client)/masters')} />
            <QuickActionButton icon="chatbubble-outline" label="Сообщения" sublabel="Чат с мастерами"
              color="#8B5CF6" bgColor="#F5F3FF" onPress={() => router.push('/(client)/chat')} />
            <QuickActionButton icon="wallet-outline" label="Кошелек" sublabel="Баланс и транзакции"
              color="#F59E0B" bgColor="#FFFBEB" onPress={() => router.push('/(client)/wallet')} />
            <QuickActionButton icon="shield-checkmark-outline" label="Споры" sublabel="Решение проблем"
              color="#EC4899" bgColor="#FDF2F8" onPress={() => router.push('/(client)/disputes')} />
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
