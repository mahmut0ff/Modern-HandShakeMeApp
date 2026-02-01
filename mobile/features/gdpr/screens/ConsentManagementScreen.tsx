import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { gdprApi, ConsentSettings } from '../../../services/gdprApi';

interface ConsentManagementScreenProps {
  onBack?: () => void;
}

export const ConsentManagementScreen: React.FC<ConsentManagementScreenProps> = ({
  onBack,
}) => {
  const [consents, setConsents] = useState<ConsentSettings>({
    marketing: false,
    analytics: true,
    personalization: true,
    thirdParty: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConsents();
  }, []);

  const loadConsents = async () => {
    try {
      const settings = await gdprApi.getConsentSettings();
      setConsents(settings);
    } catch (error) {
      console.error('Load consents error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof ConsentSettings) => {
    setConsents((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await gdprApi.updateConsentSettings(consents);
      Alert.alert('Успешно', 'Настройки согласий сохранены');
    } catch (error) {
      console.error('Save consents error:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить настройки');
    } finally {
      setSaving(false);
    }
  };

  const consentItems = [
    {
      key: 'marketing' as keyof ConsentSettings,
      title: 'Маркетинговые коммуникации',
      description: 'Получать информацию о новых функциях, акциях и специальных предложениях',
      icon: 'mail',
      required: false,
    },
    {
      key: 'analytics' as keyof ConsentSettings,
      title: 'Аналитика и улучшение сервиса',
      description: 'Помогать нам улучшать приложение, собирая анонимные данные об использовании',
      icon: 'analytics',
      required: false,
    },
    {
      key: 'personalization' as keyof ConsentSettings,
      title: 'Персонализация',
      description: 'Показывать персонализированный контент и рекомендации',
      icon: 'person',
      required: false,
    },
    {
      key: 'thirdParty' as keyof ConsentSettings,
      title: 'Сторонние сервисы',
      description: 'Делиться данными с партнерами для улучшения функциональности',
      icon: 'share-social',
      required: false,
    },
  ];

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#0165FB" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row items-center justify-between border-b border-gray-200">
        <View className="flex-row items-center flex-1">
          {onBack && (
            <TouchableOpacity onPress={onBack} className="mr-3">
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
          )}
          <Text className="text-xl font-bold text-gray-900">
            Управление согласиями
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4">
          {/* Info Card */}
          <View className="bg-blue-50 rounded-xl p-4 mb-6 flex-row">
            <Ionicons name="information-circle" size={24} color="#3B82F6" />
            <View className="flex-1 ml-3">
              <Text className="text-sm font-medium text-blue-900 mb-1">
                Ваши права
              </Text>
              <Text className="text-xs text-blue-700">
                Вы можете в любое время изменить свои согласия на обработку данных. Это не повлияет на основные функции приложения.
              </Text>
            </View>
          </View>

          {/* Consent Items */}
          <View className="bg-white rounded-xl shadow-sm mb-4">
            {consentItems.map((item, index) => (
              <View
                key={item.key}
                className={`p-4 ${
                  index < consentItems.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <View className="flex-row items-start">
                  <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                    <Ionicons name={item.icon as any} size={20} color="#0165FB" />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-base font-semibold text-gray-900 flex-1">
                        {item.title}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleToggle(item.key)}
                        disabled={item.required}
                        className={`w-12 h-7 rounded-full ${
                          consents[item.key] ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                      >
                        <View
                          className={`w-5 h-5 rounded-full bg-white mt-1 ${
                            consents[item.key] ? 'ml-6' : 'ml-1'
                          }`}
                        />
                      </TouchableOpacity>
                    </View>
                    <Text className="text-sm text-gray-600 mb-2">
                      {item.description}
                    </Text>
                    {item.required && (
                      <View className="flex-row items-center">
                        <Ionicons name="lock-closed" size={12} color="#6B7280" />
                        <Text className="text-xs text-gray-500 ml-1">
                          Обязательно для работы приложения
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Last Updated */}
          {consents.updatedAt && (
            <Text className="text-xs text-gray-500 text-center mb-4">
              Последнее обновление:{' '}
              {new Date(consents.updatedAt).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          )}

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="bg-blue-500 rounded-xl py-4 flex-row items-center justify-center shadow-sm mb-4"
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="white" />
                <Text className="text-white font-semibold text-base ml-2">
                  Сохранить настройки
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* GDPR Info */}
          <View className="bg-gray-50 rounded-xl p-4">
            <Text className="text-sm font-semibold text-gray-900 mb-3">
              Ваши права по GDPR
            </Text>
            <View className="space-y-2">
              {[
                'Право на доступ к данным',
                'Право на исправление данных',
                'Право на удаление данных',
                'Право на ограничение обработки',
                'Право на портативность данных',
                'Право на возражение',
              ].map((right, index) => (
                <View key={index} className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text className="ml-2 text-xs text-gray-700">{right}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
