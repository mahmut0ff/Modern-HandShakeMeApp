# GDPR Feature - Примеры использования

## Пример 1: Базовая интеграция в настройки

```typescript
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <View>
      {/* ... другие настройки ... */}
      
      <TouchableOpacity
        onPress={() => router.push('/gdpr')}
        className="bg-white rounded-xl p-4 flex-row items-center justify-between"
      >
        <View className="flex-row items-center">
          <Ionicons name="shield-checkmark" size={24} color="#0165FB" />
          <View className="ml-3">
            <Text className="text-base font-semibold text-gray-900">
              Конфиденциальность и данные
            </Text>
            <Text className="text-sm text-gray-600">
              GDPR, экспорт, удаление
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );
}
```

## Пример 2: Экспорт данных программно

```typescript
import React, { useState } from 'react';
import { View, Button, Alert } from 'react-native';
import { gdprApi } from '../services/gdprApi';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function ExportDataButton() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);

      // Экспорт всех данных в JSON
      const data = await gdprApi.exportUserData({
        format: 'json',
        includeFiles: true,
      });

      // Сохранить в файл
      const content = await gdprApi.downloadExportedData(data, 'json');
      const filename = `export_${new Date().toISOString()}.json`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(fileUri, content);

      // Поделиться файлом
      await Sharing.shareAsync(fileUri);

      Alert.alert('Успешно', 'Данные экспортированы');
    } catch (error: any) {
      Alert.alert('Ошибка', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      title={loading ? 'Экспорт...' : 'Экспортировать данные'}
      onPress={handleExport}
      disabled={loading}
    />
  );
}
```

## Пример 3: Выборочный экспорт

```typescript
import React from 'react';
import { gdprApi } from '../services/gdprApi';

// Экспорт только профиля и заказов
const exportProfileAndOrders = async () => {
  const data = await gdprApi.exportUserData({
    format: 'json',
    sections: ['profile', 'orders'],
    includeFiles: false,
  });

  console.log('Профиль:', data.profile);
  console.log('Заказы:', data.orders);
  console.log('Всего заказов:', data.summary.totalOrders);
};

// Экспорт только отзывов
const exportReviews = async () => {
  const data = await gdprApi.exportUserData({
    format: 'json',
    sections: ['reviews'],
  });

  console.log('Оставленные отзывы:', data.reviews?.given);
  console.log('Полученные отзывы:', data.reviews?.received);
};

// Экспорт с файлами
const exportWithFiles = async () => {
  const data = await gdprApi.exportUserData({
    format: 'json',
    includeFiles: true,
  });

  // Ссылки действительны 24 часа
  console.log('Файлы:', data.files);
  console.log('Ссылки для скачивания:', data.downloadUrls);
};
```

## Пример 4: Удаление аккаунта с проверками

```typescript
import React, { useState, useEffect } from 'react';
import { View, Button, Alert } from 'react-native';
import { gdprApi } from '../services/gdprApi';

export default function DeleteAccountButton() {
  const [canDelete, setCanDelete] = useState(false);
  const [reasons, setReasons] = useState<string[]>([]);

  useEffect(() => {
    checkEligibility();
  }, []);

  const checkEligibility = async () => {
    const result = await gdprApi.checkDeletionEligibility();
    setCanDelete(result.canDelete);
    setReasons(result.reasons);
  };

  const handleDelete = async () => {
    if (!canDelete) {
      Alert.alert(
        'Невозможно удалить',
        `Необходимо:\n${reasons.join('\n')}`
      );
      return;
    }

    Alert.alert(
      'Подтверждение',
      'Вы уверены? Это действие необратимо.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: performDeletion,
        },
      ]
    );
  };

  const performDeletion = async () => {
    try {
      const result = await gdprApi.deleteUserAccount({
        confirmPassword: 'user_password',
        reason: 'not_using',
        feedback: 'Found a better alternative',
      });

      if (result.success) {
        Alert.alert('Успешно', result.message);
        // Выход из приложения
      }
    } catch (error: any) {
      Alert.alert('Ошибка', error.message);
    }
  };

  return (
    <Button
      title="Удалить аккаунт"
      onPress={handleDelete}
      color="red"
    />
  );
}
```

