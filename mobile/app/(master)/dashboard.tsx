import { View, Text, TouchableOpacity } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useAuth } from '../../hooks/useAuth'

export default function MasterDashboard() {
  const { user, logout } = useAuth()

  return (
    <View className="flex-1 bg-[#F8F7FC]">
      <StatusBar style="dark" />
      
      <View className="px-6 pt-16 pb-6">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-8">
          <View>
            <Text className="text-2xl font-bold text-gray-900">
              Добро пожаловать, {user?.firstName}!
            </Text>
            <Text className="text-gray-600 mt-1">Панель мастера</Text>
          </View>
          
          <TouchableOpacity
            onPress={logout}
            className="w-10 h-10 bg-red-100 rounded-full items-center justify-center"
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View className="flex-row gap-4 mb-6">
          <View className="flex-1 bg-white p-4 rounded-2xl shadow-sm">
            <Text className="text-gray-600 text-sm">Активные заказы</Text>
            <Text className="text-2xl font-bold text-gray-900 mt-1">0</Text>
          </View>
          
          <View className="flex-1 bg-white p-4 rounded-2xl shadow-sm">
            <Text className="text-gray-600 text-sm">Рейтинг</Text>
            <Text className="text-2xl font-bold text-gray-900 mt-1">5.0</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="bg-white rounded-2xl p-6 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Быстрые действия
          </Text>
          
          <View className="space-y-3">
            <TouchableOpacity className="flex-row items-center p-3 bg-blue-50 rounded-xl">
              <View className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center mr-3">
                <Ionicons name="briefcase-outline" size={20} color="white" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">Мои заказы</Text>
                <Text className="text-gray-600 text-sm">Просмотр активных заказов</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center p-3 bg-green-50 rounded-xl">
              <View className="w-10 h-10 bg-green-500 rounded-full items-center justify-center mr-3">
                <Ionicons name="person-outline" size={20} color="white" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">Профиль</Text>
                <Text className="text-gray-600 text-sm">Редактировать профиль</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center p-3 bg-purple-50 rounded-xl">
              <View className="w-10 h-10 bg-purple-500 rounded-full items-center justify-center mr-3">
                <Ionicons name="wallet-outline" size={20} color="white" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">Кошелек</Text>
                <Text className="text-gray-600 text-sm">Баланс и выплаты</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => router.push('/(master)/time-tracking')}
              className="flex-row items-center p-3 bg-orange-50 rounded-xl"
            >
              <View className="w-10 h-10 bg-orange-500 rounded-full items-center justify-center mr-3">
                <Ionicons name="time-outline" size={20} color="white" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">Учет времени</Text>
                <Text className="text-gray-600 text-sm">Отслеживание рабочего времени</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  )
}