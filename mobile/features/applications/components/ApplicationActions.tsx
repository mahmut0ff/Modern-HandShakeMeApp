/**
 * Application Actions Component
 * Кнопки действий для заявки (принять/отклонить для клиентов, отменить для мастеров)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ApplicationStatus } from '../types';

interface ApplicationActionsProps {
  applicationId: number;
  status: ApplicationStatus;
  isOwner: boolean; // Владелец заявки (мастер)
  isOrderOwner: boolean; // Владелец заказа (клиент)
  onAccept?: (message?: string) => void;
  onReject?: (message?: string) => void;
  onCancel?: () => void;
  onEdit?: () => void;
  isLoading?: boolean;
}

export function ApplicationActions({
  applicationId,
  status,
  isOwner,
  isOrderOwner,
  onAccept,
  onReject,
  onCancel,
  onEdit,
  isLoading = false,
}: ApplicationActionsProps) {
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseType, setResponseType] = useState<'accept' | 'reject'>('accept');
  const [responseMessage, setResponseMessage] = useState('');

  const handleOpenResponseModal = (type: 'accept' | 'reject') => {
    setResponseType(type);
    setResponseMessage('');
    setShowResponseModal(true);
  };

  const handleSubmitResponse = () => {
    if (responseType === 'accept') {
      onAccept?.(responseMessage || undefined);
    } else {
      onReject?.(responseMessage || undefined);
    }
    setShowResponseModal(false);
  };

  const handleCancel = () => {
    Alert.alert(
      'Отменить заявку?',
      'Вы уверены, что хотите отменить эту заявку?',
      [
        { text: 'Нет', style: 'cancel' },
        {
          text: 'Да, отменить',
          style: 'destructive',
          onPress: onCancel,
        },
      ]
    );
  };

  // Для клиента - кнопки принять/отклонить
  if (isOrderOwner && (status === 'pending' || status === 'viewed')) {
    return (
      <>
        <View className="flex-row space-x-3">
          <TouchableOpacity
            className={`flex-1 bg-green-500 rounded-xl py-4 items-center ${
              isLoading ? 'opacity-50' : ''
            }`}
            onPress={() => handleOpenResponseModal('accept')}
            disabled={isLoading}
          >
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Принять</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 bg-red-500 rounded-xl py-4 items-center ${
              isLoading ? 'opacity-50' : ''
            }`}
            onPress={() => handleOpenResponseModal('reject')}
            disabled={isLoading}
          >
            <View className="flex-row items-center">
              <Ionicons name="close-circle" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Отклонить</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Response Modal */}
        <Modal
          visible={showResponseModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowResponseModal(false)}
        >
          <View className="flex-1 bg-gray-50">
            <View className="bg-white border-b border-gray-200 px-4 py-3">
              <View className="flex-row items-center justify-between">
                <TouchableOpacity
                  onPress={() => setShowResponseModal(false)}
                  className="p-2"
                >
                  <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-gray-900">
                  {responseType === 'accept' ? 'Принять заявку' : 'Отклонить заявку'}
                </Text>
                <View className="w-10" />
              </View>
            </View>

            <View className="p-4">
              <View className="bg-white rounded-2xl p-4 mb-4">
                <Text className="text-base font-semibold text-gray-900 mb-2">
                  Сообщение мастеру (необязательно)
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900"
                  placeholder={
                    responseType === 'accept'
                      ? 'Например: Жду вас завтра в 10:00'
                      : 'Укажите причину отказа...'
                  }
                  value={responseMessage}
                  onChangeText={setResponseMessage}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                className={`rounded-xl py-4 items-center ${
                  responseType === 'accept' ? 'bg-green-500' : 'bg-red-500'
                }`}
                onPress={handleSubmitResponse}
              >
                <Text className="text-white font-semibold text-base">
                  {responseType === 'accept' ? 'Подтвердить принятие' : 'Подтвердить отказ'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </>
    );
  }

  // Для мастера - кнопки редактировать/отменить
  if (isOwner && status === 'pending') {
    return (
      <View className="flex-row space-x-3">
        <TouchableOpacity
          className="flex-1 bg-blue-500 rounded-xl py-4 items-center"
          onPress={onEdit}
        >
          <View className="flex-row items-center">
            <Ionicons name="create-outline" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Редактировать</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 bg-gray-200 rounded-xl py-4 items-center"
          onPress={handleCancel}
        >
          <View className="flex-row items-center">
            <Ionicons name="close" size={20} color="#374151" />
            <Text className="text-gray-700 font-semibold ml-2">Отменить</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  // Статус уже финальный - показываем информацию
  if (status === 'accepted') {
    return (
      <View className="bg-green-100 rounded-xl p-4 items-center">
        <View className="flex-row items-center">
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          <Text className="text-green-700 font-semibold ml-2">
            Заявка принята
          </Text>
        </View>
      </View>
    );
  }

  if (status === 'rejected') {
    return (
      <View className="bg-red-100 rounded-xl p-4 items-center">
        <View className="flex-row items-center">
          <Ionicons name="close-circle" size={24} color="#EF4444" />
          <Text className="text-red-700 font-semibold ml-2">
            Заявка отклонена
          </Text>
        </View>
      </View>
    );
  }

  if (status === 'cancelled') {
    return (
      <View className="bg-gray-100 rounded-xl p-4 items-center">
        <View className="flex-row items-center">
          <Ionicons name="ban" size={24} color="#6B7280" />
          <Text className="text-gray-700 font-semibold ml-2">
            Заявка отменена
          </Text>
        </View>
      </View>
    );
  }

  return null;
}
