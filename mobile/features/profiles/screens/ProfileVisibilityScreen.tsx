/**
 * Profile Visibility Screen
 * Настройки видимости профиля
 */

import React, { useState } from 'react';
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
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import type { ProfileVisibilitySettings } from '../types';

export default function ProfileVisibilityScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [settings, setSettings] = useState<ProfileVisibilitySettings>({
    show_phone: true,
    show_email: false,
    show_address: false,
    show_rating: true,
    show_reviews: true,
    show_portfolio: true,
    is_searchable: true,
  });

  const updateSetting = (key: keyof ProfileVisibilitySettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to save visibility settings
      await new Promise((resolve) => setTimeout(resolve, 1000));
      Alert.alert('Успешно', 'Настройки сохранены', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сохранить настройки');
    } finally {
      setIsLoading(false);
    }
  };

  const SettingItem = ({
    icon,
    iconColor,
    title,
    description,
    value,
    onValueChange,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    title: string;
    description: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View className="flex-row items-center justify-between py-4 border-b border-gray-100">
      <View className="flex-row items-center flex-1 mr-4">
        <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-base font-medium text-gray-900">{title}</Text>
          <Text className="text-sm text-gray-500">{description}</Text>
        </View>
      </View>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">Приватность</Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Search Visibility */}
        <View className="bg-white p-4 mb-4">
          <Text className="text-sm font-semibold text-gray-500 uppercase mb-2">
            Видимость в поиске
          </Text>
          
          <SettingItem
            icon="search"
            iconColor="#3B82F6"
            title="Показывать в поиске"
            description="Ваш профиль будет виден в результатах поиска"
            value={settings.is_searchable}
            onValueChange={(value) => updateSetting('is_searchable', value)}
          />
        </View>

        {/* Contact Info */}
        <View className="bg-white p-4 mb-4">
          <Text className="text-sm font-semibold text-gray-500 uppercase mb-2">
            Контактная информация
          </Text>
          
          <SettingItem
            icon="call"
            iconColor="#10B981"
            title="Показывать телефон"
            description="Другие пользователи смогут видеть ваш номер"
            value={settings.show_phone}
            onValueChange={(value) => updateSetting('show_phone', value)}
          />

          <SettingItem
            icon="mail"
            iconColor="#8B5CF6"
            title="Показывать email"
            description="Другие пользователи смогут видеть ваш email"
            value={settings.show_email}
            onValueChange={(value) => updateSetting('show_email', value)}
          />

          <SettingItem
            icon="location"
            iconColor="#F59E0B"
            title="Показывать адрес"
            description="Другие пользователи смогут видеть ваш точный адрес"
            value={settings.show_address}
            onValueChange={(value) => updateSetting('show_address', value)}
          />
        </View>

        {/* Profile Info */}
        <View className="bg-white p-4 mb-4">
          <Text className="text-sm font-semibold text-gray-500 uppercase mb-2">
            Информация профиля
          </Text>
          
          <SettingItem
            icon="star"
            iconColor="#F59E0B"
            title="Показывать рейтинг"
            description="Ваш рейтинг будет виден другим пользователям"
            value={settings.show_rating}
            onValueChange={(value) => updateSetting('show_rating', value)}
          />

          <SettingItem
            icon="chatbubbles"
            iconColor="#3B82F6"
            title="Показывать отзывы"
            description="Отзывы о вас будут видны другим пользователям"
            value={settings.show_reviews}
            onValueChange={(value) => updateSetting('show_reviews', value)}
          />

          <SettingItem
            icon="images"
            iconColor="#8B5CF6"
            title="Показывать портфолио"
            description="Ваше портфолио будет видно другим пользователям"
            value={settings.show_portfolio}
            onValueChange={(value) => updateSetting('show_portfolio', value)}
          />
        </View>

        {/* Info */}
        <View className="px-4 mb-4">
          <View className="bg-blue-50 rounded-xl p-4">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <Text className="text-sm text-blue-700 ml-2 flex-1">
                Эти настройки влияют на то, какую информацию о вас видят другие пользователи.
                Некоторая информация может быть необходима для работы сервиса.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View className="bg-white border-t border-gray-200 p-4">
        <TouchableOpacity
          className={`rounded-xl py-4 items-center ${isLoading ? 'bg-gray-400' : 'bg-blue-500'}`}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <LoadingSpinner size="small" />
          ) : (
            <Text className="text-white font-semibold text-base">Сохранить</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
