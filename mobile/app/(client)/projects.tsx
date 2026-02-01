import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useGetMyProjectsQuery,
  type Project
} from '../../services/projectApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { formatRelativeTime } from '../../utils/format';

export default function ClientProjectsPage() {
  // API queries
  const {
    data: projectsData,
    isLoading,
    error,
    refetch
  } = useGetMyProjectsQuery({
    role: 'client',
    ordering: '-created_at'
  });

  // Handle the projects list
  const allProjects: Project[] = Array.isArray(projectsData) ? projectsData : [];

  const activeProjects = allProjects.filter((p: any) =>
    p.status === 'in_progress' || p.status === 'pending'
  );
  const completedProjects = allProjects.filter((p: any) =>
    p.status === 'completed'
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'В работе';
      case 'completed':
        return 'Завершён';
      case 'cancelled':
        return 'Отменён';
      default:
        return status;
    }
  };

  const renderProject = ({ item }: { item: Project }) => (
    <TouchableOpacity
      onPress={() => router.push(`/(client)/projects/${item.id}`)}
      className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4"
    >
      <View className="flex-row items-start justify-between mb-3">
        <Text className="font-semibold text-gray-900 flex-1" numberOfLines={1}>
          {item.order_title || item.order?.title}
        </Text>
        <View className={`px-3 py-1 rounded-full ${getStatusColor(item.status)}`}>
          <Text className="text-xs font-medium">{getStatusLabel(item.status)}</Text>
        </View>
      </View>

      <View className="flex-row items-center gap-3 text-sm text-gray-500 mb-2">
        <View className="flex-row items-center gap-1">
          <Ionicons name="person" size={14} color="#6B7280" />
          <Text className="text-gray-500">
            {item.master_name || item.master?.name}
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Ionicons name="card" size={14} color="#6B7280" />
          <Text className="text-gray-500">{item.agreed_price} сом</Text>
        </View>
      </View>

      {item.end_date && item.status === 'in_progress' && (
        <View className="flex-row items-center gap-1 mb-2">
          <Ionicons name="calendar" size={14} color="#6B7280" />
          <Text className="text-sm text-gray-500">
            Дедлайн: {formatRelativeTime(item.end_date)}
          </Text>
        </View>
      )}

      {item.completed_at && item.status === 'completed' && (
        <View className="flex-row items-center gap-1 mb-2">
          <Ionicons name="checkmark-circle" size={14} color="#059669" />
          <Text className="text-sm text-gray-500">
            Завершён: {formatRelativeTime(item.completed_at)}
          </Text>
        </View>
      )}

      {item.progress !== undefined && item.status === 'in_progress' && (
        <View className="mt-3">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-xs text-gray-500">Прогресс</Text>
            <Text className="text-xs font-medium text-gray-700">{item.progress}%</Text>
          </View>
          <View className="w-full bg-gray-200 rounded-full h-2">
            <View
              className="bg-[#0165FB] h-2 rounded-full"
              style={{ width: `${item.progress}%` }}
            />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Загрузка проектов..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        fullScreen
        message="Не удалось загрузить проекты"
        onRetry={refetch}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}>
        {/* Header */}
        <View className="flex-row items-center gap-4 mb-4 pt-4 px-0">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-white rounded-2xl items-center justify-center shadow-sm border border-gray-100"
          >
            <Ionicons name="arrow-back" size={20} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">Мои проекты</Text>
        </View>

        {/* Active Projects */}
        {activeProjects.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">В работе</Text>
            <FlatList
              data={activeProjects}
              renderItem={renderProject}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Completed Projects */}
        {completedProjects.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Завершённые</Text>
            <FlatList
              data={completedProjects}
              renderItem={renderProject}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Empty State */}
        {allProjects.length === 0 && (
          <View className="items-center py-12">
            <View className="w-20 h-20 bg-[#0165FB]/10 rounded-full items-center justify-center mb-4">
              <Ionicons name="folder-open" size={40} color="#0165FB" />
            </View>
            <Text className="text-lg font-semibold text-gray-900 mb-2">Нет проектов</Text>
            <Text className="text-gray-500 mb-6 text-center">
              Создайте заказ и примите отклик мастера
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(client)/create-order')}
              className="flex-row items-center gap-2 px-6 py-3 bg-[#0165FB] rounded-2xl shadow-lg"
            >
              <Ionicons name="add" size={20} color="white" />
              <Text className="font-semibold text-white">Создать заказ</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}