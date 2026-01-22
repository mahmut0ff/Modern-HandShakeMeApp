import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { Link, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAppSelector } from '../../hooks/redux'
import { useGetMyOrdersQuery } from '../../services/orderApi'
import { useGetMyProjectsQuery } from '../../services/projectApi'
import { useGetNotificationsQuery } from '../../services/notificationApi'
import { useGetMyClientProfileQuery } from '../../services/profileApi'
import { useGetWalletQuery } from '../../services/walletApi'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { ErrorMessage } from '../../components/ErrorMessage'
import { formatCurrency } from '../../utils/format'

export default function ClientDashboardPage() {
  const { user } = useAppSelector((state) => state.auth)
  const [refreshing, setRefreshing] = React.useState(false)

  // API queries
  const { 
    data: profile, 
    isLoading: profileLoading, 
    error: profileError,
    refetch: refetchProfile 
  } = useGetMyClientProfileQuery()
  
  const { 
    data: activeOrders = [], 
    isLoading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders 
  } = useGetMyOrdersQuery({ status: 'active' })
  
  const { 
    data: activeProjects = [], 
    isLoading: projectsLoading,
    error: projectsError,
    refetch: refetchProjects 
  } = useGetMyProjectsQuery({ status: 'in_progress', role: 'client' })
  
  const { 
    data: notificationsData,
    isLoading: notificationsLoading,
    refetch: refetchNotifications 
  } = useGetNotificationsQuery({ is_read: false })

  const { 
    data: wallet,
    isLoading: walletLoading,
    refetch: refetchWallet 
  } = useGetWalletQuery()

  const notifications = notificationsData?.results || []
  const unreadCount = notifications.length
  const rating = profile?.rating ? parseFloat(profile.rating) : 0
  const completedProjects = profile?.completed_orders || 0

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await Promise.all([
        refetchProfile(),
        refetchOrders(),
        refetchProjects(),
        refetchNotifications(),
        refetchWallet()
      ])
    } catch (error) {
      console.error('Refresh error:', error)
    } finally {
      setRefreshing(false)
    }
  }

  // Show loading state on initial load
  if (profileLoading && !profile) {
    return <LoadingSpinner fullScreen text="Загрузка профиля..." />
  }

  // Show error state if profile fails to load
  if (profileError && !profile) {
    return (
      <ErrorMessage
        fullScreen
        message="Не удалось загрузить профиль"
        onRetry={refetchProfile}
      />
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      <ScrollView 
        className="flex-1 px-4 pt-4 pb-6" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}
      >
        <View className="space-y-4">
          {/* Welcome Card */}
          <View className="bg-[#0165FB] rounded-3xl p-6 text-white shadow-lg mb-4" style={{
            shadowColor: '#0165FB',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white/70 text-sm mb-1">Добро пожаловать 👋</Text>
                <Text className="text-white text-2xl font-bold">{user?.firstName || 'Клиент'}</Text>
                <Text className="text-white/70 text-sm mt-2">Управляйте своими заказами</Text>
              </View>
              <View className="w-16 h-16 bg-white/20 rounded-2xl items-center justify-center">
                <Ionicons name="person" size={32} color="white" />
              </View>
            </View>
            
            {/* Quick links */}
            <View className="flex-row gap-3 mt-4 pt-4 border-t border-white/20">
              <Link href="/(client)/wallet" asChild>
                <TouchableOpacity className="flex-1 flex-row items-center justify-center gap-2 py-2.5 bg-white/20 rounded-xl">
                  <Ionicons name="wallet" size={16} color="white" />
                  <Text className="text-white text-sm font-medium">Кошелёк</Text>
                </TouchableOpacity>
              </Link>
              
              <Link href="/(client)/notifications" asChild>
                <TouchableOpacity className="flex-1 flex-row items-center justify-center gap-2 py-2.5 bg-white/20 rounded-xl relative">
                  <Ionicons name="notifications" size={16} color="white" />
                  <Text className="text-white text-sm font-medium">Уведомления</Text>
                  {unreadCount > 0 && (
                    <View className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full items-center justify-center">
                      <Text className="text-white text-xs font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Link>
            </View>
          </View>

          {/* Rating & Verification Status */}
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
            <View className="flex-row items-center justify-between">
              {/* Rating */}
              <View className="flex-row items-center gap-3">
                <View className="w-14 h-14 bg-yellow-400 rounded-2xl items-center justify-center">
                  <Ionicons name="star" size={24} color="white" />
                </View>
                <View>
                  <Text className="text-2xl font-bold text-gray-900">{rating.toFixed(1)}</Text>
                  <Text className="text-sm text-gray-500">Ваш рейтинг</Text>
                </View>
              </View>
              
              {/* Completed Projects */}
              <View className="flex-row items-center gap-3">
                <View className="text-right">
                  <Text className="text-2xl font-bold text-gray-900">{completedProjects}</Text>
                  <Text className="text-sm text-gray-500">Завершено</Text>
                </View>
                <View className="w-14 h-14 bg-green-500 rounded-2xl items-center justify-center">
                  <Ionicons name="checkmark-circle" size={24} color="white" />
                </View>
              </View>
            </View>
          </View>

          {/* Stats Grid - 4 карточки статистики */}
          <View className="space-y-3 mb-4">
            <View className="flex-row gap-3">
              <View className="flex-1 bg-[#0165FB] rounded-2xl p-4">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center">
                    <Ionicons name="briefcase" size={18} color="white" />
                  </View>
                  <View>
                    <Text className="text-xl font-bold text-white">{activeOrders.length}</Text>
                    <Text className="text-xs text-white/70">Активных заказов</Text>
                  </View>
                </View>
              </View>
              
              <View className="flex-1 bg-green-500 rounded-2xl p-4">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center">
                    <Ionicons name="construct" size={18} color="white" />
                  </View>
                  <View>
                    <Text className="text-xl font-bold text-white">{activeProjects.length}</Text>
                    <Text className="text-xs text-white/70">В работе</Text>
                  </View>
                </View>
              </View>
            </View>
            
            <View className="flex-row gap-3">
              <View className="flex-1 bg-orange-500 rounded-2xl p-4">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center">
                    <Ionicons name="wallet" size={18} color="white" />
                  </View>
                  <View>
                    <Text className="text-xl font-bold text-white">
                      {wallet ? formatCurrency(wallet.balance).replace(' сом', '') : '0'}
                    </Text>
                    <Text className="text-xs text-white/70">Баланс (сом)</Text>
                  </View>
                </View>
              </View>
              
              <View className="flex-1 bg-purple-500 rounded-2xl p-4">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center">
                    <Ionicons name="chatbubbles" size={18} color="white" />
                  </View>
                  <View>
                    <Text className="text-xl font-bold text-white">{unreadCount}</Text>
                    <Text className="text-xs text-white/70">Сообщений</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Active Orders */}
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900">Активные заказы</Text>
              <Link href="/(client)/orders" asChild>
                <TouchableOpacity>
                  <Text className="text-[#0165FB] font-medium">Все</Text>
                </TouchableOpacity>
              </Link>
            </View>
            
            {activeOrders.length === 0 ? (
              <View className="items-center py-8">
                <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                  <Ionicons name="briefcase-outline" size={32} color="#9CA3AF" />
                </View>
                <Text className="text-gray-500 text-lg font-medium mb-2">Нет активных заказов</Text>
                <Text className="text-gray-400 text-center mb-4">
                  Создайте свой первый заказ и найдите мастера
                </Text>
                <Link href="/(client)/create-order" asChild>
                  <TouchableOpacity className="bg-[#0165FB] px-6 py-3 rounded-2xl">
                    <Text className="text-white font-semibold">Создать заказ</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            ) : (
              <View className="space-y-3">
                {activeOrders.map((order: any, index: number) => (
                  <TouchableOpacity 
                    key={index}
                    className="p-4 bg-gray-50 rounded-2xl"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="font-semibold text-gray-900 flex-1" numberOfLines={1}>
                        {order.title}
                      </Text>
                      <View className="bg-blue-100 px-2 py-1 rounded-full">
                        <Text className="text-blue-700 text-xs font-medium">Активен</Text>
                      </View>
                    </View>
                    <Text className="text-gray-600 text-sm mb-2" numberOfLines={2}>
                      {order.description}
                    </Text>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-[#0165FB] font-semibold">
                        {order.budget} сом
                      </Text>
                      <Text className="text-gray-400 text-xs">
                        {order.applications_count || 0} откликов
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Active Projects */}
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900">Проекты в работе</Text>
              <Link href="/(client)/projects" asChild>
                <TouchableOpacity>
                  <Text className="text-[#0165FB] font-medium">Все</Text>
                </TouchableOpacity>
              </Link>
            </View>
            
            {activeProjects.length === 0 ? (
              <View className="items-center py-6">
                <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mb-3">
                  <Ionicons name="construct-outline" size={24} color="#9CA3AF" />
                </View>
                <Text className="text-gray-500 font-medium mb-1">Нет проектов в работе</Text>
                <Text className="text-gray-400 text-sm text-center">
                  Проекты появятся после принятия откликов
                </Text>
              </View>
            ) : (
              <View className="space-y-3">
                {activeProjects.map((project: any, index: number) => (
                  <TouchableOpacity 
                    key={index}
                    className="p-4 bg-gray-50 rounded-2xl"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="font-semibold text-gray-900 flex-1" numberOfLines={1}>
                        {project.title}
                      </Text>
                      <View className="bg-green-100 px-2 py-1 rounded-full">
                        <Text className="text-green-700 text-xs font-medium">В работе</Text>
                      </View>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-gray-600 text-sm">
                        Мастер: {project.master?.firstName} {project.master?.lastName}
                      </Text>
                      <Text className="text-[#0165FB] font-semibold">
                        {project.budget} сом
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}