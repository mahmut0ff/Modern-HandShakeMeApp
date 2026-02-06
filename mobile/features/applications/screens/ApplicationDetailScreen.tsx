/**
 * Application Detail Screen
 * Детальная информация о заявке
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGetApplicationQuery } from '../../../services/applicationApi';
import { ApplicationStatusBadge } from '../components/ApplicationStatusBadge';
import { ApplicationActions } from '../components/ApplicationActions';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ErrorMessage } from '../../../components/ErrorMessage';
import { useApplicationActions } from '../hooks/useApplicationActions';
import { formatRelativeTime } from '../../../utils/format';

export default function ApplicationDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const applicationId = parseInt(params.id);

  const {
    data: application,
    isLoading,
    error,
    refetch,
  } = useGetApplicationQuery(applicationId);

  const {
    acceptApplication,
    rejectApplication,
    cancelApplication,
    markApplicationViewed,
    isLoading: isActionLoading,
  } = useApplicationActions();

  // Отмечаем заявку как просмотренную при открытии (для клиента)
  useEffect(() => {
    if (application && application.status === 'pending') {
      // TODO: Проверить, является ли текущий пользователь владельцем заказа
      markApplicationViewed(applicationId);
    }
  }, [application, applicationId, markApplicationViewed]);

  const handleAccept = async (message?: string) => {
    const success = await acceptApplication(applicationId, message);
    if (success) {
      refetch();
    }
  };

  const handleReject = async (message?: string) => {
    const success = await rejectApplication(applicationId, message);
    if (success) {
      refetch();
    }
  };

  const handleCancel = async () => {
    const success = await cancelApplication(applicationId);
    if (success) {
      router.back();
    }
  };

  const handleEdit = () => {
    router.push(`/applications/${applicationId}/edit`);
  };

  const handleCallMaster = () => {
    if (application?.master_phone || application?.master?.phone) {
      Linking.openURL(`tel:${application.master_phone || application.master?.phone}`);
    }
  };

  const handleChatWithMaster = () => {
    router.push(`/chat/${application?.master?.id}`);
  };

  const handleViewOrder = () => {
    router.push(`/orders/${application?.order}`);
  };

  const handleViewMasterProfile = () => {
    router.push(`/masters/${application?.master?.id}`);
  };

  const formatPrice = (price: string): string => {
    const num = parseFloat(price);
    return num.toLocaleString('ru-RU');
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <LoadingSpinner fullScreen text="Загрузка заявки..." />
      </SafeAreaView>
    );
  }

  if (error || !application) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <ErrorMessage
          message="Не удалось загрузить заявку"
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  // TODO: Определить роль пользователя
  const isOwner = false; // Мастер - владелец заявки
  const isOrderOwner = true; // Клиент - владелец заказа

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">Заявка</Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Status */}
        <View className="bg-white p-4 border-b border-gray-200">
          <View className="flex-row items-center justify-between">
            <ApplicationStatusBadge status={application.status} size="large" />
            <Text className="text-sm text-gray-500">
              {formatRelativeTime(application.created_at)}
            </Text>
          </View>
        </View>

        {/* Order Info */}
        <TouchableOpacity
          className="bg-white p-4 border-b border-gray-200"
          onPress={handleViewOrder}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-3">
              <Text className="text-sm text-gray-500 mb-1">Заказ</Text>
              <Text className="text-base font-semibold text-gray-900" numberOfLines={2}>
                {application.order_title}
              </Text>
              {application.order_budget_display && (
                <Text className="text-sm text-gray-600 mt-1">
                  Бюджет: {application.order_budget_display}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>

        {/* Master Info */}
        <View className="bg-white p-4 border-b border-gray-200">
          <Text className="text-sm text-gray-500 mb-3">Мастер</Text>
          
          <TouchableOpacity
            className="flex-row items-center"
            onPress={handleViewMasterProfile}
          >
            {application.master_avatar || application.master?.avatar ? (
              <Image
                source={{ uri: application.master_avatar || application.master?.avatar || '' }}
                className="w-14 h-14 rounded-full"
              />
            ) : (
              <View className="w-14 h-14 rounded-full bg-gray-200 items-center justify-center">
                <Ionicons name="person" size={28} color="#6B7280" />
              </View>
            )}
            
            <View className="ml-3 flex-1">
              <Text className="text-lg font-semibold text-gray-900">
                {application.master_name || application.master?.name}
              </Text>
              {(application.master_rating || application.master?.rating) && (
                <View className="flex-row items-center mt-1">
                  <Ionicons name="star" size={16} color="#F59E0B" />
                  <Text className="text-sm text-gray-600 ml-1">
                    {application.master_rating || application.master?.rating}
                  </Text>
                </View>
              )}
            </View>
            
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Contact Buttons */}
          <View className="flex-row space-x-3 mt-4">
            <TouchableOpacity
              className="flex-1 bg-blue-100 rounded-xl py-3 items-center"
              onPress={handleChatWithMaster}
            >
              <View className="flex-row items-center">
                <Ionicons name="chatbubble" size={18} color="#3B82F6" />
                <Text className="text-blue-700 font-medium ml-2">Написать</Text>
              </View>
            </TouchableOpacity>

            {(application.master_phone || application.master?.phone) && (
              <TouchableOpacity
                className="flex-1 bg-green-100 rounded-xl py-3 items-center"
                onPress={handleCallMaster}
              >
                <View className="flex-row items-center">
                  <Ionicons name="call" size={18} color="#10B981" />
                  <Text className="text-green-700 font-medium ml-2">Позвонить</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Proposed Price */}
        <View className="bg-white p-4 border-b border-gray-200">
          <Text className="text-sm text-gray-500 mb-2">Предложенная цена</Text>
          <View className="flex-row items-center">
            <Ionicons name="wallet" size={24} color="#10B981" />
            <Text className="text-2xl font-bold text-gray-900 ml-2">
              {formatPrice(application.proposed_price)} сом
            </Text>
          </View>
        </View>

        {/* Message */}
        <View className="bg-white p-4 border-b border-gray-200">
          <Text className="text-sm text-gray-500 mb-2">Сообщение</Text>
          <Text className="text-base text-gray-700 leading-6">
            {application.message}
          </Text>
        </View>

        {/* Details */}
        {(application.estimated_duration || application.start_date) && (
          <View className="bg-white p-4 border-b border-gray-200">
            <Text className="text-sm text-gray-500 mb-3">Детали</Text>
            
            <View className="space-y-3">
              {application.estimated_duration && (
                <View className="flex-row items-center">
                  <Ionicons name="time" size={20} color="#3B82F6" />
                  <View className="ml-3">
                    <Text className="text-sm text-gray-500">Срок выполнения</Text>
                    <Text className="text-base text-gray-900">
                      {application.estimated_duration}
                    </Text>
                  </View>
                </View>
              )}

              {application.start_date && (
                <View className="flex-row items-center">
                  <Ionicons name="calendar" size={20} color="#10B981" />
                  <View className="ml-3">
                    <Text className="text-sm text-gray-500">Дата начала</Text>
                    <Text className="text-base text-gray-900">
                      {new Date(application.start_date).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Timeline */}
        <View className="bg-white p-4">
          <Text className="text-sm text-gray-500 mb-3">История</Text>
          
          <View className="space-y-3">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center">
                <Ionicons name="add-circle" size={16} color="#3B82F6" />
              </View>
              <View className="ml-3">
                <Text className="text-sm text-gray-900">Заявка создана</Text>
                <Text className="text-xs text-gray-500">
                  {new Date(application.created_at).toLocaleString('ru-RU')}
                </Text>
              </View>
            </View>

            {application.viewed_at && (
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-full bg-yellow-100 items-center justify-center">
                  <Ionicons name="eye" size={16} color="#F59E0B" />
                </View>
                <View className="ml-3">
                  <Text className="text-sm text-gray-900">Просмотрена клиентом</Text>
                  <Text className="text-xs text-gray-500">
                    {new Date(application.viewed_at).toLocaleString('ru-RU')}
                  </Text>
                </View>
              </View>
            )}

            {application.responded_at && (
              <View className="flex-row items-center">
                <View className={`w-8 h-8 rounded-full items-center justify-center ${
                  application.status === 'accepted' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <Ionicons
                    name={application.status === 'accepted' ? 'checkmark-circle' : 'close-circle'}
                    size={16}
                    color={application.status === 'accepted' ? '#10B981' : '#EF4444'}
                  />
                </View>
                <View className="ml-3">
                  <Text className="text-sm text-gray-900">
                    {application.status === 'accepted' ? 'Заявка принята' : 'Заявка отклонена'}
                  </Text>
                  <Text className="text-xs text-gray-500">
                    {new Date(application.responded_at).toLocaleString('ru-RU')}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View className="bg-white border-t border-gray-200 p-4">
        <ApplicationActions
          applicationId={applicationId}
          status={application.status}
          isOwner={isOwner}
          isOrderOwner={isOrderOwner}
          onAccept={handleAccept}
          onReject={handleReject}
          onCancel={handleCancel}
          onEdit={handleEdit}
          isLoading={isActionLoading}
        />
      </View>
    </SafeAreaView>
  );
}
