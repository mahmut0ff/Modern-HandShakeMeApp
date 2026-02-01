/**
 * Translation Import Screen
 * Экран импорта переводов
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useImportTranslationsMutation } from '../../services/localizationApi';
import { useTranslation } from '../../hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';

const LOCALES = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ky', name: 'Кыргызча', flag: '🇰🇬' },
];

export default function TranslationImportScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedLocale, setSelectedLocale] = useState('ru');
  const [jsonInput, setJsonInput] = useState('');
  const [importTranslations, { isLoading }] = useImportTranslationsMutation();

  const handleImport = async () => {
    if (!jsonInput.trim()) {
      Alert.alert(t('error'), 'Введите JSON с переводами');
      return;
    }

    try {
      const translations = JSON.parse(jsonInput);
      
      if (typeof translations !== 'object' || Array.isArray(translations)) {
        throw new Error('JSON должен быть объектом');
      }

      await importTranslations({
        locale: selectedLocale,
        translations,
      }).unwrap();

      Alert.alert(t('success'), `Импортировано ${Object.keys(translations).length} переводов`);
      router.back();
    } catch (error: any) {
      if (error instanceof SyntaxError) {
        Alert.alert(t('error'), 'Неверный формат JSON');
      } else {
        Alert.alert(t('error'), error.message || 'Ошибка импорта');
      }
    }
  };

  const handlePasteExample = () => {
    const example = JSON.stringify(
      {
        'example.key1': 'Пример перевода 1',
        'example.key2': 'Пример перевода 2',
        'example.nested.key': 'Вложенный ключ',
      },
      null,
      2
    );
    setJsonInput(example);
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">
          {t('localization.import')}
        </Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4 space-y-4">
          {/* Info */}
          <View className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={24} color="#3B82F6" />
              <View className="flex-1 ml-3">
                <Text className="text-blue-900 font-medium mb-1">
                  Формат импорта
                </Text>
                <Text className="text-blue-700 text-sm">
                  Вставьте JSON объект с парами ключ-значение. Ключи должны использовать точечную нотацию.
                </Text>
              </View>
            </View>
          </View>

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

          {/* JSON Input */}
          <View>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-medium text-gray-700">
                JSON переводы
              </Text>
              <TouchableOpacity onPress={handlePasteExample}>
                <Text className="text-blue-500 text-sm">Вставить пример</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-mono text-sm"
              placeholder='{"key": "value"}'
              value={jsonInput}
              onChangeText={setJsonInput}
              multiline
              numberOfLines={15}
              textAlignVertical="top"
            />
          </View>

          {/* Example */}
          <View className="bg-gray-100 rounded-lg p-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Пример формата:
            </Text>
            <Text className="text-xs font-mono text-gray-600">
              {`{
  "auth.login": "Войти",
  "auth.register": "Регистрация",
  "profile.edit": "Редактировать"
}`}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Import Button */}
      <View className="bg-white border-t border-gray-200 p-4">
        <TouchableOpacity
          className={`py-4 rounded-lg ${isLoading ? 'bg-blue-300' : 'bg-blue-500'}`}
          onPress={handleImport}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-semibold text-lg">
              Импортировать
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
