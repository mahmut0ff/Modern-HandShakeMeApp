import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { MaterialIcons } from '@expo/vector-icons';
import { useGetAvailableSlotsQuery } from '../../services/instantBookingApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';

interface BookingCalendarScreenProps {
  masterId: string;
  serviceId: string;
  onSlotSelect: (date: string, time: string) => void;
}

export const BookingCalendarScreen: React.FC<BookingCalendarScreenProps> = ({
  masterId,
  serviceId,
  onSlotSelect,
}) => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const { data: slotsData, isLoading } = useGetAvailableSlotsQuery(
    {
      masterId,
      serviceId,
      date: selectedDate,
      duration: 60,
    },
    {
      skip: !selectedDate,
    }
  );

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      onSlotSelect(selectedDate, selectedTime);
    } else {
      Alert.alert('Ошибка', 'Выберите дату и время');
    }
  };

  const getMarkedDates = () => {
    const marked: any = {};
    
    // Mark selected date
    marked[selectedDate] = {
      selected: true,
      selectedColor: '#3B82F6',
    };

    return marked;
  };

  const groupSlotsByTime = () => {
    if (!slotsData?.slots) return [];

    const groups: { time: string; slots: typeof slotsData.slots }[] = [];
    const timeMap = new Map<string, typeof slotsData.slots>();

    slotsData.slots.forEach((slot) => {
      const time = new Date(slot.startTime).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      });

      if (!timeMap.has(time)) {
        timeMap.set(time, []);
      }
      timeMap.get(time)!.push(slot);
    });

    timeMap.forEach((slots, time) => {
      groups.push({ time, slots });
    });

    return groups.sort((a, b) => a.time.localeCompare(b.time));
  };

  const timeGroups = groupSlotsByTime();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Calendar */}
        <View style={styles.calendarContainer}>
          <Calendar
            current={selectedDate}
            minDate={new Date().toISOString().split('T')[0]}
            maxDate={
              new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split('T')[0]
            }
            onDayPress={handleDayPress}
            markedDates={getMarkedDates()}
            theme={{
              todayTextColor: '#3B82F6',
              selectedDayBackgroundColor: '#3B82F6',
              selectedDayTextColor: '#FFF',
              arrowColor: '#3B82F6',
              monthTextColor: '#111827',
              textMonthFontWeight: '600',
              textDayFontSize: 14,
              textMonthFontSize: 16,
            }}
          />
        </View>

        {/* Master & Service Info */}
        {slotsData && (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons name="person" size={20} color="#6B7280" />
              <Text style={styles.infoText}>{slotsData.masterInfo.name}</Text>
              <View style={styles.ratingBadge}>
                <MaterialIcons name="star" size={14} color="#F59E0B" />
                <Text style={styles.ratingText}>{slotsData.masterInfo.rating}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="work" size={20} color="#6B7280" />
              <Text style={styles.infoText}>{slotsData.serviceInfo.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="attach-money" size={20} color="#6B7280" />
              <Text style={styles.infoText}>
                от {slotsData.serviceInfo.basePrice} сом
              </Text>
            </View>
          </View>
        )}

        {/* Time Slots */}
        <View style={styles.slotsContainer}>
          <Text style={styles.slotsTitle}>
            Доступное время на {new Date(selectedDate).toLocaleDateString('ru-RU')}
          </Text>

          {isLoading ? (
            <LoadingSpinner />
          ) : timeGroups.length > 0 ? (
            <View style={styles.slotsGrid}>
              {timeGroups.map((group) => {
                const slot = group.slots[0];
                const isAvailable = slot.available;
                const isSelected = selectedTime === group.time;
                const isUrgent = slot.isUrgent;

                return (
                  <TouchableOpacity
                    key={group.time}
                    style={[
                      styles.timeSlot,
                      !isAvailable && styles.timeSlotDisabled,
                      isSelected && styles.timeSlotSelected,
                      isUrgent && styles.timeSlotUrgent,
                    ]}
                    onPress={() => isAvailable && handleTimeSelect(group.time)}
                    disabled={!isAvailable}
                  >
                    <Text
                      style={[
                        styles.timeSlotText,
                        !isAvailable && styles.timeSlotTextDisabled,
                        isSelected && styles.timeSlotTextSelected,
                      ]}
                    >
                      {group.time}
                    </Text>
                    {isUrgent && (
                      <View style={styles.urgentBadge}>
                        <MaterialIcons name="bolt" size={12} color="#F59E0B" />
                      </View>
                    )}
                    {!isAvailable && (
                      <MaterialIcons name="block" size={16} color="#9CA3AF" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="event-busy" size={48} color="#D1D5DB" />
              <Text style={styles.emptyStateText}>
                Нет доступных слотов на эту дату
              </Text>
            </View>
          )}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={styles.legendText}>Доступно</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>Срочное (доплата)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#E5E7EB' }]} />
            <Text style={styles.legendText}>Занято</Text>
          </View>
        </View>
      </ScrollView>

      {/* Confirm Button */}
      {selectedTime && (
        <View style={styles.footer}>
          <View style={styles.selectedInfo}>
            <MaterialIcons name="event" size={20} color="#3B82F6" />
            <Text style={styles.selectedText}>
              {new Date(selectedDate).toLocaleDateString('ru-RU')} в {selectedTime}
            </Text>
          </View>
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmButtonText}>Продолжить</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  calendarContainer: {
    backgroundColor: '#FFF',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  slotsContainer: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 12,
  },
  slotsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    width: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 4,
  },
  timeSlotSelected: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  timeSlotDisabled: {
    backgroundColor: '#F9FAFB',
    opacity: 0.5,
  },
  timeSlotUrgent: {
    backgroundColor: '#FEF3C7',
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  timeSlotTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  timeSlotTextDisabled: {
    color: '#9CA3AF',
  },
  urgentBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
  footer: {
    backgroundColor: '#FFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
