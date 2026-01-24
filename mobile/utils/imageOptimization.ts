import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png';
}

export const optimizeImage = async (
  uri: string,
  options: ImageOptimizationOptions = {}
): Promise<string> => {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.8,
    format = 'jpeg',
  } = options;

  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: maxWidth, height: maxHeight } }],
      {
        compress: quality,
        format: format === 'jpeg' ? ImageManipulator.SaveFormat.JPEG : ImageManipulator.SaveFormat.PNG,
      }
    );

    return manipResult.uri;
  } catch (error) {
    console.error('Image optimization failed:', error);
    return uri;
  }
};

export const getImageSize = async (uri: string): Promise<number> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (fileInfo.exists && 'size' in fileInfo) {
      return fileInfo.size;
    }
    return 0;
  } catch (error) {
    console.error('Failed to get image size:', error);
    return 0;
  }
};

export const generateThumbnail = async (
  uri: string,
  size: number = 200
): Promise<string> => {
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: size, height: size } }],
      {
        compress: 0.7,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    return manipResult.uri;
  } catch (error) {
    console.error('Thumbnail generation failed:', error);
    return uri;
  }
};

export const cacheImage = async (uri: string): Promise<string> => {
  try {
    const filename = uri.split('/').pop() || 'image.jpg';
    const cacheDir = `${FileSystem.cacheDirectory}images/`;
    
    const dirInfo = await FileSystem.getInfoAsync(cacheDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
    }

    const cachedPath = `${cacheDir}${filename}`;
    const cachedInfo = await FileSystem.getInfoAsync(cachedPath);

    if (cachedInfo.exists) {
      return cachedPath;
    }

    await FileSystem.downloadAsync(uri, cachedPath);
    return cachedPath;
  } catch (error) {
    console.error('Image caching failed:', error);
    return uri;
  }
};

export const clearImageCache = async (): Promise<void> => {
  try {
    const cacheDir = `${FileSystem.cacheDirectory}images/`;
    const dirInfo = await FileSystem.getInfoAsync(cacheDir);
    
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(cacheDir, { idempotent: true });
    }
  } catch (error) {
    console.error('Failed to clear image cache:', error);
  }
};
