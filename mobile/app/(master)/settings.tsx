import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function MasterSettingsPage() {
  const [settings, setSettings] = useState({
    push_notifications: true,
    email_notifications: false,
    sms_notifications: true,
    marketing_emails: false,
    location_services: true,
    auto_backup: true,
    dark_mode: false,
    biometric_auth: false,
    order_notifications: true,
    application_notifications: true,
    payment_notifications: true,
  });

  const handleSettingChange = (key: keyof typeof settings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Удалить аккаунт',
      'Это действие нельзя отменить. Все ваши данные будут удалены навсегда.',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Удалить', 
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion
            Alert.alert('Аккаунт удалён', 'Ваш аккаунт был успешно удалён');
          }
        }
      ]
    );
  };

  const settingsGroups = [
    {
      title: 'Профиль мастера',
      icon: 'person',
      items: [
        {
          key: 'edit_profile',
          title: 'Редактировать профиль',
          subtitle: 'Изменить личную информацию',
          type: 'action'
        },
        {
          key: 'portfolio',
          title: 'Портфолио',
          subtitle: 'Управление работами и фото',
          type: 'action'
        },
        {
          key: 'services',
          title: 'Услуги и цены',
          subtitle: 'Настройка предлагаемых услуг',
          type: 'action'
        },
        {
          key: 'availability',
          title: 'График работы',
          subtitle: 'Установить доступное время',
          type: 'action'
        },
        {
          key: 'verification',
          title: 'Верификация',
          subtitle: 'Подтвердить документы',
          type: 'action'
        }
      ]
    },
    {
      title: 'Уведомления о заказах',
      icon: 'briefcase',
      items: [
        {
          key: 'order_notifications',
          title: 'Новые заказы',
          subtitle: 'Уведомления о подходящих заказах',
          type: 'switch'
        },
        {
          key: 'application_notifications',
          title: 'Статус откликов',
          subtitle: 'Уведомления об изменении статуса',
          type: 'switch'
        },
        {
          key: 'payment_notifications',
          title: 'Платежи',
          subtitle: 'Уведомления о поступлениях',
          type: 'switch'
        }
      ]
    },
    {
      title: 'Общие уведомления',
      icon: 'notifications',
      items: [
        {
          key: 'push_notifications',
          title: 'Push-уведомления',
          subtitle: 'Получать уведомления в приложении',
          type: 'switch'
        },
        {
          key: 'email_notifications',
          title: 'Email-уведомления',
          subtitle: 'Получать уведомления на почту',
          type: 'switch'
        },
        {
          key: 'sms_notifications',
          title: 'SMS-уведомления',
          subtitle: 'Получать SMS о важных событиях',
          type: 'switch'
        },
        {
          key: 'marketing_emails',
          title: 'Маркетинговые рассылки',
          subtitle: 'Получать информацию о новых функциях',
          type: 'switch'
        }
      ]
    },
    {
      title: 'Конфиденциальность',
      icon: 'shield-checkmark',
      items: [
        {
          key: 'location_services',
          title: 'Службы геолокации',
          subtitle: 'Разрешить доступ к местоположению',
          type: 'switch'
        },
        {
          key: 'auto_backup',
          title: 'Автоматическое резервное копирование',
          subtitle: 'Сохранять данные в облаке',
          type: 'switch'
        },
        {
          key: 'profile_visibility',
          title: 'Видимость профиля',
          subtitle: 'Показывать профиль в поиске',
          type: 'action'
        }
      ]
    },
    {
      title: 'Безопасность',
      icon: 'lock-closed',
      items: [
        {
          key: 'biometric_auth',
          title: 'Биометрическая аутентификация',
          subtitle: 'Вход по отпечатку пальца или Face ID',
          type: 'switch'
        },
        {
          key: 'change_password',
          title: 'Изменить пароль',
          subtitle: 'Обновить пароль для входа',
          type: 'action'
        },
        {
          key: 'two_factor',
          title: 'Двухфакторная аутентификация',
          subtitle: 'Дополнительная защита аккаунта',
          type: 'action'
        }
      ]
    },
    {
      title: 'Приложение',
      icon: 'phone-portrait',
      items: [
        {
          key: 'dark_mode',
          title: 'Тёмная тема',
          subtitle: 'Использовать тёмное оформление',
          type: 'switch'
        },
        {
          key: 'language',
          title: 'Язык',
          subtitle: 'Русский',
          type: 'action'
        },
        {
          key: 'cache',
          title: 'Очистить кэш',
          subtitle: 'Освободить место на устройстве',
          type: 'action'
        }
      ]
    }
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}>
        {/* Header */}
        <View className="flex-row items-center gap-4 mb-4 pt-4 px-0">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 bg-white rounded-2xl items-center justify-center shadow-sm border border-gray-100"
          >
            <Ionicons name="arrow-back" size={20} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">Настройки</Text>
        </View>

        {/* Settings Groups */}
        {settingsGroups.map((group, groupIndex) => (
          <View key={group.title} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
            <View className="flex-row items-center gap-2 mb-4">
              <Ionicons name={group.icon as any} size={20} color="#0165FB" />
              <Text className="text-lg font-bold text-gray-900">{group.title}</Text>
            </View>
            
            <View className="flex flex-col gap-1">
              {group.items.map((item, itemIndex) => (
                <View key={item.key}>
                  {item.type === 'switch' ? (
                    <View className="flex-row items-center justify-between py-3">
                      <View className="flex-1">
                        <Text className="font-medium text-gray-900">{item.title}</Text>
                        <Text className="text-sm text-gray-500 mt-1">{item.subtitle}</Text>
                      </View>
                      <Switch
                        value={settings[item.key as keyof typeof settings] as boolean}
                        onValueChange={(value) => handleSettingChange(item.key as keyof typeof settings, value)}
                        trackColor={{ false: '#E5E7EB', true: '#0165FB' }}
                        thumbColor="white"
                      />
                    </View>
                  ) : (
                    <TouchableOpacity 
                      onPress={() => {
                        if (item.key === 'edit_profile') {
                          router.push('/(master)/edit-profile');
                        } else if (item.key === 'portfolio') {
                          router.push('/(master)/portfolio');
                        } else if (item.key === 'services') {
                          router.push('/(master)/services');
                        } else if (item.key === 'availability') {
                          router.push('/(master)/availability');
                        } else if (item.key === 'verification') {
                          router.push('/(master)/verification');
                        } else if (item.key === 'change_password') {
                          router.push('/(master)/settings/security');
                        } else if (item.key === 'two_factor') {
                          router.push('/(master)/settings/security');
                        } else if (item.key === 'language') {
                          router.push('/(master)/settings/language');
                        } else if (item.key === 'profile_visibility') {
                          router.push('/(master)/profile-visibility');
                        } else if (item.key === 'cache') {
                          Alert.alert('Кэш очищен', 'Кэш приложения успешно очищен');
                        }
                      }}
                      className="flex-row items-center justify-between py-3"
                    >
                      <View className="flex-1">
                        <Text className="font-medium text-gray-900">{item.title}</Text>
                        <Text className="text-sm text-gray-500 mt-1">{item.subtitle}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                  
                  {itemIndex < group.items.length - 1 && (
                    <View className="h-px bg-gray-100 ml-0" />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Support Section */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <View className="flex-row items-center gap-2 mb-4">
            <Ionicons name="help-circle" size={20} color="#0165FB" />
            <Text className="text-lg font-bold text-gray-900">Поддержка</Text>
          </View>
          
          <View className="flex flex-col gap-1">
            <TouchableOpacity 
              onPress={() => router.push('/(master)/settings/support')}
              className="flex-row items-center justify-between py-3"
            >
              <View className="flex-1">
                <Text className="font-medium text-gray-900">Центр поддержки</Text>
                <Text className="text-sm text-gray-500 mt-1">Часто задаваемые вопросы</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            
            <View className="h-px bg-gray-100" />
            
            <TouchableOpacity 
              onPress={() => router.push('/(master)/settings/support')}
              className="flex-row items-center justify-between py-3"
            >
              <View className="flex-1">
                <Text className="font-medium text-gray-900">Связаться с нами</Text>
                <Text className="text-sm text-gray-500 mt-1">Написать в службу поддержки</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            
            <View className="h-px bg-gray-100" />
            
            <TouchableOpacity 
              onPress={() => router.push('/(master)/settings/security')}
              className="flex-row items-center justify-between py-3"
            >
              <View className="flex-1">
                <Text className="font-medium text-gray-900">Безопасность</Text>
                <Text className="text-sm text-gray-500 mt-1">Настройки безопасности</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            
            <View className="h-px bg-gray-100" />
            
            <TouchableOpacity 
              onPress={() => router.push('/(master)/settings/about')}
              className="flex-row items-center justify-between py-3"
            >
              <View className="flex-1">
                <Text className="font-medium text-gray-900">О приложении</Text>
                <Text className="text-sm text-gray-500 mt-1">Версия 1.0.0</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
          <View className="flex-row items-center gap-2 mb-4">
            <Ionicons name="warning" size={20} color="#DC2626" />
            <Text className="text-lg font-bold text-red-600">Опасная зона</Text>
          </View>
          
          <TouchableOpacity 
            onPress={handleDeleteAccount}
            className="flex-row items-center gap-3 p-3 bg-red-50 rounded-2xl border border-red-200"
          >
            <Ionicons name="trash" size={20} color="#DC2626" />
            <View className="flex-1">
              <Text className="font-medium text-red-700">Удалить аккаунт</Text>
              <Text className="text-sm text-red-500 mt-1">Это действие нельзя отменить</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}