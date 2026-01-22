import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { Link, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAppSelector } from '../../hooks/redux'
import { useGetMyProjectsQuery } from '../../services/projectApi'
import { useGetMyApplicationsQuery } from '../../services/applicationApi'
import { useGetNotificationsQuery } from '../../services/notificationApi'
import { useGetMyMasterProfileQuery } from '../../services/profileApi'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { ErrorMessage } from '../../components/ErrorMessage'
import { formatCurrency, formatDate } from '../../utils/format'

export default function MasterDashboardPage() {
  const { user } = useAppSelector((state) => state.auth)
  const [refreshing, setRefreshing] = useState(false)

  // API queries
  const { 
    data: profile, 
    isLoading: profileLoading, 
    error: profileError,
    refetch: refetchProfile 
  } = useGetMyMasterProfileQuery()
  
  const { 
    data: projects = [], 
    isLoading: projectsLoading,
    error: projectsError,
    refetch: refetchProjects 
  } = useGetMyProjectsQuery({ status: 'in_progress' })
  
  const { 
    data: applications = [], 
    isLoading: applicationsLoading,
    error: applicationsError,
    refetch: refetchApplications 
  } = useGetMyApplicationsQuery({ ordering: '-created_at' })
  
  const { 
    data: notificationsData,
    isLoading: notificationsLoading,
    refetch: refetchNotifications 
  } = useGetNotificationsQuery({ is_read: false })

  const notifications = notificationsData?.results || []
  const unreadCount = notifications.length

  // Calculate stats from real data
  const stats = {
    activeProjects: projects.length,
    pendingApplications: applications.filter(app => app.status === 'pending').length,
    unreadNotifications: unreadCount,
    totalApplications: applications.length,
    rating: profile?.rating ? parseFloat(profile.rating) : 0,
    isVerified: profile?.is_verified || false,
    completedJobs: profile?.completed_orders || 0
  }

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await Promise.all([
        refetchProfile(),
        refetchProjects(),
        refetchApplications(),
        refetchNotifications()
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
      case 'pending':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Отправлен' }
      case 'viewed':
        return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Просмотрен' }
      case 'accepted':
        return { bg: 'bg-green-100', text: 'text-green-700', label: 'Принят' }
      case 'rejected':
        return { bg: 'bg-red-100', text: 'text-red-700', label: 'Отклонён' }
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', label: status }
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}
      >
        <View className="px-4 pt-4 pb-6 space-y-4">
          {/* Welcome Card */}
          <View className="bg-blue-500 rounded-3xl p-6 shadow-lg mb-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-white/70 text-sm mb-1">Добро пожаловать 👋</Text>
                <Text className="text-white text-2xl font-bold">{user?.firstName || 'Мастер'}</Text>
                <Text className="text-white/70 text-sm mt-2">Вот что происходит сегодня</Text>
              </View>
              <View className="w-16 h-16 bg-white/20 rounded-2xl items-center justify-center">
                <Ionicons name="person" size={32} color="white" />
              </View>
            </View>
            
            {/* Quick links */}
            <View className="flex-row gap-3 mt-4 pt-4 border-t border-white/20">
              <TouchableOpacity 
                onPress={() => router.push('/(master)/wallet')}
                className="flex-1 flex-row items-center justify-center gap-2 py-2.5 bg-white/20 rounded-xl"
              >
                <Ionicons name="wallet" size={16} color="white" />
                <Text className="text-white text-sm font-medium">Кошелёк</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => router.push('/(master)/notifications')}
                className="flex-1 flex-row items-center justify-center gap-2 py-2.5 bg-white/20 rounded-xl relative"
              >
                <Ionicons name="notifications" size={16} color="white" />
                <Text className="text-white text-sm font-medium">Уведомления</Text>
                {stats.unreadNotifications > 0 && (
                  <View className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full items-center justify-center">
                    <Text className="text-white text-xs font-bold">
                      {stats.unreadNotifications > 9 ? '9+' : stats.unreadNotifications}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
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
                  <Text className="text-2xl font-bold text-gray-900">{stats.rating}</Text>
                  <Text className="text-sm text-gray-500">Ваш рейтинг</Text>
                </View>
              </View>
              
              {/* Verification Status */}
              <View className="flex-row items-center gap-3">
                <View>
                  <Text className={`text-lg font-bold text-right ${
                    stats.isVerified ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {stats.isVerified ? 'Подтверждён' : 'Не подтверждён'}
                  </Text>
                  <Text className="text-sm text-gray-500">Статус аккаунта</Text>
                </View>
                <View className={`w-14 h-14 rounded-2xl items-center justify-center ${
                  stats.isVerified ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  <Ionicons 
                    name={stats.isVerified ? 'shield-checkmark' : 'shield'} 
                    size={24} 
                    color="white" 
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Stats Grid */}
          <View className="space-y-3 mb-4">
            <View className="flex-row gap-3 mb-3">
              <View className="flex-1 bg-[#0165FB] rounded-2xl p-4">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center">
                    <Ionicons name="briefcase" size={18} color="white" />
                  </View>
                  <View>
                    <Text className="text-white text-xl font-bold">{stats.activeProjects}</Text>
                    <Text className="text-white/70 text-xs">Активных проектов</Text>
                  </View>
                </View>
              </View>

              <View className="flex-1 bg-orange-500 rounded-2xl p-4">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center">
                    <Ionicons name="time" size={18} color="white" />
                  </View>
                  <View>
                    <Text className="text-white text-xl font-bold">{stats.pendingApplications}</Text>
                    <Text className="text-white/70 text-xs">Ожидают ответа</Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1 bg-purple-500 rounded-2xl p-4">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center">
                    <Ionicons name="notifications" size={18} color="white" />
                  </View>
                  <View>
                    <Text className="text-white text-xl font-bold">{stats.unreadNotifications}</Text>
                    <Text className="text-white/70 text-xs">Новых уведомлений</Text>
                  </View>
                </View>
              </View>

              <View className="flex-1 bg-green-500 rounded-2xl p-4">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center">
                    <Ionicons name="checkmark-done" size={18} color="white" />
                  </View>
                  <View>
                    <Text className="text-white text-xl font-bold">{stats.totalApplications}</Text>
                    <Text className="text-white/70 text-xs">Всего откликов</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Active Projects */}
          {projects.length > 0 && (
            <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-gray-900">Активные проекты</Text>
                <TouchableOpacity onPress={() => router.push('/(master)/projects')}>
                  <Text className="text-blue-600 text-sm font-medium">Все →</Text>
                </TouchableOpacity>
              </View>
              
              <View className="space-y-3">
                {projects.slice(0, 3).map(project => (
                  <TouchableOpacity
                    key={project.id}
                    onPress={() => router.push(`/(master)/projects/${project.id}`)}
                    className="p-4 rounded-2xl bg-blue-50 mb-3"
                  >
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1">
                        <Text className="font-semibold text-gray-900">
                          {project.order_title || project.order?.title || 'Проект'}
                        </Text>
                        <Text className="text-sm text-gray-600">
                          {project.client_name || project.client?.name || 'Клиент'}
                        </Text>
                      </View>
                      <View className="px-3 py-1 bg-blue-500 rounded-full">
                        <Text className="text-white text-sm font-semibold">
                          {formatCurrency(project.agreed_price)}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <View className="flex-1 bg-blue-200 rounded-full h-2">
                        <View 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${project.progress || 0}%` }}
                        />
                      </View>
                      <Text className="text-sm font-medium text-blue-600">{project.progress || 0}%</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Recent Applications */}
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-gray-900">Мои отклики</Text>
              {stats.totalApplications > 5 && (
                <TouchableOpacity onPress={() => router.push('/(master)/applications')}>
                  <Text className="text-blue-600 text-sm font-medium">
                    Все ({stats.totalApplications}) →
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            
            {applications.length === 0 ? (
              <View className="items-center py-6">
                <View className="w-14 h-14 bg-blue-100 rounded-full items-center justify-center mb-3">
                  <Ionicons name="document" size={24} color="#60A5FA" />
                </View>
                <Text className="text-gray-500 text-sm mb-2">Нет откликов</Text>
                <TouchableOpacity onPress={() => router.push('/(master)/orders')}>
                  <Text className="text-blue-600 text-sm font-medium">Найти заказы →</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="space-y-3">
                {applications.slice(0, 5).map(app => {
                  const statusBadge = getStatusBadge(app.status)
                  return (
                    <TouchableOpacity
                      key={app.id}
                      onPress={() => router.push(`/(master)/applications/${app.id}`)}
                      className="p-4 rounded-2xl bg-gray-50"
                    >
                      <View className="flex-row justify-between items-start mb-2">
                        <View className="flex-1 min-w-0">
                          <Text className="font-semibold text-gray-900" numberOfLines={1}>
                            {app.order_title || 'Заказ'}
                          </Text>
                          <Text className="text-sm text-gray-500">
                            {app.client_name || app.client?.name || 'Клиент'}
                          </Text>
                        </View>
                        <View className={`px-2.5 py-1 rounded-full ${statusBadge.bg}`}>
                          <Text className={`text-xs font-medium ${statusBadge.text}`}>
                            {statusBadge.label}
                          </Text>
                        </View>
                      </View>
                      <View className="flex-row items-center justify-between">
                        <Text className="text-sm text-gray-500">
                          {formatCurrency(app.proposed_price)}
                        </Text>
                        <Text className="text-xs text-gray-400">
                          {formatDate(app.created_at)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )
                })}
              </View>
            )}
            
            {stats.totalApplications > 5 && (
              <TouchableOpacity 
                onPress={() => router.push('/(master)/applications')}
                className="mt-4 py-3 bg-blue-50 rounded-2xl"
              >
                <Text className="text-center text-blue-600 font-medium">
                  Показать все отклики
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}