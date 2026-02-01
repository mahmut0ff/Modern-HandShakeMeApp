import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BackgroundJob } from '../../services/backgroundJobsApi';
import backgroundJobsApi from '../../services/backgroundJobsApi';

interface BackgroundJobToastProps {
  job: BackgroundJob;
  onPress?: () => void;
  onDismiss?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

/**
 * Toast notification for background job updates
 * Shows at the top of the screen with slide-in animation
 */
export const BackgroundJobToast: React.FC<BackgroundJobToastProps> = ({
  job,
  onPress,
  onDismiss,
  autoHide = true,
  autoHideDelay = 5000,
}) => {
  const [slideAnim] = useState(new Animated.Value(-100));
  const typeInfo = backgroundJobsApi.getJobTypeInfo(job.type);
  const statusInfo = backgroundJobsApi.getJobStatusInfo(job.status);

  useEffect(() => {
    // Slide in
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();

    // Auto hide
    if (autoHide && (job.status === 'COMPLETED' || job.status === 'FAILED')) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [job.status]);

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDismiss?.();
    });
  };

  const getBackgroundColor = () => {
    switch (job.status) {
      case 'COMPLETED':
        return '#D1FAE5';
      case 'FAILED':
        return '#FEE2E2';
      case 'PROCESSING':
        return '#DBEAFE';
      default:
        return '#F3F4F6';
    }
  };

  const getTextColor = () => {
    switch (job.status) {
      case 'COMPLETED':
        return '#059669';
      case 'FAILED':
        return '#DC2626';
      case 'PROCESSING':
        return '#2563EB';
      default:
        return '#374151';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={0.8}
      >
        <MaterialIcons name={typeInfo.icon as any} size={24} color={getTextColor()} />

        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: getTextColor() }]}>{job.title}</Text>
          {job.status === 'PROCESSING' && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${job.progress}%`, backgroundColor: getTextColor() },
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: getTextColor() }]}>
                {job.progress}%
              </Text>
            </View>
          )}
          {job.status === 'COMPLETED' && (
            <Text style={[styles.subtitle, { color: getTextColor() }]}>Успешно завершено</Text>
          )}
          {job.status === 'FAILED' && job.error && (
            <Text style={[styles.subtitle, { color: getTextColor() }]} numberOfLines={1}>
              {job.error}
            </Text>
          )}
        </View>

        <TouchableOpacity onPress={handleDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialIcons name="close" size={20} color={getTextColor()} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    minWidth: 35,
    textAlign: 'right',
  },
});
