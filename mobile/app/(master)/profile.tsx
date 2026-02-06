import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal, Image } from 'react-native'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { logout } from '../../features/auth/authSlice'
import {
  useGetMyMasterProfileQuery,
  useUpdateMasterProfileMutation
} from '../../services/profileApi'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { ErrorMessage } from '../../components/ErrorMessage'

export default function MasterProfilePage() {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)

  const [isEditing, setIsEditing] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  // API queries
  const {
    data: profile,
    isLoading,
    error,
    refetch
  } = useGetMyMasterProfileQuery();

  // Mutations
  const [updateProfile] = useUpdateMasterProfileMutation();

  const [formData, setFormData] = useState({
    bio: '',
    city: '',
    hourly_rate: '',
    categories: [] as number[],
    skills: [] as number[],
  });

  // Update form data when profile loads
  React.useEffect(() => {
    if (profile) {
      setFormData({
        bio: profile.bio || '',
        city: profile.city || '',
        hourly_rate: profile.hourly_rate || '',
        categories: profile.categories || [],
        skills: profile.skills || [],
      });
    }
  }, [profile]);

  const availableSpecializations = [
    'Сантехника', 'Электрика', 'Ремонт', 'Отделка', 'Мебель',
    'Клининг', 'Швейное дело', 'Столярные работы', 'Дизайн интерьера'
  ]

  const handleEdit = () => {
    if (profile) {
      setFormData({
        bio: profile.bio || '',
        city: profile.city || '',
        hourly_rate: profile.hourly_rate || '',
        categories: profile.categories || [],
        skills: profile.skills || [],
      });
    }
    setIsEditing(true)
  }

  const handleSave = async () => {
    try {
      await updateProfile({
        bio: formData.bio,
        city: formData.city,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : undefined,
        categories: formData.categories,
        skills: formData.skills,
      }).unwrap();
      setIsEditing(false)
      Alert.alert('Успешно', 'Профиль обновлен')
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Ошибка', 'Не удалось обновить профиль')
    }
  }

  const handleLogout = () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = async () => {
    try {
      // Dispatch logout action
      dispatch(logout())
      setShowLogoutConfirm(false)

      // Force navigation to auth screen
      router.replace('/(auth)/login')
    } catch (error) {
      console.error('Logout error:', error)
      // Even if there's an error, force logout
      setShowLogoutConfirm(false)
      router.replace('/(auth)/login')
    }
  }

  const handleAvatarPress = () => {
    Alert.alert(
      'Изменить фото',
      'Выберите действие',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Выбрать из галереи', onPress: () => { } },
        { text: 'Сделать фото', onPress: () => { } },
        ...(profile?.user?.avatar ? [{ text: 'Удалить фото', style: 'destructive' as const, onPress: () => { } }] : []),
      ]
    )
  }

  const toggleSpecialization = (spec: string) => {
    // This would need to be updated to work with category/skill IDs
    // For now, keeping the mock functionality
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Загрузка профиля..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        fullScreen
        message="Не удалось загрузить профиль"
        onRetry={refetch}
      />
    );
  }

  if (!profile) {
    return (
      <ErrorMessage
        fullScreen
        message="Профиль не найден"
        onRetry={refetch}
      />
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-blue-500 px-4 pt-12 pb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-2xl font-bold">Профиль</Text>
            <TouchableOpacity
              onPress={isEditing ? handleSave : handleEdit}
              className="px-4 py-2 bg-white/20 rounded-2xl"
            >
              <Text className="text-white font-semibold">
                {isEditing ? 'Сохранить' : 'Редактировать'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Avatar and Basic Info */}
          <View className="flex-row items-center gap-4">
            <TouchableOpacity onPress={handleAvatarPress} className="relative">
              <View className="w-20 h-20 bg-white/20 rounded-full items-center justify-center">
                {profile.user?.avatar ? (
                  <Image source={{ uri: profile.user.avatar }} className="w-20 h-20 rounded-full" />
                ) : (
                  <Text className="text-white text-2xl font-bold">
                    {(profile.user?.first_name?.charAt(0) || 'М')}
                  </Text>
                )}
              </View>
              <View className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full items-center justify-center">
                <Ionicons name="camera" size={14} color="#3B82F6" />
              </View>
            </TouchableOpacity>

            <View className="flex-1">
              {isEditing ? (
                <View className="flex flex-col gap-2">
                  <TextInput
                    value={profile.user?.first_name || ''}
                    placeholder="Имя"
                    className="bg-white/20 text-white px-3 py-2 rounded-xl"
                    placeholderTextColor="rgba(255,255,255,0.7)"
                    editable={false}
                  />
                  <TextInput
                    value={profile.user?.last_name || ''}
                    placeholder="Фамилия"
                    className="bg-white/20 text-white px-3 py-2 rounded-xl"
                    placeholderTextColor="rgba(255,255,255,0.7)"
                    editable={false}
                  />
                </View>
              ) : (
                <>
                  <Text className="text-white text-xl font-bold">
                    {profile.user?.first_name} {profile.user?.last_name}
                  </Text>
                  <Text className="text-white/80 text-sm">{profile.user?.phone}</Text>
                  <View className="flex-row items-center gap-2 mt-1">
                    <View className="px-2 py-1 bg-white/20 rounded-full">
                      <Text className="text-white text-xs font-medium">Мастер</Text>
                    </View>
                    {profile.is_verified && (
                      <View className="px-2 py-1 bg-green-500/20 rounded-full flex-row items-center gap-1">
                        <Ionicons name="checkmark-circle" size={12} color="white" />
                        <Text className="text-white text-xs font-medium">Подтверждён</Text>
                      </View>
                    )}
                  </View>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Stats */}
        <View className="px-4 -mt-4 mb-6">
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <View className="flex-row justify-between">
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-gray-900">{profile.rating}</Text>
                <Text className="text-sm text-gray-500">Рейтинг</Text>
              </View>
              <View className="w-px bg-gray-200" />
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-gray-900">{profile.completed_orders}</Text>
                <Text className="text-sm text-gray-500">Проектов</Text>
              </View>
              <View className="w-px bg-gray-200" />
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-gray-900">{profile.reviews_count}</Text>
                <Text className="text-sm text-gray-500">Отзывов</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Profile Details */}
        <View className="px-4 flex flex-col gap-6">
          {/* Profile Details */}
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <Text className="text-lg font-bold text-gray-900 mb-4">Информация о профиле</Text>

            <View className="flex flex-col gap-4">
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Город</Text>
                {isEditing ? (
                  <TextInput
                    value={formData.city}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
                    placeholder="Введите город"
                    className="bg-gray-100 px-3 py-3 rounded-xl text-gray-900"
                  />
                ) : (
                  <Text className="text-gray-900">{profile.city}</Text>
                )}
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Описание</Text>
                {isEditing ? (
                  <TextInput
                    value={formData.bio}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
                    placeholder="Расскажите о себе и своих услугах"
                    className="bg-gray-100 px-3 py-3 rounded-xl text-gray-900"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                ) : (
                  <Text className="text-gray-900">{profile.bio || 'Не указано'}</Text>
                )}
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Стоимость за час</Text>
                {isEditing ? (
                  <TextInput
                    value={formData.hourly_rate}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, hourly_rate: text }))}
                    placeholder="Введите стоимость"
                    className="bg-gray-100 px-3 py-3 rounded-xl text-gray-900"
                    keyboardType="numeric"
                  />
                ) : (
                  <Text className="text-gray-900">
                    {profile.hourly_rate ? `${profile.hourly_rate} сом/час` : 'Не указано'}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Specializations */}
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <Text className="text-lg font-bold text-gray-900 mb-4">Специализации</Text>

            <View className="flex-row flex-wrap gap-2">
              {profile.categories_list?.map(category => (
                <View key={category.id} className="px-3 py-2 bg-blue-100 rounded-full">
                  <Text className="text-blue-700 text-sm font-medium">{category.name}</Text>
                </View>
              ))}
              {(!profile.categories_list || profile.categories_list.length === 0) && (
                <Text className="text-gray-500">Специализации не указаны</Text>
              )}
            </View>
          </View>

          {/* Quick Stats */}
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <Text className="text-lg font-bold text-gray-900 mb-4">Дополнительная информация</Text>

            <View className="flex flex-col gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-600">Опыт работы</Text>
                <Text className="text-gray-900 font-medium">
                  {profile.experience_years ? `${profile.experience_years} лет` : 'Не указано'}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-600">Время ответа</Text>
                <Text className="text-gray-900 font-medium">
                  {profile.avg_response_time || 'Не указано'}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-600">Успешность</Text>
                <Text className="text-gray-900 font-medium">{profile.success_rate}%</Text>
              </View>
            </View>
          </View>

          {/* Menu Items */}
          <View className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <TouchableOpacity
              onPress={() => router.push('/(master)/portfolio')}
              className="flex-row items-center p-4 border-b border-gray-100"
            >
              <View className="w-10 h-10 bg-purple-100 rounded-2xl items-center justify-center mr-4">
                <Ionicons name="images" size={20} color="#8B5CF6" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900">Портфолио</Text>
                <Text className="text-sm text-gray-500">Мои работы и проекты</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(master)/reviews')}
              className="flex-row items-center p-4 border-b border-gray-100"
            >
              <View className="w-10 h-10 bg-yellow-100 rounded-2xl items-center justify-center mr-4">
                <Ionicons name="star" size={20} color="#F59E0B" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900">Отзывы</Text>
                <Text className="text-sm text-gray-500">{profile?.reviews_count || 0} отзывов</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(master)/wallet')}
              className="flex-row items-center p-4 border-b border-gray-100"
            >
              <View className="w-10 h-10 bg-green-100 rounded-2xl items-center justify-center mr-4">
                <Ionicons name="wallet" size={20} color="#10B981" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900">Кошелёк</Text>
                <Text className="text-sm text-gray-500">Баланс и выплаты</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(master)/settings')}
              className="flex-row items-center p-4"
            >
              <View className="w-10 h-10 bg-gray-100 rounded-2xl items-center justify-center mr-4">
                <Ionicons name="settings" size={20} color="#6B7280" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900">Настройки</Text>
                <Text className="text-sm text-gray-500">Конфиденциальность и безопасность</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Logout */}
          <View className="px-4 mb-6">
            <TouchableOpacity
              onPress={handleLogout}
              className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex-row items-center justify-center gap-3"
            >
              <Ionicons name="log-out" size={20} color="#EF4444" />
              <Text className="text-red-500 font-semibold text-lg">Выйти из аккаунта</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-4">
          <View className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <Text className="text-xl font-bold text-gray-900 mb-2">Выход из аккаунта</Text>
            <Text className="text-gray-600 mb-6">Вы уверены, что хотите выйти из аккаунта?</Text>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowLogoutConfirm(false)}
                className="flex-1 bg-gray-100 py-3 rounded-2xl"
              >
                <Text className="text-gray-700 font-semibold text-center">Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmLogout}
                className="flex-1 bg-red-500 py-3 rounded-2xl"
              >
                <Text className="text-white font-semibold text-center">Выйти</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

