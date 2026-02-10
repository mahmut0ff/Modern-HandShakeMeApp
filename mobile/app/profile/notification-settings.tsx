import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { notificationsApi, NotificationSettings } from '@/src/api/notifications';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Header } from '@/components/ui';

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await notificationsApi.getSettings();
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch notification settings', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: keyof NotificationSettings, value: boolean) => {
    if (!settings) return;

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      await notificationsApi.updateSettings({ [key]: value });
    } catch (error) {
      console.error('Failed to update setting', error);
      setSettings(settings);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  if (!settings) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Не удалось загрузить настройки</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Настройки уведомлений" onBack={() => router.back()} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Каналы уведомлений</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Push-уведомления</Text>
              <Text style={[styles.settingDescription, { color: theme.text + '99' }]}>
                Получать уведомления в приложении
              </Text>
            </View>
            <Switch
              value={settings.pushEnabled}
              onValueChange={(value) => updateSetting('pushEnabled', value)}
              trackColor={{ false: theme.text + '30', true: theme.tint + '80' }}
              thumbColor={settings.pushEnabled ? theme.tint : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Email</Text>
              <Text style={[styles.settingDescription, { color: theme.text + '99' }]}>
                Получать уведомления на почту
              </Text>
            </View>
            <Switch
              value={settings.emailEnabled}
              onValueChange={(value) => updateSetting('emailEnabled', value)}
              trackColor={{ false: theme.text + '30', true: theme.tint + '80' }}
              thumbColor={settings.emailEnabled ? theme.tint : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Типы уведомлений</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Новые заказы</Text>
              <Text style={[styles.settingDescription, { color: theme.text + '99' }]}>
                Уведомления о новых заказах
              </Text>
            </View>
            <Switch
              value={settings.newOrders}
              onValueChange={(value) => updateSetting('newOrders', value)}
              trackColor={{ false: theme.text + '30', true: theme.tint + '80' }}
              thumbColor={settings.newOrders ? theme.tint : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Новые отклики</Text>
              <Text style={[styles.settingDescription, { color: theme.text + '99' }]}>
                Уведомления о новых откликах на ваши заказы
              </Text>
            </View>
            <Switch
              value={settings.newApplications}
              onValueChange={(value) => updateSetting('newApplications', value)}
              trackColor={{ false: theme.text + '30', true: theme.tint + '80' }}
              thumbColor={settings.newApplications ? theme.tint : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Принятые отклики</Text>
              <Text style={[styles.settingDescription, { color: theme.text + '99' }]}>
                Когда ваш отклик принят
              </Text>
            </View>
            <Switch
              value={settings.applicationAccepted}
              onValueChange={(value) => updateSetting('applicationAccepted', value)}
              trackColor={{ false: theme.text + '30', true: theme.tint + '80' }}
              thumbColor={settings.applicationAccepted ? theme.tint : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Новые сообщения</Text>
              <Text style={[styles.settingDescription, { color: theme.text + '99' }]}>
                Уведомления о новых сообщениях в чате
              </Text>
            </View>
            <Switch
              value={settings.newMessages}
              onValueChange={(value) => updateSetting('newMessages', value)}
              trackColor={{ false: theme.text + '30', true: theme.tint + '80' }}
              thumbColor={settings.newMessages ? theme.tint : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Отзывы</Text>
              <Text style={[styles.settingDescription, { color: theme.text + '99' }]}>
                Уведомления о новых отзывах
              </Text>
            </View>
            <Switch
              value={settings.reviewReceived}
              onValueChange={(value) => updateSetting('reviewReceived', value)}
              trackColor={{ false: theme.text + '30', true: theme.tint + '80' }}
              thumbColor={settings.reviewReceived ? theme.tint : '#f4f3f4'}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, padding: 16 },
  section: { borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  settingInfo: { flex: 1, marginRight: 16 },
  settingLabel: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  settingDescription: { fontSize: 13, lineHeight: 18 },
});
