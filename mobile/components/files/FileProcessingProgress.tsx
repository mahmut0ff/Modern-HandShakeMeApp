import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface FileProcessingProgressProps {
  fileName: string;
  status: 'uploading' | 'processing' | 'optimizing' | 'completed' | 'failed';
  progress?: number;
  error?: string;
}

export const FileProcessingProgress: React.FC<FileProcessingProgressProps> = ({
  fileName,
  status,
  progress = 0,
  error
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <MaterialIcons name="check-circle" size={24} color="#10B981" />;
      case 'failed':
        return <MaterialIcons name="error" size={24} color="#EF4444" />;
      default:
        return <ActivityIndicator size="small" color="#3B82F6" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return 'Загрузка...';
      case 'processing':
        return 'Обработка...';
      case 'optimizing':
        return 'Оптимизация...';
      case 'completed':
        return 'Готово';
      case 'failed':
        return 'Ошибка';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {getStatusIcon()}
        <View style={styles.textContainer}>
          <Text style={styles.fileName} numberOfLines={1}>
            {fileName}
          </Text>
          <Text style={[
            styles.statusText,
            status === 'failed' && styles.errorText
          ]}>
            {error || getStatusText()}
          </Text>
        </View>
      </View>
      
      {status !== 'completed' && status !== 'failed' && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  textContainer: {
    flex: 1,
    marginLeft: 12
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280'
  },
  errorText: {
    color: '#EF4444'
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
    minWidth: 40,
    textAlign: 'right'
  }
});
