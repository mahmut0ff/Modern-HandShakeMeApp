import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../hooks/useAuth'

export default function ClientDashboard() {
  const { user, logout } = useAuth()

  return (
    <View className="flex-1 bg-[#F8F7FC]">
      <StatusBar style="dark" />
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-16 pb-6">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-8">
            <View>
              <Text className="text-2xl font-bold text-gray-900">
                Привет, {user?.firstName}!
              </Text>
              <Text className="text-gray-600 mt-1">Найдем мастера для вас</Text>
            </View>
            
            <TouchableOpacity
              onPress={logout}
              className="w-10 h-10 bg-red-100 rounded-full items-center justify-center"
            >
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View className="bg-white rounded-2xl p-4 shadow-sm mb-6">
            <View className="flex-row items-center">
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <Text className="text-gray-500 ml-3 flex-1">
                Что нужно сделать?
              </Text>
              <Ionicons name="mic-outline" size={20} color="#9CA3AF" />
            </View>
          </View>

          {/* Categories */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Популярные категории
            </Text>
            
            <View className="flex-row flex-wrap gap-3">
              {[
                { name: 'Ремонт', icon: 'hammer-outline', color: 'bg-blue-500' },
                { name: 'Уборка', icon: 'home-outline', color: 'bg-green-500' },
                { name: 'Доставка', icon: 'car-outline', color: 'bg-orange-500' },
                { name: 'Красота', icon: 'cut-outline', color: 'bg-pink-500' },
              ].map((category, index) => (
                <TouchableOpacity
                  key={index}
                  className="flex-1 min-w-[45%] bg-white p-4 rounded-2xl shadow-sm items-center"
                >
                  <View className={`w-12 h-12 ${category.color} rounded-full items-center justify-center mb-2`}>
                    <Ionicons name={category.icon as any} size={24} color="white" />
                  </View>
                  <Text className="font-medium text-gray-900">{category.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recent Orders */}
          <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-gray-900">
                Мои заказы
              </Text>
              <TouchableOpacity>
                <Text className="text-blue-500 font-medium">Все</Text>
              </TouchableOpacity>
            </View>
            
            <View className="items-center py-8">
              <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="document-outline" size={32} color="#9CA3AF" />
              </View>
              <Text className="text-gray-500 text-center">
                У вас пока нет заказов
              </Text>
              <TouchableOpacity className="mt-4 bg-blue-500 px-6 py-3 rounded-xl">
                <Text className="text-white font-semibold">Создать заказ</Text>
              </TouchableOpacity>
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
                  <Ionicons name="add-outline" size={20} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900">Создать заказ</Text>
                  <Text className="text-gray-600 text-sm">Опишите что нужно сделать</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity className="flex-row items-center p-3 bg-green-50 rounded-xl">
                <View className="w-10 h-10 bg-green-500 rounded-full items-center justify-center mr-3">
                  <Ionicons name="people-outline" size={20} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900">Найти мастера</Text>
                  <Text className="text-gray-600 text-sm">Поиск по категориям</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity className="flex-row items-center p-3 bg-purple-50 rounded-xl">
                <View className="w-10 h-10 bg-purple-500 rounded-full items-center justify-center mr-3">
                  <Ionicons name="chatbubble-outline" size={20} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900">Сообщения</Text>
                  <Text className="text-gray-600 text-sm">Чат с мастерами</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}