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
  useGetProjectPaymentsQuery,
} from '../../services/projectApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import MilestonePaymentCard from '../../components/projects/MilestonePaymentCard';
import MilestoneProgress from '../../components/projects/MilestoneProgress';

export default function MilestonePaymentScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: milestones,
    isLoading: loadingMilestones,
    error: milestonesError,
    refetch: refetchMilestones,
  } = useGetProjectMilestonesQuery(Number(projectId));

  const {
    data: payments,
    isLoading: loadingPayments,
    error: paymentsError,
    refetch: refetchPayments,
  } = useGetProjectPaymentsQuery(Number(projectId));

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchMilestones(), refetchPayments()]);
    setRefreshing(false);
  };

  const handlePayment = async (milestoneId: number) => {
    // TODO: Integrate with payment API
    Alert.alert(
      'Оплата',
      'Функция оплаты будет доступна после интеграции с платежной системой',
      [{ text: 'OK' }]
    );
  };

  if (loadingMilestones || loadingPayments) {
    return <LoadingSpinner />;
  }

  if (milestonesError) {
    return <ErrorMessage message="Не удалось загрузить вехи" onRetry={refetchMilestones} />;
  }

  const sortedMilestones = [...(milestones || [])].sort((a, b) => {
    return (a.orderNum || 0) - (b.orderNum || 0);
  });

  const completedMilestones = sortedMilestones.filter((m) => m.status === 'COMPLETED');
  const activeMilestones = sortedMilestones.filter(
    (m) => m.status === 'IN_PROGRESS' || m.status === 'PENDING'
  );

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Progress Overview */}
        {milestones && milestones.length > 0 && (
          <View className="p-4">
            <MilestoneProgress milestones={milestones} />
          </View>
        )}

        {/* Active Milestones */}
        {activeMilestones.length > 0 && (
          <View className="px-4 mb-4">
            <Text className="text-lg font-semibold mb-3">Активные вехи</Text>
            {activeMilestones.map((milestone) => (
              <MilestonePaymentCard
                key={milestone.id}
                milestone={milestone}
                canPay={false}
              />
            ))}
          </View>
        )}

        {/* Completed Milestones */}
        {completedMilestones.length > 0 && (
          <View className="px-4 mb-4">
            <Text className="text-lg font-semibold mb-3">Завершенные вехи</Text>
            {completedMilestones.map((milestone) => (
              <MilestonePaymentCard
                key={milestone.id}
                milestone={milestone}
                onPayment={handlePayment}
                canPay={true}
              />
            ))}
          </View>
        )}

        {/* Payment History */}
        {payments && payments.length > 0 && (
          <View className="px-4 mb-4">
            <Text className="text-lg font-semibold mb-3">История платежей</Text>
            <View className="bg-white rounded-lg shadow-sm">
              {payments.map((payment, index) => (
                <View
                  key={payment.id}
                  className={`p-4 ${index !== payments.length - 1 ? 'border-b border-gray-200' : ''}`}
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <Text className="font-medium">{payment.description || 'Платеж'}</Text>
                      <Text className="text-sm text-gray-500 mt-1">
                        {new Date(payment.createdAt).toLocaleDateString('ru-RU')}
                      </Text>
                    </View>
                    <Text className="font-semibold text-green-600">
                      {Number(payment.amount).toLocaleString()} ₽
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <View
                      className={`px-2 py-1 rounded ${
                        payment.status === 'COMPLETED'
                          ? 'bg-green-100'
                          : payment.status === 'PENDING'
                          ? 'bg-yellow-100'
                          : 'bg-red-100'
                      }`}
                    >
                      <Text
                        className={`text-xs ${
                          payment.status === 'COMPLETED'
                            ? 'text-green-800'
                            : payment.status === 'PENDING'
                            ? 'text-yellow-800'
                            : 'text-red-800'
                        }`}
                      >
                        {payment.status === 'COMPLETED'
                          ? 'Выполнен'
                          : payment.status === 'PENDING'
                          ? 'Ожидает'
                          : 'Отменен'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {(!milestones || milestones.length === 0) && (
          <View className="flex-1 items-center justify-center p-8">
            <Ionicons name="flag-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 text-center mt-4">
              Нет вех для отображения
            </Text>
            <TouchableOpacity
              className="mt-4 bg-blue-600 px-6 py-3 rounded-lg"
              onPress={() =>
                router.push({
                  pathname: '/projects/milestones',
                  params: { projectId },
                })
              }
            >
              <Text className="text-white font-semibold">Управление вехами</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
