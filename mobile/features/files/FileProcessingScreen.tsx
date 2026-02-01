import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { useFileProcessing } from '../../hooks/useFileProcessing';
import { FileProcessingProgress } from '../../components/files/FileProcessingProgress';
import { ProcessedFilePreview } from '../../components/files/ProcessedFilePreview';
import { FileOptimizationStatus } from '../../components/files/FileOptimizationStatus';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';

interface FileProcessingScreenProps {
  orderId: string;
}

export const FileProcessingScreen: React.FC<FileProcessingScreenProps> = ({ orderId }) => {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const {
    uploadFile,
    loadFiles,
    deleteFile,
    downloadFile,
    getFile,
    getOptimizationStats,
    uploadingFiles,
    processedFiles,
    loading,
    error,
  } = useFileProcessing({
    orderId,
    onUploadComplete: (file) => {
      Alert.alert('Успех', `Файл "${file.originalName}" успешно обработан`);
    },
    onUploadError: (error) => {
      Alert.alert('Ошибка', error.message);
    },
  });

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFiles();
    setRefreshing(false);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Ошибка', 'Необходимо разрешение на доступ к галерее');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await uploadFile({
        uri: asset.uri,
        name: asset.fileName || `image_${Date.now()}.jpg`,
        type: asset.type || 'image/jpeg',
      });
    }
  };

  const handlePickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });

    if (result.type === 'success') {
      await uploadFile({
        uri: result.uri,
        name: result.name,
        type: result.mimeType || 'application/octet-stream',
      });
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    Alert.alert('Удалить файл?', 'Это действие нельзя отменить', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteFile(fileId);
            if (selectedFileId === fileId) {
              setSelectedFileId(null);
            }
          } catch (err) {
            Alert.alert('Ошибка', 'Не удалось удалить файл');
          }
        },
      },
    ]);
  };

  const handleDownloadFile = async (fileId: string) => {
    try {
      const downloadUrl = await downloadFile(fileId);
      // In a real app, you would open the URL or download the file
      Alert.alert('Загрузка', `URL: ${downloadUrl}`);
    } catch (err) {
      Alert.alert('Ошибка', 'Не удалось загрузить файл');
    }
  };

  const selectedFile = selectedFileId ? getFile(selectedFileId) : null;
  const selectedOptimization = selectedFileId
    ? getOptimizationStats(selectedFileId)
    : null;

  if (loading && processedFiles.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Upload Buttons */}
        <View style={styles.uploadSection}>
          <TouchableOpacity style={styles.uploadButton} onPress={handlePickImage}>
            <MaterialIcons name="photo-library" size={24} color="#3B82F6" />
            <Text style={styles.uploadButtonText}>Выбрать изображение</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.uploadButton} onPress={handlePickDocument}>
            <MaterialIcons name="attach-file" size={24} color="#3B82F6" />
            <Text style={styles.uploadButtonText}>Выбрать файл</Text>
          </TouchableOpacity>
        </View>

        {error && <ErrorMessage message={error} />}

        {/* Uploading Files */}
        {uploadingFiles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Загрузка</Text>
            {uploadingFiles.map((file) => (
              <FileProcessingProgress
                key={file.fileId}
                fileName={file.fileName}
                status={file.status}
                progress={file.progress}
                error={file.error}
              />
            ))}
          </View>
        )}

        {/* Processed Files */}
        {processedFiles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Файлы ({processedFiles.length})
            </Text>
            {processedFiles.map((file) => (
              <ProcessedFilePreview
                key={file.fileId}
                fileId={file.fileId}
                fileName={file.originalName}
                fileUrl={file.processedUrl}
                thumbnailUrl={file.thumbnailUrl}
                fileType={file.metadata.type}
                fileSize={file.metadata.size}
                dimensions={file.metadata.dimensions}
                onDelete={handleDeleteFile}
                onDownload={handleDownloadFile}
              />
            ))}
          </View>
        )}

        {/* Selected File Details */}
        {selectedFile && selectedOptimization && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Детали оптимизации</Text>
            <FileOptimizationStatus
              originalSize={selectedOptimization.originalSize}
              optimizedSize={selectedOptimization.optimizedSize}
              format={selectedOptimization.format}
              quality={selectedOptimization.quality}
            />
          </View>
        )}

        {processedFiles.length === 0 && uploadingFiles.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="cloud-upload" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateText}>Нет загруженных файлов</Text>
            <Text style={styles.emptyStateSubtext}>
              Загрузите изображения или документы
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  uploadSection: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
