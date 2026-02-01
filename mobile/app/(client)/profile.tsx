import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useAppSelector, useAppDispatch } from '../../hooks/redux'
import { logout } from '../../features/auth/authSlice'
import { 
  useGetMyClientProfileQuery 
} from '../../services/profileApi'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { ErrorMessage } from '../../components/ErrorMessage'

export default function ProfilePage() {
  const { user } = useAppSelector((state) => state.auth)
  const dispatch = useAppDispatch()

  // API queries
  const { 
    data: profile, 
    isLoading, 
    error,
    refetch 
  } = useGetMyClientProfileQuery();

  const handleLogout = () => {
    Alert.alert(
      'Выход из аккаунта',
      'Вы уверены, что хотите выйти?',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Выйти', 
          style: 'destructive',
          onPress: () => {
            dispatch(logout())
            router.replace('/')
          }
        }
      ]
    )
  }

  const menuItems = [
    {
      id: 'orders',
      title: 'Мои заказы',
      subtitle: 'Управление заказами',
      icon: 'briefcase',
      route: '/(client)/orders',
      color: '#3B82F6'
    },
    {
      id: 'projects',
      title: 'Проекты',
      subtitle: 'Активные и завершённые',
      icon: 'folder',
      route: '/(client)/projects',
      color: '#10B981'
    },
    {
      id: 'wallet',
      title: 'Кошелёк',
      subtitle: 'Баланс и платежи',
      icon: 'wallet',
      route: '/(client)/wallet',
      color: '#F59E0B'
    },
    {
      id: 'notifications',
      title: 'Уведомления',
      subtitle: 'Настройки уведомлений',
      icon: 'notifications',
      route: '/(client)/notifications',
      color: '#8B5CF6'
    },
    {
      id: 'reviews',
      title: 'Отзывы',
      subtitle: 'Мои отзывы о мастерах',
      icon: 'star',
      route: '/(client)/reviews',
      color: '#F59E0B'
    },
    {
      id: 'disputes',
      title: 'Споры',
      subtitle: 'Решение конфликтов',
      icon: 'shield',
      route: '/(client)/disputes',
      color: '#EF4444'
    }
  ]

  const settingsItems = [
    {
      id: 'edit-profile',
      title: 'Редактировать профиль',
      icon: 'person-circle',
      route: '/(client)/edit-profile'
    },
    {
      id: 'settings',
      title: 'Настройки',
      icon: 'settings',
      route: '/(client)/settings'
    },
    {
      id: 'security',
      title: 'Безопасность',
      icon: 'lock-closed',
      route: '/(client)/settings/security'
    },
    {
      id: 'language',
      title: 'Язык',
      icon: 'language',
      subtitle: 'Русский',
      route: '/(client)/settings/language'
    },
    {
      id: 'help',
      title: 'Помощь и поддержка',
      icon: 'help-circle',
      route: '/(client)/settings/support'
    },
    {
      id: 'about',
      title: 'О приложении',
      icon: 'information-circle',
      route: '/(client)/settings/about'
    }
  ]

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Загрузка профиля..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        fullScreen
        message="Не удалось загрузить профиль"
        onRetry={refetch}
      />
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}>
        {/* Header */}
        <View className="bg-blue-500 px-4 pt-12 pb-8">
          <View className="flex-row items-center gap-4">
            <View className="w-20 h-20 bg-white/20 rounded-full items-center justify-center">
              <Text className="text-white text-2xl font-bold">
                {profile?.user?.first_name?.charAt(0) || user?.firstName?.charAt(0) || 'К'}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-white text-2xl font-bold">
                {profile?.user?.first_name} {profile?.user?.last_name}
              </Text>
              <Text className="text-white/80 text-sm">{profile?.user?.phone}</Text>
              <View className="flex-row items-center gap-2 mt-1">
                <View className="px-2 py-1 bg-white/20 rounded-full">
                  <Text className="text-white text-xs font-medium">Клиент</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => router.push('/(client)/edit-profile')}
              className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
            >
              <Ionicons name="pencil" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View className="px-4 -mt-4 mb-4">
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <View className="flex-row justify-between">
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-gray-900">{profile?.rating || '0.0'}</Text>
                <Text className="text-sm text-gray-500">Рейтинг</Text>
              </View>
              <View className="w-px bg-gray-200" />
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-gray-900">{profile?.completed_orders || 0}</Text>
                <Text className="text-sm text-gray-500">Завершено</Text>
              </View>
              <View className="w-px bg-gray-200" />
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-gray-900">{profile?.total_orders || 0}</Text>
                <Text className="text-sm text-gray-500">Заказов</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Main Menu */}
        <View className="px-4 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-4">Основное</Text>
          <View className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => router.push(item.route as any)}
                className={`flex-row items-center p-4 ${
                  index < menuItems.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <View 
                  className="w-10 h-10 rounded-2xl items-center justify-center mr-4"
                  style={{ backgroundColor: `${item.color}20` }}
                >
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900">{item.title}</Text>
                  <Text className="text-sm text-gray-500">{item.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Settings */}
        <View className="px-4 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-4">Настройки</Text>
          <View className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {settingsItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => router.push(item.route as any)}
                className={`flex-row items-center p-4 ${
                  index < settingsItems.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <View className="w-10 h-10 bg-gray-100 rounded-2xl items-center justify-center mr-4">
                  <Ionicons name={item.icon as any} size={20} color="#6B7280" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900">{item.title}</Text>
                  {item.subtitle && (
                    <Text className="text-sm text-gray-500">{item.subtitle}</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout */}
        <View className="px-4 pb-8">
          <TouchableOpacity 
            onPress={handleLogout}
            className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex-row items-center justify-center gap-3"
          >
            <Ionicons name="log-out" size={20} color="#EF4444" />
            <Text className="text-red-500 font-semibold text-lg">Выйти из аккаунта</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}