/**
 * Edit Master Profile Screen
 * Редактирование профиля мастера
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import {
  useGetMyMasterProfileQuery,
  useUpdateMasterProfileMutation,
} from '../../../services/profileApi';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ErrorMessage } from '../../../components/ErrorMessage';
import type { MasterProfileFormData } from '../types';

const CITIES = ['Бишкек', 'Ош', 'Джалал-Абад', 'Каракол', 'Токмок', 'Нарын', 'Талас', 'Баткен'];
const LANGUAGES = ['Русский', 'Кыргызский', 'Английский', 'Узбекский', 'Казахский'];

export default function EditMasterProfileScreen() {
  const router = useRouter();
  const { data: profile, isLoading, error } = useGetMyMasterProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateMasterProfileMutation();

  const [formData, setFormData] = useState<MasterProfileFormData>({});

  useEffect(() => {
    if (profile) {
      setFormData({
        bio: profile.bio || '',
        experience_years: profile.experience_years,
        hourly_rate: profile.hourly_rate ? parseFloat(profile.hourly_rate) : undefined,
        min_order_amount: profile.min_order_amount ? parseFloat(profile.min_order_amount) : undefined,
        max_order_amount: profile.max_order_amount ? parseFloat(profile.max_order_amount) : undefined,
        city: profile.city || '',
        address: profile.address || '',
        work_radius: profile.work_radius,
        languages: profile.languages || [],
        education: profile.education || '',
        work_schedule: profile.work_schedule || '',
        is_available: profile.is_available,
        has_transport: profile.has_transport,
        has_tools: profile.has_tools,
      });
    }
  }, [profile]);

  const updateField = <K extends keyof MasterProfileFormData>(
    field: K,
    value: MasterProfileFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleLanguage = (language: string) => {
    const current = formData.languages || [];
    if (current.includes(language)) {
      updateField('languages', current.filter((l) => l !== language));
    } else {
      updateField('languages', [...current, language]);
    }
  };

  const handleSubmit = async () => {
    try {
      await updateProfile(formData).unwrap();
      Alert.alert('Успешно', 'Профиль обновлен', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      Alert.alert('Ошибка', error?.data?.message || 'Не удалось обновить профиль');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <LoadingSpinner fullScreen text="Загрузка..." />
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <ErrorMessage message="Не удалось загрузить профиль" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">Редактировать профиль</Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Bio */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-2">О себе</Text>
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900"
            placeholder="Расскажите о себе и своем опыте..."
            value={formData.bio}
            onChangeText={(text) => updateField('bio', text)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
        </View>

        {/* Experience */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-2">Опыт работы (лет)</Text>
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900"
            placeholder="0"
            value={formData.experience_years?.toString() || ''}
            onChangeText={(text) => updateField('experience_years', parseInt(text) || undefined)}
            keyboardType="numeric"
          />
        </View>

        {/* Rates */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">Расценки</Text>
          
          <Text className="text-sm text-gray-700 mb-2">Ставка в час (сом)</Text>
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 mb-3"
            placeholder="0"
            value={formData.hourly_rate?.toString() || ''}
            onChangeText={(text) => updateField('hourly_rate', parseInt(text) || undefined)}
            keyboardType="numeric"
          />

          <Text className="text-sm text-gray-700 mb-2">Минимальная сумма заказа (сом)</Text>
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 mb-3"
            placeholder="0"
            value={formData.min_order_amount?.toString() || ''}
            onChangeText={(text) => updateField('min_order_amount', parseInt(text) || undefined)}
            keyboardType="numeric"
          />

          <Text className="text-sm text-gray-700 mb-2">Максимальная сумма заказа (сом)</Text>
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900"
            placeholder="Без ограничений"
            value={formData.max_order_amount?.toString() || ''}
            onChangeText={(text) => updateField('max_order_amount', parseInt(text) || undefined)}
            keyboardType="numeric"
          />
        </View>

        {/* Location */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">Местоположение</Text>
          
          <Text className="text-sm text-gray-700 mb-2">Город</Text>
          <View className="border border-gray-300 rounded-xl overflow-hidden mb-3">
            <Picker
              selectedValue={formData.city}
              onValueChange={(value) => updateField('city', value)}
            >
              <Picker.Item label="Выберите город" value="" />
              {CITIES.map((city) => (
                <Picker.Item key={city} label={city} value={city} />
              ))}
            </Picker>
          </View>

          <Text className="text-sm text-gray-700 mb-2">Адрес</Text>
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 mb-3"
            placeholder="Улица, дом"
            value={formData.address}
            onChangeText={(text) => updateField('address', text)}
          />

          <Text className="text-sm text-gray-700 mb-2">Радиус работы (км)</Text>
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900"
            placeholder="10"
            value={formData.work_radius?.toString() || ''}
            onChangeText={(text) => updateField('work_radius', parseInt(text) || undefined)}
            keyboardType="numeric"
          />
        </View>

        {/* Languages */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">Языки</Text>
          <View className="flex-row flex-wrap gap-2">
            {LANGUAGES.map((language) => {
              const isSelected = formData.languages?.includes(language);
              return (
                <TouchableOpacity
                  key={language}
                  className={`px-4 py-2 rounded-full border ${
                    isSelected ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
                  }`}
                  onPress={() => toggleLanguage(language)}
                >
                  <Text className={isSelected ? 'text-white font-medium' : 'text-gray-700'}>
                    {language}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Work Schedule */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-2">График работы</Text>
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900"
            placeholder="Пн-Пт: 9:00-18:00"
            value={formData.work_schedule}
            onChangeText={(text) => updateField('work_schedule', text)}
          />
        </View>

        {/* Education */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-2">Образование</Text>
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900"
            placeholder="Укажите образование..."
            value={formData.education}
            onChangeText={(text) => updateField('education', text)}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />
        </View>

        {/* Toggles */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">Настройки</Text>
          
          <View className="space-y-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-700">Доступен для заказов</Text>
              <Switch
                value={formData.is_available}
                onValueChange={(value) => updateField('is_available', value)}
              />
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-gray-700">Есть транспорт</Text>
              <Switch
                value={formData.has_transport}
                onValueChange={(value) => updateField('has_transport', value)}
              />
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-gray-700">Есть инструменты</Text>
              <Switch
                value={formData.has_tools}
                onValueChange={(value) => updateField('has_tools', value)}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View className="bg-white border-t border-gray-200 p-4">
        <TouchableOpacity
          className={`rounded-xl py-4 items-center ${isUpdating ? 'bg-gray-400' : 'bg-blue-500'}`}
          onPress={handleSubmit}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <LoadingSpinner size="small" />
          ) : (
            <Text className="text-white font-semibold text-base">Сохранить</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
