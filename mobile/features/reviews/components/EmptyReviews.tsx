import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';

export interface EmptyReviewsProps {
  message?: string;
  showIcon?: boolean;
}

export const EmptyReviews: React.FC<EmptyReviewsProps> = ({
  message = 'No reviews yet',
  showIcon = true,
}) => {
  return (
    <View style={styles.container}>
      {showIcon && (
        <View style={styles.iconContainer}>
          <Ionicons name="star-outline" size={64} color={Colors.gray[400]} />
        </View>
      )}
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.subtitle}>
        Be the first to share your experience
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 200,
  },
  iconContainer: {
    marginBottom: 16,
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray[700],
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.gray[500],
    textAlign: 'center',
  },
});
