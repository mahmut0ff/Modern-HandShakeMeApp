import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Switch,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { format, addDays, isSameDay, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

import {
  useGetAvailableSlotsQuery,
  useCreateInstantBookingMutation,
  TimeSlot,
} from '../../services/instantBookingApi';
import { useGetPaymentMethodsQuery } from '../../services/walletApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PaymentMethodSelector } from '../wallet/PaymentMethodSelector';
import { LocationPicker } from '../../components/LocationPicker';

interface RouteParams {
  masterId: string;
  serviceId: string;
  masterName: string;
  serviceName: string;
  basePrice: number;
}

export const InstantBookingScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { masterId, serviceId, masterName, serviceName, basePrice } = route.params as RouteParams;

  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [duration, setDuration] = useState(60);
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [autoConfirm, setAutoConfirm] = useState(true);
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // API hooks
  const {
    data: slotsData,
    isLoading: slotsLoading,
    error: slotsError,
    refetch: refetchSlots,
  } = useGetAvailableSlotsQuery({
    masterId,
    serviceId,
    date: selectedDate,
    duration,
  });

  const { data: paymentMethods } = useGetPaymentMethodsQuery();

  const [createBooking, { isLoading: creatingBooking }] = useCreateInstantBookingMutation();

  // Set default payment method
  useEffect(() => {
    if (paymentMethods && paymentMethods.length > 0 && !selectedPaymentMethod) {
      const defaultMethod = paymentMethods.find(pm => pm.is_default);
      if (defaultMethod) {
        setSelectedPaymentMethod(String(defaultMethod.id));
      } else {
        setSelectedPaymentMethod(String(paymentMethods[0].id));
      }
    }
  }, [paymentMethods, selectedPaymentMethod]);

  // Generate calendar marked dates
  const markedDates = React.useMemo(() => {
    const marked: any = {};

    // Mark selected date
    marked[selectedDate] = {
      selected: true,
      selectedColor: '#3B82F6',
    };

    // Mark dates with available slots (you could enhance this)
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = format(addDays(today, i), 'yyyy-MM-dd');
      if (date !== selectedDate) {
        marked[date] = {
          marked: true,
          dotColor: '#10B981',
        };
      }
    }

    return marked;
  }, [selectedDate]);

  const handleDateSelect = (day: any) => {
    setSelectedDate(day.dateString);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };

  const handleLocationSelect = (location: { address: string; coordinates: { latitude: number; longitude: number } }) => {
    setAddress(location.address);
    setCoordinates(location.coordinates);
    setShowLocationPicker(false);
  };

  const calculateTotal = () => {
    if (!selectedSlot) return 0;

    const baseAmount = selectedSlot.price;
    const urgentFee = selectedSlot.urgentFee || 0;
    const platformFee = (baseAmount + urgentFee) * 0.05;

    return baseAmount + urgentFee + platformFee;
  };

  const handleCreateBooking = async () => {
    if (!selectedSlot || !address || !coordinates || !selectedPaymentMethod) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все обязательные поля');
      return;
    }

    try {
      const result = await createBooking({
        serviceId,
        masterId,
        scheduledDate: selectedDate,
        scheduledTime: selectedSlot.startTime,
        duration,
        address,
        coordinates,
        notes,
        paymentMethodId: selectedPaymentMethod,
        totalAmount: calculateTotal(),
        urgentBooking: selectedSlot.isUrgent,
        autoConfirm,
      }).unwrap();

      Alert.alert(
        'Успешно!',
        result.message,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('BookingDetails', { bookingId: result.booking.id }),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Ошибка', error.data?.message || 'Не удалось создать бронирование');
    }
  };

  const renderTimeSlot = (slot: TimeSlot) => (
    <TouchableOpacity
      key={`${slot.startTime}-${slot.endTime}`}
      className={`p-4 m-2 rounded-lg border-2 ${selectedSlot === slot
        ? 'border-blue-500 bg-blue-50'
        : 'border-gray-200 bg-white'
        }`}
      onPress={() => handleSlotSelect(slot)}
    >
      <View className="flex-row justify-between items-center">
        <View>
          <Text className="text-lg font-semibold text-gray-900">
            {slot.startTime} - {slot.endTime}
          </Text>
          {slot.isUrgent && (
            <View className="flex-row items-center mt-1">
              <Ionicons name="flash" size={16} color="#F59E0B" />
              <Text className="text-sm text-amber-600 ml-1">Срочное бронирование</Text>
            </View>
          )}
        </View>
        <View className="items-end">
          <Text className="text-lg font-bold text-gray-900">
            ${slot.price.toFixed(2)}
          </Text>
          {slot.urgentFee && (
            <Text className="text-sm text-amber-600">
              +${slot.urgentFee.toFixed(2)} срочность
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderDurationSelector = () => (
    <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
      <Text className="text-lg font-semibold text-gray-900 mb-3">Продолжительность</Text>
      <View className="flex-row flex-wrap">
        {[30, 60, 90, 120, 180, 240].map((dur) => (
          <TouchableOpacity
            key={dur}
            className={`px-4 py-2 m-1 rounded-full ${duration === dur
              ? 'bg-blue-500'
              : 'bg-gray-100'
              }`}
            onPress={() => {
              setDuration(dur);
              setSelectedSlot(null);
            }}
          >
            <Text className={`${duration === dur ? 'text-white' : 'text-gray-700'
              }`}>
              {dur < 60 ? `${dur} мин` : `${dur / 60} ч`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderBookingSummary = () => {
    if (!selectedSlot) return null;

    const baseAmount = selectedSlot.price;
    const urgentFee = selectedSlot.urgentFee || 0;
    const platformFee = (baseAmount + urgentFee) * 0.05;
    const total = baseAmount + urgentFee + platformFee;

    return (
      <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
        <Text className="text-lg font-semibold text-gray-900 mb-3">Сводка бронирования</Text>

        <View className="space-y-2">
          <View className="flex-row justify-between">
            <Text className="text-gray-600">Услуга:</Text>
            <Text className="font-medium">${baseAmount.toFixed(2)}</Text>
          </View>

          {urgentFee > 0 && (
            <View className="flex-row justify-between">
              <Text className="text-amber-600">Срочность (25%):</Text>
              <Text className="font-medium text-amber-600">+${urgentFee.toFixed(2)}</Text>
            </View>
          )}

          <View className="flex-row justify-between">
            <Text className="text-gray-600">Комиссия платформы (5%):</Text>
            <Text className="font-medium">${platformFee.toFixed(2)}</Text>
          </View>

          <View className="border-t border-gray-200 pt-2">
            <View className="flex-row justify-between">
              <Text className="text-lg font-semibold">Итого:</Text>
              <Text className="text-lg font-bold text-blue-600">${total.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (slotsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={slotsLoading} onRefresh={refetchSlots} />
      }
    >
      {/* Header */}
      <View className="bg-white p-4 shadow-sm">
        <Text className="text-2xl font-bold text-gray-900">{serviceName}</Text>
        <Text className="text-lg text-gray-600">Мастер: {masterName}</Text>
      </View>

      {/* Calendar */}
      <View className="bg-white m-4 rounded-lg shadow-sm">
        <Calendar
          current={selectedDate}
          minDate={format(new Date(), 'yyyy-MM-dd')}
          maxDate={format(addDays(new Date(), 30), 'yyyy-MM-dd')}
          onDayPress={handleDateSelect}
          markedDates={markedDates}
          theme={{
            selectedDayBackgroundColor: '#3B82F6',
            todayTextColor: '#3B82F6',
            arrowColor: '#3B82F6',
          }}
        />
      </View>

      {/* Duration Selector */}
      <View className="mx-4">
        {renderDurationSelector()}
      </View>

      {/* Available Slots */}
      <View className="mx-4 mb-4">
        <View className="bg-white rounded-lg shadow-sm">
          <View className="p-4 border-b border-gray-200">
            <Text className="text-lg font-semibold text-gray-900">
              Доступное время на {format(parseISO(selectedDate), 'd MMMM', { locale: ru })}
            </Text>
          </View>

          {slotsError ? (
            <ErrorMessage message="Не удалось загрузить доступное время" />
          ) : slotsData?.slots.length === 0 ? (
            <View className="p-8 items-center">
              <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 text-center mt-2">
                На выбранную дату нет доступного времени
              </Text>
            </View>
          ) : (
            <View className="p-2">
              {slotsData?.slots.map(renderTimeSlot)}
            </View>
          )}
        </View>
      </View>

      {/* Location */}
      <View className="mx-4 mb-4">
        <View className="bg-white p-4 rounded-lg shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Адрес</Text>
          <TouchableOpacity
            className="flex-row items-center p-3 border border-gray-300 rounded-lg"
            onPress={() => setShowLocationPicker(true)}
          >
            <Ionicons name="location-outline" size={24} color="#6B7280" />
            <Text className={`ml-3 flex-1 ${address ? 'text-gray-900' : 'text-gray-500'}`}>
              {address || 'Выберите адрес'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Notes */}
      <View className="mx-4 mb-4">
        <View className="bg-white p-4 rounded-lg shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Примечания</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 min-h-[80px]"
            placeholder="Дополнительная информация для мастера..."
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
          />
        </View>
      </View>

      {/* Payment Method */}
      <View className="mx-4 mb-4">
        <View className="bg-white p-4 rounded-lg shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Способ оплаты</Text>
          <TouchableOpacity
            className="flex-row items-center p-3 border border-gray-300 rounded-lg"
            onPress={() => setShowPaymentSelector(true)}
          >
            <Ionicons name="card-outline" size={24} color="#6B7280" />
            <Text className={`ml-3 flex-1 ${selectedPaymentMethod ? 'text-gray-900' : 'text-gray-500'}`}>
              {selectedPaymentMethod
                ? paymentMethods?.find(pm => String(pm.id) === selectedPaymentMethod)?.name
                : 'Выберите способ оплаты'
              }
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Auto Confirm Toggle */}
      <View className="mx-4 mb-4">
        <View className="bg-white p-4 rounded-lg shadow-sm">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-lg font-semibold text-gray-900">Автоподтверждение</Text>
              <Text className="text-sm text-gray-600 mt-1">
                Бронирование будет подтверждено автоматически
              </Text>
            </View>
            <Switch
              value={autoConfirm}
              onValueChange={setAutoConfirm}
              trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
              thumbColor={autoConfirm ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
        </View>
      </View>

      {/* Booking Summary */}
      <View className="mx-4">
        {renderBookingSummary()}
      </View>

      {/* Create Booking Button */}
      <View className="mx-4 mb-8">
        <TouchableOpacity
          className={`p-4 rounded-lg ${selectedSlot && address && selectedPaymentMethod
            ? 'bg-blue-500'
            : 'bg-gray-300'
            }`}
          onPress={handleCreateBooking}
          disabled={!selectedSlot || !address || !selectedPaymentMethod || creatingBooking}
        >
          {creatingBooking ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center text-lg font-semibold">
              Забронировать за ${calculateTotal().toFixed(2)}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Payment Method Selector Modal */}
      {showPaymentSelector && (
        <PaymentMethodSelector
          visible={showPaymentSelector}
          onClose={() => setShowPaymentSelector(false)}
          onSelect={(paymentMethodId) => {
            setSelectedPaymentMethod(paymentMethodId);
            setShowPaymentSelector(false);
          }}
          selectedId={selectedPaymentMethod}
        />
      )}

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <LocationPicker
          visible={showLocationPicker}
          onClose={() => setShowLocationPicker(false)}
          onSelect={handleLocationSelect}
          initialLocation={coordinates ? { ...coordinates, address } : undefined}
        />
      )}
    </ScrollView>
  );
};