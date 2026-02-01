import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

import {
  useGetBackgroundCheckStatusQuery,
  useGetVerificationBadgesQuery,
  useGetBackgroundCheckPricingQuery,
  useCancelBackgroundCheckMutation,
} from '../../services/backgroundCheckApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { EmptyState } from '../../components/EmptyState';

const CHECK_TYPE_LABELS = {
  IDENTITY: 'Проверка личности',
  CRIMINAL: 'Проверка судимости',
  EMPLOYMENT: 'Проверка трудовой деятельности',
  EDUCATION: 'Проверка образования',
  COMPREHENSIVE: 'Комплексная проверка',
};

const STATUS_COLORS = {
  PENDING: '#F59E0B',
  IN_PROGRESS: '#3B82F6',
  COMPLETED: '#10B981',
  FAILED: '#EF4444',
  CANCELLED: '#6B7280',
};

const STATUS_LABELS = {
  PENDING: 'Ожидает оплаты',
  IN_PROGRESS: 'В процессе',
  COMPLETED: 'Завершено',
  FAILED: 'Не удалось',
  CANCELLED: 'Отменено',
};

const RESULT_COLORS = {
  PASSED: '#10B981',
  FAILED: '#EF4444',
  CONDITIONAL: '#F59E0B',
};

const RESULT_LABELS = {
  PASSED: 'Пройдено',
  FAILED: 'Не пройдено',
  CONDITIONAL: 'Условно пройдено',
};

