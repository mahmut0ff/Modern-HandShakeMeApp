import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { ru } from 'date-fns/locale';

import {
  useListBookingsQuery,
  useManageBookingMutation,
  InstantBooking,
  BookingListParams,
} from '../../services/instantBookingApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { EmptyState } from '../../components/EmptyState';
import { useAuth } from '../../hooks/useAuth';

const BOOKING_STATUS_COLORS = {
  PENDING: '#F59E0B',
  CONFIRMED: '#10B981',
  IN_PROGRESS: '#3B82F6',
  COMPLETED: '#6B7280',
  CANCELLED: '#EF4444',
  EXPIRED: '#9CA3AF',
};

const BOOKING_STATUS_LABELS = {
  PENDING: 'Ожидает подтверждения',
  CONFIRMED: 'Подтверждено',
  IN_PROGRESS: 'В процессе',
  COMPLETED: 'Завершено',
  CANCELLED: 'Отменено',
  EXPIRED: 'Истекло',
};

export const BookingListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [filters, setFilters] = useState<BookingListParams>({
    page: 1,
    limit: 20,
    sortBy: 'scheduledDateTime',
    sortOrder: 'desc',
  });

  const [refreshing, setRefreshing] = useState(false);

  const {
    data: bookingsData,
    isLoading,
    error,
    refetch,
  } = useListBookingsQuery(filters);

  const [manageBooking, { isLoading: managingBooking }] = useManageBookingMutation();

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleFilterChange = (newFilters: Partial<BookingListParams>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleLoadMore = () => {
    if (bookingsData?.pagination.hasNextPage && !isLoading) {
      setFilters(prev => ({ ...prev, page: prev.page! + 1 }));
    }
  };

  const handleBookingAction = async (booking: InstantBooking, action: string) => {
    try {
      let confirmMessage = '';
      let reason = '';

      switch (action) {
        case 'confirm':
          confirmMessage = 'Подтвердить это бронирование?';
          break;
        case 'cancel':
          confirmMessage = 'Отменить это бронирование?';
          // You might want to show a reason input dialog here
          break;
        case 'start':
          confirmMessage = 'Начать выполнение услуги?';
          break;
        case 'complete':
          confirmMessage = 'Завершить выполнение услуги?';
          break;
        default:
          return;
      }

      Alert.alert(
        'Подтверждение',
        confirmMessage,
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Да',
            onPress: async () => {
              try {
                const result = await manageBooking({
                  bookingId: booking.id,
                  action: action as any,
                  reason,
                }).unwrap();

                Alert.alert('Успешно', result.message);
              } catch (error: any) {
                Alert.alert('Ошибка', error.data?.message || 'Не удалось выполнить действие');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error handling booking action:', error);
    }
  };

  const formatBookingDate = (dateString: string) => {
    const date = parseISO(dateString);

    if (isToday(date)) {
      return `Сегодня, ${format(date, 'HH:mm')}`;
    } else if (isTomorrow(date)) {
      return `Завтра, ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'd MMM, HH:mm', { locale: ru });
    }
  };

  const renderBookingCard = ({ item: booking }: { item: InstantBooking }) => {
    const statusColor = BOOKING_STATUS_COLORS[booking.status];
    const statusLabel = BOOKING_STATUS_LABELS[booking.status];
    const isClient = user?.role === 'CLIENT';
    const otherParty = isClient ? booking.master : booking.client;

    return (
      <TouchableOpacity
        className="bg-white mx-4 mb-3 rounded-lg shadow-sm"
        onPress={() => navigation.navigate('BookingDetails', { bookingId: booking.id })}
      >
        <View className="p-4">
          {/* Header */}
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1">
              <Text className="text-lg font-semibold text-gray-900" numberOfLines={1}>
                {booking.service.name}
              </Text>
              <Text className="text-sm text-gray-600 mt-1">
                {isClient ? 'Мастер' : 'Клиент'}: {otherParty.name}
              </Text>
            </View>
            <View className="items-end">
              <View
                className="px-2 py-1 rounded-full"
                style={{ backgroundColor: `${statusColor}20` }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: statusColor }}
                >
                  {statusLabel}
                </Text>
              </View>
              <Text className="text-lg font-bold text-gray-900 mt-1">
                ${booking.totalAmount.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Date and Duration */}
          <View className="flex-row items-center mb-2">
            <Ionicons name="time-outline" size={16} color="#6B7280" />
            <Text className="text-sm text-gray-600 ml-2">
              {formatBookingDate(booking.scheduledDateTime)} • {booking.duration} мин
            </Text>
          </View>

          {/* Address */}
          <View className="flex-row items-center mb-3">
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <Text className="text-sm text-gray-600 ml-2 flex-1" numberOfLines={1}>
              {booking.address}
            </Text>
          </View>

          {/* Urgent Badge */}
          {booking.urgentBooking && (
            <View className="flex-row items-center mb-3">
              <Ionicons name="flash" size={16} color="#F59E0B" />
              <Text className="text-sm text-amber-600 ml-1">Срочное бронирование</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View className="flex-row justify-end space-x-2">
            {booking.canStart && (
              <TouchableOpacity
                className="bg-green-500 px-4 py-2 rounded-lg"
                onPress={() => handleBookingAction(booking, 'start')}
                disabled={managingBooking}
              >
                <Text className="text-white text-sm font-medium">Начать</Text>
              </TouchableOpacity>
            )}

            {booking.canComplete && (
              <TouchableOpacity
                className="bg-blue-500 px-4 py-2 rounded-lg"
                onPress={() => handleBookingAction(booking, 'complete')}
                disabled={managingBooking}
              >
                <Text className="text-white text-sm font-medium">Завершить</Text>
              </TouchableOpacity>
            )}

            {booking.status === 'PENDING' && !isClient && (
              <TouchableOpacity
                className="bg-green-500 px-4 py-2 rounded-lg"
                onPress={() => handleBookingAction(booking, 'confirm')}
                disabled={managingBooking}
              >
                <Text className="text-white text-sm font-medium">Подтвердить</Text>
              </TouchableOpacity>
            )}

            {booking.canCancel && (
              <TouchableOpacity
                className="bg-red-500 px-4 py-2 rounded-lg"
                onPress={() => handleBookingAction(booking, 'cancel')}
                disabled={managingBooking}
              >
                <Text className="text-white text-sm font-medium">Отменить</Text>
              </TouchableOpacity>
            )}

            {booking.canReschedule && (
              <TouchableOpacity
                className="bg-orange-500 px-4 py-2 rounded-lg"
                onPress={() => navigation.navigate('RescheduleBooking', { bookingId: booking.id })}
              >
                <Text className="text-white text-sm font-medium">Перенести</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterBar = () => (
    <View className="bg-white px-4 py-3 border-b border-gray-200">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row space-x-2">
          {/* Status Filter */}
          <TouchableOpacity
            className={`px-3 py-2 rounded-full border ${!filters.status ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
              }`}
            onPress={() => handleFilterChange({ status: undefined })}
          >
            <Text className={`text-sm ${!filters.status ? 'text-white' : 'text-gray-700'}`}>
              Все
            </Text>
          </TouchableOpacity>

          {Object.entries(BOOKING_STATUS_LABELS).map(([status, label]) => (
            <TouchableOpacity
              key={status}
              className={`px-3 py-2 rounded-full border ${filters.status === status ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
                }`}
              onPress={() => handleFilterChange({ status: status as any })}
            >
              <Text className={`text-sm ${filters.status === status ? 'text-white' : 'text-gray-700'
                }`}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderHeader = () => (
    <View className="bg-white px-4 py-4 border-b border-gray-200">
      <View className="flex-row justify-between items-center">
        <Text className="text-2xl font-bold text-gray-900">Мои бронирования</Text>
        <TouchableOpacity
          className="p-2"
          onPress={() => navigation.navigate('BookingStats')}
        >
          <Ionicons name="stats-chart-outline" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {bookingsData && (
        <Text className="text-sm text-gray-600 mt-1">
          Всего: {bookingsData.pagination.totalCount} бронирований
        </Text>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!bookingsData?.pagination.hasNextPage) return null;

    return (
      <View className="py-4">
        <TouchableOpacity
          className="bg-blue-500 mx-4 py-3 rounded-lg"
          onPress={handleLoadMore}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-medium">Загрузить еще</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading && !bookingsData) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center">
        <ErrorMessage
          message="Не удалось загрузить бронирования"
          onRetry={refetch}
        />
      </View>
    );
  }

  if (!bookingsData?.bookings.length) {
    return (
      <View className="flex-1 bg-gray-50">
        {renderHeader()}
        {renderFilterBar()}
        <EmptyState
          icon="calendar-outline"
          title="Нет бронирований"
          description="У вас пока нет мгновенных бронирований"
          actionText="Найти услуги"
          onAction={() => navigation.navigate('Services')}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {renderHeader()}
      {renderFilterBar()}

      <FlatList
        data={bookingsData.bookings}
        renderItem={renderBookingCard}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-blue-500 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        onPress={() => navigation.navigate('Services')}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
};