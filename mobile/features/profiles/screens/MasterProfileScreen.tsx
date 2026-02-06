/**
 * Master Profile Screen
 * Профиль мастера
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
  useGetMasterProfileQuery,
  useGetMyMasterProfileQuery,
  useGetMasterPortfolioQuery,
} from '../../../services/profileApi';
import { useGetMasterServicesQuery } from '../../../services/servicesApi';
import { ProfileHeader } from '../components/ProfileHeader';
import { MasterProfileStats } from '../components/ProfileStats';
import { ProfileActions } from '../components/ProfileActions';
import { ProfileSkillsList } from '../components/ProfileSkillsList';
import { ProfileContactInfo } from '../components/ProfileContactInfo';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ErrorMessage } from '../../../components/ErrorMessage';
import { useProfileActions } from '../hooks/useProfileActions';

export default function MasterProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const masterId = params.id ? parseInt(params.id) : undefined;

  // Если id не указан, показываем свой профиль
  const isOwnProfile = !masterId;

  const {
    data: profile,
    isLoading,
    isFetching,
    error,
    refetch,
  } = isOwnProfile
    ? useGetMyMasterProfileQuery()
    : useGetMasterProfileQuery(masterId!);

  const { data: portfolio } = useGetMasterPortfolioQuery(
    isOwnProfile ? undefined : masterId!,
    { skip: isOwnProfile }
  );

  const { data: services } = useGetMasterServicesQuery(
    isOwnProfile ? undefined : masterId!,
    { skip: isOwnProfile }
  );

  const { shareProfile } = useProfileActions({
    profileType: 'master',
    profileId: profile?.id || 0,
    profileName: profile?.user?.full_name || '',
  });

  const handleEdit = () => {
    router.push('/profile/edit');
  };

  const handleViewPortfolio = () => {
    router.push(isOwnProfile ? '/portfolio' : `/masters/${masterId}/portfolio`);
  };

  const handleViewServices = () => {
    router.push(isOwnProfile ? '/services' : `/masters/${masterId}/services`);
  };

  const handleViewReviews = () => {
    router.push(isOwnProfile ? '/reviews' : `/masters/${masterId}/reviews`);
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
            {isOwnProfile ? 'Мой профиль' : 'Профиль мастера'}
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
          isVerified={profile.is_verified}
          isPremium={profile.is_premium}
          isAvailable={profile.is_available}
          subtitle={profile.company_name}
          editable={isOwnProfile}
        />

        {/* Stats */}
        <MasterProfileStats
          completedOrders={profile.completed_orders}
          successRate={profile.success_rate}
          repeatClients={profile.repeat_clients}
          responseTime={profile.avg_response_time}
        />

        {/* Skills */}
        <ProfileSkillsList
          categories={profile.categories_list}
          skills={profile.skills_list}
          editable={isOwnProfile}
          onEditPress={() => router.push('/profile/skills')}
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

        {/* Experience & Rates */}
        <View className="bg-white p-4 border-t border-gray-200">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Опыт и расценки
          </Text>
          
          <View className="space-y-3">
            {profile.experience_years && (
              <View className="flex-row items-center">
                <Ionicons name="briefcase" size={20} color="#3B82F6" />
                <Text className="text-gray-700 ml-2">
                  Опыт: {profile.experience_years} лет
                </Text>
              </View>
            )}

            {profile.hourly_rate && (
              <View className="flex-row items-center">
                <Ionicons name="wallet" size={20} color="#10B981" />
                <Text className="text-gray-700 ml-2">
                  Ставка: {profile.hourly_rate} сом/час
                </Text>
              </View>
            )}

            {(profile.min_order_amount || profile.max_order_amount) && (
              <View className="flex-row items-center">
                <Ionicons name="cash" size={20} color="#F59E0B" />
                <Text className="text-gray-700 ml-2">
                  Заказы: {profile.min_order_amount || '0'} - {profile.max_order_amount || '∞'} сом
                </Text>
              </View>
            )}

            <View className="flex-row items-center">
              <Ionicons
                name={profile.has_transport ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={profile.has_transport ? '#10B981' : '#EF4444'}
              />
              <Text className="text-gray-700 ml-2">
                {profile.has_transport ? 'Есть транспорт' : 'Нет транспорта'}
              </Text>
            </View>

            <View className="flex-row items-center">
              <Ionicons
                name={profile.has_tools ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={profile.has_tools ? '#10B981' : '#EF4444'}
              />
              <Text className="text-gray-700 ml-2">
                {profile.has_tools ? 'Есть инструменты' : 'Нет инструментов'}
              </Text>
            </View>
          </View>
        </View>

        {/* Contact Info */}
        <ProfileContactInfo
          phone={profile.user?.phone}
          city={profile.city}
          address={profile.address}
          workRadius={profile.work_radius}
          workSchedule={profile.work_schedule}
          languages={profile.languages}
          showPhone={!isOwnProfile}
        />

        {/* Quick Links */}
        <View className="bg-white p-4 border-t border-gray-200">
          <TouchableOpacity
            className="flex-row items-center justify-between py-3"
            onPress={handleViewServices}
          >
            <View className="flex-row items-center">
              <Ionicons name="construct" size={20} color="#3B82F6" />
              <Text className="text-gray-900 ml-3">Услуги</Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-gray-500 mr-2">
                {services?.length || 0}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-between py-3 border-t border-gray-100"
            onPress={handleViewPortfolio}
          >
            <View className="flex-row items-center">
              <Ionicons name="images" size={20} color="#8B5CF6" />
              <Text className="text-gray-900 ml-3">Портфолио</Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-gray-500 mr-2">
                {portfolio?.length || profile.portfolio_items?.length || 0}
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