## Пример 5: Управление согласиями

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, Switch } from 'react-native';
import { gdprApi, ConsentSettings } from '../services/gdprApi';

export default function ConsentToggles() {
  const [consents, setConsents] = useState<ConsentSettings>({
    marketing: false,
    analytics: true,
    personalization: true,
    thirdParty: false,
  });

  useEffect(() => {
    loadConsents();
  }, []);

  const loadConsents = async () => {
    const settings = await gdprApi.getConsentSettings();
    setConsents(settings);
  };

  const handleToggle = async (key: keyof ConsentSettings) => {
    const updated = {
      ...consents,
      [key]: !consents[key],
    };
    
    setConsents(updated);
    await gdprApi.updateConsentSettings(updated);
  };

  return (
    <View>
      <View>
        <Text>Маркетинг</Text>
        <Switch
          value={consents.marketing}
          onValueChange={() => handleToggle('marketing')}
        />
      </View>

      <View>
        <Text>Аналитика</Text>
        <Switch
          value={consents.analytics}
          onValueChange={() => handleToggle('analytics')}
        />
      </View>

      <View>
        <Text>Персонализация</Text>
        <Switch
          value={consents.personalization}
          onValueChange={() => handleToggle('personalization')}
        />
      </View>

      <View>
        <Text>Сторонние сервисы</Text>
        <Switch
          value={consents.thirdParty}
          onValueChange={() => handleToggle('thirdParty')}
        />
      </View>
    </View>
  );
}
```

## Пример 6: Экспорт в CSV

```typescript
import { gdprApi } from '../services/gdprApi';
import * as FileSystem from 'expo-file-system';

const exportToCSV = async () => {
  // Экспорт в CSV формате
  const data = await gdprApi.exportUserData({
    format: 'csv',
    sections: ['orders', 'reviews'],
  });

  // Конвертировать в CSV
  const csvContent = await gdprApi.downloadExportedData(data, 'csv');

  // Сохранить файл
  const fileUri = `${FileSystem.documentDirectory}export.csv`;
  await FileSystem.writeAsStringAsync(fileUri, csvContent);

  console.log('CSV сохранен:', fileUri);
};
```

## Пример 7: Обработка ошибок

```typescript
import { gdprApi } from '../services/gdprApi';
import { Alert } from 'react-native';

const handleGDPROperation = async () => {
  try {
    const data = await gdprApi.exportUserData({
      format: 'json',
    });
    
    // Успешно
    console.log('Экспорт завершен');
  } catch (error: any) {
    // Обработка различных ошибок
    if (error.response?.status === 429) {
      // Rate limit
      Alert.alert(
        'Превышен лимит',
        'Пожалуйста, подождите перед следующим экспортом'
      );
    } else if (error.response?.status === 401) {
      // Не авторизован
      Alert.alert('Ошибка', 'Необходимо войти в систему');
    } else if (error.response?.status === 403) {
      // Неверный пароль
      Alert.alert('Ошибка', 'Неверный пароль');
    } else if (error.response?.status === 400) {
      // Бизнес-логика
      Alert.alert('Ошибка', error.response.data.error);
    } else {
      // Общая ошибка
      Alert.alert('Ошибка', 'Что-то пошло не так');
    }
  }
};
```

## Пример 8: Показ статистики экспорта

```typescript
import React, { useState } from 'react';
import { View, Text, Button } from 'react-native';
import { gdprApi, GDPRExportData } from '../services/gdprApi';

export default function ExportStats() {
  const [stats, setStats] = useState<GDPRExportData['summary'] | null>(null);

  const loadStats = async () => {
    const data = await gdprApi.exportUserData({
      format: 'json',
    });
    
    setStats(data.summary);
  };

  return (
    <View>
      <Button title="Загрузить статистику" onPress={loadStats} />
      
      {stats && (
        <View>
          <Text>Заказов: {stats.totalOrders}</Text>
          <Text>Откликов: {stats.totalApplications}</Text>
          <Text>Проектов: {stats.totalProjects}</Text>
          <Text>Отзывов: {stats.totalReviews}</Text>
          <Text>Сообщений: {stats.totalMessages}</Text>
          <Text>Уведомлений: {stats.totalNotifications}</Text>
          <Text>Транзакций: {stats.totalTransactions}</Text>
          <Text>Портфолио: {stats.totalPortfolioItems}</Text>
        </View>
      )}
    </View>
  );
}
```

## Пример 9: Автоматический экспорт перед удалением

```typescript
import { gdprApi } from '../services/gdprApi';
import { Alert } from 'react-native';

