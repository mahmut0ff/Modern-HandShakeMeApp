import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useGetMyMasterProfileQuery,
  useUpdateMasterProfileMutation,
  type MasterProfile,
} from '../../services/profileApi';

interface VisibilitySettings {
  profile_visible: boolean;
  show_phone: boolean;
  show_email: boolean;
  show_address: boolean;
  show_rating: boolean;
  show_reviews: boolean;
  show_portfolio: boolean;
  show_completed_projects: boolean;
  show_response_time: boolean;
  show_last_active: boolean;
  allow_direct_contact: boolean;
  show_in_search: boolean;
  show_availability: boolean;
  show_pricing: boolean;
}

export default function MasterProfileVisibilityPage() {
  const [settings, setSettings] = useState<VisibilitySettings>({
    profile_visible: true,
    show_phone: false,
    show_email: false,
    show_address: true,
    show_rating: true,
    show_reviews: true,
    show_portfolio: true,
    show_completed_projects: true,
    show_response_time: true,
    show_last_active: false,
    allow_direct_contact: true,
    show_in_search: true,
    show_availability: true,
    show_pricing: true,
  });

  // API queries
  const { 
    data: profileData, 
    isLoading: profileLoading, 
    error: profileError,
    refetch: refetchProfile 
  } = useGetMyMasterProfileQuery();

  // Mutations
  const [updateProfile, { isLoading: updateLoading }] = useUpdateMasterProfileMutation();

  // Update local settings when profile data loads
  useEffect(() => {
    if (profileData) {
      // Map profile data to visibility settings
      // Note: This assumes the backend has these fields. Adjust based on actual API structure
      setSettings({
        profile_visible: profileData.is_available ?? true,
        show_phone: true, // These would come from profile privacy settings
        show_email: false,
        show_address: true,
        show_rating: true,
        show_reviews: true,
        show_portfolio: true,
        show_completed_projects: true,
        show_response_time: true,
        show_last_active: false,
        allow_direct_contact: true,
        show_in_search: profileData.is_available ?? true,
        show_availability: true,
        show_pricing: true,
      });
    }
  }, [profileData]);

  const visibilityOptions = [
    {
      section: 'Основные настройки',
      items: [
        {
          key: 'profile_visible' as keyof VisibilitySettings,
          title: 'Профиль виден всем',
          description: 'Ваш профиль отображается в поиске и доступен для просмотра',
          icon: 'eye',
          critical: true
        },
        {
          key: 'show_in_search' as keyof VisibilitySettings,
          title: 'Показывать в поиске',
          description: 'Ваш профиль появляется в результатах поиска мастеров',
          icon: 'search'
        }
      ]
    },
    {
      section: 'Контактная информация',
      items: [
        {
          key: 'show_phone' as keyof VisibilitySettings,
          title: 'Показывать телефон',
          description: 'Номер телефона виден в профиле',
          icon: 'call'
        },
        {
          key: 'show_email' as keyof VisibilitySettings,
          title: 'Показывать email',
          description: 'Email адрес виден в профиле',
          icon: 'mail'
        },
        {
          key: 'show_address' as keyof VisibilitySettings,
          title: 'Показывать адрес',
          description: 'Город и район работы видны в профиле',
          icon: 'location'
        },
        {
          key: 'allow_direct_contact' as keyof VisibilitySettings,
          title: 'Разрешить прямые контакты',
          description: 'Клиенты могут связаться напрямую без создания заказа',
          icon: 'chatbubbles'
        }
      ]
    },
    {
      section: 'Профессиональная информация',
      items: [
        {
          key: 'show_rating' as keyof VisibilitySettings,
          title: 'Показывать рейтинг',
          description: 'Средний рейтинг отображается в профиле',
          icon: 'star'
        },
        {
          key: 'show_reviews' as keyof VisibilitySettings,
          title: 'Показывать отзывы',
          description: 'Отзывы клиентов видны в профиле',
          icon: 'chatbox'
        },
        {
          key: 'show_portfolio' as keyof VisibilitySettings,
          title: 'Показывать портфолио',
          description: 'Примеры работ отображаются в профиле',
          icon: 'images'
        },
        {
          key: 'show_completed_projects' as keyof VisibilitySettings,
          title: 'Показывать количество проектов',
          description: 'Число завершенных проектов видно в профиле',
          icon: 'briefcase'
        }
      ]
    },
    {
      section: 'Активность и доступность',
      items: [
        {
          key: 'show_response_time' as keyof VisibilitySettings,
          title: 'Показывать время ответа',
          description: 'Среднее время ответа на сообщения',
          icon: 'time'
        },
        {
          key: 'show_last_active' as keyof VisibilitySettings,
          title: 'Показывать последнюю активность',
          description: 'Когда вы были онлайн в последний раз',
          icon: 'radio-button-on'
        },
        {
          key: 'show_availability' as keyof VisibilitySettings,
          title: 'Показывать доступность',
          description: 'Ваше расписание и свободное время',
          icon: 'calendar'
        }
      ]
    },
    {
      section: 'Ценообразование',
      items: [
        {
          key: 'show_pricing' as keyof VisibilitySettings,
          title: 'Показывать цены',
          description: 'Стоимость услуг отображается в профиле',
          icon: 'card'
        }
      ]
    }
  ];

  const toggleSetting = (key: keyof VisibilitySettings) => {
    if (key === 'profile_visible' && settings[key]) {
      Alert.alert(
        'Скрыть профиль',
        'Если вы скроете профиль, клиенты не смогут найти вас в поиске. Продолжить?',
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Скрыть',
            style: 'destructive',
            onPress: () => {
              setSettings(prev => ({ ...prev, [key]: !prev[key] }));
            }
          }
        ]
      );
      return;
    }

    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const saveSettings = async () => {
    try {
      // Map visibility settings back to profile update data
      await updateProfile({
        is_available: settings.profile_visible && settings.show_in_search,
        // Add other privacy-related fields as they become available in the API
      }).unwrap();
      
      refetchProfile();
      Alert.alert('Успех', 'Настройки приватности сохранены');
    } catch (error: any) {
      console.error('Failed to update profile visibility:', error);
      Alert.alert('Ошибка', error?.data?.message || 'Не удалось сохранить настройки');
    }
  };

  const resetToDefault = () => {
    Alert.alert(
      'Сбросить настройки',
      'Вернуть все настройки к значениям по умолчанию?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Сбросить',
          onPress: () => {
            setSettings({
              profile_visible: true,
              show_phone: false,
              show_email: false,
              show_address: true,
              show_rating: true,
              show_reviews: true,
              show_portfolio: true,
              show_completed_projects: true,
              show_response_time: true,
              show_last_active: false,
              allow_direct_contact: true,
              show_in_search: true,
              show_availability: true,
              show_pricing: true,
            });
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      <ScrollView className="flex-1 px-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center gap-4">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="w-10 h-10 bg-white rounded-2xl items-center justify-center shadow-sm border border-gray-100"
            >
              <Ionicons name="arrow-back" size={20} color="#6B7280" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-gray-900">Приватность профиля</Text>
          </View>
          <TouchableOpacity
            onPress={resetToDefault}
            className="px-3 py-2 bg-gray-100 rounded-xl"
          >
            <Text className="text-gray-700 text-sm font-medium">Сбросить</Text>
          </TouchableOpacity>
        </View>

        {/* Loading state */}
        {profileLoading && (
          <View className="bg-white rounded-3xl p-8 items-center shadow-sm border border-gray-100 mb-6">
            <ActivityIndicator size="large" color="#0165FB" />
            <Text className="text-gray-500 mt-2">Загрузка настроек профиля...</Text>
          </View>
        )}

        {/* Error state */}
        {profileError && (
          <View className="bg-white rounded-3xl p-8 items-center shadow-sm border border-gray-100 mb-6">
            <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="alert-circle" size={32} color="#EF4444" />
            </View>
            <Text className="text-gray-900 font-semibold mb-2">Ошибка загрузки</Text>
            <Text className="text-gray-500 text-center mb-4">
              Не удалось загрузить настройки профиля
            </Text>
            <TouchableOpacity 
              onPress={() => refetchProfile()}
              className="bg-[#0165FB] px-6 py-2 rounded-xl"
            >
              <Text className="text-white font-medium">Повторить</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Profile Status */}
        {!profileLoading && !profileError && (
          <>
            <View className={`rounded-3xl p-5 mb-6 ${
              settings.profile_visible ? 'bg-green-500' : 'bg-red-500'
            }`}>
              <View className="flex-row items-center gap-4">
                <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center">
                  <Ionicons 
                    name={settings.profile_visible ? 'eye' : 'eye-off'} 
                    size={32} 
                    color="white" 
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-xl font-bold">
                    Профиль {settings.profile_visible ? 'виден' : 'скрыт'}
                  </Text>
                  <Text className="text-white/80 text-sm">
                    {settings.profile_visible 
                      ? 'Клиенты могут найти вас в поиске'
                      : 'Ваш профиль скрыт от поиска'
                    }
                  </Text>
                  {profileData && (
                    <Text className="text-white/60 text-xs mt-1">
                      Рейтинг: {parseFloat(profileData.rating).toFixed(1)} • 
                      Проектов: {profileData.completed_orders}
                    </Text>
                  )}
                </View>
              </View>
            </View>

        {/* Visibility Settings */}
        {visibilityOptions.map((section, sectionIndex) => (
          <View key={sectionIndex} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
            <Text className="text-lg font-bold text-gray-900 mb-4">{section.section}</Text>
            
            <View className="space-y-4">
              {section.items.map((item, itemIndex) => (
                <View key={item.key} className="flex-row items-start gap-4">
                  <View className={`w-10 h-10 rounded-2xl items-center justify-center ${
                    settings[item.key] ? 'bg-[#0165FB]/10' : 'bg-gray-100'
                  }`}>
                    <Ionicons 
                      name={item.icon as any} 
                      size={20} 
                      color={settings[item.key] ? '#0165FB' : '#6B7280'} 
                    />
                  </View>
                  
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text className="font-semibold text-gray-900">{item.title}</Text>
                      {item.critical && (
                        <View className="px-2 py-1 bg-orange-100 rounded-full">
                          <Text className="text-xs font-medium text-orange-700">Важно</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-sm text-gray-600 mb-3">{item.description}</Text>
                  </View>
                  
                  <TouchableOpacity
                    onPress={() => toggleSetting(item.key)}
                    className={`w-12 h-7 rounded-full p-1 ${
                      settings[item.key] ? 'bg-[#0165FB]' : 'bg-gray-300'
                    }`}
                  >
                    <View className={`w-5 h-5 bg-white rounded-full transition-all ${
                      settings[item.key] ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Privacy Tips */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
          <Text className="font-semibold text-gray-900 mb-3 flex-row items-center gap-2">
            <Ionicons name="shield-checkmark" size={20} color="#059669" />
            Советы по приватности
          </Text>
          <View className="space-y-2">
            <Text className="text-sm text-gray-600">• Не показывайте личные контакты незнакомцам</Text>
            <Text className="text-sm text-gray-600">• Включите показ рейтинга для повышения доверия</Text>
            <Text className="text-sm text-gray-600">• Портфолио помогает получить больше заказов</Text>
            <Text className="text-sm text-gray-600">• Скрывайте точный адрес, указывайте только район</Text>
          </View>
        </View>

        {/* Save Button */}
        {!profileLoading && !profileError && (
          <TouchableOpacity
            onPress={saveSettings}
            disabled={updateLoading}
            className={`py-4 rounded-2xl shadow-lg mb-6 ${
              updateLoading ? 'bg-gray-400' : 'bg-[#0165FB]'
            }`}
          >
            <Text className="text-center font-semibold text-white text-lg">
              {updateLoading ? 'Сохранение...' : 'Сохранить настройки'}
            </Text>
          </TouchableOpacity>
        )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}