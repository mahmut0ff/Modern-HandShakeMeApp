import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface FileOptimizationStatusProps {
  originalSize: number;
  optimizedSize: number;
  format?: string;
  quality?: number;
}

export const FileOptimizationStatus: React.FC<FileOptimizationStatusProps> = ({
  originalSize,
  optimizedSize,
  format,
  quality
}) => {
  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const savingsPercent = Math.round(((originalSize - optimizedSize) / originalSize) * 100);
  const hasSavings = savingsPercent > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons 
          name="compress" 
          size={20} 
          color={hasSavings ? '#10B981' : '#6B7280'} 
        />
        <Text style={styles.title}>Оптимизация</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statRow}>
          <Text style={styles.label}>Исходный размер:</Text>
          <Text style={styles.value}>{formatBytes(originalSize)}</Text>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.label}>Оптимизированный:</Text>
          <Text style={[styles.value, hasSavings && styles.successValue]}>
            {formatBytes(optimizedSize)}
          </Text>
        </View>

        {hasSavings && (
          <View style={styles.savingsRow}>
            <MaterialIcons name="trending-down" size={16} color="#10B981" />
            <Text style={styles.savingsText}>
              Сэкономлено {savingsPercent}% ({formatBytes(originalSize - optimizedSize)})
            </Text>
          </View>
        )}

        {format && (
          <View style={styles.statRow}>
            <Text style={styles.label}>Формат:</Text>
            <Text style={styles.value}>{format.toUpperCase()}</Text>
          </View>
        )}

        {quality && (
          <View style={styles.statRow}>
            <Text style={styles.label}>Качество:</Text>
            <Text style={styles.value}>{quality}%</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8
  },
  statsContainer: {
    gap: 8
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  label: {
    fontSize: 13,
    color: '#6B7280'
  },
  value: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827'
  },
  successValue: {
    color: '#10B981'
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    padding: 8,
    borderRadius: 6,
    marginTop: 4
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#059669',
    marginLeft: 6
  }
});
