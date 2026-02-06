import { useCallback } from 'react';
import { Alert } from 'react-native';
import {
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
  useDeleteAllNotificationsMutation,
} from '../../../services/notificationApi';

export function useNotificationActions() {
  const [markRead, { isLoading: isMarkingRead }] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: isMarkingAllRead }] = useMarkAllNotificationsReadMutation();
  const [deleteNotification, { isLoading: isDeleting }] = useDeleteNotificationMutation();
  const [deleteAll, { isLoading: isDeletingAll }] = useDeleteAllNotificationsMutation();

  const handleMarkRead = useCallback(async (notificationId: number) => {
    try {
      await markRead(notificationId).unwrap();
      return true;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  }, [markRead]);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await markAllRead().unwrap();
      return true;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      Alert.alert('Ошибка', 'Не удалось отметить уведомления как прочитанные');
      return false;
    }
  }, [markAllRead]);

  const handleDelete = useCallback(async (notificationId: number) => {
    try {
      await deleteNotification(notificationId).unwrap();
      return true;
    } catch (error) {
      console.error('Failed to delete notification:', error);
      Alert.alert('Ошибка', 'Не удалось удалить уведомление');
      return false;
    }
  }, [deleteNotification]);

  const confirmDeleteAll = useCallback(() => {
    Alert.alert(
      'Удалить все уведомления?',
      'Это действие нельзя отменить',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAll().unwrap();
            } catch (error) {
              console.error('Failed to delete all notifications:', error);
              Alert.alert('Ошибка', 'Не удалось удалить уведомления');
            }
          },
        },
      ]
    );
  }, [deleteAll]);

  return {
    handleMarkRead,
    handleMarkAllRead,
    handleDelete,
    confirmDeleteAll,
    isMarkingRead,
    isMarkingAllRead,
    isDeleting,
    isDeletingAll,
    isLoading: isMarkingRead || isMarkingAllRead || isDeleting || isDeletingAll,
  };
}
