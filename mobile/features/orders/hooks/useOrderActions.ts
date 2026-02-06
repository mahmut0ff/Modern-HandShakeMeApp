/**
 * useOrderActions Hook
 * Хук для действий с заказами (избранное, удаление и т.д.)
 */

import { useCallback } from 'react';
import { Alert } from 'react-native';
import {
  useAddToFavoritesMutation,
  useRemoveFromFavoritesMutation,
  useDeleteOrderMutation,
} from '../../../services/orderApi';

export function useOrderActions() {
  const [addToFavorites] = useAddToFavoritesMutation();
  const [removeFromFavorites] = useRemoveFromFavoritesMutation();
  const [deleteOrder] = useDeleteOrderMutation();

  const toggleFavorite = useCallback(
    async (orderId: number, isFavorite: boolean) => {
      try {
        if (isFavorite) {
          await removeFromFavorites(orderId).unwrap();
        } else {
          await addToFavorites(orderId).unwrap();
        }
      } catch (error) {
        console.error('Failed to toggle favorite:', error);
        Alert.alert(
          'Ошибка',
          'Не удалось изменить статус избранного. Попробуйте снова.'
        );
      }
    },
    [addToFavorites, removeFromFavorites]
  );

  const confirmDelete = useCallback(
    (orderId: number, onSuccess?: () => void) => {
      Alert.alert(
        'Удалить заказ?',
        'Вы уверены, что хотите удалить этот заказ? Это действие нельзя отменить.',
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Удалить',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteOrder(orderId).unwrap();
                Alert.alert('Успешно', 'Заказ удален');
                onSuccess?.();
              } catch (error) {
                console.error('Failed to delete order:', error);
                Alert.alert(
                  'Ошибка',
                  'Не удалось удалить заказ. Попробуйте снова.'
                );
              }
            },
          },
        ]
      );
    },
    [deleteOrder]
  );

  return {
    toggleFavorite,
    confirmDelete,
  };
}
