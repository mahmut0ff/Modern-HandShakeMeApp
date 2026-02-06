/**
 * My Services Screen
 * Мои услуги (для мастеров)
 */

import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useGetMyServicesQuery } from '../../../services/servicesApi';
import { ServiceCard } from '../components/ServiceCard';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { EmptyState } from '../../../components/EmptyState';
import { useServiceActions } from '../hooks/useServiceActions';

export default function MyServicesScreen() {
  const router = useRouter();
  const {
    data: services,
    isLoading,
    isFetching,
    refetch,
  } = useGetMyServicesQuery();

  const { confirmDelete, toggleServiceStatus } = useServiceActions();

  const handleCreateService = () => {
    router.push('/services/create');
  };

  const handleEditService = (serviceId: number) => {
    router.push(`/services/${serviceId}/edit`);
  };

  const handleDeleteService = (serviceId: number, serviceName: string) => {
    confirmDelete(serviceId, serviceName, () => {
      refetch();
    });
  };

  const handleToggleStatus = async (serviceId: number) => {
    await toggleServiceStatus(serviceId);
    refetch();
  };

  const activeServices = services?.filter((s) => s.is_active) || [];
  const inactiveServices = services?.filter((s) => !s.is_active) || [];

  const renderHeader = () => (
    <View className="bg-white border-b border-gray-200">
      {/* Title */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">Мои услуги</Text>
        </View>
        <TouchableOpacity
          onPress={handleCreateService}
          className="bg-blue-500 rounded-full px-4 py-2"
        >
          <View className="flex-row items-center">
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-white font-semibold ml-1">Добавить</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      {services && services.length > 0 && (
        <View className="flex-row px-4 pb-3">
          <View className="flex-row items-center mr-4">
            <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
            <Text className="text-sm text-gray-600">
              Активных: {activeServices.length}
            </Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-gray-400 mr-2" />
            <Text className="text-sm text-gray-600">
              Неактивных: {inactiveServices.length}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        {renderHeader()}
        <LoadingSpinner fullScreen text="Загрузка услуг..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <FlatList
        ListHeaderComponent={renderHeader}
        data={services}
        renderItem={({ item }) => (
          <ServiceCard
            service={item}
            editable
            onEdit={() => handleEditService(item.id)}
            onDelete={() => handleDeleteService(item.id, item.name)}
            onToggleStatus={() => handleToggleStatus(item.id)}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <EmptyState
            icon="construct-outline"
            title="У вас пока нет услуг"
            description="Добавьте услуги, чтобы клиенты могли их видеть"
            actionLabel="Добавить услугу"
            onAction={handleCreateService}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            tintColor="#3B82F6"
          />
        }
      />
    </SafeAreaView>
  );
}
