/**
 * Payment Holds Screen
 * Экран управления холдами платежей
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

interface PaymentHold {
  id: string;
  amount: number;
  currency: string;
  status: 'ACTIVE' | 'RELEASED' | 'EXPIRED' | 'CANCELLED';
  reason: string;
  projectId?: string;
  projectTitle?: string;
  createdAt: string;
  expiresAt: string;
  releasedAt?: string;
  autoRelease: boolean;
}

const HOLD_STATUS_CONFIG: Record<string, { bg: string; text: string; icon: string }> = {
  ACTIVE: { bg: 'bg-blue-100', text: 'text-blue-700', icon: 'lock-closed' },
  RELEASED: { bg: 'bg-green-100', text: 'text-green-700', icon: 'checkmark-circle' },
  EXPIRED: { bg: 'bg-gray-100', text: 'text-gray-700', icon: 'time-outline' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', icon: 'close-circle' },
};

export default function PaymentHoldsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'RELEASED'>('ALL');

  const [holds, setHolds] = useState<PaymentHold[]>([
    {
      id: '1',
      amount: 27500,
      currency: 'KGS',
      status: 'ACTIVE',
      reason: 'Резервирование для проекта',
      projectId: 'proj-1',
      projectTitle: 'Ремонт ванной комнаты',
      createdAt: '2024-05-20T10:00:00Z',
      expiresAt: '2024-06-20T10:00:00Z',
      autoRelease: true,
    },
    {
      id: '2',
      amount: 16500,
      currency: 'KGS',
      status: 'RELEASED',
      reason: 'Резервирование для проекта',
      projectId: 'proj-2',
      projectTitle: 'Установка электропроводки',
      createdAt: '2024-05-15T14:30:00Z',
      expiresAt: '2024-06-15T14:30:00Z',
      releasedAt: '2024-05-18T16:00:00Z',
      autoRelease: false,
    },
    {
      id: '3',
      amount: 12000,
      currency: 'KGS',
      status: 'ACTIVE',
      reason: 'Предоплата за услуги',
      createdAt: '2024-05-22T09:00:00Z',
      expiresAt: '2024-06-22T09:00:00Z',
      autoRelease: true,
    },
  ]);

  const filteredHolds = holds.filter(hold => {
    if (filter === 'ALL') return true;
    return hold.status === filter;
  });

  const totalActiveHolds = holds
    .filter(h => h.status === 'ACTIVE')
    .reduce((sum, h) => sum + h.amount, 0);

  const getDaysUntilExpiry = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
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
            {t('payments.holds')}
          </Text>
        </View>

        {/* Summary */}
        <View className="bg-blue-50 rounded-xl p-4">
          <Text className="text-sm text-blue-700 mb-1">{t('payments.totalHeld')}</Text>
          <Text className="text-3xl font-bold text-blue-900">
            {totalActiveHolds.toLocaleString()} сом
          </Text>
          <Text className="text-xs text-blue-600 mt-1">
            {holds.filter(h => h.status === 'ACTIVE').length} {t('payments.activeHolds')}
          </Text>
        </View>
      </View>

      {/* Filter */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row space-x-2">
            {['ALL', 'ACTIVE', 'RELEASED'].map((f) => (
              <TouchableOpacity
                key={f}
                className={`px-4 py-2 rounded-full ${
                  filter === f ? 'bg-blue-500' : 'bg-gray-100'
                }`}
                onPress={() => setFilter(f as any)}
              >
                <Text className={filter === f ? 'text-white font-medium' : 'text-gray-700'}>
                  {t(`payments.filter.${f.toLowerCase()}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4 space-y-3">
          {filteredHolds.length === 0 ? (
            <View className="bg-white rounded-2xl p-8 items-center border border-gray-200">
              <Ionicons name="lock-open-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-600 mt-4">{t('payments.noHolds')}</Text>
            </View>
          ) : (
            filteredHolds.map((hold) => {
              const statusConfig = HOLD_STATUS_CONFIG[hold.status];
              const daysLeft = getDaysUntilExpiry(hold.expiresAt);
              const isExpiringSoon = daysLeft <= 7 && hold.status === 'ACTIVE';

              return (
                <View
                  key={hold.id}
                  className="bg-white rounded-2xl p-4 border border-gray-200"
                >
                  {/* Header */}
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-gray-900 mb-1">
                        {hold.amount.toLocaleString()} {hold.currency}
                      </Text>
                      <Text className="text-sm text-gray-600">{hold.reason}</Text>
                      {hold.projectTitle && (
                        <Text className="text-sm text-gray-500 mt-1">
                          {hold.projectTitle}
                        </Text>
                      )}
                    </View>
                    <View className={`px-3 py-1 rounded-full ${statusConfig.bg}`}>
                      <View className="flex-row items-center">
                        <Ionicons
                          name={statusConfig.icon as any}
                          size={14}
                          color={statusConfig.text.replace('text-', '#')}
                        />
                        <Text className={`text-xs font-medium ml-1 ${statusConfig.text}`}>
                          {t(`payments.holdStatus.${hold.status.toLowerCase()}`)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Timeline */}
                  <View className="bg-gray-50 rounded-xl p-3 mb-3">
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                      <Text className="text-xs text-gray-600 ml-2">
                        {t('payments.created')}: {new Date(hold.createdAt).toLocaleDateString('ru-RU')}
                      </Text>
                    </View>
                    
                    {hold.status === 'ACTIVE' && (
                      <View className="flex-row items-center">
                        <Ionicons
                          name="time-outline"
                          size={14}
                          color={isExpiringSoon ? '#EF4444' : '#6B7280'}
                        />
                        <Text className={`text-xs ml-2 ${isExpiringSoon ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                          {t('payments.expires')}: {daysLeft} {t('payments.daysLeft')}
                        </Text>
                      </View>
                    )}

                    {hold.releasedAt && (
                      <View className="flex-row items-center">
                        <Ionicons name="checkmark-circle-outline" size={14} color="#10B981" />
                        <Text className="text-xs text-gray-600 ml-2">
                          {t('payments.released')}: {new Date(hold.releasedAt).toLocaleDateString('ru-RU')}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Auto Release Badge */}
                  {hold.autoRelease && hold.status === 'ACTIVE' && (
                    <View className="flex-row items-center mb-3">
                      <Ionicons name="sync-outline" size={14} color="#3B82F6" />
                      <Text className="text-xs text-blue-600 ml-1">
                        {t('payments.autoRelease')}
                      </Text>
                    </View>
                  )}

                  {/* Actions */}
                  {hold.status === 'ACTIVE' && hold.projectId && (
                    <TouchableOpacity
                      className="py-3 bg-blue-500 rounded-xl"
                      onPress={() => router.push({
                        pathname: '/(master)/payments/escrow',
                        params: { projectId: hold.projectId }
                      })}
                    >
                      <Text className="text-white text-center font-semibold">
                        {t('payments.viewDetails')}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}