export const BackgroundCheckScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: statusData,
    isLoading: statusLoading,
    error: statusError,
    refetch: refetchStatus,
  } = useGetBackgroundCheckStatusQuery({});

  const {
    data: badgesData,
    isLoading: badgesLoading,
    refetch: refetchBadges,
  } = useGetVerificationBadgesQuery();

  const {
    data: pricingData,
    isLoading: pricingLoading,
  } = useGetBackgroundCheckPricingQuery();

  const [cancelCheck, { isLoading: cancelling }] = useCancelBackgroundCheckMutation();

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStatus(), refetchBadges()]);
    setRefreshing(false);
  };

  const handleCancelCheck = async (checkId: string) => {
    Alert.alert(
      'Отменить проверку',
      'Вы уверены, что хотите отменить проверку анкетных данных? Это действие нельзя отменить.',
      [
        { text: 'Нет', style: 'cancel' },
        {
          text: 'Да, отменить',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await cancelCheck({ checkId }).unwrap();
              Alert.alert('Успешно', result.message);
            } catch (error: any) {
              Alert.alert('Ошибка', error.data?.message || 'Не удалось отменить проверку');
            }
          },
        },
      ]
    );
  };

  const renderCurrentCheck = () => {
    const check = statusData?.backgroundCheck;
    if (!check) return null;

    const statusColor = STATUS_COLORS[check.status];
    const statusLabel = STATUS_LABELS[check.status];
    const resultColor = check.result ? RESULT_COLORS[check.result] : undefined;
    const resultLabel = check.result ? RESULT_LABELS[check.result] : undefined;

    return (
      <View className="bg-white mx-4 mb-4 rounded-lg shadow-sm">
        <View className="p-4">
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1">
              <Text className="text-lg font-semibold text-gray-900">
                {CHECK_TYPE_LABELS[check.checkType]}
              </Text>
              <Text className="text-sm text-gray-600 mt-1">
                Создано: {format(parseISO(check.createdAt), 'd MMM yyyy', { locale: ru })}
              </Text>
            </View>
            <View className="items-end">
              <View
                className="px-2 py-1 rounded-full mb-1"
                style={{ backgroundColor: `${statusColor}20` }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: statusColor }}
                >
                  {statusLabel}
                </Text>
              </View>
              {resultLabel && (
                <View
                  className="px-2 py-1 rounded-full"
                  style={{ backgroundColor: `${resultColor}20` }}
                >
                  <Text
                    className="text-xs font-medium"
                    style={{ color: resultColor }}
                  >
                    {resultLabel}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Progress Bar */}
          <View className="mb-3">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm text-gray-600">Прогресс</Text>
              <Text className="text-sm font-medium text-gray-900">{check.progress}%</Text>
            </View>
            <View className="w-full bg-gray-200 rounded-full h-2">
              <View
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${check.progress}%` }}
              />
            </View>
          </View>

          {/* Estimated Completion */}
          {check.status === 'IN_PROGRESS' && (
            <View className="flex-row items-center mb-3">
              <Ionicons name="time-outline" size={16} color="#6B7280" />
              <Text className="text-sm text-gray-600 ml-2">
                Ожидаемое завершение: {format(parseISO(check.estimatedCompletionDate), 'd MMM', { locale: ru })}
              </Text>
            </View>
          )}

          {/* Pricing */}
          <View className="bg-gray-50 p-3 rounded-lg mb-3">
            <Text className="text-sm font-medium text-gray-900 mb-2">Стоимость</Text>
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-600">Базовая стоимость:</Text>
              <Text className="text-sm text-gray-900">${check.pricing.baseAmount.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-600">Комиссия за обработку:</Text>
              <Text className="text-sm text-gray-900">${check.pricing.processingFee.toFixed(2)}</Text>
            </View>
            <View className="border-t border-gray-200 pt-2 mt-2">
              <View className="flex-row justify-between">
                <Text className="text-sm font-medium text-gray-900">Итого:</Text>
                <Text className="text-sm font-bold text-gray-900">${check.pricing.total.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row space-x-2">
            <TouchableOpacity
              className="flex-1 bg-blue-500 py-3 rounded-lg"
              onPress={() => navigation.navigate('BackgroundCheckDetails', { checkId: check.id })}
            >
              <Text className="text-white text-center font-medium">Подробности</Text>
            </TouchableOpacity>

            {check.status === 'COMPLETED' && check.result !== 'PASSED' && (
              <TouchableOpacity
                className="flex-1 bg-orange-500 py-3 rounded-lg"
                onPress={() => navigation.navigate('DisputeBackgroundCheck', { checkId: check.id })}
              >
                <Text className="text-white text-center font-medium">Оспорить</Text>
              </TouchableOpacity>
            )}

            {['PENDING', 'IN_PROGRESS'].includes(check.status) && (
              <TouchableOpacity
                className="bg-red-500 px-4 py-3 rounded-lg"
                onPress={() => handleCancelCheck(check.id)}
                disabled={cancelling}
              >
                {cancelling ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="text-white text-center font-medium">Отменить</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderVerificationBadges = () => {
    if (!badgesData?.badges.length) return null;

    return (
      <View className="bg-white mx-4 mb-4 rounded-lg shadow-sm">
        <View className="p-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-semibold text-gray-900">Значки верификации</Text>
            <View className="bg-blue-100 px-2 py-1 rounded-full">
              <Text className="text-xs font-medium text-blue-800">
                Счет: {badgesData.verificationScore}/100
              </Text>
            </View>
          </View>

          <View className="space-y-3">
            {badgesData.badges.map((badge, index) => (
              <View key={index} className="flex-row items-center">
                <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3">
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                </View>
                <View className="flex-1">
                  <Text className="font-medium text-gray-900">{badge.name}</Text>
                  <Text className="text-sm text-gray-600">{badge.description}</Text>
                  <Text className="text-xs text-gray-500">
                    Получено: {format(parseISO(badge.earnedAt), 'd MMM yyyy', { locale: ru })}
                  </Text>
                </View>
                <View className={`px-2 py-1 rounded-full ${badge.verificationLevel === 'PREMIUM' ? 'bg-purple-100' :
                    badge.verificationLevel === 'STANDARD' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                  <Text className={`text-xs font-medium ${badge.verificationLevel === 'PREMIUM' ? 'text-purple-800' :
                      badge.verificationLevel === 'STANDARD' ? 'text-blue-800' : 'text-gray-800'
                    }`}>
                    {badge.verificationLevel}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderAvailableChecks = () => {
    if (!pricingData?.pricing) return null;

    return (
      <View className="bg-white mx-4 mb-4 rounded-lg shadow-sm">
        <View className="p-4">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Доступные проверки</Text>

          <View className="space-y-3">
            {Object.entries(pricingData.pricing).map(([checkType, pricing]) => (
              <TouchableOpacity
                key={checkType}
                className="border border-gray-200 rounded-lg p-3"
                onPress={() => navigation.navigate('InitiateBackgroundCheck', { checkType })}
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="font-medium text-gray-900">
                      {CHECK_TYPE_LABELS[checkType as keyof typeof CHECK_TYPE_LABELS]}
                    </Text>
                    <Text className="text-sm text-gray-600 mt-1">{pricing.description}</Text>
                    <Text className="text-xs text-gray-500 mt-1">
                      Время выполнения: {pricing.estimatedDays} дней
                    </Text>
                  </View>
                  <View className="items-end ml-3">
                    <Text className="text-lg font-bold text-gray-900">
                      ${pricing.total.toFixed(2)}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      +${pricing.processingFee.toFixed(2)} комиссия
                    </Text>
                  </View>
                </View>

                <View className="mt-2">
                  <Text className="text-xs text-gray-600 mb-1">Включает:</Text>
                  {pricing.features.slice(0, 3).map((feature, index) => (
                    <Text key={index} className="text-xs text-gray-500">• {feature}</Text>
                  ))}
                  {pricing.features.length > 3 && (
                    <Text className="text-xs text-blue-600">
                      +{pricing.features.length - 3} дополнительных функций
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderNextSteps = () => {
    if (!statusData?.nextSteps?.length) return null;

    return (
      <View className="bg-blue-50 mx-4 mb-4 rounded-lg">
        <View className="p-4">
          <Text className="text-lg font-semibold text-blue-900 mb-3">Следующие шаги</Text>
          <View className="space-y-2">
            {statusData.nextSteps.map((step, index) => (
              <View key={index} className="flex-row items-start">
                <View className="w-6 h-6 bg-blue-500 rounded-full items-center justify-center mr-3 mt-0.5">
                  <Text className="text-white text-xs font-bold">{index + 1}</Text>
                </View>
                <Text className="flex-1 text-blue-800">{step}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  if (statusLoading || badgesLoading || pricingLoading) {
    return <LoadingSpinner />;
  }

  if (statusError) {
    return (
      <View className="flex-1 justify-center items-center">
        <ErrorMessage
          message="Не удалось загрузить данные о проверке"
          onRetry={refetchStatus}
        />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View className="bg-white p-4 shadow-sm">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-bold text-gray-900">Проверка анкетных данных</Text>
            <Text className="text-gray-600 mt-1">Повысьте доверие клиентов</Text>
          </View>
          <TouchableOpacity
            className="p-2"
            onPress={() => navigation.navigate('BackgroundCheckHistory')}
          >
            <Ionicons name="time-outline" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Current Check */}
      {statusData?.backgroundCheck && renderCurrentCheck()}

      {/* Next Steps */}
      {renderNextSteps()}

      {/* Verification Badges */}
      {renderVerificationBadges()}

      {/* Available Checks */}
      {!statusData?.backgroundCheck && renderAvailableChecks()}

      {/* No Background Check State */}
      {!statusData?.backgroundCheck && !statusData?.recommendations && (
        <EmptyState
          icon="shield-checkmark-outline"
          title="Нет активных проверок"
          description="Пройдите проверку анкетных данных, чтобы повысить доверие клиентов"
          actionText="Начать проверку"
          onAction={() => navigation.navigate('InitiateBackgroundCheck')}
        />
      )}

      {/* Recommendations */}
      {statusData?.recommendations && (
        <View className="bg-green-50 mx-4 mb-4 rounded-lg">
          <View className="p-4">
            <Text className="text-lg font-semibold text-green-900 mb-3">Рекомендации</Text>
            <View className="space-y-2">
              {statusData.recommendations.map((recommendation, index) => (
                <View key={index} className="flex-row items-start">
                  <Ionicons name="bulb-outline" size={16} color="#059669" className="mt-1 mr-2" />
                  <Text className="flex-1 text-green-800">{recommendation}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Discounts */}
      {pricingData?.discounts && pricingData.discounts.length > 0 && (
        <View className="bg-yellow-50 mx-4 mb-8 rounded-lg">
          <View className="p-4">
            <Text className="text-lg font-semibold text-yellow-900 mb-3">Доступные скидки</Text>
            <View className="space-y-2">
              {pricingData.discounts.map((discount, index) => (
                <View key={index} className="bg-white p-3 rounded-lg">
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="font-medium text-gray-900">{discount.description}</Text>
                      <Text className="text-sm text-gray-600 mt-1">
                        Условия: {discount.conditions.join(', ')}
                      </Text>
                    </View>
                    <View className="bg-yellow-100 px-2 py-1 rounded-full ml-2">
                      <Text className="text-xs font-bold text-yellow-800">
                        -{discount.discount}%
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};