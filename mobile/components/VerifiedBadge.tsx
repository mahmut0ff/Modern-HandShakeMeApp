import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VerifiedBadgeProps {
  size?: number;
  color?: string;
}

export default function VerifiedBadge({ size = 16, color = '#4CAF50' }: VerifiedBadgeProps) {
  return (
    <View style={[styles.badge, { width: size, height: size }]}>
      <Ionicons name="checkmark-circle" size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
