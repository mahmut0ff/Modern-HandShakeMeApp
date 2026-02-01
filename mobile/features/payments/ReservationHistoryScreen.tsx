/**
 * Reservation History Screen
 * Экран истории резервирований
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../../hooks/useTranslation';

interface Reservation {
  id: string;
  type: 'RESERVE' | 'RELEASE' | 'REFUND';
  amount: number;
  commission: number;
  totalAmount: number;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  projectId: string;
  projectTitle: string;
  description: string;
  createdAt: string;
  completedAt?: string;
}

const TYPE_CONFIG: Record<string, { bg: string; text: string; icon: string; color: string }> = {
  RESERVE: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'lock-closed', color: '#3B82F6' },
  RELEASE: { bg: 'bg-green-50', text: 'text-green-700', icon: 'checkmark-circle', color: '#10B981' },
  REFUND: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'arrow-undo', color: '#8B5CF6' },
};

export default function ReservationHistoryScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('month');
  const [isLoading, setIsLoading] = useState(false);

  const [reservations, setReservations] = useState<Reservation[]>([
    {
      id: '1',
      type: 'RESERVE',
      amount: 25000,
      commission: 2500,
      totalAmount: 27500,
      status: 'COMPLETED',
      projectId: 'proj-1',
      projectTitle: 'Ремонт ванной комнаты',
      description: 'Резервирование средств для проекта',
      createdAt: '2024-05-20T10:00:00Z',
      completedAt: '2024-05-20T10:00:05Z',
    },
    {
      id: '2',
      type: 'RELEASE',
      amount: 15000,
      commission: 1500,
      totalAmount: 16500,
      status: 'COMPLETED',
      projectId: 'proj-2',
      projectTitle: 'Установка электропроводки',
      description: 'Освобождение средств после завершения',
      createdAt: '2024-05-18T16:00:00Z',
      completedAt: '2024-05-18T16:00:03Z',
    },
    {
      id: '3',
      type: 'RESERVE',
      amount: 12000,
      commission: 1200,
      totalAmount: 13200,
      status: 'PENDING',
      projectId: 'proj-3',
      projectTitle: 'Покраска стен',
      description: 'Резервирование средств для проекта',
      createdAt: '2024-05-22T09:00:00Z',
    },
    {
      id: '4',
      type: 'REFUND',
      amount: 8000,
      commission: 800,
      totalAmount: 8800,
      status: 'COMPLETED',
      projectId: 'proj-4',
      projectTitle: 'Сантехнические работы',
      description: 'Возврат средств по запросу клиента',
      createdAt: '2024-05-10T14:30:00Z',
      completedAt: '2024-05-10T14:30:08Z',
    },
  ]);

  const stats = {
    totalReserved: reservations
      .filter(r => r.type === 'RESERVE' && r.status === 'COMPLETED')
      .reduce((sum, r) => sum + r.totalAmount, 0),
    totalReleased: reservations
      .filter(r => r.type === 'RELEASE' && r.status === 'COMPLETED')
      .reduce((sum, r) => sum + r.amount, 0),
    totalRefunded: reservations
      .filter(r => r.type === 'REFUND' && r.status === 'COMPLETED')
      .reduce((sum, r) => sum + r.totalAmount, 0),
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">
            {t('payments.reservationHistory')}
          </Text>
        </View>

        {/* Stats */}
        <View className="flex-row space-x-3">
          <View className="flex-1 bg-blue-50 rounded-xl p-3">
            <Text className="text-xs text-blue-600 mb-1">{t('payments.reserved')}</Text>
            <Text className="text-lg font-bold text-blue-900">
              {(stats.totalReserved / 1000).toFixed(0)}K
            </Text>
          </View>
          <View className="flex-1 bg-green-50 rounded-xl p-3">
            <Text className="text-xs text-green-600 mb-1">{t('payments.released')}</Text>
            <Text className="text-lg font-bold text-green-900">
              {(stats.totalReleased / 1000).toFixed(0)}K
            </Text>
          </View>
          <View className="flex-1 bg-purple-50 rounded-xl p-3">
            <Text className="text-xs text-purple-600 mb-1">{t('payments.refunded')}</Text>
            <Text className="text-lg font-bold text-purple-900">
              {(stats.totalRefunded / 1000).toFixed(0)}K
            </Text>
          </View>
        </View>
      </View>

      {/* Period Filter */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row space-x-2">
          {['week', 'month', 'all'].map((p) => (
            <TouchableOpacity
              key={p}
              className={`flex-1 py-2 rounded-full ${
                period === p ? 'bg-blue-500' : 'bg-gray-100'
              }`}
              onPress={() => setPeriod(p as any)}
            >
              <Text className={`text-center ${period === p ? 'text-white font-medium' : 'text-gray-700'}`}>
                {t(`payments.period.${p}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView className="flex-1">
        {isLoading ? (
          <View className="flex-1 items-center justify-center py-12">
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : (
          <View className="p-4 space-y-3">
            {reservations.length === 0 ? (
              <View className="bg-white rounded-2xl p-8 items-center border border-gray-200">
                <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
                <Text className="text-gray-600 mt-4">{t('payments.noHistory')}</Text>
              </View>
            ) : (
              reservations.map((reservation) => {
                const typeConfig = TYPE_CONFIG[reservation.type];
                const isPositive = reservation.type === 'RELEASE' || reservation.type === 'REFUND';

                return (
                  <View
                    key={reservation.id}
                    className="bg-white rounded-2xl p-4 border border-gray-200"
                  >
                    {/* Header */}
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-row items-start flex-1">
                        <View
                          className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${typeConfig.bg}`}
                        >
                          <Ionicons
                            name={typeConfig.icon as any}
                            size={20}
                            color={typeConfig.color}
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="text-base font-semibold text-gray-900 mb-1">
                            {reservation.projectTitle}
                          </Text>
                          <Text className="text-sm text-gray-600">
                            {reservation.description}
                          </Text>
                        </View>
                      </View>
                      <Text className={`text-lg font-bold ${isPositive ? 'text-green-600' : 'text-blue-600'}`}>
                        {isPositive ? '+' : '-'}{reservation.totalAmount.toLocaleString()}
                      </Text>
                    </View>

                    {/* Details */}
                    <View className="bg-gray-50 rounded-xl p-3 mb-3">
                      <View className="flex-row justify-between mb-1">
                        <Text className="text-sm text-gray-600">{t('payments.amount')}</Text>
                        <Text className="text-sm text-gray-900 font-medium">
                          {reservation.amount.toLocaleString()} сом
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-sm text-gray-600">{t('payments.commission')}</Text>
                        <Text className="text-sm text-gray-900 font-medium">
                          {reservation.commission.toLocaleString()} сом
                        </Text>
                      </View>
                    </View>

                    {/* Footer */}
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                        <Text className="text-xs text-gray-500 ml-1">
                          {new Date(reservation.createdAt).toLocaleString('ru-RU')}
                        </Text>
                      </View>
                      <View
                        className={`px-2 py-1 rounded-full ${
                          reservation.status === 'COMPLETED' ? 'bg-green-100' :
                          reservation.status === 'PENDING' ? 'bg-yellow-100' : 'bg-red-100'
                        }`}
                      >
                        <Text
                          className={`text-xs font-medium ${
                            reservation.status === 'COMPLETED' ? 'text-green-700' :
                            reservation.status === 'PENDING' ? 'text-yellow-700' : 'text-red-700'
                          }`}
                        >
                          {t(`payments.status.${reservation.status.toLowerCase()}`)}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
