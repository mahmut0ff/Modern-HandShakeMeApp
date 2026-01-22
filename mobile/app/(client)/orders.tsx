import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl } from 'react-native'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useGetMyOrdersQuery } from '../../services/orderApi'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { ErrorMessage } from '../../components/ErrorMessage'
import { EmptyState } from '../../components/EmptyState'
import { formatCurrency, formatDate } from '../../utils/format'

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'draft'>('active')
  const [searchQuery, setSearchQuery] = useState('')

  const { 
    data: orders = [], 
    isLoading, 
    error, 
    refetch 
  } = useGetMyOrdersQuery({ status: activeTab })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700'
      case 'completed':
        return 'bg-blue-100 text-blue-700'
      case 'draft':
        return 'bg-gray-100 text-gray-700'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Активен'
      case 'completed':
        return 'Завершён'
      case 'draft':
        return 'Черновик'
      case 'in_progress':
        return 'В работе'
      case 'cancelled':
        return 'Отменён'
      default:
        return status
    }
  }

  const filteredOrders = orders.filter(order =>
    order.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.category_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getOrderCounts = () => {
    // This would ideally come from separate API calls or be cached
    return {
      active: orders.filter(o => o.status === 'active').length,
      completed: orders.filter(o => o.status === 'completed').length,
      draft: orders.filter(o => o.status === 'draft').length,
    }
  }

  const orderCounts = getOrderCounts()

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Загрузка заказов..." />
  }

  if (error) {
    return (
      <ErrorMessage
        fullScreen
        message="Не удалось загрузить заказы"
        onRetry={refetch}
      />
    )
  }

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="bg-white px-4 pt-12 pb-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-gray-900">Мои заказы</Text>
          <TouchableOpacity 
            onPress={() => router.push('/(client)/create-order')}
            className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center"
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
        
        {/* Search */}
        <View className="relative mb-4">
          <View className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
            <Ionicons name="search" size={20} color="#9CA3AF" />
          </View>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Поиск заказов..."
            className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-2xl text-gray-900"
            placeholderTextColor="#9CA3AF"
          />
        </View>
        
        {/* Tabs */}
        <View className="flex-row bg-gray-100 rounded-2xl p-1">
          <TouchableOpacity
            onPress={() => setActiveTab('active')}
            className={`flex-1 py-2 px-4 rounded-xl ${
              activeTab === 'active' ? 'bg-white shadow-sm' : ''
            }`}
          >
            <Text className={`text-center font-medium ${
              activeTab === 'active' ? 'text-gray-900' : 'text-gray-600'
            }`}>
              Активные ({orderCounts.active})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setActiveTab('completed')}
            className={`flex-1 py-2 px-4 rounded-xl ${
              activeTab === 'completed' ? 'bg-white shadow-sm' : ''
            }`}
          >
            <Text className={`text-center font-medium ${
              activeTab === 'completed' ? 'text-gray-900' : 'text-gray-600'
            }`}>
              Завершённые ({orderCounts.completed})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setActiveTab('draft')}
            className={`flex-1 py-2 px-4 rounded-xl ${
              activeTab === 'draft' ? 'bg-white shadow-sm' : ''
            }`}
          >
            <Text className={`text-center font-medium ${
              activeTab === 'draft' ? 'text-gray-900' : 'text-gray-600'
            }`}>
              Черновики ({orderCounts.draft})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Orders List */}
      <ScrollView 
        className="flex-1 px-4 py-4" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}
      >
        {filteredOrders.length === 0 ? (
          <EmptyState
            icon="briefcase-outline"
            title={searchQuery ? 'Заказы не найдены' : 'Нет заказов'}
            description={
              searchQuery 
                ? 'Попробуйте изменить поисковый запрос'
                : activeTab === 'active' 
                  ? 'Создайте свой первый заказ'
                  : activeTab === 'completed'
                    ? 'У вас пока нет завершённых заказов'
                    : 'У вас нет черновиков'
            }
            actionText={!searchQuery && activeTab === 'active' ? 'Создать заказ' : undefined}
            onAction={!searchQuery && activeTab === 'active' ? () => router.push('/(client)/create-order') : undefined}
          />
        ) : (
          <View className="space-y-3">
            {filteredOrders.map(order => (
              <TouchableOpacity
                key={order.id}
                onPress={() => router.push(`/(client)/orders/${order.id}`)}
                className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4"
              >
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1 mr-3">
                    <Text className="text-lg font-semibold text-gray-900 mb-1">
                      {order.title}
                    </Text>
                    <Text className="text-sm text-gray-600">{order.category_name}</Text>
                  </View>
                  <View className={`px-3 py-1 rounded-full ${getStatusColor(order.status)}`}>
                    <Text className="text-xs font-semibold">
                      {getStatusText(order.status)}
                    </Text>
                  </View>
                </View>
                
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="wallet" size={16} color="#6B7280" />
                    <Text className="text-sm text-gray-600">
                      {order.budget_display || formatCurrency(order.budget_min || '0')}
                    </Text>
                  </View>
                  <Text className="text-xs text-gray-400">
                    {formatDate(order.created_at)}
                  </Text>
                </View>
                
                {order.status !== 'draft' && (
                  <View className="flex-row items-center gap-4">
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="people" size={16} color="#6B7280" />
                      <Text className="text-sm text-gray-600">
                        {order.applications_count} откликов
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="eye" size={16} color="#6B7280" />
                      <Text className="text-sm text-gray-600">
                        {order.views_count} просмотров
                      </Text>
                    </View>
                  </View>
                )}
                
                {order.status === 'completed' && order.updated_at && (
                  <View className="mt-2 pt-2 border-t border-gray-100">
                    <Text className="text-xs text-gray-500">
                      Завершён: {formatDate(order.updated_at)}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
      
      {/* Floating Action Button */}
      <TouchableOpacity 
        onPress={() => router.push('/(client)/create-order')}
        className="absolute bottom-6 right-6 w-14 h-14 bg-blue-500 rounded-full items-center justify-center shadow-lg"
        style={{
          shadowColor: '#3B82F6',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  )
}