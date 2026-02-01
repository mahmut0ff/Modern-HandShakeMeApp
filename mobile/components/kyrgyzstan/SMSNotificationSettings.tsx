import React, { useState } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface SMSNotificationSettingsProps {
  phoneNumber: string;
  onPhoneChange: (phone: string) => void;
  onSave: (settings: SMSSettings) => Promise<void>;
}

export interface SMSSettings {
  enabled: boolean;
  phoneNumber: string;
  notifyOnNewOrder: boolean;
  notifyOnApplication: boolean;
  notifyOnPayment: boolean;
  notifyOnMessage: boolean;
  notifyOnReview: boolean;
  language: 'ru' | 'ky';
}

export const SMSNotificationSettings: React.FC<SMSNotificationSettingsProps> = ({
  phoneNumber,
  onPhoneChange,
  onSave,
}) => {
  const [settings, setSettings] = useState<SMSSettings>({
    enabled: false,
    phoneNumber: phoneNumber || '',
    notifyOnNewOrder: true,
    notifyOnApplication: true,
    notifyOnPayment: true,
    notifyOnMessage: false,
    notifyOnReview: false,
    language: 'ru',
  });
  const [saving, setSaving] = useState(false);

  const handleToggle = (key: keyof SMSSettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handlePhoneChange = (phone: string) => {
    // Format phone number for Kyrgyzstan
    let formatted = phone.replace(/[^\d+]/g, '');
    if (formatted.startsWith('0')) {
      formatted = '+996' + formatted.substring(1);
    } else if (!formatted.startsWith('+')) {
      formatted = '+996' + formatted;
    }
    setSettings((prev) => ({ ...prev, phoneNumber: formatted }));
    onPhoneChange(formatted);
  };

  const validatePhone = (phone: string): boolean => {
    // Kyrgyzstan phone format: +996XXXXXXXXX
    const phoneRegex = /^\+996[0-9]{9}$/;
    return phoneRegex.test(phone);
  };

  const handleSave = async () => {
    if (settings.enabled && !validatePhone(settings.phoneNumber)) {
      Alert.alert('Ошибка', 'Неверный формат номера телефона. Используйте +996XXXXXXXXX');
      return;
    }

    setSaving(true);
    try {
      await onSave(settings);
      Alert.alert('Успех', 'Настройки SMS уведомлений сохранены');
    } catch (err: any) {
      Alert.alert('Ошибка', err.message || 'Не удалось сохранить настройки');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Main Toggle */}
      <View style={styles.section}>
        <View style={styles.header}>
          <MaterialIcons name="sms" size={24} color="#3B82F6" />
          <Text style={styles.headerTitle}>SMS уведомления</Text>
        </View>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Включить SMS</Text>
            <Text style={styles.settingDescription}>
              Получать важные уведомления по SMS
            </Text>
          </View>
          <Switch
            value={settings.enabled}
            onValueChange={(value) => handleToggle('enabled', value)}
            trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
            thumbColor={settings.enabled ? '#3B82F6' : '#F3F4F6'}
          />
        </View>
      </View>

      {/* Phone Number */}
      {settings.enabled && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Номер телефона</Text>
            <View style={styles.phoneInputContainer}>
              <MaterialIcons name="phone" size={20} color="#6B7280" />
              <TextInput
                style={styles.phoneInput}
                value={settings.phoneNumber}
                onChangeText={handlePhoneChange}
                placeholder="+996 XXX XXX XXX"
                keyboardType="phone-pad"
                maxLength={13}
              />
              {validatePhone(settings.phoneNumber) && (
                <MaterialIcons name="check-circle" size={20} color="#10B981" />
              )}
            </View>
            <Text style={styles.hint}>
              Формат: +996 XXX XXX XXX (Beeline, MegaCom, O!)
            </Text>
          </View>

          {/* Notification Types */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Типы уведомлений</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Новые заказы</Text>
                <Text style={styles.settingDescription}>
                  Уведомления о новых заказах в вашей категории
                </Text>
              </View>
              <Switch
                value={settings.notifyOnNewOrder}
                onValueChange={(value) => handleToggle('notifyOnNewOrder', value)}
                trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                thumbColor={settings.notifyOnNewOrder ? '#3B82F6' : '#F3F4F6'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Отклики</Text>
                <Text style={styles.settingDescription}>
                  Уведомления о новых откликах на ваши заказы
                </Text>
              </View>
              <Switch
                value={settings.notifyOnApplication}
                onValueChange={(value) => handleToggle('notifyOnApplication', value)}
                trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                thumbColor={settings.notifyOnApplication ? '#3B82F6' : '#F3F4F6'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Платежи</Text>
                <Text style={styles.settingDescription}>
                  Уведомления о платежах и транзакциях
                </Text>
              </View>
              <Switch
                value={settings.notifyOnPayment}
                onValueChange={(value) => handleToggle('notifyOnPayment', value)}
                trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                thumbColor={settings.notifyOnPayment ? '#3B82F6' : '#F3F4F6'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Сообщения</Text>
                <Text style={styles.settingDescription}>
                  Уведомления о новых сообщениях в чате
                </Text>
              </View>
              <Switch
                value={settings.notifyOnMessage}
                onValueChange={(value) => handleToggle('notifyOnMessage', value)}
                trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                thumbColor={settings.notifyOnMessage ? '#3B82F6' : '#F3F4F6'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Отзывы</Text>
                <Text style={styles.settingDescription}>
                  Уведомления о новых отзывах
                </Text>
              </View>
              <Switch
                value={settings.notifyOnReview}
                onValueChange={(value) => handleToggle('notifyOnReview', value)}
                trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                thumbColor={settings.notifyOnReview ? '#3B82F6' : '#F3F4F6'}
              />
            </View>
          </View>

          {/* Language */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Язык SMS</Text>
            <View style={styles.languageButtons}>
              <TouchableOpacity
                style={[
                  styles.languageButton,
                  settings.language === 'ru' && styles.languageButtonActive,
                ]}
                onPress={() => setSettings((prev) => ({ ...prev, language: 'ru' }))}
              >
                <Text
                  style={[
                    styles.languageButtonText,
                    settings.language === 'ru' && styles.languageButtonTextActive,
                  ]}
                >
                  Русский
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.languageButton,
                  settings.language === 'ky' && styles.languageButtonActive,
                ]}
                onPress={() => setSettings((prev) => ({ ...prev, language: 'ky' }))}
              >
                <Text
                  style={[
                    styles.languageButtonText,
                    settings.language === 'ky' && styles.languageButtonTextActive,
                  ]}
                >
                  Кыргызча
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Info */}
          <View style={styles.infoCard}>
            <MaterialIcons name="info-outline" size={20} color="#3B82F6" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoText}>
                SMS отправляются через операторов Beeline, MegaCom и O!
              </Text>
              <Text style={styles.infoText}>
                Стоимость: 1 сом за SMS (списывается с баланса)
              </Text>
            </View>
          </View>
        </>
      )}

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <MaterialIcons name="save" size={20} color="#FFF" />
        <Text style={styles.saveButtonText}>
          {saving ? 'Сохранение...' : 'Сохранить настройки'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFF',
    marginBottom: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
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
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageButtonActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  languageButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
  },
  languageButtonTextActive: {
    color: '#3B82F6',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 16,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    margin: 16,
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
