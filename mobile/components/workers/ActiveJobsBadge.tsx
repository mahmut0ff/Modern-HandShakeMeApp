import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface ActiveJobsBadgeProps {
  count: number;
  compact?: boolean;
}

/**
 * Badge showing number of active background jobs
 * Can be used in navigation bar or header
 */
export const ActiveJobsBadge: React.FC<ActiveJobsBadgeProps> = ({ count, compact = false }) => {
  const [pulseAnim] = React.useState(new Animated.Value(1));

  React.useEffect(() => {
    if (count > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [count]);

  if (count === 0) {
    return null;
  }

  if (compact) {
    return (
      <Animated.View
        style={[
          styles.compactBadge,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <Text style={styles.compactText}>{count}</Text>
      </Animated.View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <MaterialIcons name="sync" size={16} color="#3B82F6" />
      </Animated.View>
      <Text style={styles.text}>{count} активных</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  iconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  compactBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  compactText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
});
