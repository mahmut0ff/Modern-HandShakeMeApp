/**
 * Localization Management Screen
 * Экран управления переводами (для админов)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useGetTranslationsQuery, useGetLocalizationStatsQuery } from '../../services/localizationApi';
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

export default function LocalizationManagementScreen() {
  const { t } = useTranslation();
  const [selectedLocale, setSelectedLocale] = useState('ru');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'translations' | 'stats'>('translations');

  const { data: translations, isLoading: translationsLoading } = useGetTranslationsQuery({
    locale: selectedLocale,
    category: selectedCategory || undefined,
  });

  const { data: stats, isLoading: statsLoading } = useGetLocalizationStatsQuery();

  const filteredTranslations = React.useMemo(() => {
    if (!translations) return [];
    
    const entries = Object.entries(translations);
    if (!searchQuery) return entries;
    
    return entries.filter(([key, value]) =>
      key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      value.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [translations, searchQuery]);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <Text className="text-xl font-bold text-gray-900">
          {t('localization.management')}
        </Text>
      </View>

      {/* Tabs */}
      <View className="flex-row bg-white border-b border-gray-200">
        <TouchableOpacity
          className={`flex-1 py-3 ${activeTab === 'translations' ? 'border-b-2 border-blue-500' : ''}`}
          onPress={() => setActiveTab('translations')}
        >
          <Text className={`text-center font-medium ${activeTab === 'translations' ? 'text-blue-500' : 'text-gray-600'}`}>
            {t('localization.translations')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-3 ${activeTab === 'stats' ? 'border-b-2 border-blue-500' : ''}`}
          onPress={() => setActiveTab('stats')}
        >
          <Text className={`text-center font-medium ${activeTab === 'stats' ? 'text-blue-500' : 'text-gray-600'}`}>
            {t('localization.statistics')}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'translations' ? (
        <>
          {/* Locale Selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="bg-white border-b border-gray-200">
            <View className="flex-row px-4 py-3 space-x-2">
              {LOCALES.map((locale) => (
                <TouchableOpacity
                  key={locale.code}
                  className={`px-4 py-2 rounded-full flex-row items-center ${
                    selectedLocale === locale.code ? 'bg-blue-500' : 'bg-gray-100'
                  }`}
                  onPress={() => setSelectedLocale(locale.code)}
                >
                  <Text className="mr-2">{locale.flag}</Text>
                  <Text className={selectedLocale === locale.code ? 'text-white font-medium' : 'text-gray-700'}>
                    {locale.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Category Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="bg-white border-b border-gray-200">
            <View className="flex-row px-4 py-2 space-x-2">
              <TouchableOpacity
                className={`px-3 py-1.5 rounded-full ${!selectedCategory ? 'bg-blue-500' : 'bg-gray-100'}`}
                onPress={() => setSelectedCategory(null)}
              >
                <Text className={!selectedCategory ? 'text-white text-sm' : 'text-gray-700 text-sm'}>
                  {t('localization.all')}
                </Text>
              </TouchableOpacity>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  className={`px-3 py-1.5 rounded-full ${
                    selectedCategory === category ? 'bg-blue-500' : 'bg-gray-100'
                  }`}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text className={selectedCategory === category ? 'text-white text-sm' : 'text-gray-700 text-sm'}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Search */}
          <View className="bg-white px-4 py-3 border-b border-gray-200">
            <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
              <Ionicons name="search" size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-2 text-gray-900"
                placeholder={t('localization.search')}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Translations List */}
          <ScrollView className="flex-1">
            {translationsLoading ? (
              <View className="flex-1 items-center justify-center py-12">
                <ActivityIndicator size="large" color="#3B82F6" />
              </View>
            ) : (
              <View className="p-4 space-y-2">
                {filteredTranslations.map(([key, value]) => (
                  <TranslationItem
                    key={key}
                    translationKey={key}
                    value={value}
                    locale={selectedLocale}
                  />
                ))}
                {filteredTranslations.length === 0 && (
                  <View className="py-12 items-center">
                    <Ionicons name="language-outline" size={48} color="#D1D5DB" />
                    <Text className="text-gray-500 mt-4">{t('localization.noTranslations')}</Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </>
      ) : (
        <ScrollView className="flex-1">
          {statsLoading ? (
            <View className="flex-1 items-center justify-center py-12">
              <ActivityIndicator size="large" color="#3B82F6" />
            </View>
          ) : stats ? (
            <LocalizationStats stats={stats} />
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

interface TranslationItemProps {
  translationKey: string;
  value: string;
  locale: string;
}

function TranslationItem({ translationKey, value, locale }: TranslationItemProps) {
  return (
    <TouchableOpacity className="bg-white rounded-lg p-4 border border-gray-200">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-sm font-mono text-gray-600 mb-1">{translationKey}</Text>
          <Text className="text-base text-gray-900">{value}</Text>
        </View>
        <TouchableOpacity className="ml-2">
          <Ionicons name="create-outline" size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

interface LocalizationStatsProps {
  stats: any;
}

function LocalizationStats({ stats }: LocalizationStatsProps) {
  const { t } = useTranslation();

  return (
    <View className="p-4 space-y-4">
      {/* Total Keys */}
      <View className="bg-white rounded-lg p-4 border border-gray-200">
        <Text className="text-sm text-gray-600 mb-1">{t('localization.totalKeys')}</Text>
        <Text className="text-3xl font-bold text-gray-900">{stats.totalKeys}</Text>
      </View>

      {/* Locale Progress */}
      <View className="bg-white rounded-lg p-4 border border-gray-200">
        <Text className="text-lg font-semibold text-gray-900 mb-4">
          {t('localization.localeProgress')}
        </Text>
        {Object.entries(stats.locales || {}).map(([locale, data]: [string, any]) => (
          <View key={locale} className="mb-4 last:mb-0">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-base font-medium text-gray-900">
                {LOCALES.find(l => l.code === locale)?.name || locale}
              </Text>
              <Text className="text-sm font-semibold text-blue-500">
                {data.percentage.toFixed(1)}%
              </Text>
            </View>
            <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <View
                className="h-full bg-blue-500"
                style={{ width: `${data.percentage}%` }}
              />
            </View>
            <View className="flex-row justify-between mt-1">
              <Text className="text-xs text-gray-500">
                {t('localization.translated')}: {data.translated}
              </Text>
              <Text className="text-xs text-gray-500">
                {t('localization.missing')}: {data.missing}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Categories */}
      {stats.categories && Object.keys(stats.categories).length > 0 && (
        <View className="bg-white rounded-lg p-4 border border-gray-200">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            {t('localization.categories')}
          </Text>
          {Object.entries(stats.categories).map(([category, data]: [string, any]) => (
            <View key={category} className="mb-3 last:mb-0">
              <Text className="text-base font-medium text-gray-900 mb-2">{category}</Text>
              <Text className="text-sm text-gray-600">
                {t('localization.totalKeys')}: {data.total}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
