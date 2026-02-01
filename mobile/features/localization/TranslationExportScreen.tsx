/**
 * Translation Export Screen
 * Экран экспорта переводов
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGetTranslationsQuery } from '../../services/localizationApi';
import { useTranslation } from '../../hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

const LOCALES = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ky', name: 'Кыргызча', flag: '🇰🇬' },
];

export default function TranslationExportScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedLocale, setSelectedLocale] = useState('ru');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: translations, isLoading } = useGetTranslationsQuery({
    locale: selectedLocale,
    category: selectedCategory || undefined,
  });

  const handleCopyToClipboard = async () => {
    if (!translations) return;

    try {
      const json = JSON.stringify(translations, null, 2);
      await Clipboard.setStringAsync(json);
      Alert.alert(t('success'), 'Переводы скопированы в буфер обмена');
    } catch (error) {
      Alert.alert(t('error'), 'Не удалось скопировать');
    }
  };

  const handleShare = async () => {
    if (!translations) return;

    try {
      const json = JSON.stringify(translations, null, 2);
      await Share.share({
        message: json,
        title: `Переводы ${selectedLocale}`,
      });
    } catch (error) {
      Alert.alert(t('error'), 'Не удалось поделиться');
    }
  };

  const translationCount = translations ? Object.keys(translations).length : 0;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">
          {t('localization.export')}
        </Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4 space-y-4">
          {/* Locale Selector */}
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Выберите язык
            </Text>
            <View className="flex-row space-x-2">
              {LOCALES.map((loc) => (
                <TouchableOpacity
                  key={loc.code}
                  className={`flex-1 px-4 py-3 rounded-lg border ${
                    selectedLocale === loc.code
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-white border-gray-300'
                  }`}
                  onPress={() => setSelectedLocale(loc.code)}
                >
                  <Text className="text-center">
                    {loc.flag} {loc.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Stats */}
          {!isLoading && translations && (
            <View className="bg-white rounded-lg p-4 border border-gray-200">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-700">Всего переводов:</Text>
                <Text className="text-lg font-bold text-gray-900">{translationCount}</Text>
              </View>
            </View>
          )}

          {/* Preview */}
          {isLoading ? (
            <View className="bg-white rounded-lg p-8 items-center">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className="text-gray-600 mt-4">Загрузка переводов...</Text>
            </View>
          ) : translations ? (
            <View className="bg-white rounded-lg p-4 border border-gray-200">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Предпросмотр JSON:
              </Text>
              <ScrollView
                className="bg-gray-50 rounded-lg p-3 max-h-96"
                nestedScrollEnabled
              >
                <Text className="text-xs font-mono text-gray-700">
                  {JSON.stringify(translations, null, 2)}
                </Text>
              </ScrollView>
            </View>
          ) : null}

          {/* Actions */}
          {!isLoading && translations && (
            <View className="space-y-3">
              <TouchableOpacity
                className="bg-blue-500 py-4 rounded-lg flex-row items-center justify-center"
                onPress={handleCopyToClipboard}
              >
                <Ionicons name="copy-outline" size={20} color="white" />
                <Text className="text-white font-semibold text-lg ml-2">
                  Скопировать в буфер
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-green-500 py-4 rounded-lg flex-row items-center justify-center"
                onPress={handleShare}
              >
                <Ionicons name="share-outline" size={20} color="white" />
                <Text className="text-white font-semibold text-lg ml-2">
                  Поделиться
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
