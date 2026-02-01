/**
 * Escrow Screen
 * Экран резервирования средств (эскроу)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../../hooks/useTranslation';

interface EscrowTransaction {
  id: string;
  projectId: string;
  projectTitle: string;
  amount: number;
  commission: number;
  totalAmount: number;
  status: 'PENDING' | 'RESERVED' | 'RELEASED' | 'REFUNDED' | 'CANCELLED';
  createdAt: string;
  releasedAt?: string;
  masterName: string;
  clientName: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: 'time' },
  RESERVED: { bg: 'bg-blue-100', text: 'text-blue-700', icon: 'lock-closed' },
  RELEASED: { bg: 'bg-green-100', text: 'text-green-700', icon: 'checkmark-circle' },
  REFUNDED: { bg: 'bg-purple-100', text: 'text-purple-700', icon: 'arrow-undo' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', icon: 'close-circle' },
};

export default function EscrowScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const projectId = params.projectId as string;

  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([
    {
      id: '1',
      projectId: 'proj-1',
      projectTitle: 'Ремонт ванной комнаты',
      amount: 25000,
      commission: 2500,
      totalAmount: 27500,
      status: 'RESERVED',
      createdAt: '2024-05-20T10:00:00Z',
      masterName: 'Иван Петров',
      clientName: 'Мария Сидорова',
    },
    {
      id: '2',
      projectId: 'proj-2',
      projectTitle: 'Установка электропроводки',
      amount: 15000,
      commission: 1500,
      totalAmount: 16500,
      status: 'RELEASED',
      createdAt: '2024-05-15T14:30:00Z',
      releasedAt: '2024-05-18T16:00:00Z',
      masterName: 'Алексей Иванов',
      clientName: 'Мария Сидорова',
    },
  ]);

  const handleReserve = async (projectId: string, amount: number) => {
    Alert.alert(
      t('payments.reserveFunds'),
      `${t('payments.reserveConfirm')} ${amount.toLocaleString()} сом?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('payments.reserve'),
          onPress: async () => {
            setIsLoading(true);
            try {
              // API call would go here
              await new Promise(resolve => setTimeout(resolve, 1500));
              Alert.alert(t('success'), t('payments.fundsReserved'));
            } catch (error) {
              Alert.alert(t('error'), t('payments.reserveFailed'));
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRelease = async (transactionId: string) => {
    Alert.alert(
      t('payments.releaseFunds'),
      t('payments.releaseConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('payments.release'),
          onPress: async () => {
            setIsLoading(true);
            try {
              await new Promise(resolve => setTimeout(resolve, 1500));
              setTransactions(prev =>
                prev.map(tx =>
                  tx.id === transactionId
                    ? { ...tx, status: 'RELEASED', releasedAt: new Date().toISOString() }
                    : tx
                )
              );
              Alert.alert(t('success'), t('payments.fundsReleased'));
            } catch (error) {
              Alert.alert(t('error'), t('payments.releaseFailed'));
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRefund = async (transactionId: string) => {
    Alert.alert(
      t('payments.refundFunds'),
      t('payments.refundConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('payments.refund'),
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await new Promise(resolve => setTimeout(resolve, 1500));
              setTransactions(prev =>
                prev.map(tx =>
                  tx.id === transactionId ? { ...tx, status: 'REFUNDED' } : tx
                )
              );
              Alert.alert(t('success'), t('payments.fundsRefunded'));
            } catch (error) {
              Alert.alert(t('error'), t('payments.refundFailed'));
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">
          {t('payments.escrow')}
        </Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4 space-y-4">
          {/* Info Card */}
          <View className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <View className="flex-row items-start">
              <Ionicons name="shield-checkmark" size={24} color="#3B82F6" />
              <View className="flex-1 ml-3">
                <Text className="text-blue-900 font-medium mb-1">
                  {t('payments.escrowInfo')}
                </Text>
                <Text className="text-blue-700 text-sm">
                  {t('payments.escrowDescription')}
                </Text>
              </View>
            </View>
          </View>

          {/* Transactions */}
          {transactions.length === 0 ? (
            <View className="bg-white rounded-2xl p-8 items-center border border-gray-200">
              <Ionicons name="lock-closed-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-600 mt-4">{t('payments.noEscrow')}</Text>
            </View>
          ) : (
            transactions.map((transaction) => {
              const statusConfig = STATUS_COLORS[transaction.status];
              
              return (
                <View
                  key={transaction.id}
                  className="bg-white rounded-2xl p-4 border border-gray-200"
                >
                  {/* Header */}
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-gray-900 mb-1">
                        {transaction.projectTitle}
                      </Text>
                      <Text className="text-sm text-gray-500">
                        {t('payments.master')}: {transaction.masterName}
                      </Text>
                    </View>
                    <View className={`px-3 py-1 rounded-full ${statusConfig.bg}`}>
                      <View className="flex-row items-center">
                        <Ionicons
                          name={statusConfig.icon as any}
                          size={14}
                          color={statusConfig.text.replace('text-', '#')}
                        />
                        <Text className={`text-xs font-medium ml-1 ${statusConfig.text}`}>
                          {t(`payments.status.${transaction.status.toLowerCase()}`)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Amount Details */}
                  <View className="bg-gray-50 rounded-xl p-3 mb-3">
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-gray-600">{t('payments.amount')}</Text>
                      <Text className="text-gray-900 font-semibold">
                        {transaction.amount.toLocaleString()} сом
                      </Text>
                    </View>
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-gray-600">{t('payments.commission')}</Text>
                      <Text className="text-gray-900 font-semibold">
                        {transaction.commission.toLocaleString()} сом
                      </Text>
                    </View>
                    <View className="h-px bg-gray-200 my-2" />
                    <View className="flex-row justify-between">
                      <Text className="text-gray-900 font-semibold">{t('payments.total')}</Text>
                      <Text className="text-gray-900 font-bold text-lg">
                        {transaction.totalAmount.toLocaleString()} сом
                      </Text>
                    </View>
                  </View>

                  {/* Dates */}
                  <View className="mb-3">
                    <View className="flex-row items-center mb-1">
                      <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                      <Text className="text-xs text-gray-500 ml-1">
                        {t('payments.reserved')}: {new Date(transaction.createdAt).toLocaleString('ru-RU')}
                      </Text>
                    </View>
                    {transaction.releasedAt && (
                      <View className="flex-row items-center">
                        <Ionicons name="checkmark-circle-outline" size={14} color="#10B981" />
                        <Text className="text-xs text-gray-500 ml-1">
                          {t('payments.released')}: {new Date(transaction.releasedAt).toLocaleString('ru-RU')}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Actions */}
                  {transaction.status === 'RESERVED' && (
                    <View className="flex-row space-x-2">
                      <TouchableOpacity
                        className="flex-1 py-3 bg-green-500 rounded-xl"
                        onPress={() => handleRelease(transaction.id)}
                        disabled={isLoading}
                      >
                        <Text className="text-white text-center font-semibold">
                          {t('payments.release')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="flex-1 py-3 bg-red-100 rounded-xl"
                        onPress={() => handleRefund(transaction.id)}
                        disabled={isLoading}
                      >
                        <Text className="text-red-600 text-center font-semibold">
                          {t('payments.refund')}
                        </Text>
                      </TouchableOpacity>
                    </View>
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
