import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl } from 'react-native'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useGetOrdersQuery, useGetCategoriesQuery } from '../../services/orderApi'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { ErrorMessage } from '../../components/ErrorMessage'
import { EmptyState } from '../../components/EmptyState'
import { formatCurrency, formatDate, formatRelativeTime } from '../../utils/format'
import type { Order, Category } from '../../types/api'

export default function MasterOrdersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [filters, setFilters] = useState({
    city: '',
    budget_min: '',
    budget_max: '',
    is_urgent: false
  })

  // API queries
  const {
    data: ordersData,
    isLoading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders
  } = useGetOrdersQuery({
    category: selectedCategory || undefined,
    search: searchQuery || undefined,
    city: filters.city || undefined,
    budget_min: filters.budget_min ? parseInt(filters.budget_min) : undefined,
    budget_max: filters.budget_max ? parseInt(filters.budget_max) : undefined,
    is_urgent: filters.is_urgent || undefined,
    status: 'active'
  })

  const {
    data: categoriesData,
    isLoading: categoriesLoading
  } = useGetCategoriesQuery()

  const orders: Order[] = ordersData?.results || []
  const categories: Category[] = Array.isArray(categoriesData) ? categoriesData : [];

  // Build categories list with "All" option
  const categoryOptions = [
    { id: null, name: 'Все', icon: 'apps' },
    ...categories.map((cat: Category) => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon || 'briefcase'
    }))
  ]

  const handleCategorySelect = (categoryId: number | null) => {
    setSelectedCategory(categoryId)
  }

  const onRefresh = async () => {
    await refetchOrders()
  }

  if (ordersLoading && orders.length === 0) {
    return <LoadingSpinner fullScreen text="Загрузка заказов..." />
  }

  if (ordersError) {
    return (
      <ErrorMessage
        fullScreen
        message="Не удалось загрузить заказы"
        onRetry={refetchOrders}
      />
    )
  }

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="bg-white px-4 pt-12 pb-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900 mb-4">Найти заказы</Text>

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

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
          <View className="flex-row gap-2 px-1">
            {categoryOptions.map(category => (
              <TouchableOpacity
                key={category.id || 'all'}
                onPress={() => handleCategorySelect(category.id)}
                className={`flex-row items-center gap-2 px-4 py-2 rounded-full border ${(selectedCategory === category.id)
                  ? 'bg-blue-500 border-blue-500'
                  : 'bg-white border-gray-200'
                  }`}
              >
                <Ionicons
                  name={category.icon as any}
                  size={16}
                  color={selectedCategory === category.id ? 'white' : '#6B7280'}
                />
                <Text className={`font-medium ${selectedCategory === category.id ? 'text-white' : 'text-gray-700'
                  }`}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Orders List */}
      <ScrollView
        className="flex-1 px-4 py-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}
        refreshControl={
          <RefreshControl refreshing={ordersLoading} onRefresh={onRefresh} />
        }
      >
        {orders.length === 0 ? (
          <EmptyState
            icon="briefcase-outline"
            title="Заказы не найдены"
            description={
              searchQuery || selectedCategory
                ? "Попробуйте изменить поисковый запрос или фильтры"
                : "Новые заказы появятся здесь"
            }
          />
        ) : (
          <View className="flex flex-col gap-4">
            {orders.map((order: Order) => (
              <TouchableOpacity
                key={order.id}
                onPress={() => router.push(`/(master)/orders/${order.id}`)}
                className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4"
              >
                {/* Header */}
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1 mr-3">
                    <View className="flex-row items-start gap-2 mb-1">
                      <Text className="text-lg font-bold text-gray-900 flex-1" numberOfLines={2}>
                        {order.title}
                      </Text>
                      {order.is_urgent && (
                        <View className="px-2 py-1 bg-red-100 rounded-full">
                          <Text className="text-red-700 text-xs font-semibold">Срочно</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-sm text-gray-600 mb-2">{order.category_name}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-lg font-bold text-blue-600">
                      {order.budget_display || formatCurrency(order.budget_min || '0')}
                    </Text>
                  </View>
                </View>

                {/* Description */}
                <Text className="text-sm text-gray-600 mb-4" numberOfLines={2}>
                  {order.description}
                </Text>

                {/* Client Info */}
                <View className="flex-row items-center gap-2 mb-3">
                  <Ionicons name="person" size={16} color="#6B7280" />
                  <Text className="text-sm text-gray-600 flex-1">
                    {order.client_name || order.client?.name || 'Клиент'}
                  </Text>
                  <Ionicons name="location" size={16} color="#6B7280" />
                  <Text className="text-sm text-gray-600">{order.city}</Text>
                </View>

                {/* Stats */}
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center gap-4">
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="people" size={16} color="#6B7280" />
                      <Text className="text-sm text-gray-600">{order.applications_count} откликов</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="eye" size={16} color="#6B7280" />
                      <Text className="text-sm text-gray-600">{order.views_count} просмотров</Text>
                    </View>
                  </View>
                  <Text className="text-xs text-gray-400">
                    {formatRelativeTime(order.created_at)}
                  </Text>
                </View>

                {/* Action Button */}
                <TouchableOpacity
                  onPress={() => router.push(`/(master)/orders/${order.id}/apply`)}
                  className="bg-blue-500 py-3 rounded-2xl"
                >
                  <Text className="text-white font-semibold text-center">
                    {order.has_applied ? 'Просмотреть отклик' : 'Откликнуться'}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}