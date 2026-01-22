import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useGetMyServicesQuery,
  useGetServiceCategoriesQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
  useToggleServiceStatusMutation,
  type Service as APIService,
  type ServiceCategory,
} from '../../services/servicesApi';

// Unit mapping for display
const unitMap: Record<string, string> = {
  'hour': 'час',
  'sqm': 'м²',
  'piece': 'шт',
  'project': 'проект',
  'day': 'день',
};

const reverseUnitMap: Record<string, string> = {
  'час': 'hour',
  'м²': 'sqm',
  'шт': 'piece',
  'проект': 'project',
  'день': 'day',
};

interface Service {
  id: number;
  name: string;
  description: string;
  price_from: number;
  price_to: number;
  unit: string;
  is_active: boolean;
  category: string;
}

export default function MasterServicesPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    price_from: '',
    price_to: '',
    unit: 'час',
    category: 1 // Default to first category
  });

  // API queries
  const { 
    data: servicesData, 
    isLoading: servicesLoading, 
    error: servicesError,
    refetch: refetchServices 
  } = useGetMyServicesQuery();

  const { 
    data: categoriesData, 
    isLoading: categoriesLoading 
  } = useGetServiceCategoriesQuery();

  // Mutations
  const [createService, { isLoading: createLoading }] = useCreateServiceMutation();
  const [updateService] = useUpdateServiceMutation();
  const [deleteService] = useDeleteServiceMutation();
  const [toggleServiceStatus] = useToggleServiceStatusMutation();

  const services = servicesData || [];
  const categories = categoriesData || [];
  const units = ['час', 'м²', 'шт', 'проект', 'день'];

  // Set default category when categories load
  useEffect(() => {
    if (categories.length > 0 && newService.category === 1) {
      setNewService(prev => ({ ...prev, category: categories[0].id }));
    }
  }, [categories]);

  const handleAddService = async () => {
    if (!newService.name || !newService.price_from) {
      Alert.alert('Ошибка', 'Заполните обязательные поля');
      return;
    }

    try {
      await createService({
        name: newService.name,
        description: newService.description,
        category: newService.category,
        price_from: parseFloat(newService.price_from),
        price_to: newService.price_to ? parseFloat(newService.price_to) : undefined,
        unit: reverseUnitMap[newService.unit] as any,
        is_active: true,
      }).unwrap();
      
      setNewService({
        name: '',
        description: '',
        price_from: '',
        price_to: '',
        unit: 'час',
        category: categories[0]?.id || 1
      });
      setShowAddForm(false);
      Alert.alert('Успех', 'Услуга добавлена');
    } catch (error: any) {
      console.error('Failed to create service:', error);
      Alert.alert('Ошибка', error?.data?.message || 'Не удалось добавить услугу');
    }
  };

  const handleToggleServiceStatus = async (serviceId: number) => {
    try {
      await toggleServiceStatus(serviceId).unwrap();
    } catch (error: any) {
      console.error('Failed to toggle service status:', error);
      Alert.alert('Ошибка', 'Не удалось изменить статус услуги');
    }
  };

  const handleDeleteService = async (serviceId: number) => {
    Alert.alert(
      'Удалить услугу',
      'Вы уверены, что хотите удалить эту услугу?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteService(serviceId).unwrap();
              Alert.alert('Успех', 'Услуга удалена');
            } catch (error: any) {
              console.error('Failed to delete service:', error);
              Alert.alert('Ошибка', 'Не удалось удалить услугу');
            }
          }
        }
      ]
    );
  };

  const getCategoryName = (categoryId: number): string => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Общие услуги';
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      <ScrollView className="flex-1 px-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center gap-4">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="w-10 h-10 bg-white rounded-2xl items-center justify-center shadow-sm border border-gray-100"
            >
              <Ionicons name="arrow-back" size={20} color="#6B7280" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-gray-900">Мои услуги</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowAddForm(!showAddForm)}
            className="w-10 h-10 bg-[#0165FB] rounded-2xl items-center justify-center shadow-lg"
          >
            <Ionicons name={showAddForm ? "close" : "add"} size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Loading state */}
        {servicesLoading && (
          <View className="bg-white rounded-3xl p-8 items-center shadow-sm border border-gray-100 mb-6">
            <ActivityIndicator size="large" color="#0165FB" />
            <Text className="text-gray-500 mt-2">Загрузка услуг...</Text>
          </View>
        )}

        {/* Error state */}
        {servicesError && (
          <View className="bg-white rounded-3xl p-8 items-center shadow-sm border border-gray-100 mb-6">
            <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="alert-circle" size={32} color="#EF4444" />
            </View>
            <Text className="text-gray-900 font-semibold mb-2">Ошибка загрузки</Text>
            <Text className="text-gray-500 text-center mb-4">
              Не удалось загрузить список услуг
            </Text>
            <TouchableOpacity 
              onPress={() => refetchServices()}
              className="bg-[#0165FB] px-6 py-2 rounded-xl"
            >
              <Text className="text-white font-medium">Повторить</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Stats */}
        {!servicesLoading && !servicesError && (
          <View className="bg-[#0165FB] rounded-3xl p-5 mb-6">
            <View className="flex-row justify-between">
              <View className="items-center flex-1">
                <Text className="text-3xl font-bold text-white">{services.length}</Text>
                <Text className="text-white/70 text-sm">Всего услуг</Text>
              </View>
              <View className="w-px bg-white/20" />
              <View className="items-center flex-1">
                <Text className="text-3xl font-bold text-white">
                  {services.filter(s => s.is_active).length}
                </Text>
                <Text className="text-white/70 text-sm">Активных</Text>
              </View>
              <View className="w-px bg-white/20" />
              <View className="items-center flex-1">
                <Text className="text-3xl font-bold text-white">
                  {services.length > 0 
                    ? Math.round(services.reduce((sum, s) => sum + parseFloat(s.price_from), 0) / services.length)
                    : 0
                  }
                </Text>
                <Text className="text-white/70 text-sm">Средняя цена</Text>
              </View>
            </View>
          </View>
        )}

        {/* Add Service Form */}
        {showAddForm && !servicesLoading && (
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">Добавить услугу</Text>
            
            <View className="space-y-4">
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Название услуги *</Text>
                <TextInput
                  value={newService.name}
                  onChangeText={(text) => setNewService({...newService, name: text})}
                  placeholder="Например: Ремонт сантехники"
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900"
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Описание</Text>
                <TextInput
                  value={newService.description}
                  onChangeText={(text) => setNewService({...newService, description: text})}
                  placeholder="Краткое описание услуги"
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700 mb-2">Цена от *</Text>
                  <TextInput
                    value={newService.price_from}
                    onChangeText={(text) => setNewService({...newService, price_from: text})}
                    placeholder="1500"
                    keyboardType="numeric"
                    className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700 mb-2">Цена до</Text>
                  <TextInput
                    value={newService.price_to}
                    onChangeText={(text) => setNewService({...newService, price_to: text})}
                    placeholder="3000"
                    keyboardType="numeric"
                    className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900"
                  />
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700 mb-2">Единица измерения</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-2">
                      {units.map(unit => (
                        <TouchableOpacity
                          key={unit}
                          onPress={() => setNewService({...newService, unit})}
                          className={`px-3 py-2 rounded-full ${
                            newService.unit === unit
                              ? 'bg-[#0165FB]'
                              : 'bg-gray-100'
                          }`}
                        >
                          <Text className={`text-sm font-medium ${
                            newService.unit === unit ? 'text-white' : 'text-gray-700'
                          }`}>
                            {unit}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Категория</Text>
                {categoriesLoading ? (
                  <View className="py-4">
                    <ActivityIndicator size="small" color="#0165FB" />
                  </View>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-2">
                      {categories.map(category => (
                        <TouchableOpacity
                          key={category.id}
                          onPress={() => setNewService({...newService, category: category.id})}
                          className={`px-3 py-2 rounded-full ${
                            newService.category === category.id
                              ? 'bg-[#0165FB]'
                              : 'bg-gray-100'
                          }`}
                        >
                          <Text className={`text-sm font-medium ${
                            newService.category === category.id ? 'text-white' : 'text-gray-700'
                          }`}>
                            {category.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                )}
              </View>

              <TouchableOpacity
                onPress={handleAddService}
                disabled={createLoading}
                className={`py-4 rounded-2xl ${
                  createLoading ? 'bg-gray-400' : 'bg-[#0165FB]'
                }`}
              >
                <Text className="text-center font-semibold text-white">
                  {createLoading ? 'Добавление...' : 'Добавить услугу'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Services List */}
        {!servicesLoading && !servicesError && (
          <View className="space-y-4 mb-6">
            {services.length === 0 ? (
              <View className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 items-center">
                <View className="w-20 h-20 bg-[#0165FB]/10 rounded-full items-center justify-center mb-4">
                  <Ionicons name="construct" size={40} color="#0165FB" />
                </View>
                <Text className="text-lg font-semibold text-gray-900 mb-2">Нет услуг</Text>
                <Text className="text-gray-500 text-center">
                  Добавьте свои услуги, чтобы клиенты могли найти вас
                </Text>
              </View>
            ) : (
              services.map(service => (
                <View key={service.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-1">
                        <Text className="font-semibold text-gray-900">{service.name}</Text>
                        <View className={`px-2 py-1 rounded-full ${
                          service.is_active ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <Text className={`text-xs font-medium ${
                            service.is_active ? 'text-green-700' : 'text-gray-500'
                          }`}>
                            {service.is_active ? 'Активна' : 'Неактивна'}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-sm text-gray-500 mb-2">
                        {getCategoryName(service.category)}
                      </Text>
                      {service.description && (
                        <Text className="text-sm text-gray-600 mb-3">{service.description}</Text>
                      )}
                      <Text className="font-semibold text-[#0165FB]">
                        {service.price_to && parseFloat(service.price_from) !== parseFloat(service.price_to)
                          ? `${parseFloat(service.price_from).toLocaleString('ru-RU')} - ${parseFloat(service.price_to).toLocaleString('ru-RU')} сом/${unitMap[service.unit] || service.unit}`
                          : `${parseFloat(service.price_from).toLocaleString('ru-RU')} сом/${unitMap[service.unit] || service.unit}`
                        }
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => handleToggleServiceStatus(service.id)}
                      className={`flex-1 py-3 rounded-2xl ${
                        service.is_active ? 'bg-gray-100' : 'bg-green-100'
                      }`}
                    >
                      <Text className={`text-center font-medium ${
                        service.is_active ? 'text-gray-700' : 'text-green-700'
                      }`}>
                        {service.is_active ? 'Деактивировать' : 'Активировать'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteService(service.id)}
                      className="px-4 py-3 bg-red-100 rounded-2xl"
                    >
                      <Ionicons name="trash" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}