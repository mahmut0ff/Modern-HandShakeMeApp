import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface TimeSlot {
  start: string;
  end: string;
}

interface DaySchedule {
  day: string;
  dayName: string;
  isAvailable: boolean;
  timeSlots: TimeSlot[];
}

export default function MasterAvailabilityPage() {
  const [loading, setLoading] = useState(false);
  
  // Mock data - replace with actual API calls
  const [schedule, setSchedule] = useState<DaySchedule[]>([
    {
      day: 'monday',
      dayName: 'Понедельник',
      isAvailable: true,
      timeSlots: [{ start: '09:00', end: '18:00' }]
    },
    {
      day: 'tuesday',
      dayName: 'Вторник',
      isAvailable: true,
      timeSlots: [{ start: '09:00', end: '18:00' }]
    },
    {
      day: 'wednesday',
      dayName: 'Среда',
      isAvailable: true,
      timeSlots: [{ start: '09:00', end: '18:00' }]
    },
    {
      day: 'thursday',
      dayName: 'Четверг',
      isAvailable: true,
      timeSlots: [{ start: '09:00', end: '18:00' }]
    },
    {
      day: 'friday',
      dayName: 'Пятница',
      isAvailable: true,
      timeSlots: [{ start: '09:00', end: '18:00' }]
    },
    {
      day: 'saturday',
      dayName: 'Суббота',
      isAvailable: true,
      timeSlots: [{ start: '10:00', end: '16:00' }]
    },
    {
      day: 'sunday',
      dayName: 'Воскресенье',
      isAvailable: false,
      timeSlots: []
    }
  ]);

  const [vacationMode, setVacationMode] = useState(false);
  const [emergencyAvailable, setEmergencyAvailable] = useState(true);

  const timeOptions = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
  ];

  const toggleDayAvailability = (dayIndex: number) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].isAvailable = !newSchedule[dayIndex].isAvailable;
    
    if (!newSchedule[dayIndex].isAvailable) {
      newSchedule[dayIndex].timeSlots = [];
    } else if (newSchedule[dayIndex].timeSlots.length === 0) {
      newSchedule[dayIndex].timeSlots = [{ start: '09:00', end: '18:00' }];
    }
    
    setSchedule(newSchedule);
  };

  const updateTimeSlot = (dayIndex: number, slotIndex: number, field: 'start' | 'end', value: string) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].timeSlots[slotIndex][field] = value;
    setSchedule(newSchedule);
  };

  const addTimeSlot = (dayIndex: number) => {
    const newSchedule = [...schedule];
    const lastSlot = newSchedule[dayIndex].timeSlots[newSchedule[dayIndex].timeSlots.length - 1];
    const newStart = lastSlot ? lastSlot.end : '09:00';
    const newEnd = lastSlot ? '23:00' : '18:00';
    
    newSchedule[dayIndex].timeSlots.push({ start: newStart, end: newEnd });
    setSchedule(newSchedule);
  };

  const removeTimeSlot = (dayIndex: number, slotIndex: number) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].timeSlots.splice(slotIndex, 1);
    setSchedule(newSchedule);
  };

  const saveSchedule = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('Успех', 'Расписание сохранено');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сохранить расписание');
    } finally {
      setLoading(false);
    }
  };

  const setQuickSchedule = (type: 'weekdays' | 'everyday' | 'weekends') => {
    const newSchedule = [...schedule];
    
    newSchedule.forEach((day, index) => {
      if (type === 'weekdays') {
        day.isAvailable = index < 5; // Mon-Fri
        day.timeSlots = index < 5 ? [{ start: '09:00', end: '18:00' }] : [];
      } else if (type === 'everyday') {
        day.isAvailable = true;
        day.timeSlots = [{ start: '09:00', end: '18:00' }];
      } else if (type === 'weekends') {
        day.isAvailable = index >= 5; // Sat-Sun
        day.timeSlots = index >= 5 ? [{ start: '10:00', end: '16:00' }] : [];
      }
    });
    
    setSchedule(newSchedule);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      <ScrollView className="flex-1 px-4">
        {/* Header */}
        <View className="flex-row items-center gap-4 mb-6">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 bg-white rounded-2xl items-center justify-center shadow-sm border border-gray-100"
          >
            <Ionicons name="arrow-back" size={20} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">Доступность</Text>
        </View>

        {/* Status Cards */}
        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity
            onPress={() => setVacationMode(!vacationMode)}
            className={`flex-1 p-4 rounded-3xl ${
              vacationMode ? 'bg-orange-500' : 'bg-white border border-gray-100'
            }`}
          >
            <View className="flex-row items-center gap-3">
              <Ionicons 
                name={vacationMode ? "pause" : "pause-outline"} 
                size={24} 
                color={vacationMode ? "white" : "#F97316"} 
              />
              <View>
                <Text className={`font-semibold ${vacationMode ? 'text-white' : 'text-gray-900'}`}>
                  Отпуск
                </Text>
                <Text className={`text-sm ${vacationMode ? 'text-white/70' : 'text-gray-500'}`}>
                  {vacationMode ? 'Включен' : 'Выключен'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setEmergencyAvailable(!emergencyAvailable)}
            className={`flex-1 p-4 rounded-3xl ${
              emergencyAvailable ? 'bg-red-500' : 'bg-white border border-gray-100'
            }`}
          >
            <View className="flex-row items-center gap-3">
              <Ionicons 
                name={emergencyAvailable ? "flash" : "flash-outline"} 
                size={24} 
                color={emergencyAvailable ? "white" : "#EF4444"} 
              />
              <View>
                <Text className={`font-semibold ${emergencyAvailable ? 'text-white' : 'text-gray-900'}`}>
                  Срочные
                </Text>
                <Text className={`text-sm ${emergencyAvailable ? 'text-white/70' : 'text-gray-500'}`}>
                  {emergencyAvailable ? 'Принимаю' : 'Не принимаю'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Schedule */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-4">Быстрая настройка</Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setQuickSchedule('weekdays')}
              className="flex-1 py-3 bg-blue-100 rounded-2xl"
            >
              <Text className="text-center font-medium text-blue-700">Будни</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setQuickSchedule('weekends')}
              className="flex-1 py-3 bg-purple-100 rounded-2xl"
            >
              <Text className="text-center font-medium text-purple-700">Выходные</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setQuickSchedule('everyday')}
              className="flex-1 py-3 bg-green-100 rounded-2xl"
            >
              <Text className="text-center font-medium text-green-700">Каждый день</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Weekly Schedule */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-4">Недельное расписание</Text>
          
          {schedule.map((day, dayIndex) => (
            <View key={day.day} className="mb-6 last:mb-0">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="font-semibold text-gray-900">{day.dayName}</Text>
                <TouchableOpacity
                  onPress={() => toggleDayAvailability(dayIndex)}
                  className={`px-4 py-2 rounded-full ${
                    day.isAvailable ? 'bg-green-100' : 'bg-gray-100'
                  }`}
                >
                  <Text className={`font-medium ${
                    day.isAvailable ? 'text-green-700' : 'text-gray-500'
                  }`}>
                    {day.isAvailable ? 'Доступен' : 'Недоступен'}
                  </Text>
                </TouchableOpacity>
              </View>

              {day.isAvailable && (
                <View className="space-y-3">
                  {day.timeSlots.map((slot, slotIndex) => (
                    <View key={slotIndex} className="flex-row items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                      <View className="flex-1 flex-row items-center gap-2">
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          <View className="flex-row gap-1">
                            {timeOptions.map(time => (
                              <TouchableOpacity
                                key={`start-${time}`}
                                onPress={() => updateTimeSlot(dayIndex, slotIndex, 'start', time)}
                                className={`px-3 py-2 rounded-xl ${
                                  slot.start === time ? 'bg-[#0165FB]' : 'bg-white'
                                }`}
                              >
                                <Text className={`text-sm font-medium ${
                                  slot.start === time ? 'text-white' : 'text-gray-700'
                                }`}>
                                  {time}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </ScrollView>
                      </View>
                      
                      <Text className="text-gray-500">—</Text>
                      
                      <View className="flex-1 flex-row items-center gap-2">
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          <View className="flex-row gap-1">
                            {timeOptions.map(time => (
                              <TouchableOpacity
                                key={`end-${time}`}
                                onPress={() => updateTimeSlot(dayIndex, slotIndex, 'end', time)}
                                className={`px-3 py-2 rounded-xl ${
                                  slot.end === time ? 'bg-[#0165FB]' : 'bg-white'
                                }`}
                              >
                                <Text className={`text-sm font-medium ${
                                  slot.end === time ? 'text-white' : 'text-gray-700'
                                }`}>
                                  {time}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </ScrollView>
                      </View>

                      {day.timeSlots.length > 1 && (
                        <TouchableOpacity
                          onPress={() => removeTimeSlot(dayIndex, slotIndex)}
                          className="w-8 h-8 bg-red-100 rounded-full items-center justify-center"
                        >
                          <Ionicons name="close" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}

                  <TouchableOpacity
                    onPress={() => addTimeSlot(dayIndex)}
                    className="flex-row items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-2xl"
                  >
                    <Ionicons name="add" size={16} color="#6B7280" />
                    <Text className="text-gray-600 font-medium">Добавить время</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={saveSchedule}
          disabled={loading}
          className={`py-4 rounded-2xl shadow-lg mb-6 ${
            loading ? 'bg-gray-400' : 'bg-[#0165FB]'
          }`}
        >
          <Text className="text-center font-semibold text-white text-lg">
            {loading ? 'Сохранение...' : 'Сохранить расписание'}
          </Text>
        </TouchableOpacity>

        {/* Tips */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
          <Text className="font-semibold text-gray-900 mb-3 flex-row items-center gap-2">
            <Ionicons name="bulb" size={20} color="#F59E0B" />
            Советы по расписанию
          </Text>
          <View className="space-y-2">
            <Text className="text-sm text-gray-600">• Указывайте реальное время работы</Text>
            <Text className="text-sm text-gray-600">• Оставляйте время между заказами</Text>
            <Text className="text-sm text-gray-600">• Обновляйте расписание при изменениях</Text>
            <Text className="text-sm text-gray-600">• Включайте режим отпуска заранее</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}