import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { gdprApi, DeleteReason } from '../../../services/gdprApi';

interface DeleteAccountScreenProps {
  onBack?: () => void;
  onDeleted?: () => void;
}

export const DeleteAccountScreen: React.FC<DeleteAccountScreenProps> = ({
  onBack,
  onDeleted,
}) => {
  const router = useRouter();
  const [step, setStep] = useState<'warning' | 'confirm' | 'reason'>('warning');
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState<DeleteReason>('other');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [eligibility, setEligibility] = useState<{
    canDelete: boolean;
    reasons: string[];
  } | null>(null);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    checkEligibility();
  }, []);

  const checkEligibility = async () => {
    try {
      const result = await gdprApi.checkDeletionEligibility();
      setEligibility(result);
    } catch (error) {
      console.error('Eligibility check error:', error);
      // Default to allowing deletion if check fails
      setEligibility({ canDelete: true, reasons: [] });
    }
  };

  const reasons: Array<{ key: DeleteReason; label: string; icon: string }> = [
    { key: 'privacy_concerns', label: 'Беспокоюсь о конфиденциальности', icon: 'shield-outline' },
    { key: 'not_using', label: 'Не использую приложение', icon: 'time-outline' },
    { key: 'found_alternative', label: 'Нашел альтернативу', icon: 'swap-horizontal-outline' },
    { key: 'other', label: 'Другая причина', icon: 'ellipsis-horizontal-outline' },
  ];

  const handleDelete = async () => {
    if (!password) {
      Alert.alert('Ошибка', 'Введите пароль для подтверждения');
      return;
    }

    if (confirmText !== 'УДАЛИТЬ') {
      Alert.alert('Ошибка', 'Введите "УДАЛИТЬ" для подтверждения');
      return;
    }

    Alert.alert(
      'Последнее предупреждение',
      'Это действие необратимо. Все ваши данные будут удалены навсегда. Продолжить?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: performDeletion,
        },
      ]
    );
  };

  const performDeletion = async () => {
    try {
      setLoading(true);

      const result = await gdprApi.deleteUserAccount({
        confirmPassword: password,
        reason,
        feedback: feedback || undefined,
      });

      if (result.success) {
        // Clear all local data
        await AsyncStorage.clear();

        Alert.alert(
          'Аккаунт удален',
          result.message,
          [
            {
              text: 'OK',
              onPress: () => {
                if (onDeleted) {
                  onDeleted();
                } else {
                  router.replace('/');
                }
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        Alert.alert('Ошибка', result.message);
      }
    } catch (error: any) {
      console.error('Delete account error:', error);

      if (error.response?.status === 403) {
        Alert.alert('Ошибка', 'Неверный пароль');
      } else if (error.response?.status === 400) {
        Alert.alert('Ошибка', error.response?.data?.error || 'Не удалось удалить аккаунт');
      } else {
        Alert.alert('Ошибка', 'Не удалось удалить аккаунт. Попробуйте позже.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (eligibility && !eligibility.canDelete) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="bg-white px-4 py-3 flex-row items-center border-b border-gray-200">
          {onBack && (
            <TouchableOpacity onPress={onBack} className="mr-3">
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
          )}
          <Text className="text-xl font-bold text-gray-900">Удаление аккаунта</Text>
        </View>

        <View className="flex-1 items-center justify-center p-6">
          <View className="w-20 h-20 rounded-full bg-red-100 items-center justify-center mb-4">
            <Ionicons name="alert-circle" size={40} color="#EF4444" />
          </View>
          <Text className="text-lg font-semibold text-gray-900 mb-2 text-center">
            Невозможно удалить аккаунт
          </Text>
          <Text className="text-center text-gray-600 mb-4">
            Перед удалением аккаунта необходимо:
          </Text>
          <View className="bg-white rounded-xl p-4 w-full">
            {eligibility.reasons.map((reason, index) => (
              <View key={index} className="flex-row items-start py-2">
                <Ionicons name="close-circle" size={20} color="#EF4444" />
                <Text className="flex-1 ml-2 text-sm text-gray-700">{reason}</Text>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row items-center border-b border-gray-200">
        {onBack && (
          <TouchableOpacity onPress={onBack} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
        )}
        <Text className="text-xl font-bold text-gray-900">Удаление аккаунта</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4">
          {step === 'warning' && (
            <>
              {/* Warning */}
              <View className="bg-red-50 rounded-xl p-6 mb-6 items-center">
                <View className="w-20 h-20 rounded-full bg-red-100 items-center justify-center mb-4">
                  <Ionicons name="warning" size={40} color="#EF4444" />
                </View>
                <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
                  Внимание!
                </Text>
                <Text className="text-center text-gray-700">
                  Удаление аккаунта - необратимое действие
                </Text>
              </View>

              {/* What will be deleted */}
              <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                <Text className="text-base font-semibold text-gray-900 mb-3">
                  Что будет удалено:
                </Text>
                {[
                  { icon: 'person', text: 'Профиль и личные данные' },
                  { icon: 'chatbubbles', text: 'Все сообщения' },
                  { icon: 'notifications', text: 'История уведомлений' },
                  { icon: 'images', text: 'Загруженные файлы' },
                  { icon: 'wallet', text: 'История транзакций' },
                ].map((item, index) => (
                  <View key={index} className="flex-row items-center py-2">
                    <Ionicons name={item.icon as any} size={20} color="#EF4444" />
                    <Text className="ml-3 text-sm text-gray-700">{item.text}</Text>
                  </View>
                ))}
              </View>

              {/* What will be kept */}
              <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                <Text className="text-base font-semibold text-gray-900 mb-3">
                  Что будет сохранено (анонимно):
                </Text>
                {[
                  { icon: 'star', text: 'Отзывы (без личных данных)' },
                  { icon: 'receipt', text: 'История заказов (для отчетности)' },
                ].map((item, index) => (
                  <View key={index} className="flex-row items-center py-2">
                    <Ionicons name={item.icon as any} size={20} color="#10B981" />
                    <Text className="ml-3 text-sm text-gray-700">{item.text}</Text>
                  </View>
                ))}
              </View>

              {/* GDPR Info */}
              <View className="bg-blue-50 rounded-xl p-4 mb-6 flex-row">
                <Ionicons name="information-circle" size={24} color="#3B82F6" />
                <View className="flex-1 ml-3">
                  <Text className="text-sm font-medium text-blue-900 mb-1">
                    Право на удаление (GDPR)
                  </Text>
                  <Text className="text-xs text-blue-700">
                    В соответствии со Статьей 17 GDPR, ваши данные будут анонимизированы немедленно и полностью удалены через 30 дней.
                  </Text>
                </View>
              </View>

              {/* Buttons */}
              <View className="space-y-3">
                <TouchableOpacity
                  onPress={() => setStep('reason')}
                  className="bg-red-500 rounded-xl py-4 flex-row items-center justify-center"
                >
                  <Ionicons name="trash" size={24} color="white" />
                  <Text className="text-white font-semibold text-base ml-2">
                    Продолжить удаление
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onBack}
                  className="bg-gray-100 rounded-xl py-4 flex-row items-center justify-center"
                >
                  <Text className="text-gray-700 font-semibold text-base">
                    Отмена
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 'reason' && (
            <>
              {/* Reason Selection */}
              <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                <Text className="text-base font-semibold text-gray-900 mb-3">
                  Почему вы удаляете аккаунт?
                </Text>
                <Text className="text-sm text-gray-600 mb-4">
                  Это поможет нам улучшить сервис
                </Text>

                {reasons.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => setReason(item.key)}
                    className="flex-row items-center py-3 border-b border-gray-100 last:border-b-0"
                  >
                    <View
                      className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${
                        reason === item.key
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {reason === item.key && (
                        <View className="w-3 h-3 rounded-full bg-white" />
                      )}
                    </View>
                    <Ionicons name={item.icon as any} size={20} color="#6B7280" />
                    <Text className="ml-3 text-sm text-gray-700">{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Feedback */}
              <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                <Text className="text-base font-semibold text-gray-900 mb-3">
                  Дополнительный комментарий (необязательно)
                </Text>
                <TextInput
                  value={feedback}
                  onChangeText={setFeedback}
                  placeholder="Расскажите подробнее..."
                  multiline
                  numberOfLines={4}
                  maxLength={1000}
                  className="bg-gray-50 rounded-lg p-3 text-sm text-gray-900"
                  style={{ textAlignVertical: 'top' }}
                />
                <Text className="text-xs text-gray-500 mt-2 text-right">
                  {feedback.length}/1000
                </Text>
              </View>

              {/* Buttons */}
              <View className="space-y-3">
                <TouchableOpacity
                  onPress={() => setStep('confirm')}
                  className="bg-red-500 rounded-xl py-4 flex-row items-center justify-center"
                >
                  <Text className="text-white font-semibold text-base">
                    Далее
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setStep('warning')}
                  className="bg-gray-100 rounded-xl py-4 flex-row items-center justify-center"
                >
                  <Text className="text-gray-700 font-semibold text-base">
                    Назад
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 'confirm' && (
            <>
              {/* Final Confirmation */}
              <View className="bg-red-50 rounded-xl p-6 mb-6 items-center">
                <Ionicons name="alert-circle" size={48} color="#EF4444" />
                <Text className="text-lg font-bold text-gray-900 mt-4 mb-2 text-center">
                  Последнее подтверждение
                </Text>
                <Text className="text-center text-gray-700">
                  Это действие нельзя отменить
                </Text>
              </View>

              {/* Password Input */}
              <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                <Text className="text-base font-semibold text-gray-900 mb-3">
                  Введите пароль
                </Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Ваш пароль"
                  secureTextEntry
                  className="bg-gray-50 rounded-lg p-3 text-sm text-gray-900"
                />
              </View>

              {/* Confirmation Text */}
              <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                <Text className="text-base font-semibold text-gray-900 mb-3">
                  Введите "УДАЛИТЬ" для подтверждения
                </Text>
                <TextInput
                  value={confirmText}
                  onChangeText={setConfirmText}
                  placeholder="УДАЛИТЬ"
                  autoCapitalize="characters"
                  className="bg-gray-50 rounded-lg p-3 text-sm text-gray-900"
                />
              </View>

              {/* Buttons */}
              <View className="space-y-3">
                <TouchableOpacity
                  onPress={handleDelete}
                  disabled={loading || !password || confirmText !== 'УДАЛИТЬ'}
                  className={`rounded-xl py-4 flex-row items-center justify-center ${
                    loading || !password || confirmText !== 'УДАЛИТЬ'
                      ? 'bg-gray-300'
                      : 'bg-red-500'
                  }`}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Ionicons name="trash" size={24} color="white" />
                      <Text className="text-white font-semibold text-base ml-2">
                        Удалить аккаунт навсегда
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setStep('reason')}
                  disabled={loading}
                  className="bg-gray-100 rounded-xl py-4 flex-row items-center justify-center"
                >
                  <Text className="text-gray-700 font-semibold text-base">
                    Назад
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
