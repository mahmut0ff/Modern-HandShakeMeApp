/**
 * Edit Client Profile Screen
 * Редактирование профиля клиента
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import {
  useGetMyClientProfileQuery,
  useUpdateClientProfileMutation,
} from '../../../services/profileApi';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ErrorMessage } from '../../../components/ErrorMessage';
import type { ClientProfileFormData } from '../types';

const CITIES = ['Бишкек', 'Ош', 'Джалал-Абад', 'Каракол', 'Токмок', 'Нарын', 'Талас', 'Баткен'];
const COMPANY_TYPES = ['Частное лицо', 'ИП', 'ООО', 'ОсОО', 'Государственная организация'];
const CONTACT_METHODS = [
  { value: 'phone', label: 'Телефон' },
  { value: 'chat', label: 'Чат' },
  { value: 'email', label: 'Email' },
];

export default function EditClientProfileScreen() {
  const router = useRouter();
  const { data: profile, isLoading, error } = useGetMyClientProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateClientProfileMutation();

  const [formData, setFormData] = useState<ClientProfileFormData>({});

  useEffect(() => {
    if (profile) {
      setFormData({
        bio: profile.bio || '',
        city: profile.city || '',
        address: profile.address || '',
        company_name: profile.company_name || '',
        company_type: profile.company_type || '',
        preferred_contact_method: profile.preferred_contact_method || 'phone',
      });
    }
  }, [profile]);

  const updateField = <K extends keyof ClientProfileFormData>(
    field: K,
    value: ClientProfileFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
            placeholder="Расскажите о себе..."
            value={formData.bio}
            onChangeText={(text) => updateField('bio', text)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
        </View>

        {/* Company Info */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">Компания</Text>
          
          <Text className="text-sm text-gray-700 mb-2">Название компании</Text>
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 mb-3"
            placeholder="Название компании (необязательно)"
            value={formData.company_name}
            onChangeText={(text) => updateField('company_name', text)}
          />

          <Text className="text-sm text-gray-700 mb-2">Тип</Text>
          <View className="border border-gray-300 rounded-xl overflow-hidden">
            <Picker
              selectedValue={formData.company_type}
              onValueChange={(value) => updateField('company_type', value)}
            >
              <Picker.Item label="Выберите тип" value="" />
              {COMPANY_TYPES.map((type) => (
                <Picker.Item key={type} label={type} value={type} />
              ))}
            </Picker>
          </View>
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
            className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900"
            placeholder="Улица, дом"
            value={formData.address}
            onChangeText={(text) => updateField('address', text)}
          />
        </View>

        {/* Contact Preferences */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Предпочтительный способ связи
          </Text>
          
          <View className="space-y-2">
            {CONTACT_METHODS.map((method) => (
              <TouchableOpacity
                key={method.value}
                className={`p-4 rounded-xl border ${
                  formData.preferred_contact_method === method.value
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-white border-gray-200'
                }`}
                onPress={() => updateField('preferred_contact_method', method.value as any)}
              >
                <View className="flex-row items-center">
                  <Ionicons
                    name={
                      method.value === 'phone'
                        ? 'call'
                        : method.value === 'chat'
                        ? 'chatbubble'
                        : 'mail'
                    }
                    size={20}
                    color={formData.preferred_contact_method === method.value ? '#3B82F6' : '#6B7280'}
                  />
                  <Text
                    className={`ml-3 ${
                      formData.preferred_contact_method === method.value
                        ? 'text-blue-700 font-medium'
                        : 'text-gray-700'
                    }`}
                  >
                    {method.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
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
