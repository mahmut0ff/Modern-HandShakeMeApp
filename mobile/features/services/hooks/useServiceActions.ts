/**
 * useServiceActions Hook
 * Хук для действий с услугами
 */

import { useCallback } from 'react';
import { Alert } from 'react-native';
import {
  useDeleteServiceMutation,
  useToggleServiceStatusMutation,
  useReorderServicesMutation,
} from '../../../services/servicesApi';

export function useServiceActions() {
  const [deleteService, { isLoading: isDeleting }] = useDeleteServiceMutation();
  const [toggleStatus, { isLoading: isToggling }] = useToggleServiceStatusMutation();
  const [reorderServices, { isLoading: isReordering }] = useReorderServicesMutation();

  const confirmDelete = useCallback(
    (serviceId: number, serviceName: string, onSuccess?: () => void) => {
      Alert.alert(
        'Удалить услугу?',
        `Вы уверены, что хотите удалить услугу "${serviceName}"?`,
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Удалить',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteService(serviceId).unwrap();
                Alert.alert('Успешно', 'Услуга удалена');
                onSuccess?.();
              } catch (error: any) {
                console.error('Failed to delete service:', error);
                Alert.alert(
                  'Ошибка',
                  error?.data?.message || 'Не удалось удалить услугу'
                );
              }
            },
          },
        ]
      );
    },
    [deleteService]
  );

  const toggleServiceStatus = useCallback(
    async (serviceId: number) => {
      try {
        await toggleStatus(serviceId).unwrap();
        return true;
      } catch (error: any) {
        console.error('Failed to toggle service status:', error);
        Alert.alert(
          'Ошибка',
          error?.data?.message || 'Не удалось изменить статус услуги'
        );
        return false;
      }
    },
    [toggleStatus]
  );

  const reorder = useCallback(
    async (serviceIds: number[]) => {
      try {
        await reorderServices({ service_ids: serviceIds }).unwrap();
        return true;
      } catch (error: any) {
        console.error('Failed to reorder services:', error);
        Alert.alert(
          'Ошибка',
          error?.data?.message || 'Не удалось изменить порядок услуг'
        );
        return false;
      }
    },
    [reorderServices]
  );

  return {
    confirmDelete,
    toggleServiceStatus,
    reorder,
    isDeleting,
    isToggling,
    isReordering,
    isLoading: isDeleting || isToggling || isReordering,
  };
}
