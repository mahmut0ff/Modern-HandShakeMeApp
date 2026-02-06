/**
 * useApplicationActions Hook
 * Хук для действий с заявками
 */

import { useCallback } from 'react';
import { Alert } from 'react-native';
import {
  useRespondToApplicationMutation,
  useDeleteApplicationMutation,
  useMarkApplicationViewedMutation,
} from '../../../services/applicationApi';

export function useApplicationActions() {
  const [respondToApplication, { isLoading: isResponding }] = useRespondToApplicationMutation();
  const [deleteApplication, { isLoading: isDeleting }] = useDeleteApplicationMutation();
  const [markViewed] = useMarkApplicationViewedMutation();

  const acceptApplication = useCallback(
    async (applicationId: number, message?: string) => {
      try {
        await respondToApplication({
          id: applicationId,
          data: {
            status: 'accepted',
            message,
          },
        }).unwrap();
        
        Alert.alert('Успешно', 'Заявка принята. Проект создан.');
        return true;
      } catch (error: any) {
        console.error('Failed to accept application:', error);
        Alert.alert(
          'Ошибка',
          error?.data?.message || 'Не удалось принять заявку. Попробуйте снова.'
        );
        return false;
      }
    },
    [respondToApplication]
  );

  const rejectApplication = useCallback(
    async (applicationId: number, message?: string) => {
      try {
        await respondToApplication({
          id: applicationId,
          data: {
            status: 'rejected',
            message,
          },
        }).unwrap();
        
        Alert.alert('Готово', 'Заявка отклонена.');
        return true;
      } catch (error: any) {
        console.error('Failed to reject application:', error);
        Alert.alert(
          'Ошибка',
          error?.data?.message || 'Не удалось отклонить заявку. Попробуйте снова.'
        );
        return false;
      }
    },
    [respondToApplication]
  );

  const cancelApplication = useCallback(
    async (applicationId: number) => {
      try {
        await deleteApplication(applicationId).unwrap();
        Alert.alert('Готово', 'Заявка отменена.');
        return true;
      } catch (error: any) {
        console.error('Failed to cancel application:', error);
        Alert.alert(
          'Ошибка',
          error?.data?.message || 'Не удалось отменить заявку. Попробуйте снова.'
        );
        return false;
      }
    },
    [deleteApplication]
  );

  const markApplicationViewed = useCallback(
    async (applicationId: number) => {
      try {
        await markViewed(applicationId).unwrap();
        return true;
      } catch (error) {
        console.error('Failed to mark application as viewed:', error);
        return false;
      }
    },
    [markViewed]
  );

  return {
    acceptApplication,
    rejectApplication,
    cancelApplication,
    markApplicationViewed,
    isResponding,
    isDeleting,
    isLoading: isResponding || isDeleting,
  };
}
