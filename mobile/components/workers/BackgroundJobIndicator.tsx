import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BackgroundJob } from '../../services/backgroundJobsApi';
import backgroundJobsApi from '../../services/backgroundJobsApi';

interface BackgroundJobIndicatorProps {
  job: BackgroundJob;
  onPress?: () => void;
  compact?: boolean;
}

export const BackgroundJobIndicator: React.FC<BackgroundJobIndicatorProps> = ({
  job,
  onPress,
  compact = false,
}) => {
  const [spinValue] = useState(new Animated.Value(0));
  const typeInfo = backgroundJobsApi.getJobTypeInfo(job.type);
  const statusInfo = backgroundJobsApi.getJobStatusInfo(job.status);
  const isActive = backgroundJobsApi.isJobActive(job.status);

  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [isActive]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactContainer, { borderColor: typeInfo.color }]}
        onPress={onPress}
        disabled={!onPress}
      >
        <Animated.View style={{ transform: [{ rotate: isActive ? spin : '0deg' }] }}>
          <MaterialIcons name={typeInfo.icon as any} size={16} color={typeInfo.color} />
        </Animated.View>
        <View style={styles.compactProgress}>
          <View
            style={[
              styles.compactProgressFill,
              { width: `${job.progress}%`, backgroundColor: typeInfo.color },
            ]}
          />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Animated.View style={{ transform: [{ rotate: isActive ? spin : '0deg' }] }}>
            <MaterialIcons name={typeInfo.icon as any} size={24} color={typeInfo.color} />
          </Animated.View>
        </View>

        <View style={styles.info}>
          <Text style={styles.title}>{job.title}</Text>
          {job.description && (
            <Text style={styles.description} numberOfLines={1}>
              {job.description}
            </Text>
          )}
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
          <MaterialIcons name={statusInfo.icon as any} size={14} color="#FFF" />
        </View>
      </View>

      {/* Progress Bar */}
      {isActive && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${job.progress}%`, backgroundColor: typeInfo.color },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{job.progress}%</Text>
        </View>
      )}

      {/* Metadata */}
      {job.metadata && (
        <View style={styles.metadata}>
          {job.metadata.itemsProcessed !== undefined && job.metadata.itemsTotal !== undefined && (
            <View style={styles.metadataItem}>
              <MaterialIcons name="list" size={14} color="#6B7280" />
              <Text style={styles.metadataText}>
                {job.metadata.itemsProcessed} / {job.metadata.itemsTotal}
              </Text>
            </View>
          )}
          {job.metadata.estimatedTimeRemaining !== undefined && (
            <View style={styles.metadataItem}>
              <MaterialIcons name="schedule" size={14} color="#6B7280" />
              <Text style={styles.metadataText}>
                {backgroundJobsApi.formatTimeRemaining(job.metadata.estimatedTimeRemaining)}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Error */}
      {job.status === 'FAILED' && job.error && (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={16} color="#EF4444" />
          <Text style={styles.errorText} numberOfLines={2}>
            {job.error}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    gap: 8,
  },
  compactProgress: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  compactProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
  },
  statusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
    minWidth: 40,
    textAlign: 'right',
  },
  metadata: {
    flexDirection: 'row',
    gap: 16,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataText: {
    fontSize: 12,
    color: '#6B7280',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    gap: 6,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#EF4444',
    lineHeight: 16,
  },
});
