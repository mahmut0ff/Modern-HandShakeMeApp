import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, FlatList, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGetOrderQuery, useDeleteOrderMutation } from '../../../services/orderApi';

export default function OrderDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, isLoading, error } = useGetOrderQuery(Number(id));
  const [deleteOrder, { isLoading: isDeleting }] = useDeleteOrderMutation();

  const handleDelete = async () => {
    Alert.alert(
      'Удалить заказ',
      'Вы уверены, что хотите удалить этот заказ?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteOrder(Number(id)).unwrap();
              router.push('/(client)/orders');
            } catch (error: any) {
              Alert.alert('Ошибка', error?.data?.message || 'Не удалось удалить заказ');
            }
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8F7FC]">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0165FB" />
          <Text className="text-gray-500 mt-4">Загрузка заказа...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8F7FC]">
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="alert-circle" size={64} color="#EF4444" />
          <Text className="text-xl font-bold text-gray-900 mt-4">Заказ не найден</Text>
          <Text className="text-gray-500 mt-2 text-center">Возможно, заказ был удалён</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-6 px-6 py-3 bg-[#0165FB] rounded-2xl"
          >
            <Text className="text-white font-semibold">Назад</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusLabels: Record<string, string> = {
    draft: 'Черновик',
    active: 'Активный',
    in_progress: 'В работе',
    completed: 'Завершён',
    cancelled: 'Отменён',
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    active: 'bg-[#0165FB]/10 text-[#0165FB]',
    in_progress: 'bg-orange-100 text-orange-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  const renderFile = ({ item }: { item: typeof order.files[0] }) => (
    <TouchableOpacity className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 mr-2">
      {item.file_type === 'photo' ? (
        <Image source={{ uri: item.file_url || item.file }} className="w-full h-full" />
      ) : (
        <View className="w-full h-full items-center justify-center">
          <Ionicons name="document" size={32} color="#9CA3AF" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}>
        {/* Header */}
        <View className="flex-row items-center gap-4 mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-white rounded-2xl items-center justify-center shadow-sm border border-gray-100"
          >
            <Ionicons name="arrow-back" size={20} color="#6B7280" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900" numberOfLines={1}>{order.title}</Text>
            <View className="flex-row items-center gap-2 mt-1">
              <View className={`px-3 py-1 rounded-full ${statusColors[order.status]}`}>
                <Text className="text-xs font-semibold">{statusLabels[order.status]}</Text>
              </View>
              {order.is_urgent && (
                <View className="px-3 py-1 bg-red-100 rounded-full">
                  <Text className="text-xs font-semibold text-red-700">Срочно</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Budget Card */}
        <View className="bg-[#0165FB] rounded-3xl p-5 text-white shadow-lg mb-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white/70 text-sm">Бюджет</Text>
              <Text className="text-3xl font-bold text-white">{order.budget_display}</Text>
            </View>
            <View className="flex-row gap-4">
              <View className="items-center">
                <Text className="text-2xl font-bold text-white">{order.views_count || 0}</Text>
                <Text className="text-xs text-white/70">Просмотров</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-white">{order.applications_count || 0}</Text>
                <Text className="text-xs text-white/70">Откликов</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Applications Button */}
        {order.status === 'active' && order.applications_count > 0 && (
          <TouchableOpacity
            onPress={() => router.push(`/(client)/orders/${id}/applications`)}
            className="flex-row items-center justify-between p-4 bg-green-50 rounded-2xl border border-green-200 mb-4"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-12 h-12 bg-green-500 rounded-2xl items-center justify-center">
                <Ionicons name="people" size={24} color="white" />
              </View>
              <View>
                <Text className="font-semibold text-gray-900">Смотреть отклики</Text>
                <Text className="text-sm text-gray-500">{order.applications_count} мастеров откликнулись</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        )}

        {/* Description */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <View className="flex-row items-center gap-2 mb-3">
            <Ionicons name="document-text" size={20} color="#0165FB" />
            <Text className="text-lg font-bold text-gray-900">Описание</Text>
          </View>
          <Text className="text-gray-700">{order.description}</Text>
        </View>

        {/* Details */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <View className="flex-row items-center gap-2 mb-4">
            <Ionicons name="information-circle" size={20} color="#0165FB" />
            <Text className="text-lg font-bold text-gray-900">Детали</Text>
          </View>
          <View className="flex flex-col gap-3">
            <View className="flex-row items-center gap-3 p-3 bg-gray-50 rounded-2xl">
              <View className="w-10 h-10 bg-[#0165FB]/10 rounded-xl items-center justify-center">
                <Ionicons name="grid" size={20} color="#0165FB" />
              </View>
              <View>
                <Text className="text-xs text-gray-500">Категория</Text>
                <Text className="font-medium text-gray-900 text-sm">{order.category_name}</Text>
              </View>
            </View>
            
            <View className="flex-row items-center gap-3 p-3 bg-gray-50 rounded-2xl">
              <View className="w-10 h-10 bg-[#0165FB]/10 rounded-xl items-center justify-center">
                <Ionicons name="location" size={20} color="#0165FB" />
              </View>
              <View>
                <Text className="text-xs text-gray-500">Город</Text>
                <Text className="font-medium text-gray-900 text-sm">{order.city}</Text>
              </View>
            </View>

            {order.floor && (
              <View className="flex-row items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                <View className="w-10 h-10 bg-[#0165FB]/10 rounded-xl items-center justify-center">
                  <Ionicons name="business" size={20} color="#0165FB" />
                </View>
                <View>
                  <Text className="text-xs text-gray-500">Этаж</Text>
                  <Text className="font-medium text-gray-900 text-sm">{order.floor}</Text>
                </View>
              </View>
            )}

            {order.work_volume && (
              <View className="flex-row items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                <View className="w-10 h-10 bg-[#0165FB]/10 rounded-xl items-center justify-center">
                  <Ionicons name="resize" size={20} color="#0165FB" />
                </View>
                <View>
                  <Text className="text-xs text-gray-500">Объём работ</Text>
                  <Text className="font-medium text-gray-900 text-sm">{order.work_volume}</Text>
                </View>
              </View>
            )}

            {order.start_date && (
              <View className="flex-row items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                <View className="w-10 h-10 bg-[#0165FB]/10 rounded-xl items-center justify-center">
                  <Ionicons name="calendar" size={20} color="#0165FB" />
                </View>
                <View>
                  <Text className="text-xs text-gray-500">Начало</Text>
                  <Text className="font-medium text-gray-900 text-sm">
                    {new Date(order.start_date).toLocaleDateString('ru-RU')}
                  </Text>
                </View>
              </View>
            )}

            {order.end_date && (
              <View className="flex-row items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                <View className="w-10 h-10 bg-[#0165FB]/10 rounded-xl items-center justify-center">
                  <Ionicons name="calendar-outline" size={20} color="#0165FB" />
                </View>
                <View>
                  <Text className="text-xs text-gray-500">Окончание</Text>
                  <Text className="font-medium text-gray-900 text-sm">
                    {new Date(order.end_date).toLocaleDateString('ru-RU')}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Conditions */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <View className="flex-row items-center gap-2 mb-4">
            <Ionicons name="home" size={20} color="#0165FB" />
            <Text className="text-lg font-bold text-gray-900">Условия на объекте</Text>
          </View>
          <View className="flex flex-col gap-2">
            {[
              { key: 'has_elevator', label: 'Лифт', icon: 'arrow-up' },
              { key: 'has_electricity', label: 'Электричество', icon: 'flash' },
              { key: 'has_water', label: 'Вода', icon: 'water' },
              { key: 'can_store_tools', label: 'Хранение инструментов', icon: 'construct' },
              { key: 'has_parking', label: 'Парковка', icon: 'car' },
            ].map(item => {
              const value = order[item.key as keyof Order] as boolean | undefined;
              return (
                <View 
                  key={item.key}
                  className={`flex-row items-center gap-2 p-3 rounded-2xl ${
                    value === true ? 'bg-green-50' : 
                    value === false ? 'bg-red-50' : 
                    'bg-gray-50'
                  }`}
                >
                  <Ionicons 
                    name={item.icon as any} 
                    size={16} 
                    color={
                      value === true ? '#059669' : 
                      value === false ? '#DC2626' : 
                      '#9CA3AF'
                    } 
                  />
                  <Text className={`text-sm font-medium flex-1 ${
                    value === true ? 'text-green-700' : 
                    value === false ? 'text-red-700' : 
                    'text-gray-400'
                  }`}>
                    {item.label}
                  </Text>
                  {value === true && <Ionicons name="checkmark" size={16} color="#059669" />}
                  {value === false && <Ionicons name="close" size={16} color="#DC2626" />}
                </View>
              );
            })}
          </View>
        </View>

        {/* Skills */}
        {order.skills_list && order.skills_list.length > 0 && (
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
            <View className="flex-row items-center gap-2 mb-3">
              <Ionicons name="star" size={20} color="#0165FB" />
              <Text className="text-lg font-bold text-gray-900">Требуемые навыки</Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {order.skills_list.map(skill => (
                <View key={skill.id} className="px-4 py-2 bg-[#0165FB]/10 rounded-full">
                  <Text className="text-sm font-medium text-[#0165FB]">{skill.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Files */}
        {order.files && order.files.length > 0 && (
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
            <View className="flex-row items-center gap-2 mb-3">
              <Ionicons name="image" size={20} color="#0165FB" />
              <Text className="text-lg font-bold text-gray-900">Файлы</Text>
            </View>
            <FlatList
              data={order.files}
              renderItem={renderFile}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          </View>
        )}

        {/* Actions */}
        {order.status === 'active' && (
          <View className="flex-row gap-3 mb-6">
            <TouchableOpacity
              onPress={() => router.push(`/(client)/orders/${id}/edit`)}
              className="flex-1 flex-row items-center justify-center gap-2 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm"
            >
              <Ionicons name="create" size={16} color="#0165FB" />
              <Text className="font-semibold text-[#0165FB]">Редактировать</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              disabled={isDeleting}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-red-50 rounded-2xl"
            >
              <Ionicons name="trash" size={16} color="#DC2626" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}