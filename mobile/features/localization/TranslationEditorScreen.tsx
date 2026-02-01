/**
 * Translation Editor Screen
 * Экран редактирования перевода
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSaveTranslationMutation, useDeleteTranslationMutation } from '../../services/localizationApi';
import { useTranslation } from '../../hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';

const LOCALES = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ky', name: 'Кыргызча', flag: '🇰🇬' },
];

const CATEGORIES = [
  'general',
  'auth',
  'profile',
  'orders',
  'chat',
  'notifications',
  'errors',
  'validation',
];

export default function TranslationEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useTranslation();

  const [key, setKey] = useState(params.key as string || '');
  const [locale, setLocale] = useState(params.locale as string || 'ru');
  const [value, setValue] = useState(params.value as string || '');
  const [category, setCategory] = useState(params.category as string || 'general');
  const [description, setDescription] = useState(params.description as string || '');

  const [saveTranslation, { isLoading: isSaving }] = useSaveTranslationMutation();
  const [deleteTranslation, { isLoading: isDeleting }] = useDeleteTranslationMutation();

  const isEditMode = !!params.key;

  const handleSave = async () => {
    if (!key.trim() || !value.trim()) {
      Alert.alert(t('error'), t('localization.fillRequired'));
      return;
    }

    try {
      await saveTranslation({
        key: key.trim(),
        locale,
        value: value.trim(),
        category,
        description: description.trim() || undefined,
      }).unwrap();

      Alert.alert(t('success'), t('localization.saved'));
      router.back();
    } catch (error: any) {
      Alert.alert(t('error'), error.message || t('localization.saveFailed'));
    }
  };

  const handleDelete = () => {
    Alert.alert(
      t('localization.deleteTranslation'),
      t('localization.deleteConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTranslation({ key, locale }).unwrap();
              Alert.alert(t('success'), t('localization.deleted'));
              router.back();
            } catch (error: any) {
              Alert.alert(t('error'), error.message || t('localization.deleteFailed'));
            }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">
            {isEditMode ? t('localization.editTranslation') : t('localization.newTranslation')}
          </Text>
        </View>
        {isEditMode && (
          <TouchableOpacity onPress={handleDelete} disabled={isDeleting}>
            <Ionicons name="trash-outline" size={24} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView className="flex-1">
        <View className="p-4 space-y-4">
          {/* Key */}
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              {t('localization.key')} *
            </Text>
            <TextInput
              className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-mono"
              placeholder="auth.login.title"
              value={key}
              onChangeText={setKey}
              editable={!isEditMode}
              autoCapitalize="none"
            />
            <Text className="text-xs text-gray-500 mt-1">
              {t('localization.keyHint')}
            </Text>
          </View>

          {/* Locale */}
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              {t('localization.locale')} *
            </Text>
            <View className="flex-row space-x-2">
              {LOCALES.map((loc) => (
                <TouchableOpacity
                  key={loc.code}
                  className={`flex-1 px-4 py-3 rounded-lg border ${
                    locale === loc.code
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-white border-gray-300'
                  }`}
                  onPress={() => setLocale(loc.code)}
                  disabled={isEditMode}
                >
                  <Text className="text-center">
                    {loc.flag} {loc.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Value */}
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              {t('localization.value')} *
            </Text>
            <TextInput
              className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
              placeholder={t('localization.valuePlaceholder')}
              value={value}
              onChangeText={setValue}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Category */}
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              {t('localization.category')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row space-x-2">
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    className={`px-4 py-2 rounded-full ${
                      category === cat ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                    onPress={() => setCategory(cat)}
                  >
                    <Text className={category === cat ? 'text-white' : 'text-gray-700'}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Description */}
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              {t('localization.description')}
            </Text>
            <TextInput
              className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
              placeholder={t('localization.descriptionPlaceholder')}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View className="bg-white border-t border-gray-200 p-4">
        <TouchableOpacity
          className={`py-4 rounded-lg ${isSaving ? 'bg-blue-300' : 'bg-blue-500'}`}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-semibold text-lg">
              {t('save')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