const deleteAccountWithBackup = async (password: string) => {
  try {
    // Сначала экспортировать данные
    Alert.alert(
      'Экспорт данных',
      'Перед удалением мы экспортируем ваши данные'
    );

    const data = await gdprApi.exportUserData({
      format: 'json',
      includeFiles: true,
    });

    // Сохранить экспорт
    const content = await gdprApi.downloadExportedData(data, 'json');
    // ... сохранить файл ...

    // Затем удалить аккаунт
    const result = await gdprApi.deleteUserAccount({
      confirmPassword: password,
      reason: 'other',
    });

    if (result.success) {
      Alert.alert(
        'Аккаунт удален',
        'Ваши данные экспортированы и аккаунт удален'
      );
    }
  } catch (error) {
    Alert.alert('Ошибка', 'Не удалось завершить операцию');
  }
};
```

## Пример 10: Интеграция с onboarding

```typescript
import React, { useState } from 'react';
import { View, Text, Switch, Button } from 'react-native';
import { gdprApi } from '../services/gdprApi';

export default function OnboardingConsents() {
  const [consents, setConsents] = useState({
    marketing: false,
    analytics: true,
    personalization: true,
    thirdParty: false,
  });

  const handleComplete = async () => {
    // Сохранить согласия при первом входе
    await gdprApi.updateConsentSettings(consents);
    
    // Продолжить onboarding
    console.log('Согласия сохранены');
  };

  return (
    <View>
      <Text>Настройте ваши предпочтения</Text>
      
      <View>
        <Text>Получать маркетинговые email</Text>
        <Switch
          value={consents.marketing}
          onValueChange={(value) =>
            setConsents({ ...consents, marketing: value })
          }
        />
      </View>

      <View>
        <Text>Помогать улучшать приложение</Text>
        <Switch
          value={consents.analytics}
          onValueChange={(value) =>
            setConsents({ ...consents, analytics: value })
          }
        />
      </View>

      <Button title="Продолжить" onPress={handleComplete} />
    </View>
  );
}
```

## Пример 11: Уведомление о GDPR при регистрации

```typescript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';

export default function GDPRNotice() {
  const [accepted, setAccepted] = useState(false);

  const openPrivacyPolicy = () => {
    Linking.openURL('https://handshakeme.com/privacy-policy');
  };

  return (
    <View>
      <Text>
        Регистрируясь, вы соглашаетесь с нашей{' '}
        <Text onPress={openPrivacyPolicy} style={{ color: 'blue' }}>
          Политикой конфиденциальности
        </Text>
        {' '}и обработкой персональных данных в соответствии с GDPR.
      </Text>

      <TouchableOpacity onPress={() => setAccepted(!accepted)}>
        <Text>
          {accepted ? '☑' : '☐'} Я согласен с условиями
        </Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 12, color: 'gray' }}>
        Вы можете в любое время изменить свои согласия, экспортировать или удалить данные в настройках приложения.
      </Text>
    </View>
  );
}
```

## Пример 12: Периодическое напоминание о GDPR правах

```typescript
import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function GDPRReminder() {
  useEffect(() => {
    checkAndShowReminder();
  }, []);

  const checkAndShowReminder = async () => {
    const lastShown = await AsyncStorage.getItem('gdpr_reminder_last_shown');
    const now = Date.now();
    const sixMonths = 6 * 30 * 24 * 60 * 60 * 1000;

    if (!lastShown || now - parseInt(lastShown) > sixMonths) {
      Alert.alert(
        'Ваши данные',
        'Напоминаем, что вы можете в любое время экспортировать или удалить свои данные в настройках.',
        [
          { text: 'Понятно', style: 'cancel' },
          { text: 'Открыть настройки', onPress: () => {
            // Открыть GDPR настройки
          }},
        ]
      );

      await AsyncStorage.setItem('gdpr_reminder_last_shown', String(now));
    }
  };

  return null;
}
```
