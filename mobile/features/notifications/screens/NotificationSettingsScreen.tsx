import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  useGetNotificationSettingsQuery,
  useUpdateNotificationSettingsMutation,
} from '../../../services/notificationApi';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ErrorMessage } from '../../../components/ErrorMessage';

interface SettingRowProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

function SettingRow({ label, description, value, onChange }: SettingRowProps) {
  return (
    <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
      <View className="flex-1 mr-3">
        <Text className="text-base text-gray-900">{label}</Text>
        {description && (
          <Text className="text-sm text-gray-500 mt-0.5">{description}</Text>
        )}
      </View>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { data: settings, isLoading, error } = useGetNotificationSettingsQuery();
  const [updateSettings, { isLoading: isUpdating }] = useUpdateNotificationSettingsMutation();

  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleChange = async (key: string, value: boolean) => {
    if (!localSettings) return;

    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings as any);

    try {
      await updateSettings({ [key]: value }).unwrap();
    } catch (err) {
      setLocalSettings(localSettings);
      Alert.alert('Ошибка', 'Не удалось сохранить настройки');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <LoadingSpinner fullScreen text="Загрузка настроек..." />
      </SafeAreaView>
    );
  }

  if (error || !localSettings) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <ErrorMessage message="Не удалось загрузить настройки" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Настройки уведомлений</Text>
        </View>
      </View>

      <ScrollView className="flex-1">
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4">
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            Push-уведомления
          </Text>
          
          <SettingRow
            label="Заказы"
            description="Новые заказы и обновления"
            value={localSettings.push_order_updates}
            onChange={(v) => handleChange('push_order_updates', v)}
          />
          <SettingRow
            label="Заявки"
            description="Новые заявки и ответы"
            value={localSettings.push_application_updates}
            onChange={(v) => handleChange('push_application_updates', v)}
          />
          <SettingRow
            label="Проекты"
            description="Статус проектов"
            value={localSettings.push_project_updates}
            onChange={(v) => handleChange('push_project_updates', v)}
          />
          <SettingRow
            label="Платежи"
            description="Поступления и списания"
            value={localSettings.push_payment_updates}
            onChange={(v) => handleChange('push_payment_updates', v)}
          />
          <SettingRow
            label="Отзывы"
            description="Новые отзывы"
            value={localSettings.push_review_updates}
            onChange={(v) => handleChange('push_review_updates', v)}
          />
          <SettingRow
            label="Сообщения"
            description="Новые сообщения в чате"
            value={localSettings.push_message_updates}
            onChange={(v) => handleChange('push_message_updates', v)}
          />
          <SettingRow
            label="Акции"
            description="Специальные предложения"
            value={localSettings.push_marketing}
            onChange={(v) => handleChange('push_marketing', v)}
          />
        </View>

        <View className="bg-white mx-4 mt-4 rounded-2xl p-4">
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            Email-уведомления
          </Text>
          
          <SettingRow
            label="Заказы"
            value={localSettings.email_order_updates}
            onChange={(v) => handleChange('email_order_updates', v)}
          />
          <SettingRow
            label="Заявки"
            value={localSettings.email_application_updates}
            onChange={(v) => handleChange('email_application_updates', v)}
          />
          <SettingRow
            label="Проекты"
            value={localSettings.email_project_updates}
            onChange={(v) => handleChange('email_project_updates', v)}
          />
          <SettingRow
            label="Платежи"
            value={localSettings.email_payment_updates}
            onChange={(v) => handleChange('email_payment_updates', v)}
          />
          <SettingRow
            label="Рассылка"
            value={localSettings.email_marketing}
            onChange={(v) => handleChange('email_marketing', v)}
          />
        </View>

        <View className="bg-white mx-4 mt-4 mb-4 rounded-2xl p-4">
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            SMS-уведомления
          </Text>
          
          <SettingRow
            label="Заказы"
            value={localSettings.sms_order_updates}
            onChange={(v) => handleChange('sms_order_updates', v)}
          />
          <SettingRow
            label="Платежи"
            value={localSettings.sms_payment_updates}
            onChange={(v) => handleChange('sms_payment_updates', v)}
          />
          <SettingRow
            label="Безопасность"
            description="Важные уведомления безопасности"
            value={localSettings.sms_security_alerts}
            onChange={(v) => handleChange('sms_security_alerts', v)}
          />
        </View>

        <View className="bg-white mx-4 mb-4 rounded-2xl p-4">
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            Тихий режим
          </Text>
          
          <SettingRow
            label="Включить тихий режим"
            description="Отключить звуки в определенное время"
            value={localSettings.quiet_hours_enabled}
            onChange={(v) => handleChange('quiet_hours_enabled', v)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
