import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  useGetMasterBookingSettingsQuery,
  useUpdateMasterBookingSettingsMutation,
} from '../../services/instantBookingApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';

export const BookingSettingsScreen: React.FC = () => {
  const { data: settings, isLoading, error } = useGetMasterBookingSettingsQuery();
  const [updateSettings, { isLoading: updating }] = useUpdateMasterBookingSettingsMutation();

  const [localSettings, setLocalSettings] = useState({
    instantBookingEnabled: false,
    autoConfirmEnabled: false,
    minimumNotice: 60,
    maximumAdvanceBooking: 30,
    urgentBookingFee: 20,
    cancellationPolicy: 'flexible',
  });

  React.useEffect(() => {
    if (settings) {
      setLocalSettings({
        instantBookingEnabled: settings.instantBookingEnabled,
        autoConfirmEnabled: settings.autoConfirmEnabled,
        minimumNotice: settings.minimumNotice,
        maximumAdvanceBooking: settings.maximumAdvanceBooking,
        urgentBookingFee: settings.urgentBookingFee,
        cancellationPolicy: settings.cancellationPolicy,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings(localSettings).unwrap();
      Alert.alert('Успех', 'Настройки сохранены');
    } catch (err: any) {
      Alert.alert('Ошибка', err.message || 'Не удалось сохранить настройки');
    }
  };

  const handleToggle = (key: keyof typeof localSettings, value: boolean) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleNumberChange = (key: keyof typeof localSettings, value: number) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message="Не удалось загрузить настройки" />;
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Main Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Основные настройки</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Мгновенное бронирование</Text>
              <Text style={styles.settingDescription}>
                Клиенты могут бронировать ваши услуги без подтверждения
              </Text>
            </View>
            <Switch
              value={localSettings.instantBookingEnabled}
              onValueChange={(value) => handleToggle('instantBookingEnabled', value)}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={localSettings.instantBookingEnabled ? '#3B82F6' : '#F3F4F6'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Автоподтверждение</Text>
              <Text style={styles.settingDescription}>
                Автоматически подтверждать бронирования
              </Text>
            </View>
            <Switch
              value={localSettings.autoConfirmEnabled}
              onValueChange={(value) => handleToggle('autoConfirmEnabled', value)}
              disabled={!localSettings.instantBookingEnabled}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={localSettings.autoConfirmEnabled ? '#3B82F6' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* Time Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Временные настройки</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Минимальное уведомление</Text>
              <Text style={styles.settingDescription}>
                Минимальное время до начала услуги
              </Text>
            </View>
            <View style={styles.valueSelector}>
              {[30, 60, 120, 180, 240].map((minutes) => (
                <TouchableOpacity
                  key={minutes}
                  style={[
                    styles.valueButton,
                    localSettings.minimumNotice === minutes && styles.valueButtonActive,
                  ]}
                  onPress={() => handleNumberChange('minimumNotice', minutes)}
                >
                  <Text
                    style={[
                      styles.valueButtonText,
                      localSettings.minimumNotice === minutes && styles.valueButtonTextActive,
                    ]}
                  >
                    {minutes < 60 ? `${minutes}м` : `${minutes / 60}ч`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Максимальное бронирование</Text>
              <Text style={styles.settingDescription}>
                На сколько дней вперед можно бронировать
              </Text>
            </View>
            <View style={styles.valueSelector}>
              {[7, 14, 30, 60, 90].map((days) => (
                <TouchableOpacity
                  key={days}
                  style={[
                    styles.valueButton,
                    localSettings.maximumAdvanceBooking === days && styles.valueButtonActive,
                  ]}
                  onPress={() => handleNumberChange('maximumAdvanceBooking', days)}
                >
                  <Text
                    style={[
                      styles.valueButtonText,
                      localSettings.maximumAdvanceBooking === days &&
                      styles.valueButtonTextActive,
                    ]}
                  >
                    {days}д
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Pricing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ценообразование</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Доплата за срочность</Text>
              <Text style={styles.settingDescription}>
                Процент доплаты за срочные заказы (менее 2 часов)
              </Text>
            </View>
            <View style={styles.valueSelector}>
              {[0, 10, 20, 30, 50].map((percent) => (
                <TouchableOpacity
                  key={percent}
                  style={[
                    styles.valueButton,
                    localSettings.urgentBookingFee === percent && styles.valueButtonActive,
                  ]}
                  onPress={() => handleNumberChange('urgentBookingFee', percent)}
                >
                  <Text
                    style={[
                      styles.valueButtonText,
                      localSettings.urgentBookingFee === percent && styles.valueButtonTextActive,
                    ]}
                  >
                    {percent}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Cancellation Policy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Политика отмены</Text>

          <TouchableOpacity
            style={[
              styles.policyCard,
              localSettings.cancellationPolicy === 'flexible' && styles.policyCardActive,
            ]}
            onPress={() =>
              setLocalSettings((prev) => ({ ...prev, cancellationPolicy: 'flexible' }))
            }
          >
            <View style={styles.policyHeader}>
              <MaterialIcons
                name={
                  localSettings.cancellationPolicy === 'flexible'
                    ? 'radio-button-checked'
                    : 'radio-button-unchecked'
                }
                size={24}
                color={localSettings.cancellationPolicy === 'flexible' ? '#3B82F6' : '#9CA3AF'}
              />
              <Text style={styles.policyTitle}>Гибкая</Text>
            </View>
            <Text style={styles.policyDescription}>
              Полный возврат при отмене за 24 часа до начала
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.policyCard,
              localSettings.cancellationPolicy === 'moderate' && styles.policyCardActive,
            ]}
            onPress={() =>
              setLocalSettings((prev) => ({ ...prev, cancellationPolicy: 'moderate' }))
            }
          >
            <View style={styles.policyHeader}>
              <MaterialIcons
                name={
                  localSettings.cancellationPolicy === 'moderate'
                    ? 'radio-button-checked'
                    : 'radio-button-unchecked'
                }
                size={24}
                color={localSettings.cancellationPolicy === 'moderate' ? '#3B82F6' : '#9CA3AF'}
              />
              <Text style={styles.policyTitle}>Умеренная</Text>
            </View>
            <Text style={styles.policyDescription}>
              Полный возврат за 48 часов, 50% за 24 часа
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.policyCard,
              localSettings.cancellationPolicy === 'strict' && styles.policyCardActive,
            ]}
            onPress={() =>
              setLocalSettings((prev) => ({ ...prev, cancellationPolicy: 'strict' }))
            }
          >
            <View style={styles.policyHeader}>
              <MaterialIcons
                name={
                  localSettings.cancellationPolicy === 'strict'
                    ? 'radio-button-checked'
                    : 'radio-button-unchecked'
                }
                size={24}
                color={localSettings.cancellationPolicy === 'strict' ? '#3B82F6' : '#9CA3AF'}
              />
              <Text style={styles.policyTitle}>Строгая</Text>
            </View>
            <Text style={styles.policyDescription}>
              Полный возврат за 7 дней, 50% за 48 часов
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <MaterialIcons name="info-outline" size={20} color="#3B82F6" />
          <Text style={styles.infoText}>
            Настройки применяются ко всем новым бронированиям. Существующие бронирования не
            изменятся.
          </Text>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, updating && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={updating}
        >
          {updating ? (
            <LoadingSpinner size="small" />
          ) : (
            <>
              <MaterialIcons name="save" size={20} color="#FFF" />
              <Text style={styles.saveButtonText}>Сохранить настройки</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  section: {
    backgroundColor: '#FFF',
    marginBottom: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  settingItem: {
    marginBottom: 20,
  },
  settingInfo: {
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  valueSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  valueButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  valueButtonActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  valueButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  valueButtonTextActive: {
    color: '#3B82F6',
  },
  policyCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 12,
  },
  policyCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  policyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  policyDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginLeft: 36,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    margin: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
