import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../../hooks/redux';

export default function EditClientProfilePage() {
  const { user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.firstName || '',
    last_name: user?.lastName || '',
    phone: user?.phone || '',
    city: '',
    address: '',
    about: '',
  });

  const handleSave = async () => {
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      Alert.alert('Ошибка', 'Заполните имя и фамилию');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      Alert.alert('Успех', 'Профиль обновлён!');
      router.back();
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось обновить профиль');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarPress = () => {
    Alert.alert(
      'Изменить фото',
      'Выберите действие',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Выбрать из галереи', onPress: () => {/* TODO: Open image picker */} },
        { text: 'Сделать фото', onPress: () => {/* TODO: Open camera */} },
        { text: 'Удалить фото', style: 'destructive', onPress: () => {/* TODO: Delete avatar */} },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 bg-white rounded-2xl items-center justify-center shadow-sm border border-gray-100"
          >
            <Ionicons name="arrow-back" size={20} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Редактировать профиль</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            className={`px-4 py-2 rounded-2xl ${loading ? 'bg-gray-400' : 'bg-[#0165FB]'}`}
          >
            <Text className="text-white font-semibold">
              {loading ? 'Сохранение...' : 'Сохранить'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Avatar Section */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
          <Text className="font-semibold text-gray-900 mb-4">Фото профиля</Text>
          <View className="items-center">
            <TouchableOpacity onPress={handleAvatarPress} className="relative">
              <View className="w-24 h-24 bg-[#0165FB] rounded-full items-center justify-center overflow-hidden">
                <Text className="text-white text-2xl font-bold">
                  {(formData.first_name.charAt(0) || 'К').toUpperCase()}
                </Text>
              </View>
              <View className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full items-center justify-center shadow-lg border border-gray-100">
                <Ionicons name="camera" size={16} color="#0165FB" />
              </View>
            </TouchableOpacity>
            <Text className="text-sm text-gray-500 mt-2">Нажмите, чтобы изменить</Text>
          </View>
        </View>

        {/* Personal Info */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
          <Text className="font-semibold text-gray-900 mb-4">Личная информация</Text>
          
          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Имя *</Text>
              <TextInput
                value={formData.first_name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, first_name: text }))}
                placeholder="Введите имя"
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900"
              />
            </View>
            
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Фамилия *</Text>
              <TextInput
                value={formData.last_name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, last_name: text }))}
                placeholder="Введите фамилию"
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900"
              />
            </View>
            
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Телефон</Text>
              <TextInput
                value={formData.phone}
                editable={false}
                className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-gray-500"
              />
              <Text className="text-xs text-gray-500 mt-1">
                Для изменения номера обратитесь в поддержку
              </Text>
            </View>
          </View>
        </View>

        {/* Location Info */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
          <Text className="font-semibold text-gray-900 mb-4">Местоположение</Text>
          
          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Город</Text>
              <TextInput
                value={formData.city}
                onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
                placeholder="Выберите город"
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900"
              />
            </View>
            
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Адрес</Text>
              <TextInput
                value={formData.address}
                onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
                placeholder="Введите адрес (необязательно)"
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900"
              />
            </View>
          </View>
        </View>

        {/* About */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
          <Text className="font-semibold text-gray-900 mb-4">О себе</Text>
          <TextInput
            value={formData.about}
            onChangeText={(text) => setFormData(prev => ({ ...prev, about: text }))}
            placeholder="Расскажите немного о себе (необязательно)"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900 min-h-[100px]"
          />
        </View>

        {/* Delete Account */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
          <Text className="font-semibold text-gray-900 mb-3">Опасная зона</Text>
          <TouchableOpacity 
            onPress={() => {
              Alert.alert(
                'Удалить аккаунт',
                'Это действие нельзя отменить. Все ваши данные будут удалены.',
                [
                  { text: 'Отмена', style: 'cancel' },
                  { text: 'Удалить', style: 'destructive', onPress: () => {} }
                ]
              );
            }}
            className="flex-row items-center gap-3 p-3 bg-red-50 rounded-2xl"
          >
            <Ionicons name="trash" size={20} color="#DC2626" />
            <Text className="text-red-600 font-medium">Удалить аккаунт</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}