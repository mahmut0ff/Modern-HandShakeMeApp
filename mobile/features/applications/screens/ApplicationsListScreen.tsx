/**
 * Applications List Screen
 * Общий список заявок (редирект на нужный экран в зависимости от роли)
 */

import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LoadingSpinner } from '../../../components/LoadingSpinner';

/**
 * Этот экран служит точкой входа для раздела заявок.
 * В зависимости от роли пользователя перенаправляет на:
 * - MyApplicationsScreen (для мастеров)
 * - OrderApplicationsScreen (для клиентов, если указан orderId)
 */
export default function ApplicationsListScreen() {
  const router = useRouter();

  // TODO: Определить роль пользователя и перенаправить
  // Пока показываем экран мастера по умолчанию
  React.useEffect(() => {
    // Перенаправляем на экран "Мои заявки" для мастеров
    router.replace('/applications/my');
  }, [router]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <LoadingSpinner fullScreen text="Загрузка..." />
    </SafeAreaView>
  );
}
