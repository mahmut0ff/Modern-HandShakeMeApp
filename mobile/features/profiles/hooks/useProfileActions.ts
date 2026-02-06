/**
 * useProfileActions Hook
 * Хук для действий с профилем
 */

import { useCallback } from 'react';
import { Alert, Share } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

interface UseProfileActionsOptions {
  profileType: 'master' | 'client';
  profileId: number;
  profileName: string;
}

export function useProfileActions({
  profileType,
  profileId,
  profileName,
}: UseProfileActionsOptions) {
  const shareProfile = useCallback(async () => {
    try {
      const profileUrl = `https://handshakeme.kg/${profileType}s/${profileId}`;
      await Share.share({
        message: `Посмотрите профиль ${profileName} на HandShakeMe: ${profileUrl}`,
        title: `Профиль ${profileName}`,
        url: profileUrl,
      });
    } catch (error) {
      console.error('Error sharing profile:', error);
    }
  }, [profileType, profileId, profileName]);

  const pickAvatar = useCallback(async (): Promise<string | null> => {
    try {
      // Запрашиваем разрешение
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Нет доступа',
          'Для загрузки фото необходим доступ к галерее'
        );
        return null;
      }

      // Открываем галерею
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }

      return null;
    } catch (error) {
      console.error('Error picking avatar:', error);
      Alert.alert('Ошибка', 'Не удалось выбрать изображение');
      return null;
    }
  }, []);

  const takePhoto = useCallback(async (): Promise<string | null> => {
    try {
      // Запрашиваем разрешение на камеру
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Нет доступа',
          'Для съемки фото необходим доступ к камере'
        );
        return null;
      }

      // Открываем камеру
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }

      return null;
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Ошибка', 'Не удалось сделать фото');
      return null;
    }
  }, []);

  const showAvatarOptions = useCallback(() => {
    return new Promise<string | null>((resolve) => {
      Alert.alert(
        'Изменить фото',
        'Выберите источник',
        [
          {
            text: 'Камера',
            onPress: async () => {
              const uri = await takePhoto();
              resolve(uri);
            },
          },
          {
            text: 'Галерея',
            onPress: async () => {
              const uri = await pickAvatar();
              resolve(uri);
            },
          },
          {
            text: 'Отмена',
            style: 'cancel',
            onPress: () => resolve(null),
          },
        ]
      );
    });
  }, [pickAvatar, takePhoto]);

  return {
    shareProfile,
    pickAvatar,
    takePhoto,
    showAvatarOptions,
  };
}
