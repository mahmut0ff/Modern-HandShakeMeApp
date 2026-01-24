import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../../../constants/Colors';

export interface VerificationProgressProps {
  completed: number;
  total: number;
  showPercentage?: boolean;
}

export const VerificationProgress: React.FC<VerificationProgressProps> = ({
  completed,
  total,
  showPercentage = true,
}) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isComplete = completed === total && total > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Verification Progress</Text>
        {showPercentage && (
          <Text style={[styles.percentage, isComplete && styles.percentageComplete]}>
            {percentage}%
          </Text>
        )}
      </View>

      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${percentage}%`,
              backgroundColor: isComplete ? Colors.green[500] : Colors.primary,
            },
          ]}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {completed} of {total} documents {isComplete ? 'completed' : 'uploaded'}
        </Text>
        {!isComplete && (
          <Text style={styles.remaining}>
            {total - completed} remaining
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
  },
  percentage: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  percentageComplete: {
    color: Colors.green[600],
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: Colors.gray[600],
  },
  remaining: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
});
