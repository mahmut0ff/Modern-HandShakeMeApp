import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface GDPRInfoScreenProps {
  onBack?: () => void;
  onNavigateToExport?: () => void;
  onNavigateToDelete?: () => void;
  onNavigateToConsents?: () => void;
}

export const GDPRInfoScreen: React.FC<GDPRInfoScreenProps> = ({
  onBack,
  onNavigateToExport,
  onNavigateToDelete,
  onNavigateToConsents,
}) => {
  const handleContactSupport = () => {
    Linking.openURL('mailto:privacy@handshakeme.com?subject=GDPR Request');
  };

  const handleOpenPrivacyPolicy = () => {
    Linking.openURL('https://handshakeme.com/privacy-policy');
  };

  const actions = [
    {
      icon: 'download',
      title: 'Экспорт данных',
      description: 'Скачать все ваши данные в структурированном формате',
      color: 'blue',
      onPress: onNavigateToExport,
    },
    {
      icon: 'shield-checkmark',
      title: 'Управление согласиями',
      description: 'Настроить разрешения на обработку данных',
      color: 'green',
      onPress: onNavigateToConsents,
    },
    {
      icon: 'trash',
      title: 'Удаление аккаунта',
      description: 'Безвозвратно удалить аккаунт и все данные',
      color: 'red',
      onPress: onNavigateToDelete,
    },
  ];

  const rights = [
    {
      icon: 'eye',
      title: 'Право на доступ',
      description: 'Вы можете запросить копию всех ваших данных',
      article: 'Статья 15',
    },
    {
      icon: 'create',
      title: 'Право на исправление',
      description: 'Вы можете исправить неточные данные',
      article: 'Статья 16',
    },
    {
      icon: 'trash',
      title: 'Право на удаление',
      description: 'Вы можете удалить свои данные ("право быть забытым")',
      article: 'Статья 17',
    },
    {
      icon: 'pause',
      title: 'Право на ограничение',
      description: 'Вы можете ограничить обработку ваших данных',
      article: 'Статья 18',
    },
    {
      icon: 'swap-horizontal',
      title: 'Право на портативность',
      description: 'Вы можете перенести данные к другому провайдеру',
      article: 'Статья 20',
    },
    {
      icon: 'hand-left',
      title: 'Право на возражение',
      description: 'Вы можете возразить против обработки данных',
      article: 'Статья 21',
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row items-center border-b border-gray-200">
        {onBack && (
          <TouchableOpacity onPress={onBack} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
        )}
        <Text className="text-xl font-bold text-gray-900">
          Конфиденциальность и данные
        </Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4">
          {/* Hero Section */}
          <View className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 mb-6">
            <View className="flex-row items-center mb-4">
              <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center mr-3">
                <Ionicons name="shield-checkmark" size={28} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-xl font-bold text-white mb-1">
                  GDPR Compliance
                </Text>
                <Text className="text-sm text-white/90">
                  Ваши данные под защитой
                </Text>
              </View>
            </View>
            <Text className="text-sm text-white/90 leading-6">
              Мы соблюдаем Общий регламент по защите данных (GDPR) и гарантируем полный контроль над вашими персональными данными.
            </Text>
          </View>

          {/* Quick Actions */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-3">
              Быстрые действия
            </Text>
            {actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                onPress={action.onPress}
                className="bg-white rounded-xl p-4 mb-3 shadow-sm flex-row items-center"
              >
                <View
                  className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${
                    action.color === 'blue'
                      ? 'bg-blue-100'
                      : action.color === 'green'
                      ? 'bg-green-100'
                      : 'bg-red-100'
                  }`}
                >
                  <Ionicons
                    name={action.icon as any}
                    size={24}
                    color={
                      action.color === 'blue'
                        ? '#3B82F6'
                        : action.color === 'green'
                        ? '#10B981'
                        : '#EF4444'
                    }
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900 mb-1">
                    {action.title}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {action.description}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Your Rights */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-3">
              Ваши права по GDPR
            </Text>
            <View className="bg-white rounded-xl shadow-sm">
              {rights.map((right, index) => (
                <View
                  key={index}
                  className={`p-4 ${
                    index < rights.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <View className="flex-row items-start">
                    <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                      <Ionicons name={right.icon as any} size={20} color="#0165FB" />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-base font-semibold text-gray-900">
                          {right.title}
                        </Text>
                        <Text className="text-xs text-blue-600 font-medium">
                          {right.article}
                        </Text>
                      </View>
                      <Text className="text-sm text-gray-600">
                        {right.description}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Data Protection */}
          <View className="bg-white rounded-xl p-4 mb-6 shadow-sm">
            <Text className="text-base font-semibold text-gray-900 mb-3">
              Как мы защищаем ваши данные
            </Text>
            <View className="space-y-3">
              {[
                {
                  icon: 'lock-closed',
                  text: 'Шифрование данных при передаче и хранении',
                },
                {
                  icon: 'shield',
                  text: 'Регулярные аудиты безопасности',
                },
                {
                  icon: 'key',
                  text: 'Двухфакторная аутентификация',
                },
                {
                  icon: 'eye-off',
                  text: 'Минимизация сбора данных',
                },
                {
                  icon: 'time',
                  text: 'Автоматическое удаление устаревших данных',
                },
              ].map((item, index) => (
                <View key={index} className="flex-row items-center">
                  <Ionicons name={item.icon as any} size={20} color="#10B981" />
                  <Text className="ml-3 text-sm text-gray-700 flex-1">
                    {item.text}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Data Retention */}
          <View className="bg-white rounded-xl p-4 mb-6 shadow-sm">
            <Text className="text-base font-semibold text-gray-900 mb-3">
              Сроки хранения данных
            </Text>
            <View className="space-y-3">
              {[
                { type: 'Профиль', period: 'До удаления аккаунта' },
                { type: 'Сообщения', period: '1 год после последней активности' },
                { type: 'Транзакции', period: '7 лет (требование закона)' },
                { type: 'Логи', period: '90 дней' },
                { type: 'Удаленные данные', period: '30 дней (резервная копия)' },
              ].map((item, index) => (
                <View
                  key={index}
                  className="flex-row items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                >
                  <Text className="text-sm text-gray-700">{item.type}</Text>
                  <Text className="text-sm font-medium text-gray-900">
                    {item.period}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Contact & Links */}
          <View className="space-y-3 mb-6">
            <TouchableOpacity
              onPress={handleOpenPrivacyPolicy}
              className="bg-white rounded-xl p-4 flex-row items-center justify-between shadow-sm"
            >
              <View className="flex-row items-center flex-1">
                <Ionicons name="document-text" size={24} color="#6B7280" />
                <Text className="ml-3 text-base text-gray-900">
                  Политика конфиденциальности
                </Text>
              </View>
              <Ionicons name="open" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleContactSupport}
              className="bg-white rounded-xl p-4 flex-row items-center justify-between shadow-sm"
            >
              <View className="flex-row items-center flex-1">
                <Ionicons name="mail" size={24} color="#6B7280" />
                <Text className="ml-3 text-base text-gray-900">
                  Связаться по вопросам GDPR
                </Text>
              </View>
              <Ionicons name="open" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Footer Info */}
          <View className="bg-gray-50 rounded-xl p-4">
            <Text className="text-xs text-gray-600 text-center leading-5">
              HandShakeMe соблюдает требования GDPR (EU) 2016/679 и обеспечивает защиту персональных данных всех пользователей. Для получения дополнительной информации свяжитесь с нашим специалистом по защите данных.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
