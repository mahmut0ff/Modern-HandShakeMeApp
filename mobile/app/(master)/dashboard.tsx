import { View, Text, TouchableOpacity, ScrollView, RefreshControl, Dimensions } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useState, useEffect, useRef } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Animated, Easing } from 'react-native'
import { useAuth } from '../../hooks/useAuth'
import { useGetMasterDashboardStatsQuery } from '../../services/profileApi'
import { useGetVerificationStatusQuery } from '../../services/verificationApi'
import { LoadingSpinner } from '../../components/LoadingSpinner'

const { width } = Dimensions.get('window')

// Animated stat card component
function AnimatedStatCard({ 
  title, 
  value, 
  icon, 
  gradient, 
  delay = 0,
  suffix = '',
  onPress 
}: { 
  title: string
  value: number | string
  icon: string
  gradient: string[]
  delay?: number
  suffix?: string
  onPress?: () => void
}) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current
  const opacityAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        delay,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  return (
    <Animated.View style={{ opacity: opacityAnim, transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="p-5 rounded-3xl min-h-[120px]"
          style={{
            shadowColor: gradient[0],
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center">
              <Ionicons name={icon as any} size={24} color="white" />
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
          </View>
          <Text className="text-white/80 text-sm font-medium">{title}</Text>
          <Text className="text-white text-3xl font-bold mt-1">
            {value}{suffix ? suffix : ''}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  )
}

// Quick action button component
function QuickActionButton({ 
  icon, 
  label, 
  sublabel,
  color, 
  bgColor,
  onPress 
}: { 
  icon: string
  label: string
  sublabel?: string
  color: string
  bgColor: string
  onPress: () => void
}) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className="flex-row items-center p-4 rounded-2xl mb-3"
      style={{ backgroundColor: bgColor }}
      activeOpacity={0.8}
    >
      <View 
        className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
        style={{ backgroundColor: color }}
      >
        <Ionicons name={icon as any} size={22} color="white" />
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

// Progress ring component
function ProgressRing({ progress, size = 80, strokeWidth = 8, color = '#0165FB' }: {
  progress: number
  size?: number
  strokeWidth?: number
  color?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <View style={{ width: size, height: size }}>
      <View className="absolute inset-0 items-center justify-center">
        <Text className="text-xl font-bold text-gray-900">{Math.round(progress)}%</Text>
      </View>
      <View 
        className="absolute inset-0 rounded-full border-4"
        style={{ borderColor: `${color}20` }}
      />
      <View 
        className="absolute inset-0 rounded-full border-4"
        style={{ 
          borderColor: color,
          borderTopColor: 'transparent',
          borderRightColor: progress > 25 ? color : 'transparent',
          borderBottomColor: progress > 50 ? color : 'transparent',
          borderLeftColor: progress > 75 ? color : 'transparent',
          transform: [{ rotate: '-90deg' }]
        }}
      />
    </View>
  )
}

export default function MasterDashboard() {
  const { user, logout } = useAuth()
  const { data: stats, isLoading, refetch } = useGetMasterDashboardStatsQuery()
  const { data: verificationStatus } = useGetVerificationStatusQuery()
  const [refreshing, setRefreshing] = useState(false)
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Доброе утро')
    else if (hour < 18) setGreeting('Добрый день')
    else setGreeting('Добрый вечер')
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  const completionRate = stats?.completed_orders && stats?.active_orders 
    ? Math.round((stats.completed_orders / (stats.completed_orders + stats.active_orders)) * 100)
    : 0

  return (
    <View className="flex-1 bg-[#F8F7FC]">
      <StatusBar style="light" />
      
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0165FB" />}
      >
        {/* Header with gradient */}
        <LinearGradient
          colors={['#0165FB', '#0147B3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="pt-16 pb-8 px-6"
          style={{ borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}
        >
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-1">
              <Text className="text-white/70 text-base">{greeting},</Text>
              <Text className="text-white text-2xl font-bold mt-1">
                {user?.firstName || 'Мастер'}! 👋
              </Text>
            </View>
            
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                onPress={() => router.push('/(master)/notifications')}
                className="w-11 h-11 bg-white/20 rounded-2xl items-center justify-center"
              >
                <Ionicons name="notifications-outline" size={22} color="white" />
                {stats?.unread_messages != null && stats.unread_messages > 0 && (
                  <View className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full items-center justify-center">
                    <Text className="text-white text-xs font-bold">{stats.unread_messages}</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={logout}
                className="w-11 h-11 bg-white/20 rounded-2xl items-center justify-center"
              >
                <Ionicons name="log-out-outline" size={22} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Today's summary card */}
          <View className="bg-white/10 rounded-2xl p-4 backdrop-blur-lg">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white/70 text-sm">Сегодня заработано</Text>
                <Text className="text-white text-3xl font-bold mt-1">
                  {((stats?.total_earned || 0) / 30).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} сом
                </Text>
              </View>
              <View className="items-center">
                <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center">
                  <Text className="text-white text-2xl font-bold">{stats?.active_orders || 0}</Text>
                </View>
                <Text className="text-white/70 text-xs mt-1">активных</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View className="px-6 -mt-4">
          {/* Stats Grid */}
          <View className="flex-row gap-4 mb-6">
            <View className="flex-1">
              <AnimatedStatCard
                title="Всего заработано"
                value={(stats?.total_earned || 0).toLocaleString('ru-RU')}
                suffix=" сом"
                icon="wallet"
                gradient={['#10B981', '#059669']}
                delay={0}
                onPress={() => router.push('/(master)/wallet')}
              />
            </View>
            <View className="flex-1">
              <AnimatedStatCard
                title="Рейтинг"
                value={stats?.average_rating ? stats.average_rating.toFixed(1) : '—'}
                icon="star"
                gradient={['#F59E0B', '#D97706']}
                delay={100}
                onPress={() => router.push('/(master)/reviews')}
              />
            </View>
          </View>

          <View className="flex-row gap-4 mb-6">
            <View className="flex-1">
              <AnimatedStatCard
                title="Завершено"
                value={stats?.completed_orders || 0}
                icon="checkmark-circle"
                gradient={['#8B5CF6', '#7C3AED']}
                delay={200}
                onPress={() => router.push('/(master)/orders')}
              />
            </View>
            <View className="flex-1">
              <AnimatedStatCard
                title="Отклики"
                value={stats?.pending_applications || 0}
                icon="document-text"
                gradient={['#EC4899', '#DB2777']}
                delay={300}
                onPress={() => router.push('/(master)/applications')}
              />
            </View>
          </View>

          {/* Performance Card */}
          <View className="bg-white rounded-3xl p-6 mb-6 shadow-sm">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900">Эффективность</Text>
              <TouchableOpacity onPress={() => router.push('/(master)/analytics')}>
                <Text className="text-[#0165FB] font-semibold">Подробнее</Text>
              </TouchableOpacity>
            </View>
            
            <View className="flex-row items-center">
              <ProgressRing progress={completionRate} color="#10B981" />
              <View className="flex-1 ml-6">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-gray-600">Выполнение заказов</Text>
                  <Text className="font-semibold text-gray-900">{completionRate}%</Text>
                </View>
                <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <View 
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${completionRate}%` }}
                  />
                </View>
                <View className="flex-row items-center mt-3">
                  <Ionicons name="trending-up" size={16} color="#10B981" />
                  <Text className="text-green-600 text-sm ml-1 font-medium">
                    +12% за неделю
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Notifications Badge */}
          {stats && (stats.pending_applications > 0 || stats.unread_messages > 0) && (
            <TouchableOpacity 
              onPress={() => router.push('/(master)/notifications')}
              className="mb-6"
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#FEF3C7', '#FDE68A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="rounded-2xl p-4"
              >
                <View className="flex-row items-center">
                  <View className="w-12 h-12 bg-orange-500 rounded-2xl items-center justify-center">
                    <Ionicons name="notifications" size={24} color="white" />
                  </View>
                  <View className="flex-1 ml-4">
                    <Text className="font-bold text-gray-900">Новые уведомления</Text>
                    <Text className="text-gray-600 text-sm mt-0.5">
                      {stats.pending_applications > 0 && `${stats.pending_applications} откликов`}
                      {stats.pending_applications > 0 && stats.unread_messages > 0 && ' • '}
                      {stats.unread_messages > 0 && `${stats.unread_messages} сообщений`}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Verification Banner */}
          {verificationStatus && verificationStatus.overall_status !== 'verified' && (
            <TouchableOpacity 
              onPress={() => router.push('/(master)/verification')}
              className="mb-6"
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={
                  verificationStatus.overall_status === 'rejected' 
                    ? ['#FEE2E2', '#FECACA']
                    : verificationStatus.overall_status === 'in_review'
                    ? ['#DBEAFE', '#BFDBFE']
                    : ['#FEF3C7', '#FDE68A']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="rounded-2xl p-4"
              >
                <View className="flex-row items-center">
                  <View className={`w-12 h-12 rounded-2xl items-center justify-center ${
                    verificationStatus.overall_status === 'rejected' 
                      ? 'bg-red-500' 
                      : verificationStatus.overall_status === 'in_review'
                      ? 'bg-blue-500'
                      : 'bg-amber-500'
                  }`}>
                    <Ionicons 
                      name={
                        verificationStatus.overall_status === 'rejected' 
                          ? 'close-circle' 
                          : verificationStatus.overall_status === 'in_review'
                          ? 'time'
                          : 'shield-checkmark'
                      } 
                      size={24} 
                      color="white"
                    />
                  </View>
                  <View className="flex-1 ml-4">
                    <Text className="font-bold text-gray-900">
                      {verificationStatus.overall_status === 'rejected' 
                        ? 'Верификация отклонена' 
                        : verificationStatus.overall_status === 'in_review'
                        ? 'На проверке'
                        : 'Пройдите верификацию'}
                    </Text>
                    <Text className="text-gray-600 text-sm mt-0.5">
                      {verificationStatus.overall_status === 'rejected' 
                        ? 'Загрузите документы повторно' 
                        : verificationStatus.overall_status === 'in_review'
                        ? 'Обычно это занимает 1-2 дня'
                        : 'Для получения заказов'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Quick Actions */}
          <View className="bg-white rounded-3xl p-6 shadow-sm mb-8">
            <Text className="text-lg font-bold text-gray-900 mb-4">
              Быстрые действия
            </Text>
            
            <QuickActionButton
              icon="briefcase-outline"
              label="Мои заказы"
              sublabel={`${stats?.active_orders || 0} активных`}
              color="#0165FB"
              bgColor="#EFF6FF"
              onPress={() => router.push('/(master)/orders')}
            />

            <QuickActionButton
              icon="person-outline"
              label="Профиль"
              sublabel="Редактировать данные"
              color="#10B981"
              bgColor="#ECFDF5"
              onPress={() => router.push('/(master)/profile')}
            />

            <QuickActionButton
              icon="wallet-outline"
              label="Кошелек"
              sublabel={`${(stats?.total_earned || 0).toLocaleString('ru-RU')} сом`}
              color="#8B5CF6"
              bgColor="#F5F3FF"
              onPress={() => router.push('/(master)/wallet')}
            />

            <QuickActionButton
              icon="time-outline"
              label="Учет времени"
              sublabel="Отслеживание работы"
              color="#F59E0B"
              bgColor="#FFFBEB"
              onPress={() => router.push('/(master)/time-tracking')}
            />

            <QuickActionButton
              icon="calendar-outline"
              label="Календарь"
              sublabel="Расписание и доступность"
              color="#EC4899"
              bgColor="#FDF2F8"
              onPress={() => router.push('/(master)/calendar')}
            />

            <QuickActionButton
              icon="stats-chart-outline"
              label="Аналитика"
              sublabel="Статистика и отчеты"
              color="#06B6D4"
              bgColor="#ECFEFF"
              onPress={() => router.push('/(master)/analytics')}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
