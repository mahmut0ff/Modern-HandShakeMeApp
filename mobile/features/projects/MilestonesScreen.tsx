import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useGetProjectMilestonesQuery,
  useDeleteProjectMilestoneMutation,
  ProjectMilestone,
} from '../../services/projectApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { EmptyState } from '../../components/EmptyState';

export default function MilestonesScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: milestones,
    isLoading,
    error,
    refetch,
  } = useGetProjectMilestonesQuery(Number(projectId));

  const [deleteMilestone] = useDeleteProjectMilestoneMutation();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleDelete = (milestone: ProjectMilestone) => {
    Alert.alert(
      'Удалить веху',
      `Вы уверены, что хотите удалить "${milestone.title}"?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMilestone({ id: milestone.id, projectId: Number(projectId) }).unwrap();
              Alert.alert('Успешно', 'Веха удалена');
            } catch (err) {
              Alert.alert('Ошибка', 'Не удалось удалить веху');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Завершено';
      case 'IN_PROGRESS':
        return 'В работе';
      case 'PENDING':
        return 'Ожидает';
      case 'CANCELLED':
        return 'Отменено';
      default:
        return status;
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message="Не удалось загрузить вехи" onRetry={refetch} />;
  }

  const totalAmount = milestones?.reduce((sum, m) => sum + Number(m.amount || 0), 0) || 0;
  const completedAmount =
    milestones
      ?.filter((m) => m.status === 'COMPLETED')
      .reduce((sum, m) => sum + Number(m.amount || 0), 0) || 0;

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Summary */}
        <View className="bg-white p-4 mb-2">
          <Text className="text-lg font-semibold mb-3">Сводка</Text>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">Всего вех:</Text>
            <Text className="font-semibold">{milestones?.length || 0}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">Завершено:</Text>
            <Text className="font-semibold text-green-600">
              {milestones?.filter((m) => m.status === 'COMPLETED').length || 0}
            </Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">Общая сумма:</Text>
            <Text className="font-semibold">{totalAmount.toLocaleString()} ₽</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-600">Выплачено:</Text>
            <Text className="font-semibold text-green-600">
              {completedAmount.toLocaleString()} ₽
            </Text>
          </View>
        </View>

        {/* Milestones List */}
        {!milestones || milestones.length === 0 ? (
          <EmptyState
            icon="flag-outline"
            title="Нет вех"
            description="Добавьте вехи для отслеживания прогресса проекта"
          />
        ) : (
          <View className="bg-white">
            {milestones.map((milestone, index) => (
              <TouchableOpacity
                key={milestone.id}
                className={`p-4 ${index !== milestones.length - 1 ? 'border-b border-gray-200' : ''}`}
                onPress={() =>
                  router.push({
                    pathname: '/projects/milestone-edit',
                    params: { projectId, milestoneId: milestone.id },
                  })
                }
              >
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1 mr-2">
                    <Text className="font-semibold text-base mb-1">{milestone.title}</Text>
                    {milestone.description && (
                      <Text className="text-gray-600 text-sm mb-2">{milestone.description}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDelete(milestone)}
                    className="p-2"
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                <View className="flex-row items-center justify-between">
                  <View className={`px-3 py-1 rounded-full ${getStatusColor(milestone.status)}`}>
                    <Text className="text-xs font-medium">{getStatusText(milestone.status)}</Text>
                  </View>
                  <Text className="font-semibold text-blue-600">
                    {Number(milestone.amount).toLocaleString()} ₽
                  </Text>
                </View>

                {milestone.dueDate && (
                  <View className="flex-row items-center mt-2">
                    <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                    <Text className="text-gray-600 text-sm ml-1">
                      Срок: {new Date(milestone.dueDate).toLocaleDateString('ru-RU')}
                    </Text>
                  </View>
                )}

                {milestone.completedAt && (
                  <View className="flex-row items-center mt-1">
                    <Ionicons name="checkmark-circle-outline" size={14} color="#10B981" />
                    <Text className="text-green-600 text-sm ml-1">
                      Завершено: {new Date(milestone.completedAt).toLocaleDateString('ru-RU')}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-blue-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        onPress={() =>
          router.push({
            pathname: '/projects/milestone-create',
            params: { projectId },
          })
        }
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}
