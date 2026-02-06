/**
 * Client Profile Screen
 * Профиль клиента
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  useGetClientProfileQuery,
  useGetMyClientProfileQuery,
} from '../../../services/profileApi';
import { ProfileHeader } from '../components/ProfileHeader';
import { ClientProfileStats } from '../components/ProfileStats';
import { ProfileActions } from '../components/ProfileActions';
import { ProfileContactInfo } from '../components/ProfileContactInfo';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ErrorMessage } from '../../../components/ErrorMessage';
import { useProfileActions } from '../hooks/useProfileActions';

export default function ClientProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const clientId = params.id ? parseInt(params.id) : undefined;

  // Если id не указан, показываем свой профиль
  const isOwnProfile = !clientId;

  const {
    data: profile,
    isLoading,
    isFetching,
    error,
    refetch,
  } = isOwnProfile
    ? useGetMyClientProfileQuery()
    : useGetClientProfileQuery(clientId!);

  const { shareProfile } = useProfileActions({
    profileType: 'client',
    profileId: profile?.id || 0,
    profileName: profile?.user?.full_name || '',
  });

  const handleEdit = () => {
    router.push('/profile/edit');
  };

  const handleViewOrders = () => {
    router.push(isOwnProfile ? '/orders/my' : `/clients/${clientId}/orders`);
  };

  const handleViewReviews = () => {
    router.push(isOwnProfile ? '/reviews' : `/clients/${clientId}/reviews`);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <LoadingSpinner fullScreen text="Загрузка профиля..." />
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <ErrorMessage
          message="Не удалось загрузить профиль"
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">
            {isOwnProfile ? 'Мой профиль' : 'Профиль клиента'}
          </Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            tintColor="#3B82F6"
          />
        }
      >
        {/* Profile Header */}
        <ProfileHeader
          name={profile.user?.full_name || ''}
          avatar={profile.user?.avatar}
          rating={profile.rating}
          reviewsCount={profile.reviews_count}
          subtitle={profile.company_name}
          editable={isOwnProfile}
        />

        {/* Stats */}
        <ClientProfileStats
          totalOrders={profile.total_orders}
          completedOrders={profile.completed_orders}
          avgBudget={profile.avg_budget}
        />

        {/* Bio */}
        {profile.bio && (
          <View className="bg-white p-4 border-t border-gray-200">
            <Text className="text-base font-semibold text-gray-900 mb-2">
              О себе
            </Text>
            <Text className="text-gray-700 leading-6">{profile.bio}</Text>
          </View>
        )}

        {/* Company Info */}
        {(profile.company_name || profile.company_type) && (
          <View className="bg-white p-4 border-t border-gray-200">
            <Text className="text-base font-semibold text-gray-900 mb-3">
              Компания
            </Text>
            
            <View className="space-y-3">
              {profile.company_name && (
                <View className="flex-row items-center">
                  <Ionicons name="business" size={20} color="#3B82F6" />
                  <Text className="text-gray-700 ml-2">{profile.company_name}</Text>
                </View>
              )}

              {profile.company_type && (
                <View className="flex-row items-center">
                  <Ionicons name="briefcase" size={20} color="#8B5CF6" />
                  <Text className="text-gray-700 ml-2">{profile.company_type}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Contact Info */}
        <ProfileContactInfo
          phone={profile.user?.phone}
          city={profile.city}
          address={profile.address}
          showPhone={!isOwnProfile}
        />

        {/* Preferred Contact Method */}
        {profile.preferred_contact_method && (
          <View className="bg-white p-4 border-t border-gray-200">
            <Text className="text-base font-semibold text-gray-900 mb-2">
              Предпочтительный способ связи
            </Text>
            <View className="flex-row items-center">
              <Ionicons
                name={
                  profile.preferred_contact_method === 'phone'
                    ? 'call'
                    : profile.preferred_contact_method === 'chat'
                    ? 'chatbubble'
                    : 'mail'
                }
                size={20}
                color="#3B82F6"
              />
              <Text className="text-gray-700 ml-2">
                {profile.preferred_contact_method === 'phone' && 'Телефон'}
                {profile.preferred_contact_method === 'chat' && 'Чат'}
                {profile.preferred_contact_method === 'email' && 'Email'}
              </Text>
            </View>
          </View>
        )}

        {/* Quick Links */}
        <View className="bg-white p-4 border-t border-gray-200">
          <TouchableOpacity
            className="flex-row items-center justify-between py-3"
            onPress={handleViewOrders}
          >
            <View className="flex-row items-center">
              <Ionicons name="document-text" size={20} color="#3B82F6" />
              <Text className="text-gray-900 ml-3">Заказы</Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-gray-500 mr-2">
                {profile.total_orders}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-between py-3 border-t border-gray-100"
            onPress={handleViewReviews}
          >
            <View className="flex-row items-center">
              <Ionicons name="star" size={20} color="#F59E0B" />
              <Text className="text-gray-900 ml-3">Отзывы</Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-gray-500 mr-2">
                {profile.reviews_count}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Member Since */}
        <View className="bg-white p-4 border-t border-gray-200">
          <View className="flex-row items-center">
            <Ionicons name="calendar" size={20} color="#6B7280" />
            <Text className="text-gray-500 ml-2">
              На платформе с {new Date(profile.created_at).toLocaleDateString('ru-RU', {
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Actions */}
      <ProfileActions
        userId={profile.user?.id || 0}
        phone={profile.user?.phone}
        isOwnProfile={isOwnProfile}
        onEdit={handleEdit}
        onShare={shareProfile}
      />
    </SafeAreaView>
  );
}
